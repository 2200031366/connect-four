/*
  # Create Connect Four Game Tables

  1. New Tables
    - `games`
      - `id` (serial, primary key) - Unique game identifier
      - `game_id` (uuid, unique) - Public game ID for reconnection
      - `player1` (text) - First player username
      - `player2` (text) - Second player username (or 'bot')
      - `winner` (text, nullable) - Winner username or 'draw'
      - `duration` (integer) - Game duration in seconds
      - `created_at` (timestamptz) - Game start timestamp
      - `completed_at` (timestamptz, nullable) - Game end timestamp
    
    - `leaderboard`
      - `username` (text, primary key) - Player username
      - `wins` (integer) - Total wins count
      - `losses` (integer) - Total losses count
      - `games_played` (integer) - Total games played
      - `updated_at` (timestamptz) - Last update timestamp

  2. Security
    - Enable RLS on both tables
    - Add policies for public read access (game is public for all players)
    - Add policies for authenticated system writes
*/

-- Create games table
CREATE TABLE IF NOT EXISTS games (
  id SERIAL PRIMARY KEY,
  game_id UUID UNIQUE DEFAULT gen_random_uuid(),
  player1 TEXT NOT NULL,
  player2 TEXT NOT NULL,
  winner TEXT,
  duration INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now(),
  completed_at TIMESTAMPTZ
);

-- Create leaderboard table
CREATE TABLE IF NOT EXISTS leaderboard (
  username TEXT PRIMARY KEY,
  wins INTEGER DEFAULT 0,
  losses INTEGER DEFAULT 0,
  games_played INTEGER DEFAULT 0,
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Create index for faster leaderboard queries
CREATE INDEX IF NOT EXISTS idx_leaderboard_wins ON leaderboard(wins DESC);
CREATE INDEX IF NOT EXISTS idx_games_created_at ON games(created_at DESC);

-- Enable Row Level Security
ALTER TABLE games ENABLE ROW LEVEL SECURITY;
ALTER TABLE leaderboard ENABLE ROW LEVEL SECURITY;

-- Create policies for public read access (anonymous users can view)
CREATE POLICY "Anyone can view games"
  ON games FOR SELECT
  TO anon, authenticated
  USING (true);

CREATE POLICY "Anyone can view leaderboard"
  ON leaderboard FOR SELECT
  TO anon, authenticated
  USING (true);

-- Create policies for service role writes (backend service)
CREATE POLICY "Service role can insert games"
  ON games FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Service role can update games"
  ON games FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Service role can insert leaderboard entries"
  ON leaderboard FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Service role can update leaderboard entries"
  ON leaderboard FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);