import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseAnonKey = process.env.SUPABASE_ANON_KEY;
const supabaseServiceRole = process.env.SUPABASE_SERVICE_ROLE_KEY; // set this in your .env for server-side writes

if (!supabaseUrl) {
  throw new Error('Missing SUPABASE_URL environment variable');
}

if (!supabaseAnonKey && !supabaseServiceRole) {
  throw new Error('Missing Supabase keys (anon or service role). For server operations you should set SUPABASE_SERVICE_ROLE_KEY.');
}

// Use service role if available for server-side operations (safer for writes to tables with RLS)
const clientKey = supabaseServiceRole || supabaseAnonKey;
export const supabase = createClient(supabaseUrl, clientKey);

export async function saveGame(gameData) {
  const { data, error } = await supabase
    .from('games')
    .insert({
      game_id: gameData.gameId,
      player1: gameData.player1,
      player2: gameData.player2,
      winner: gameData.winner,
      duration: gameData.duration,
      completed_at: new Date().toISOString()
    })
    .select()
    .single();

  if (error) {
    console.error('Error saving game:', error);
    throw error;
  }

  return data;
}

export async function updateLeaderboard(username, isWin) {
  // defensive: ensure username is string
  const uname = String(username);

  const { data: existing, error: selectError } = await supabase
    .from('leaderboard')
    .select('*')
    .eq('username', uname)
    .maybeSingle();

  if (selectError) {
    console.error('Error reading leaderboard entry:', selectError);
    throw selectError;
  }

  if (existing) {
    const { error } = await supabase
      .from('leaderboard')
      .update({
        wins: isWin ? existing.wins + 1 : existing.wins,
        losses: isWin ? existing.losses : existing.losses + 1,
        games_played: existing.games_played + 1,
        updated_at: new Date().toISOString()
      })
      .eq('username', uname);

    if (error) {
      console.error('Error updating leaderboard:', error);
      throw error;
    }
  } else {
    const { error } = await supabase
      .from('leaderboard')
      .insert({
        username: uname,
        wins: isWin ? 1 : 0,
        losses: isWin ? 0 : 1,
        games_played: 1
      });

    if (error) {
      console.error('Error inserting leaderboard:', error);
      throw error;
    }
  }
}

export async function getLeaderboard(limit = 10) {
  const { data, error } = await supabase
    .from('leaderboard')
    .select('*')
    .order('wins', { ascending: false })
    .limit(limit);

  if (error) {
    console.error('Error fetching leaderboard:', error);
    throw error;
  }

  return data;
}
