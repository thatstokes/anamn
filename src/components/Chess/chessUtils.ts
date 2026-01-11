import { Chess } from 'chess.js';
import { PIECE_SYMBOLS } from './types';

/**
 * Convert UCI move to SAN notation using chess.js
 */
export function uciToSan(fen: string, uciMove: string): string {
  try {
    const chess = new Chess(fen);
    const promotion = uciMove.length > 4 ? uciMove.charAt(4) : undefined;
    const move = chess.move({
      from: uciMove.slice(0, 2),
      to: uciMove.slice(2, 4),
      ...(promotion && { promotion }),
    });
    if (move) {
      return move.san.replace(/^([KQRBN])/, (_, piece) => {
        const pieceType = piece.toLowerCase() as keyof typeof PIECE_SYMBOLS;
        return PIECE_SYMBOLS[pieceType].w;
      });
    }
  } catch {
    // If conversion fails, return original
  }
  return uciMove;
}

/**
 * Convert a sequence of UCI moves to SAN, playing them sequentially
 */
export function uciLinesToSan(fen: string, uciMoves: string[]): string[] {
  const result: string[] = [];
  try {
    const chess = new Chess(fen);
    for (const uciMove of uciMoves) {
      const promotion = uciMove.length > 4 ? uciMove.charAt(4) : undefined;
      const move = chess.move({
        from: uciMove.slice(0, 2),
        to: uciMove.slice(2, 4),
        ...(promotion && { promotion }),
      });
      if (move) {
        const san = move.san.replace(/^([KQRBN])/, (_, piece) => {
          const pieceType = piece.toLowerCase() as keyof typeof PIECE_SYMBOLS;
          return PIECE_SYMBOLS[pieceType].w;
        });
        result.push(san);
      } else {
        break;
      }
    }
  } catch {
    // Return what we have so far
  }
  return result;
}

/**
 * Parse UCI move to get from/to squares
 */
export function parseUciMove(uciMove: string): { from: string; to: string } | null {
  if (uciMove.length < 4) return null;
  return {
    from: uciMove.slice(0, 2),
    to: uciMove.slice(2, 4),
  };
}
