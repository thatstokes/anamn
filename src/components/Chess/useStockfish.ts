import { useState, useEffect, useRef, useCallback } from 'react';
import type { EngineAnalysis } from '../../../shared/types.js';

interface UseStockfishOptions {
  enabled?: boolean;
  depth?: number;
  debounceMs?: number;
}

interface UseStockfishResult {
  analysis: EngineAnalysis | null;
  loading: boolean;
  error: string | null;
  analyze: () => void;
}

// Get whose turn it is from a FEN string
function getSideToMove(fen: string): 'w' | 'b' {
  const parts = fen.split(' ');
  return (parts[1] === 'b' ? 'b' : 'w');
}

// Normalize analysis to always be from white's perspective
function normalizeAnalysis(analysis: EngineAnalysis, fen: string): EngineAnalysis {
  const sideToMove = getSideToMove(fen);

  // UCI scores are from the perspective of the side to move
  // We want scores from white's perspective (positive = white is better)
  if (sideToMove === 'b') {
    return {
      ...analysis,
      score: -analysis.score,
      mate: analysis.mate !== null ? -analysis.mate : null,
    };
  }

  return analysis;
}

export function useStockfish(
  fen: string,
  options: UseStockfishOptions = {}
): UseStockfishResult {
  const { enabled = true, depth = 20, debounceMs = 300 } = options;

  const [analysis, setAnalysis] = useState<EngineAnalysis | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const debounceTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const currentFen = useRef<string>(fen);

  const analyze = useCallback(async () => {
    if (!enabled) return;

    setLoading(true);
    setError(null);

    try {
      const result = await window.api.chess.analyze(fen, depth);
      // Only update if this is still the current position
      if (currentFen.current === fen) {
        // Normalize score to white's perspective
        setAnalysis(normalizeAnalysis(result, fen));
      }
    } catch (e) {
      if (currentFen.current === fen) {
        setError(e instanceof Error ? e.message : 'Analysis failed');
      }
    } finally {
      if (currentFen.current === fen) {
        setLoading(false);
      }
    }
  }, [fen, depth, enabled]);

  useEffect(() => {
    currentFen.current = fen;

    if (!enabled) {
      setAnalysis(null);
      setLoading(false);
      return;
    }

    // Don't clear previous analysis - keep it visible until new one arrives
    // This prevents the jarring reset to 0.00

    // Debounce analysis requests
    if (debounceTimer.current) {
      clearTimeout(debounceTimer.current);
    }

    debounceTimer.current = setTimeout(() => {
      analyze();
    }, debounceMs);

    return () => {
      if (debounceTimer.current) {
        clearTimeout(debounceTimer.current);
      }
      // Stop any ongoing analysis when position changes or unmounting
      window.api.chess.stopAnalysis().catch(() => {
        // Ignore errors on stop
      });
    };
  }, [fen, enabled, debounceMs, analyze]);

  return { analysis, loading, error, analyze };
}

// Helper to format score for display
export function formatScore(analysis: EngineAnalysis | null): string {
  if (!analysis) return '';

  if (analysis.mate !== null) {
    const sign = analysis.mate > 0 ? '+' : '';
    return `M${sign}${analysis.mate}`;
  }

  const score = analysis.score / 100; // Convert centipawns to pawns
  const sign = score > 0 ? '+' : '';
  return `${sign}${score.toFixed(2)}`;
}

// Helper to convert UCI move to display format
export function formatMove(uciMove: string): string {
  if (uciMove.length < 4) return uciMove;

  const from = uciMove.slice(0, 2);
  const to = uciMove.slice(2, 4);
  const promotion = uciMove.length > 4 ? uciMove[4] : '';

  return `${from}-${to}${promotion ? `=${promotion.toUpperCase()}` : ''}`;
}

// Calculate eval bar percentage (0-100, where 50 is equal)
export function getEvalBarPercent(analysis: EngineAnalysis | null): number {
  if (!analysis) return 50;

  if (analysis.mate !== null) {
    // Mate: show full bar for winning side
    return analysis.mate > 0 ? 100 : 0;
  }

  // Convert centipawns to percentage
  // Use sigmoid-like scaling: ±500cp = ~90%
  const score = analysis.score / 100;
  const scaled = 50 + (50 * (2 / (1 + Math.exp(-score * 0.4)) - 1));

  return Math.max(0, Math.min(100, scaled));
}
