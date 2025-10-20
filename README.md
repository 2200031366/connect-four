Connect Four – Real-Time Multiplayer Game

A real-time Connect Four multiplayer game where players can compete against each other or an intelligent bot. The game features live leaderboard tracking, WebSocket-based gameplay, and analytics event publishing via Kafka.

Features

Real-time Multiplayer: Play against other players with instant updates.

Smart AI Bot: If no opponent joins within 10 seconds, play against a competitive bot that:

Blocks the opponent’s winning moves

Creates its own winning opportunities

Uses strategic positioning

Matchmaking System: Automatic player pairing with queue management

Reconnection Support: Rejoin the game within 30 seconds of disconnection

Leaderboard: Track wins, losses, and games played

Kafka Integration: Event publishing for game analytics (game started, moves made, results)

Responsive UI: Modern interface built with React and Tailwind CSS

Tech Stack
Backend

Node.js with Express

WebSocket (ws) for real-time gameplay

Supabase (PostgreSQL) for persistent data

Kafka for event publishing

Frontend

React with Vite

Tailwind CSS for styling

Lucide React for icons

WebSocket client for real-time updates

Project Structure
project-root/
├── backend/                    # Node.js WebSocket server
│   ├── src/
│   │   ├── websocket/          # Game logic and WebSocket hub
│   │   │   ├── game.js
│   │   │   └── hub.js
│   │   ├── bot/                # AI bot logic
│   │   │   └── bot.js
│   │   ├── database/           # Supabase integration
│   │   │   └── supabase.js
│   │   ├── kafka/              # Kafka publisher
│   │   │   └── publisher.js
│   │   └── server.js           # Express + WebSocket server
│   ├── Dockerfile
│   ├── package.json
│   └── .env                     # Environment variables
├── src/                        # React frontend
│   ├── components/
│   ├── pages/
│   ├── websocket/
│   ├── App.jsx
│   ├── main.tsx
│   └── index.css
├── supabase/                    # Database migrations
├── docker-compose.yml
├── .gitignore
├── README.md
└── .env

Prerequisites

Node.js 18+

Supabase account (free tier works)

Docker and Docker Compose (optional, for Kafka)

Environment Variables
Backend (backend/.env)
SUPABASE_URL=your_supabase_url
SUPABASE_ANON_KEY=your_supabase_anon_key
PORT=8080
KAFKA_BROKERS=localhost:9092  # Optional if Kafka is not used

Frontend (.env)
VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
VITE_WS_URL=ws://localhost:8080
VITE_API_URL=http://localhost:8080

Running Locally
Backend
cd backend
npm install
npm start


Backend runs at http://localhost:8080.

Frontend
npm install
npm run dev


Frontend runs at http://localhost:5173.

Optional: Kafka
docker-compose up -d kafka zookeeper


Starts Kafka and Zookeeper containers for analytics.

How to Play

Enter Username: Open the app and enter your username.

Matchmaking: Wait for an opponent (max 10 seconds).

Play: Click columns to drop your disc (Red = Player 1, Yellow = Player 2).

Win: Connect 4 discs horizontally, vertically, or diagonally.

View Stats: Check the leaderboard to see rankings.

Game Rules

Grid: 7 columns × 6 rows

Players alternate turns

First to connect 4 discs wins

Draw if board fills

30-second reconnection window

API Endpoints

GET /health – Health check

GET /leaderboard?limit=10 – Top players

[
  {
    "username": "player1",
    "wins": 10,
    "losses": 3,
    "games_played": 13,
    "updated_at": "2025-10-20T..."
  }
]

WebSocket Events
Client → Server

Join Game

{ "type": "join", "username": "player1" }


Make Move

{ "type": "move", "gameId": "uuid", "column": 3 }

Server → Client

Waiting for Opponent

{ "type": "waiting", "message": "Waiting for opponent..." }


Game Started

{
  "type": "gameStart",
  "gameId": "uuid",
  "opponent": "player2",
  "yourPlayer": 1,
  "board": [[0,0,...]],
  "currentPlayer": 1
}


Move Made

{
  "type": "moveMade",
  "column": 3,
  "row": 5,
  "player": 1,
  "board": [[0,0,...]],
  "currentPlayer": 2
}


Game Over

{ "type": "gameOver", "winner": "player1", "board": [[0,0,...]] }

Bot Strategy

Win Detection – Take a winning move if available

Block Detection – Prevent opponent’s immediate win

Strategic Positioning – Prefer center, create multiple threats

Fallback – Random valid move

Deployment Notes

Backend: Use Render, Railway, or Fly.io for Node.js WebSocket server.

Frontend: Use Vercel or Netlify for React app.

Note: Backend and frontend need separate hosting due to WebSocket requirements.

Local Run: If hosting is not possible, app can be run locally as above.

Future Enhancements

User authentication with Supabase Auth

Private game rooms with invite codes

Game replay system

Multiple AI difficulty levels

Tournament mode

Chat system during games

Sound effects and animations

Mobile app version

License

MIT License – free for learning or production use.

Credits

Built with modern web technologies for real-time multiplayer gaming.
