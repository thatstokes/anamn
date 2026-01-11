import { useState, useEffect, useCallback, useRef } from 'react';
import { Chess } from 'chess.js';
import { ChessViewerProps, ParsedMove, STARTING_FEN, LastMove, Arrow } from './types';
import { ChessBoard } from './ChessBoard';
import { ChessMoveList } from './ChessMoveList';
import { EvalBar } from './EvalBar';
import { useStockfish, formatScore } from './useStockfish';
import { useOpening } from './useOpening';
import { uciLinesToSan, parseUciMove } from './chessUtils';

export function ChessViewer({ pgn }: ChessViewerProps) {
  const [currentIndex, setCurrentIndex] = useState(-1); // -1 = starting position
  const [moves, setMoves] = useState<ParsedMove[]>([]);
  const [positions, setPositions] = useState<string[]>([STARTING_FEN]);
  const [lastMoves, setLastMoves] = useState<(LastMove | undefined)[]>([undefined]);
  const [error, setError] = useState<string | null>(null);
  const [analysisEnabled, setAnalysisEnabled] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  // Parse PGN on mount
  useEffect(() => {
    try {
      const chess = new Chess();
      chess.loadPgn(pgn);

      const history = chess.history({ verbose: true });
      const parsedMoves: ParsedMove[] = [];
      const positionList: string[] = [STARTING_FEN];
      const lastMoveList: (LastMove | undefined)[] = [undefined];

      // Replay moves to get positions at each step
      const replayChess = new Chess();
      for (const move of history) {
        replayChess.move(move.san);
        positionList.push(replayChess.fen());
        lastMoveList.push({ from: move.from, to: move.to });

        parsedMoves.push({
          san: move.san,
          from: move.from,
          to: move.to,
          piece: move.piece,
          color: move.color,
          captured: move.captured,
          promotion: move.promotion,
        });
      }

      setMoves(parsedMoves);
      setPositions(positionList);
      setLastMoves(lastMoveList);
      setError(null);
    } catch (e) {
      setError(`Invalid PGN: ${e instanceof Error ? e.message : 'Unknown error'}`);
    }
  }, [pgn]);

  // Navigation handlers
  const goToMove = useCallback((index: number) => {
    const clampedIndex = Math.max(-1, Math.min(index, moves.length - 1));
    setCurrentIndex(clampedIndex);
  }, [moves.length]);

  const goFirst = useCallback(() => goToMove(-1), [goToMove]);
  const goPrev = useCallback(() => goToMove(currentIndex - 1), [currentIndex, goToMove]);
  const goNext = useCallback(() => goToMove(currentIndex + 1), [currentIndex, goToMove]);
  const goLast = useCallback(() => goToMove(moves.length - 1), [moves.length, goToMove]);

  // Keyboard navigation
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      // Only handle if we're focused on this viewer
      if (!container.contains(document.activeElement) &&
          document.activeElement !== container) {
        return;
      }

      switch (e.key) {
        case 'ArrowLeft':
          e.preventDefault();
          goPrev();
          break;
        case 'ArrowRight':
          e.preventDefault();
          goNext();
          break;
        case 'Home':
          e.preventDefault();
          goFirst();
          break;
        case 'End':
          e.preventDefault();
          goLast();
          break;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [goFirst, goPrev, goNext, goLast]);

  if (error) {
    return (
      <div className="chess-viewer">
        <div className="chess-error" style={{ color: 'var(--text-secondary)', fontStyle: 'italic' }}>
          {error}
        </div>
        <pre style={{ fontSize: '12px', background: 'var(--bg-code)', padding: '0.5rem', borderRadius: '4px' }}>
          {pgn}
        </pre>
      </div>
    );
  }

  // Position index is currentIndex + 1 because positions[0] is the starting position
  const positionIndex = currentIndex + 1;
  const currentPosition = positions[positionIndex] || STARTING_FEN;
  const currentLastMove = lastMoves[positionIndex];

  const { analysis, loading } = useStockfish(currentPosition, {
    enabled: analysisEnabled,
    depth: 20,
    debounceMs: 300,
  });
  const opening = useOpening(currentPosition);

  // Build arrows from best move when analysis is available
  const arrows: Arrow[] = [];
  if (analysisEnabled && analysis?.bestMove) {
    const parsed = parseUciMove(analysis.bestMove);
    if (parsed) {
      arrows.push({ from: parsed.from, to: parsed.to, color: 'green' });
    }
  }

  return (
    <div
      className="chess-viewer"
      ref={containerRef}
      tabIndex={0}
      style={{ outline: 'none' }}
    >
      <div className="chess-board-with-eval">
        {analysisEnabled && <EvalBar analysis={analysis} loading={loading} />}
        <ChessBoard
          position={currentPosition}
          size={400}
          lastMove={currentLastMove}
          arrows={arrows}
        />
      </div>

      <div className="chess-nav">
        <button
          className="chess-nav-button"
          onClick={goFirst}
          disabled={currentIndex === -1}
          title="First move (Home)"
        >
          ⏮
        </button>
        <button
          className="chess-nav-button"
          onClick={goPrev}
          disabled={currentIndex === -1}
          title="Previous move (Left arrow)"
        >
          ◀
        </button>
        <button
          className="chess-nav-button"
          onClick={goNext}
          disabled={currentIndex === moves.length - 1}
          title="Next move (Right arrow)"
        >
          ▶
        </button>
        <button
          className="chess-nav-button"
          onClick={goLast}
          disabled={currentIndex === moves.length - 1}
          title="Last move (End)"
        >
          ⏭
        </button>
        <button
          className={`chess-nav-button chess-analysis-toggle ${analysisEnabled ? 'active' : ''}`}
          onClick={() => setAnalysisEnabled(!analysisEnabled)}
          title={analysisEnabled ? 'Disable analysis' : 'Enable Stockfish analysis'}
        >
          {analysisEnabled ? '🔍' : '🔎'}
        </button>
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
          {analysis.pv && analysis.pv.length > 0 && (
            <div className="chess-analysis-line">
              {uciLinesToSan(currentPosition, analysis.pv.slice(0, 8)).join(' ')}
              {analysis.pv.length > 8 && '...'}
            </div>
          )}
        </div>
      )}

      {moves.length > 0 && (
        <ChessMoveList
          moves={moves}
          currentIndex={currentIndex}
          onMoveClick={goToMove}
        />
      )}
    </div>
  );
}
