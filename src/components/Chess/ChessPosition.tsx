import { useState } from 'react';
import { ChessPositionProps, Arrow } from './types';
import { ChessBoard } from './ChessBoard';
import { EvalBar } from './EvalBar';
import { useStockfish, formatScore } from './useStockfish';
import { useOpening } from './useOpening';
import { uciToSan, uciLinesToSan, parseUciMove } from './chessUtils';
import { useUI } from '../../state/contexts/UIContext.js';

export function ChessPosition({ fen }: ChessPositionProps) {
  const { chessConfig } = useUI();
  const [analysisEnabled, setAnalysisEnabled] = useState(false);
  const [flipped, setFlipped] = useState(false);
  const { analysis, loading } = useStockfish(fen, {
    enabled: analysisEnabled,
    depth: chessConfig.engineDepth,
    multiPv: chessConfig.multiPv,
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
      <div className="chess-layout">
        <EvalBar analysis={analysis} loading={loading} disabled={!analysisEnabled} />
        <div className="chess-main">
          <ChessBoard position={fen} size={400} arrows={arrows} flipped={flipped} />
          <div className="chess-nav">
            <button
              className={`chess-nav-button chess-analysis-toggle ${analysisEnabled ? 'active' : ''}`}
              onClick={() => setAnalysisEnabled(!analysisEnabled)}
              title={analysisEnabled ? 'Disable analysis' : 'Enable Stockfish analysis'}
            >
              {analysisEnabled ? '🔍' : '🔎'}
            </button>
            <button
              className={`chess-nav-button ${flipped ? 'active' : ''}`}
              onClick={() => setFlipped(!flipped)}
              title="Flip board"
            >
              ⇅
            </button>
          </div>
        </div>
      </div>

      {opening && (
        <div className="chess-opening">
          <span className="chess-opening-eco">{opening.eco}</span>
          <span className="chess-opening-name">{opening.name}</span>
        </div>
      )}

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
    </div>
  );
}
