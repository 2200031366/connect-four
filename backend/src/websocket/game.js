import { v4 as uuidv4 } from 'uuid';

export const ROWS = 6;
export const COLS = 7;
export const PLAYER1 = 1;
export const PLAYER2 = 2;

export class Game {
  constructor(player1, player2) {
    this.id = uuidv4();
    this.board = Array.from({ length: ROWS }, () => Array(COLS).fill(0));
    this.player1 = player1;
    this.player2 = player2;
    this.currentPlayer = PLAYER1;
    this.winner = null;
    this.gameOver = false;
    this.startTime = Date.now();
    this.lastMoveTime = Date.now();
  }

  makeMove(column) {
    if (this.gameOver) return { success: false, message: 'Game over' };
    if (column < 0 || column >= COLS) return { success: false, message: 'Invalid column' };

    // Place piece in the lowest available row
    for (let row = ROWS - 1; row >= 0; row--) {
      if (this.board[row][column] === 0) {
        this.board[row][column] = this.currentPlayer;
        this.lastMoveTime = Date.now();

        // Check win or draw
        if (this.checkWin(row, column)) {
          this.winner = this.currentPlayer === PLAYER1 ? this.player1.username : this.player2.username;
          this.gameOver = true;
          return { success: true, row, column, gameOver: true, winner: this.winner };
        }

        if (this.checkDraw()) {
          this.winner = 'draw';
          this.gameOver = true;
          return { success: true, row, column, gameOver: true, winner: 'draw' };
        }

        // Switch player
        this.currentPlayer = this.currentPlayer === PLAYER1 ? PLAYER2 : PLAYER1;
        return { success: true, row, column, gameOver: false };
      }
    }

    return { success: false, message: 'Column is full' };
  }

  checkWin(row, col) {
    const player = this.board[row][col];
    return (
      this.checkDirection(row, col, 0, 1, player) || // horizontal
      this.checkDirection(row, col, 1, 0, player) || // vertical
      this.checkDirection(row, col, 1, 1, player) || // diagonal \
      this.checkDirection(row, col, 1, -1, player)   // diagonal /
    );
  }

  checkDirection(row, col, dRow, dCol, player) {
    let count = 1;
    count += this.countInDirection(row, col, dRow, dCol, player);
    count += this.countInDirection(row, col, -dRow, -dCol, player);
    return count >= 4;
  }

  countInDirection(row, col, dRow, dCol, player) {
    let count = 0;
    let r = row + dRow;
    let c = col + dCol;

    while (r >= 0 && r < ROWS && c >= 0 && c < COLS && this.board[r][c] === player) {
      count++;
      r += dRow;
      c += dCol;
    }

    return count;
  }

  checkDraw() {
    return this.board[0].every(cell => cell !== 0);
  }

  getValidMoves() {
    return Array.from({ length: COLS }, (_, col) => col).filter(col => this.board[0][col] === 0);
  }

  getGameDuration() {
    return Math.floor((Date.now() - this.startTime) / 1000);
  }

  getBoardState() {
    return {
      board: this.board,
      currentPlayer: this.currentPlayer,
      gameOver: this.gameOver,
      winner: this.winner
    };
  }
}
