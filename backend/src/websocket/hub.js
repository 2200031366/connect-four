import { Game, PLAYER1, PLAYER2 } from './game.js';
import { Bot } from '../bot/bot.js';
import { saveGame, updateLeaderboard } from '../database/supabase.js';
import { kafkaPublisher } from '../kafka/publisher.js';

const MATCHMAKING_TIMEOUT = 10000;
const RECONNECT_TIMEOUT = 30000;

export class GameHub {
  constructor() {
    this.waitingPlayers = [];
    this.activeGames = new Map();
    this.playerConnections = new Map(); // username -> [ws, ws, ...]
    this.disconnectedPlayers = new Map();
  }

  handleConnection(ws, username) {
    console.log(`Player connected: ${username}`);

    // Allow multiple connections per username
    if (!this.playerConnections.has(username)) {
      this.playerConnections.set(username, []);
    }
    this.playerConnections.get(username).push(ws);

    // Check if player was disconnected from an ongoing game
    if (this.disconnectedPlayers.has(username)) {
      clearTimeout(this.disconnectedPlayers.get(username).timeout);
      this.disconnectedPlayers.delete(username);

      const game = this.findGameByPlayer(username);
      if (game) {
        this.sendMessage(ws, {
          type: 'reconnected',
          gameId: game.id,
          board: game.board,
          currentPlayer: game.currentPlayer,
          yourPlayer: game.player1.username === username ? PLAYER1 : PLAYER2
        });
        return;
      }
    }

    this.addToMatchmaking(ws, username);
  }

  addToMatchmaking(ws, username) {
    const player = { ws, username };

    // Match with the first waiting player
    const waitingPlayer = this.waitingPlayers.shift();

    if (waitingPlayer) {
      this.startGame(waitingPlayer, player, false);
    } else {
      // No one waiting, add this player to queue
      this.waitingPlayers.push(player);

      this.sendMessage(ws, {
        type: 'waiting',
        message: 'Waiting for opponent...'
      });

      const timeout = setTimeout(() => {
        const index = this.waitingPlayers.findIndex(p => p === player);
        if (index !== -1) {
          this.waitingPlayers.splice(index, 1);
          this.startGame(player, { username: 'bot', isBot: true }, true);
        }
      }, MATCHMAKING_TIMEOUT);

      player.matchmakingTimeout = timeout;
    }
  }

  startGame(player1, player2, withBot) {
    if (player1.matchmakingTimeout) clearTimeout(player1.matchmakingTimeout);
    if (player2.matchmakingTimeout) clearTimeout(player2.matchmakingTimeout);

    const game = new Game(player1, player2);
    game.isBot = withBot;

    if (withBot) game.bot = new Bot(PLAYER2);

    this.activeGames.set(game.id, game);

    this.sendMessage(player1.ws, {
      type: 'gameStart',
      gameId: game.id,
      opponent: player2.username,
      yourPlayer: PLAYER1,
      board: game.board,
      currentPlayer: game.currentPlayer
    });

    if (!withBot) {
      this.sendMessage(player2.ws, {
        type: 'gameStart',
        gameId: game.id,
        opponent: player1.username,
        yourPlayer: PLAYER2,
        board: game.board,
        currentPlayer: game.currentPlayer
      });
    }

    kafkaPublisher.publishGameStarted(game.id, player1.username, player2.username);
    console.log(`Game started: ${game.id} - ${player1.username} vs ${player2.username}`);
  }

  handleMove(ws, data) {
    const { gameId, column, username } = data;
    const game = this.activeGames.get(gameId);

    if (!game) {
      this.sendMessage(ws, { type: 'error', message: 'Game not found' });
      return;
    }

    const playerNumber = game.player1.username === username ? PLAYER1 : PLAYER2;

    if (game.currentPlayer !== playerNumber) {
      this.sendMessage(ws, { type: 'error', message: 'Not your turn' });
      return;
    }

    const result = game.makeMove(column);

    if (!result.success) {
      this.sendMessage(ws, { type: 'error', message: result.message });
      return;
    }

    kafkaPublisher.publishMoveMade(game.id, username, column, result.row);

    this.broadcastToGame(game, {
      type: 'moveMade',
      column,
      row: result.row,
      player: playerNumber,
      board: game.board,
      currentPlayer: game.currentPlayer
    });

    if (result.gameOver) {
      this.endGame(game);
    } else if (game.isBot && game.currentPlayer === PLAYER2) {
      setTimeout(() => this.makeBotMove(game), 500);
    }
  }

