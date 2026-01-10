import { useState, useEffect, useCallback, useRef } from 'react';
import { Chess } from 'chess.js';
import { ChessViewerProps, ParsedMove, STARTING_FEN, LastMove, PIECE_SYMBOLS, Arrow } from './types';
import { ChessBoard } from './ChessBoard';
import { ChessMoveList } from './ChessMoveList';
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
      // Replace piece letters with symbols for consistency with move list
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

// Convert a sequence of UCI moves to SAN, playing them sequentially
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
        // Replace piece letters with symbols
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

  // Stockfish analysis
  const { analysis, loading } = useStockfish(currentPosition, {
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
  const opening = useOpening(currentPosition);

  return (
    <div
      className="chess-viewer"
      ref={containerRef}
      tabIndex={0}
      style={{ outline: 'none' }}
    >
      <div className="chess-board-with-eval">
        {analysisEnabled && (
          <EvalBar analysis={analysis} loading={loading} height={400} />
        )}
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
          className={`chess-nav-button ${analysisEnabled ? 'active' : ''}`}
          onClick={() => setAnalysisEnabled(!analysisEnabled)}
          title="Toggle engine analysis"
        >
          ⚙
        </button>
      </div>

      {analysisEnabled && analysis && (
        <div className="chess-analysis">
          <div className="chess-analysis-score">
            <span className="label">Eval:</span>
            <span className="value">{formatScore(analysis)}</span>
            <span className="depth">Depth {analysis.depth}</span>
          </div>
          {analysis.bestMove && (
            <div className="chess-analysis-best">
              <span className="label">Best:</span>
              <span className="value">{uciToSan(currentPosition, analysis.bestMove)}</span>
            </div>
          )}
          {analysis.pv.length > 1 && (
            <div className="chess-analysis-pv">
              <span className="label">Line:</span>
              <span className="value">
                {uciLinesToSan(currentPosition, analysis.pv.slice(0, 5)).join(' ')}
                {analysis.pv.length > 5 ? '...' : ''}
              </span>
            </div>
          )}
        </div>
      )}

      {opening && (
        <div className="chess-opening">
          <span className="chess-opening-code">{opening.eco}</span>
          <span className="chess-opening-name">{opening.name}</span>
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
