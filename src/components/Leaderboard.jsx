import { useEffect, useState } from 'react';
import { Trophy, Medal, Award } from 'lucide-react';

export default function Leaderboard({ apiUrl }) {
  const [leaderboard, setLeaderboard] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchLeaderboard();
  }, []);

  const fetchLeaderboard = async () => {
    try {
      setLoading(true);
      const response = await fetch(`${apiUrl}/leaderboard`);
      if (!response.ok) throw new Error('Failed to fetch leaderboard');
      const data = await response.json();
      setLeaderboard(data);
      setError(null);
    } catch (err) {
      setError(err.message);
      console.error('Error fetching leaderboard:', err);
    } finally {
      setLoading(false);
    }
  };

  const getRankIcon = (index) => {
    switch (index) {
      case 0:
        return <Trophy className="w-6 h-6 text-yellow-500" />;
      case 1:
        return <Medal className="w-6 h-6 text-gray-400" />;
      case 2:
        return <Award className="w-6 h-6 text-orange-600" />;
      default:
        return <span className="w-6 text-center font-bold text-gray-600">{index + 1}</span>;
    }
  };

  if (loading) {
    return (
      <div className="bg-white rounded-xl shadow-lg p-6">
        <h2 className="text-2xl font-bold mb-4 text-gray-800">Leaderboard</h2>
        <div className="flex justify-center py-8">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-white rounded-xl shadow-lg p-6">
        <h2 className="text-2xl font-bold mb-4 text-gray-800">Leaderboard</h2>
        <div className="text-red-500 text-center py-4">
          Error: {error}
        </div>
        <button
          onClick={fetchLeaderboard}
          className="w-full mt-4 bg-blue-500 hover:bg-blue-600 text-white font-semibold py-2 px-4 rounded-lg transition"
        >
          Retry
        </button>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl shadow-lg p-6">
      <h2 className="text-2xl font-bold mb-4 text-gray-800 flex items-center gap-2">
        <Trophy className="w-8 h-8 text-yellow-500" />
        Leaderboard
      </h2>

      {leaderboard.length === 0 ? (
        <p className="text-gray-500 text-center py-8">No players yet. Be the first!</p>
      ) : (
        <div className="space-y-2">
          {leaderboard.map((player, index) => (
            <div
              key={player.username}
              className={`flex items-center gap-4 p-4 rounded-lg transition ${
                index < 3 ? 'bg-gradient-to-r from-blue-50 to-purple-50' : 'bg-gray-50'
              }`}
            >
              <div className="flex items-center justify-center w-8">
                {getRankIcon(index)}
              </div>

              <div className="flex-1">
                <div className="font-semibold text-gray-800">{player.username}</div>
                <div className="text-sm text-gray-500">
                  {player.games_played} games played
                </div>
              </div>

              <div className="text-right">
                <div className="font-bold text-green-600">{player.wins} wins</div>
                <div className="text-sm text-gray-500">{player.losses} losses</div>
              </div>
            </div>
          ))}
        </div>
      )}

      <button
        onClick={fetchLeaderboard}
        className="w-full mt-6 bg-blue-500 hover:bg-blue-600 text-white font-semibold py-2 px-4 rounded-lg transition"
      >
        Refresh
      </button>
    </div>
  );
}