  makeBotMove(game) {
    if (game.gameOver) return;

    const column = game.bot.getMove(game);
    if (column === null) return;

    const result = game.makeMove(column);

    if (result.success) {
      kafkaPublisher.publishMoveMade(game.id, 'bot', column, result.row);

      this.broadcastToGame(game, {
        type: 'moveMade',
        column,
        row: result.row,
        player: PLAYER2,
        board: game.board,
        currentPlayer: game.currentPlayer
      });

      if (result.gameOver) this.endGame(game);
    }
  }

  async endGame(game) {
    const duration = game.getGameDuration();

    // publish kafka events
    if (game.winner === 'draw') {
      kafkaPublisher.publishGameDrawn(game.id, game.player1.username, game.player2.username, duration);
    } else {
      const loser = game.winner === game.player1.username ? game.player2.username : game.player1.username;
      kafkaPublisher.publishGameWon(game.id, game.winner, loser, duration);
    }

    // Personalized messages for players
    const p1 = game.player1.username;
    const p2 = game.player2.username;

    // Compose messages
    const p1Msg = game.winner === 'draw'
      ? 'Draw! Well played.'
      : (game.winner === p1 ? 'You Win!' : 'You Lose. Better luck next time!');
    const p2Msg = game.winner === 'draw'
      ? 'Draw! Well played.'
      : (game.winner === p2 ? 'You Win!' : 'You Lose. Better luck next time!');

    // Send personalized gameOver to player1 connections
    const sendToConnections = (username, payload) => {
      const conns = this.playerConnections.get(username) || [];
      conns.forEach(conn => {
        if (conn.readyState === 1) {
          this.sendMessage(conn, payload);
        }
      });
    };

    // For player1
    sendToConnections(p1, {
      type: 'gameOver',
      winner: game.winner,
      board: game.board,
      message: p1Msg,
      yourPlayer: PLAYER1
    });

    // For player2 (if bot, send only if player2 isn't the placeholder without connections)
    if (!game.isBot) {
      sendToConnections(p2, {
        type: 'gameOver',
        winner: game.winner,
        board: game.board,
        message: p2Msg,
        yourPlayer: PLAYER2
      });
    } else {
      // If bot won or lost, still broadcast final board to player1 was already done.
    }

    // persist results & update leaderboard
    try {
      await saveGame({
        gameId: game.id,
        player1: game.player1.username,
        player2: game.player2.username,
        winner: game.winner,
        duration
      });

      if (game.winner !== 'draw') {
        if (!game.isBot) {
          await updateLeaderboard(game.player1.username, game.winner === game.player1.username);
          await updateLeaderboard(game.player2.username, game.winner === game.player2.username);
        } else {
          // only human is player1 when playing with bot in this design
          await updateLeaderboard(game.player1.username, game.winner === game.player1.username);
        }
      }
    } catch (error) {
      console.error('Error saving game results:', error);
    }

    this.activeGames.delete(game.id);
  }

  handleDisconnect(username) {
    console.log(`Player disconnected: ${username}`);

    // Remove from waiting queue
    this.waitingPlayers = this.waitingPlayers.filter(p => p.username !== username);

    const game = this.findGameByPlayer(username);

    if (game && !game.gameOver) {
      kafkaPublisher.publishPlayerDisconnected(game.id, username);

      const timeout = setTimeout(() => {
        if (this.activeGames.has(game.id)) {
          game.winner = game.player1.username === username ? game.player2.username : game.player1.username;
          game.gameOver = true;
          this.endGame(game);
        }
        this.disconnectedPlayers.delete(username);
      }, RECONNECT_TIMEOUT);

      this.disconnectedPlayers.set(username, { game, timeout });
    }

    // Remove this connection
    const connections = this.playerConnections.get(username) || [];
    const filtered = connections.filter(ws => ws.readyState === 1);
    this.playerConnections.set(username, filtered);
    if (!this.playerConnections.get(username) || this.playerConnections.get(username).length === 0) {
      this.playerConnections.delete(username);
    }
  }

  findGameByPlayer(username) {
    for (const game of this.activeGames.values()) {
      if (game.player1.username === username || game.player2.username === username) {
        return game;
      }
    }
    return null;
  }

  broadcastToGame(game, message) {
    // Broadcast to all connections for both players (except bot)
    const sendToConnections = (username) => {
      const connections = this.playerConnections.get(username) || [];
      connections.forEach(ws => {
        if (ws.readyState === 1) this.sendMessage(ws, message);
      });
    };

    sendToConnections(game.player1.username);
    if (!game.isBot) sendToConnections(game.player2.username);
  }

  sendMessage(ws, message) {
    if (ws.readyState === 1) ws.send(JSON.stringify(message));
  }
}
