import { Circle } from 'lucide-react';

const ROWS = 6;
const COLS = 7;

export default function GameBoard({ board, onColumnClick, currentPlayer, yourPlayer, gameOver }) {
  const isYourTurn = currentPlayer === yourPlayer && !gameOver;

  const getDiscColor = (cell) => {
    if (cell === 0) return 'bg-white';
    if (cell === 1) return 'bg-red-500';
    return 'bg-yellow-500';
  };

  return (
    <div className="flex flex-col items-center gap-2">
      <div className="inline-grid grid-cols-7 gap-2 bg-blue-600 p-4 rounded-lg shadow-2xl">
        {[...board].reverse().map((row, rowIndex) => (
          row.map((cell, colIndex) => (
            <button
              key={`${rowIndex}-${colIndex}`}
              onClick={() => isYourTurn && onColumnClick(colIndex)}
              disabled={!isYourTurn}
              className={`w-16 h-16 rounded-full flex items-center justify-center transition-all ${
                getDiscColor(cell)
              } ${isYourTurn ? 'hover:scale-105 cursor-pointer' : 'cursor-not-allowed'} shadow-inner`}
            >
              {cell !== 0 && (
                <Circle className="w-14 h-14" fill="currentColor" />
              )}
            </button>
          ))
        ))}
      </div>
    </div>
  );
}
