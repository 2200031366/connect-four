import { useState, useEffect } from 'react';
import GameBoard from '../components/GameBoard';
import GameModal from '../components/GameModal';
import Leaderboard from '../components/Leaderboard';
import { Users, Wifi, WifiOff } from 'lucide-react';
import { socketClient } from '../websocket/socket';

const ROWS = 6;
const COLS = 7;

export default function Game({ username, apiUrl, wsUrl }) {
  const [board, setBoard] = useState(Array.from({ length: ROWS }, () => Array(COLS).fill(0)));
  const [gameId, setGameId] = useState(null);
  const [opponent, setOpponent] = useState(null);
  const [yourPlayer, setYourPlayer] = useState(null);
  const [currentPlayer, setCurrentPlayer] = useState(1);
  const [gameOver, setGameOver] = useState(false);
  const [winner, setWinner] = useState(null);
  const [resultMessage, setResultMessage] = useState(null); // NEW
  const [status, setStatus] = useState('Connecting...');
  const [connected, setConnected] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [showLeaderboard, setShowLeaderboard] = useState(false);

  // ---------------------- WEBSOCKET ----------------------
  useEffect(() => {
    socketClient.connect(username, wsUrl);

    socketClient.on('waiting', (data) => {
      setStatus(data.message);
      setConnected(true);
    });

    socketClient.on('gameStart', (data) => {
      setGameId(data.gameId);
      setOpponent(data.opponent);
      setYourPlayer(data.yourPlayer); // 1 or 2
      setBoard(data.board);
      setCurrentPlayer(data.currentPlayer);
      setGameOver(false);
      setWinner(null);
      setResultMessage(null);
      setShowModal(false);
      setStatus(`Playing against ${data.opponent}`);
      setConnected(true);
    });

    socketClient.on('moveMade', (data) => {
      setBoard(data.board);
      setCurrentPlayer(data.currentPlayer);
    });

    // server now sends personalized message and yourPlayer in payload
    socketClient.on('gameOver', (data) => {
      setBoard(data.board);
      setWinner(data.winner);
      setGameOver(true);
      setResultMessage(data.message || null); // use server-provided message
      setShowModal(true);
      setStatus('Game Over');
      // if server provided yourPlayer ensure local state matches
      if (data.yourPlayer) setYourPlayer(data.yourPlayer);
    });

    socketClient.on('reconnected', (data) => {
      setGameId(data.gameId);
      setBoard(data.board);
      setCurrentPlayer(data.currentPlayer);
      setYourPlayer(data.yourPlayer);
      setStatus('Reconnected to game');
      setConnected(true);
    });

    socketClient.on('error', (data) => {
      console.error('Game error:', data.message);
    });

    socketClient.on('disconnected', () => {
      setConnected(false);
      setStatus('Disconnected. Reconnecting...');
    });

    return () => {
      socketClient.disconnect();
    };
  }, []);

  // ---------------------- GAME LOGIC ----------------------
  const handleColumnClick = (column) => {
    if (!gameOver && gameId && currentPlayer === yourPlayer) {
      socketClient.send({
        type: 'move',
        gameId,
        column
      });
    }
  };

  const handlePlayAgain = () => {
    setShowModal(false);
    setGameOver(false);
    setWinner(null);
    setResultMessage(null);
    setGameId(null);
    setOpponent(null);
    setBoard(Array.from({ length: ROWS }, () => Array(COLS).fill(0)));
    setStatus('Finding new opponent...');
    // Notify server to assign a new game
    socketClient.send({ type: 'join', username });
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setShowLeaderboard(true);
  };

  const getPlayerColor = (player) => (player === 1 ? 'text-red-500' : 'text-yellow-500');

  const getTurnMessage = () => {
    if (gameOver) return 'Game Over';
    if (currentPlayer === yourPlayer) return 'Your Turn';
    return `${opponent}'s Turn`;
  };

  // ---------------------- RENDER ----------------------
  if (showLeaderboard) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-500 to-purple-600 p-8">
        <div className="max-w-2xl mx-auto">
          <button
            onClick={() => {
              setShowLeaderboard(false);
              handlePlayAgain();
            }}
            className="mb-6 bg-white text-blue-500 hover:bg-gray-100 font-semibold py-2 px-6 rounded-lg transition shadow-lg"
          >
            Back to Game
          </button>
          <Leaderboard apiUrl={apiUrl} />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-500 to-purple-600 p-8">
      <div className="max-w-4xl mx-auto">
        <div className="bg-white rounded-2xl shadow-2xl p-8 mb-6">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <div className="bg-blue-500 p-3 rounded-full">
                <Users className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-gray-800">Connect Four</h1>
                <p className="text-sm text-gray-600">{username}</p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              {connected ? (
                <Wifi className="w-6 h-6 text-green-500" />
              ) : (
                <WifiOff className="w-6 h-6 text-red-500" />
              )}
              <button
                onClick={() => setShowLeaderboard(true)}
                className="bg-blue-500 hover:bg-blue-600 text-white font-semibold py-2 px-4 rounded-lg transition"
              >
                Leaderboard
              </button>
            </div>
          </div>

          <div className="text-center mb-6">
            <div className="inline-block bg-gray-100 px-6 py-3 rounded-lg">
              <p className="text-lg font-semibold text-gray-700">{status}</p>
            </div>
          </div>

          {opponent && (
            <div className="text-center mb-6">
              <div className={`inline-block px-6 py-3 rounded-lg ${
                currentPlayer === yourPlayer ? 'bg-green-100' : 'bg-gray-100'
              }`}>
                <p className={`text-lg font-bold ${getPlayerColor(currentPlayer)}`}>
                  {getTurnMessage()}
                </p>
              </div>
            </div>
          )}

          <div className="flex justify-center">
            <GameBoard
              board={board}
              onColumnClick={handleColumnClick}
              currentPlayer={currentPlayer}
              yourPlayer={yourPlayer}
              gameOver={gameOver}
            />
          </div>
        </div>

        {opponent && (
          <div className="bg-white rounded-xl shadow-lg p-6">
            <div className="flex justify-around text-center">
              <div className="flex-1">
                <p className="text-sm text-gray-600 mb-1">You</p>
                <div className="flex items-center justify-center gap-2">
                  <div className={`w-6 h-6 rounded-full ${yourPlayer === 1 ? 'bg-red-500' : 'bg-yellow-500'}`}></div>
                  <p className="font-bold text-gray-800">{username}</p>
                </div>
              </div>

              <div className="flex-1">
                <p className="text-sm text-gray-600 mb-1">Opponent</p>
                <div className="flex items-center justify-center gap-2">
                  <div className={`w-6 h-6 rounded-full ${yourPlayer === 1 ? 'bg-yellow-500' : 'bg-red-500'}`}></div>
                  <p className="font-bold text-gray-800">{opponent}</p>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {showModal && winner && (
        <GameModal
          winner={winner}
          yourPlayer={yourPlayer}
          resultMessage={resultMessage} // pass server message to modal
          onClose={handleCloseModal}
          onPlayAgain={handlePlayAgain}
        />
      )}
    </div>
  );
}
