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
}

export interface ParsedMove {
  san: string; // Standard algebraic notation (e.g., "Nf3")
  from: Square;
  to: Square;
  piece: PieceType;
  color: PieceColor;
  captured?: PieceType | undefined;
  promotion?: PieceType | undefined;
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
