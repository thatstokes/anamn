import { useState } from 'react';
import { Chess } from 'chess.js';
import { ChessPositionProps, Arrow, PIECE_SYMBOLS } from './types';
import { ChessBoard } from './ChessBoard';
import { EvalBar } from './EvalBar';
import { useStockfish, formatScore } from './useStockfish';
import { useOpening } from './useOpening';

// Convert UCI move to SAN notation using chess.js
function uciToSan(fen: string, uciMove: string): string {
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

// Convert a sequence of UCI moves to SAN
function uciLinesToSan(fen: string, uciMoves: string[]): string[] {
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

// Parse UCI move to get from/to squares
function parseUciMove(uciMove: string): { from: string; to: string } | null {
  if (uciMove.length < 4) return null;
  return {
    from: uciMove.slice(0, 2),
    to: uciMove.slice(2, 4),
  };
}

export function ChessPosition({ fen }: ChessPositionProps) {
  const [analysisEnabled, setAnalysisEnabled] = useState(false);
  const { analysis, loading } = useStockfish(fen, {
    enabled: analysisEnabled,
    depth: 20,
    debounceMs: 300,
  });

  // Build arrows for best move
  const arrows: Arrow[] = [];
  if (analysisEnabled && analysis?.bestMove) {
    const move = parseUciMove(analysis.bestMove);
    if (move) {
      arrows.push({ from: move.from, to: move.to, color: 'green' });
    }
  }

  // Opening detection
  const opening = useOpening(fen);

  return (
    <div className="chess-position">
      <div className="chess-board-with-eval">
        {analysisEnabled && <EvalBar analysis={analysis} loading={loading} />}
        <ChessBoard position={fen} size={400} arrows={arrows} />
      </div>

      <div className="chess-nav">
        <button
          className={`chess-nav-button chess-analysis-toggle ${analysisEnabled ? 'active' : ''}`}
          onClick={() => setAnalysisEnabled(!analysisEnabled)}
          title={analysisEnabled ? 'Disable analysis' : 'Enable Stockfish analysis'}
        >
          {analysisEnabled ? '🔍' : '🔎'}
        </button>
      </div>

      {analysisEnabled && analysis && (
        <div className="chess-analysis">
          <div className="chess-analysis-score">
            {loading ? 'Analyzing...' : formatScore(analysis)}
            {!loading && analysis.depth && <span className="chess-analysis-depth"> (d{analysis.depth})</span>}
          </div>
          {analysis.bestMove && (
            <div className="chess-analysis-best">
              Best: {uciToSan(fen, analysis.bestMove)}
            </div>
          )}
          {analysis.pv && analysis.pv.length > 1 && (
            <div className="chess-analysis-line">
              {uciLinesToSan(fen, analysis.pv.slice(0, 5)).join(' ')}
              {analysis.pv.length > 5 ? '...' : ''}
            </div>
          )}
        </div>
      )}

      {opening && (
        <div className="chess-opening">
          <span className="chess-opening-eco">{opening.eco}</span>
          <span className="chess-opening-name">{opening.name}</span>
        </div>
      )}
    </div>
  );
}
