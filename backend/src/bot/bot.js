import { ROWS, COLS, PLAYER1, PLAYER2 } from '../websocket/game.js';

export class Bot {
  constructor(playerNumber) {
    this.playerNumber = playerNumber;
    this.opponentNumber = playerNumber === PLAYER1 ? PLAYER2 : PLAYER1;
  }

  getMove(game) {
    const validMoves = game.getValidMoves();

    if (validMoves.length === 0) {
      return null;
    }

    const winMove = this.findWinningMove(game, this.playerNumber);
    if (winMove !== null) {
      return winMove;
    }

    const blockMove = this.findWinningMove(game, this.opponentNumber);
    if (blockMove !== null) {
      return blockMove;
    }

    const strategicMove = this.findStrategicMove(game);
    if (strategicMove !== null) {
      return strategicMove;
    }

    const centerCol = Math.floor(COLS / 2);
    if (validMoves.includes(centerCol)) {
      return centerCol;
    }

    return validMoves[Math.floor(Math.random() * validMoves.length)];
  }

  findWinningMove(game, player) {
    for (let col = 0; col < COLS; col++) {
      if (game.board[0][col] !== 0) continue;

      for (let row = ROWS - 1; row >= 0; row--) {
        if (game.board[row][col] === 0) {
          game.board[row][col] = player;

          const isWin = game.checkWin(row, col);

          game.board[row][col] = 0;

          if (isWin) {
            return col;
          }

          break;
        }
      }
    }

    return null;
  }

  findStrategicMove(game) {
    const scores = [];

    for (let col = 0; col < COLS; col++) {
      if (game.board[0][col] !== 0) {
        scores.push({ col, score: -1000 });
        continue;
      }

      let row = -1;
      for (let r = ROWS - 1; r >= 0; r--) {
        if (game.board[r][col] === 0) {
          row = r;
          break;
        }
      }

      if (row === -1) {
        scores.push({ col, score: -1000 });
        continue;
      }

      let score = 0;

      if (col === Math.floor(COLS / 2)) {
        score += 3;
      }

      score += this.evaluatePosition(game, row, col, this.playerNumber);
      score -= this.evaluatePosition(game, row, col, this.opponentNumber) * 0.8;

      if (row < ROWS - 1) {
        game.board[row][col] = this.opponentNumber;
        if (game.checkWin(row, col)) {
          score -= 50;
        }
        game.board[row][col] = 0;
      }

      scores.push({ col, score });
    }

    scores.sort((a, b) => b.score - a.score);

    if (scores[0].score > -1000) {
      return scores[0].col;
    }

    return null;
  }

  evaluatePosition(game, row, col, player) {
    let score = 0;

    score += this.countDirection(game, row, col, 0, 1, player);
    score += this.countDirection(game, row, col, 1, 0, player);
    score += this.countDirection(game, row, col, 1, 1, player);
    score += this.countDirection(game, row, col, 1, -1, player);

    return score;
  }

  countDirection(game, row, col, dRow, dCol, player) {
    let count = 0;
    let openEnds = 0;

    let r = row + dRow;
    let c = col + dCol;
    while (r >= 0 && r < ROWS && c >= 0 && c < COLS && game.board[r][c] === player) {
      count++;
      r += dRow;
      c += dCol;
    }
    if (r >= 0 && r < ROWS && c >= 0 && c < COLS && game.board[r][c] === 0) {
      openEnds++;
    }

    r = row - dRow;
    c = col - dCol;
    while (r >= 0 && r < ROWS && c >= 0 && c < COLS && game.board[r][c] === player) {
      count++;
      r -= dRow;
      c -= dCol;
    }
    if (r >= 0 && r < ROWS && c >= 0 && c < COLS && game.board[r][c] === 0) {
      openEnds++;
    }

    if (count === 0) return 0;
    if (count === 1) return openEnds;
    if (count === 2) return openEnds * 2;
    if (count >= 3) return openEnds * 5;

    return 0;
  }
}
