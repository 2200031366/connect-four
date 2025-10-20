import { Trophy, X } from 'lucide-react';

export default function GameModal({
  winner,
  yourUsername,
  yourPlayer,
  onClose,
  onPlayAgain,
  opponent,
}) {
  const getTitle = () => {
    if (!winner) return '';
    if (winner === 'draw') return 'Draw!';

    // Check if it's a bot match
    if (winner === 'bot' || opponent === 'bot') {
      return winner === 'bot'
        ? 'Bot Wins!'
        : 'You Win!';
    }

    // Compare by username
    if (winner === yourUsername) {
      return 'You Win!';
    } else {
      return 'You Lose!';
    }
  };

  const getMessage = () => {
    if (!winner) return '';
    if (winner === 'draw') return 'The game ended in a draw. Good game!';
    if (winner === 'bot') return 'The bot defeated you this time. Try again!';
    if (winner === yourUsername)
      return 'Congratulations on your victory!';
    return 'Better luck next time!';
  };

  const getBgColor = () => {
    const title = getTitle();
    if (title === 'You Win!') return 'from-green-500 to-emerald-600';
    if (title === 'You Lose!' || winner === 'bot')
      return 'from-red-500 to-rose-600';
    return 'from-gray-500 to-slate-600';
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-2xl shadow-2xl p-8 max-w-md w-full mx-4 relative">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 transition"
        >
          <X className="w-6 h-6" />
        </button>

        <div className={`flex justify-center mb-6`}>
          <div className={`bg-gradient-to-r ${getBgColor()} p-4 rounded-full`}>
            <Trophy className="w-16 h-16 text-white" />
          </div>
        </div>

        <h2 className="text-3xl font-bold text-center mb-4 text-gray-800">
          {getTitle()}
        </h2>

        <p className="text-center text-gray-600 mb-8">
          {getMessage()}
        </p>

        <div className="space-y-3">
          <button
            onClick={onPlayAgain}
            className="w-full bg-blue-500 hover:bg-blue-600 text-white font-semibold py-3 px-6 rounded-lg transition shadow-lg hover:shadow-xl"
          >
            Play Again
          </button>

          <button
            onClick={onClose}
            className="w-full bg-gray-200 hover:bg-gray-300 text-gray-800 font-semibold py-3 px-6 rounded-lg transition"
          >
            View Leaderboard
          </button>
        </div>
      </div>
    </div>
  );
}
