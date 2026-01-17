// Chess types

export type PieceType = 'k' | 'q' | 'r' | 'b' | 'n' | 'p';
export type PieceColor = 'w' | 'b';

export interface ChessPiece {
  type: PieceType;
  color: PieceColor;
}

export type Square = string; // e.g., 'e4', 'a1'

export interface LastMove {
  from: Square;
  to: Square;
}

export type ArrowColor = 'green' | 'blue' | 'red' | 'yellow';

export interface Arrow {
  from: Square;
  to: Square;
  color?: ArrowColor;
}

export interface ChessBoardProps {
  position: string; // FEN position string
  size?: number; // Board size in pixels (default: 400)
  flipped?: boolean; // View from black's perspective
  lastMove?: LastMove | undefined; // Highlight last move squares
  arrows?: Arrow[]; // Arrows to draw on board (e.g., for best move)
}

export interface ChessPositionProps {
  fen: string;
}

export interface ChessViewerProps {
  pgn: string;
  defaultFlipped?: boolean;  // Start with board flipped (black at bottom)
}

// Numeric Annotation Glyphs (NAGs) for move quality
export type NAG = 1 | 2 | 3 | 4 | 5 | 6 | 7 | 10 | 13 | 14 | 15 | 16 | 17 | 18 | 19;

// NAG to symbol mapping
export const NAG_SYMBOLS: Record<NAG, string> = {
  1: '!',      // Good move
  2: '?',      // Mistake
  3: '!!',     // Brilliant move
  4: '??',     // Blunder
  5: '!?',     // Interesting move
  6: '?!',     // Dubious move
  7: '□',      // Forced move (only move)
  10: '=',     // Equal position
  13: '∞',     // Unclear position
  14: '⩲',     // White has slight advantage
  15: '⩱',     // Black has slight advantage
  16: '±',     // White has moderate advantage
  17: '∓',     // Black has moderate advantage
  18: '+−',    // White has decisive advantage
  19: '−+',    // Black has decisive advantage
};

// NAG CSS class for styling
export const NAG_CLASSES: Record<NAG, string> = {
  1: 'nag-good',
  2: 'nag-mistake',
  3: 'nag-brilliant',
  4: 'nag-blunder',
  5: 'nag-interesting',
  6: 'nag-dubious',
  7: 'nag-forced',
  10: 'nag-equal',
  13: 'nag-unclear',
  14: 'nag-white-slight',
  15: 'nag-black-slight',
  16: 'nag-white-moderate',
  17: 'nag-black-moderate',
  18: 'nag-white-decisive',
  19: 'nag-black-decisive',
};

export interface ParsedMove {
  san: string; // Standard algebraic notation (e.g., "Nf3")
  from: Square;
  to: Square;
  piece: PieceType;
  color: PieceColor;
  captured?: PieceType | undefined;
  promotion?: PieceType | undefined;
  nags?: NAG[]; // Annotation glyphs for this move
  comment?: string; // Text annotation after the move
}

export interface ChessMoveListProps {
  moves: ParsedMove[];
  currentIndex: number;
  onMoveClick: (index: number) => void;
}

// Map piece types to unicode symbols
export const PIECE_SYMBOLS: Record<PieceType, { w: string; b: string }> = {
  k: { w: '♔', b: '♚' },
  q: { w: '♕', b: '♛' },
  r: { w: '♖', b: '♜' },
  b: { w: '♗', b: '♝' },
  n: { w: '♘', b: '♞' },
  p: { w: '♙', b: '♟' },
};

// Starting position FEN
export const STARTING_FEN = 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1';

// Files and ranks
export const FILES = ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h'] as const;
export const RANKS = ['8', '7', '6', '5', '4', '3', '2', '1'] as const;
