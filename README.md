# Connect Four - Real-Time Multiplayer Game

A fully-featured real-time multiplayer Connect Four game with WebSocket communication, smart AI bot, leaderboard system, and Kafka event publishing.

## Features

- **Real-time Multiplayer**: Play against other players with WebSocket-based gameplay
- **Smart AI Bot**: If no opponent joins within 10 seconds, play against an intelligent bot that:
  - Blocks your winning moves
  - Creates its own winning opportunities
  - Uses strategic positioning
- **Matchmaking System**: Automatic player pairing with queue management
- **Reconnection Support**: Rejoin your game within 30 seconds of disconnection
- **Leaderboard**: Track wins, losses, and games played
- **Kafka Integration**: Event publishing for analytics (game started, moves made, game results)
- **Responsive UI**: Clean, modern interface built with React and Tailwind CSS

## Tech Stack

### Backend
- **Node.js** with Express
- **WebSocket (ws)** for real-time communication
- **Supabase** (PostgreSQL) for data persistence
- **Kafka** event publishing structure

### Frontend
- **React** with Vite
- **Tailwind CSS** for styling
- **Lucide React** for icons
- **WebSocket client** for real-time updates

## Project Structure

```
/
├── backend/                    # Node.js WebSocket server
│   ├── src/
│   │   ├── websocket/         # Game logic and WebSocket hub
│   │   │   ├── game.js        # Core game engine
│   │   │   └── hub.js         # Matchmaking and game management
│   │   ├── bot/               # AI bot logic
│   │   │   └── bot.js         # Smart bot with strategic moves
│   │   ├── database/          # Supabase integration
│   │   │   └── supabase.js    # Database queries
│   │   ├── kafka/             # Event publishing
│   │   │   └── publisher.js   # Kafka event publisher
│   │   └── server.js          # Express + WebSocket server
│   ├── Dockerfile
│   ├── package.json
│   └── .env                   # Environment variables
├── src/                       # React frontend
│   ├── components/            # UI components
│   │   ├── GameBoard.jsx      # Interactive game board
│   │   ├── UsernameForm.jsx   # Login screen
│   │   ├── Leaderboard.jsx    # Leaderboard display
│   │   └── GameModal.jsx      # Game over modal
│   ├── pages/
│   │   └── Game.jsx           # Main game page
│   ├── websocket/
│   │   └── socket.js          # WebSocket client wrapper
│   └── App.jsx                # Root component
├── supabase/migrations/       # Database migrations
├── docker-compose.yml         # Local development setup
└── README.md
```

## Setup Instructions

### Prerequisites
- Node.js 18+ installed
- Supabase account (free tier works)
- Docker and Docker Compose (optional, for Kafka)

### 1. Database Setup

The Supabase database is already configured. The migration has created:
- `games` table: Stores completed game records
- `leaderboard` table: Tracks player statistics

### 2. Backend Setup

```bash
cd backend
npm install
npm start
```

The backend server will start on `http://localhost:8080`

### 3. Frontend Setup

```bash
npm install
npm run dev
```

The frontend will start on `http://localhost:5173`

### 4. Environment Variables

**Backend** (`backend/.env`):
```
SUPABASE_URL=your_supabase_url
SUPABASE_ANON_KEY=your_supabase_anon_key
PORT=8080
KAFKA_BROKERS=localhost:9092
```

**Frontend** (`.env`):
```
VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
VITE_WS_URL=ws://localhost:8080
VITE_API_URL=http://localhost:8080
```

### 5. Optional: Kafka Setup

To enable full Kafka event publishing:

```bash
docker-compose up -d kafka zookeeper
```

This will start Kafka and Zookeeper containers for event streaming.

## How to Play

1. **Enter Username**: Open the app and enter your username
2. **Matchmaking**: Wait for an opponent (max 10 seconds)
3. **Play**: Click columns to drop your disc (Red = Player 1, Yellow = Player 2)
4. **Win**: Connect 4 discs horizontally, vertically, or diagonally
5. **View Stats**: Check the leaderboard to see rankings

## Game Rules

- 7 columns × 6 rows grid
- Players alternate turns
- First to connect 4 discs wins
- If the board fills up, it's a draw
- 30-second reconnection window if disconnected

## API Endpoints

### GET `/health`
Health check endpoint

### GET `/leaderboard?limit=10`
Returns top players sorted by wins

**Response:**
```json
[
  {
    "username": "player1",
    "wins": 10,
    "losses": 3,
    "games_played": 13,
    "updated_at": "2025-10-20T..."
  }
]
```

## WebSocket Events

### Client → Server

**Join Game:**
```json
{
  "type": "join",
  "username": "player1"
}
```

**Make Move:**
```json
{
  "type": "move",
  "gameId": "uuid",
  "column": 3
}
```

### Server → Client

**Waiting for Opponent:**
```json
{
  "type": "waiting",
  "message": "Waiting for opponent..."
}
```

**Game Started:**
```json
{
  "type": "gameStart",
  "gameId": "uuid",
  "opponent": "player2",
  "yourPlayer": 1,
  "board": [[0,0,...]],
  "currentPlayer": 1
}
```

**Move Made:**
```json
{
  "type": "moveMade",
  "column": 3,
  "row": 5,
  "player": 1,
  "board": [[0,0,...]],
  "currentPlayer": 2
}
```

**Game Over:**
```json
{
  "type": "gameOver",
  "winner": "player1",
  "board": [[0,0,...]]
}
```

## Kafka Events

When Kafka is enabled, the following events are published:

- `game_started`: When a new game begins
- `move_made`: Each move by a player
- `game_won`: When a player wins
- `game_drawn`: When the game ends in a draw
- `player_disconnected`: When a player loses connection

## Bot Strategy

The AI bot uses a strategic decision-making process:

1. **Win Detection**: If bot can win this turn, take that move
2. **Block Detection**: If opponent can win next turn, block them
3. **Strategic Positioning**: Evaluate positions based on:
   - Center column preference
   - Creating multiple threat opportunities
   - Avoiding setups that benefit opponent
4. **Fallback**: Random valid move if no strategic option exists

## Deployment

### Backend (Render/Railway/Fly.io)

1. Push code to GitHub
2. Connect repository to hosting platform
3. Set environment variables
4. Deploy

### Frontend (Vercel/Netlify)

1. Push code to GitHub
2. Connect repository to hosting platform
3. Set build command: `npm run build`
4. Set environment variables with production URLs
5. Deploy

## Development

Run both frontend and backend concurrently:

```bash
# Terminal 1 - Backend
cd backend && npm start

# Terminal 2 - Frontend
npm run dev
```

## Future Enhancements

- [ ] User authentication with Supabase Auth
- [ ] Private game rooms with invite codes
- [ ] Game replay system
- [ ] Multiple AI difficulty levels
- [ ] Tournament mode
- [ ] Chat system during games
- [ ] Sound effects and animations
- [ ] Mobile app version

## License

MIT License - feel free to use this project for learning or production.

## Credits

Built with modern web technologies for real-time multiplayer gaming.
