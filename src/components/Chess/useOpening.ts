import { useMemo } from 'react';
import ecoCodes from 'chess-eco-codes/codes.json';

export interface Opening {
  eco: string;
  name: string;
  moves: string;
}

type EcoDatabase = Record<string, Opening>;

const ecoDatabase = ecoCodes as EcoDatabase;

/**
 * Look up the opening name for a given FEN position.
 * Returns null if the position is not a known opening.
 */
export function useOpening(fen: string): Opening | null {
  return useMemo(() => {
    if (!fen) return null;

    // Try exact lookup first
    const exact = ecoDatabase[fen];
    if (exact) return exact;

    // The ECO database uses specific halfmove/fullmove clocks.
    // Try with halfmove clock = 0 and various fullmove numbers.
    const parts = fen.split(' ');
    if (parts.length !== 6) return null;

    const [position, side, castling, enPassant] = parts;

    // Try common fullmove numbers (1-30 covers most openings)
    for (let fullmove = 1; fullmove <= 30; fullmove++) {
      const normalizedFen = `${position} ${side} ${castling} ${enPassant} 0 ${fullmove}`;
      const result = ecoDatabase[normalizedFen];
      if (result) return result;
    }

    return null;
  }, [fen]);
}
