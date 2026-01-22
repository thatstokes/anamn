import { useState, useEffect, useCallback, useRef } from 'react';
import { Chess } from 'chess.js';
import { ChessViewerProps, ParsedMove, STARTING_FEN, LastMove, Arrow, NAG, NAG_SYMBOLS, GameMetadata } from './types';
import { ChessBoard } from './ChessBoard';
import { ChessMoveList } from './ChessMoveList';
import { EvalBar } from './EvalBar';
import { useStockfish, formatScore, formatLineScore } from './useStockfish';
import { useOpening } from './useOpening';
import { uciLinesToSan, parseUciMove } from './chessUtils';
import { useUI } from '../../state/contexts/UIContext.js';

// Valid NAG numbers
const VALID_NAGS = new Set([1, 2, 3, 4, 5, 6, 7, 10, 13, 14, 15, 16, 17, 18, 19]);

function isValidNag(n: number): n is NAG {
  return VALID_NAGS.has(n);
}

// Parse NAGs from PGN text (e.g., "e4!" -> [1], "Nf3??" -> [4])
// Also handles explicit $N notation
function parseNagsFromPgn(pgn: string): Map<number, NAG[]> {
  const nagMap = new Map<number, NAG[]>();

  // Symbol to NAG mapping
  const symbolToNag: Record<string, NAG> = {
    '!!': 3,
    '??': 4,
    '!?': 5,
    '?!': 6,
    '!': 1,
    '?': 2,
  };

  // Find moves with annotations
  // Match move number, optional dots, move text, and annotations
  const moveRegex = /(\d+)\.\s*(\S+?)([!?]{1,2})?(?:\s+\$(\d+))*(?:\s+(\S+?)([!?]{1,2})?(?:\s+\$(\d+))*)?/g;

  let match;
  let moveIndex = 0;

  while ((match = moveRegex.exec(pgn)) !== null) {
    // White's move
    const whiteNags: NAG[] = [];
    const whiteSymbol = match[3];
    if (whiteSymbol && symbolToNag[whiteSymbol]) {
      whiteNags.push(symbolToNag[whiteSymbol]);
    }
    if (match[4]) {
      const nagNum = parseInt(match[4], 10);
      if (isValidNag(nagNum)) {
        whiteNags.push(nagNum);
      }
    }
    if (whiteNags.length > 0) {
      nagMap.set(moveIndex, whiteNags);
    }
    moveIndex++;

    // Black's move (if present)
    if (match[5]) {
      const blackNags: NAG[] = [];
      const blackSymbol = match[6];
      if (blackSymbol && symbolToNag[blackSymbol]) {
        blackNags.push(symbolToNag[blackSymbol]);
      }
      if (match[7]) {
        const nagNum = parseInt(match[7], 10);
        if (isValidNag(nagNum)) {
          blackNags.push(nagNum);
        }
      }
      if (blackNags.length > 0) {
        nagMap.set(moveIndex, blackNags);
      }
      moveIndex++;
    }
  }

  return nagMap;
}

// Parse comments from PGN text (text in curly braces: {comment})
// Comments appear after moves and are associated with the preceding move
function parseCommentsFromPgn(pgn: string): Map<number, string> {
  const commentMap = new Map<number, string>();

  // Get move section (after headers)
  const moveTextMatch = pgn.match(/\]\s*\n\s*\n([\s\S]+)$/);
  const moveText = moveTextMatch?.[1] || pgn;

  // Track move index as we scan through the text
  let moveIndex = -1; // Start at -1, increments on each move found

  // Tokenize: find moves and comments
  // Move pattern: number + dot(s) + move, or just a move after black's turn
  // Comment pattern: {text}
  const tokenRegex = /(\d+\.+\s*[a-zA-Z][a-zA-Z0-9+#=x-]*[!?]*)|([a-zA-Z][a-zA-Z0-9+#=x-]*[!?]*)|(\{[^}]*\})/g;

  let match;
  let lastWasMove = false;

  while ((match = tokenRegex.exec(moveText)) !== null) {
    const fullMatch = match[0];

    if (fullMatch.startsWith('{')) {
      // This is a comment - associate with the last move
      if (lastWasMove && moveIndex >= 0) {
        const comment = fullMatch.slice(1, -1).trim(); // Remove braces
        if (comment) {
          // Append to existing comment if there is one
          const existing = commentMap.get(moveIndex);
          commentMap.set(moveIndex, existing ? `${existing} ${comment}` : comment);
        }
      }
      lastWasMove = false;
    } else {
      // This is a move
      moveIndex++;
      lastWasMove = true;
    }
  }

  return commentMap;
}

// Update PGN with annotation for a specific move
function updatePgnAnnotation(pgn: string, moveIndex: number, nag: NAG | null, moves: ParsedMove[]): string {
  const move = moves[moveIndex];
  if (!move) return pgn;

  const san = move.san;
  const isWhite = moveIndex % 2 === 0;
  const moveNumber = Math.floor(moveIndex / 2) + 1;

  // Symbol annotation (!, ?, !!, ??, !?, ?!)
  const nagSymbol = nag ? NAG_SYMBOLS[nag] : '';

  // Find the move in the PGN text
  // We need to find the specific occurrence based on move number and color
  // Pattern: moveNumber. whiteSan blackSan or moveNumber... blackSan (after comment)
  const lines = pgn.split('\n');
  const headerEndIndex = lines.findIndex((line, i) =>
    i > 0 && !line.startsWith('[') && lines[i - 1]?.startsWith('[')
  );
  const moveTextStartIndex = headerEndIndex >= 0 ? headerEndIndex : 0;

  // Reconstruct with headers preserved
  const headers = lines.slice(0, moveTextStartIndex).join('\n');
  let moveText = lines.slice(moveTextStartIndex).join('\n');

  // For white moves, match the pattern: "1. e4!?" -> replace with "1. e4" + new annotation
  // For black moves, match: "1. e4 c6!?" -> replace with "1. e4 c6" + new annotation
  let found = false;

  if (isWhite) {
    // White move: "N. san" where N is move number
    moveText = moveText.replace(
      new RegExp(`(${moveNumber}\\.\\s*)(${escapeRegex(san)})([!?]{1,2})?`),
      (_match, prefix, moveSan, _existingNag) => {
        found = true;
        return `${prefix}${moveSan}${nagSymbol}`;
      }
    );
  } else {
    // Black move - trickier because we need to find the right occurrence after white's move
    // Build a more specific pattern that matches the full move pair context
    const whiteMoveIndex = moveIndex - 1;
    const whiteMove = moves[whiteMoveIndex];
    if (whiteMove) {
      const whiteSan = whiteMove.san;
      // Match: "N. whiteSan... blackSan" with possible annotations and comments
      const fullPattern = new RegExp(
        `(${moveNumber}\\.\\s*${escapeRegex(whiteSan)}[!?]*(?:\\s*\\{[^}]*\\})?\\s*)(${escapeRegex(san)})([!?]{1,2})?`
      );
      moveText = moveText.replace(fullPattern, (_match, prefix, moveSan, _existingNag) => {
        found = true;
        return `${prefix}${moveSan}${nagSymbol}`;
      });
    }
  }

  // If not found with simple pattern, try a more general approach
  if (!found) {
    // Count occurrences of the SAN to find the right one
    let targetOccurrence = 0;
    for (let i = 0; i <= moveIndex; i++) {
      if (moves[i]?.san === san) targetOccurrence++;
    }

    // Replace the nth occurrence
    let occurrenceCount = 0;
    moveText = moveText.replace(
      new RegExp(`\\b(${escapeRegex(san)})([!?]{1,2})?\\b`, 'g'),
      (match, moveSan, _existingNag) => {
        occurrenceCount++;
        if (occurrenceCount === targetOccurrence) {
          return `${moveSan}${nagSymbol}`;
        }
        return match;
      }
    );
  }

  return headers ? `${headers}\n${moveText}` : moveText;
}

// Escape special regex characters
function escapeRegex(str: string): string {
  return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

// Update PGN with a comment for a specific move
// This function handles both SAN (Nf3) and UCI (g1f3) move notation
function updatePgnComment(pgn: string, moveIndex: number, comment: string, _moves: ParsedMove[]): string {
  console.log('[updatePgnComment] called', { moveIndex, comment });

  // Split into headers and move text
  const lines = pgn.split('\n');
  const headerEndIndex = lines.findIndex((line, i) =>
    i > 0 && !line.startsWith('[') && lines[i - 1]?.startsWith('[')
  );
  const moveTextStartIndex = headerEndIndex >= 0 ? headerEndIndex : 0;

  const headers = lines.slice(0, moveTextStartIndex).join('\n');
  let moveText = lines.slice(moveTextStartIndex).join('\n');

  // Strategy: tokenize the move text and find the Nth move by counting
  // This works regardless of whether moves are in SAN or UCI notation

  // Token types: move numbers, moves (SAN or UCI), comments {}, annotations (!?), results
  // We need to find the moveIndex-th move token and insert/replace comment after it

  // Pattern to match tokens:
  // - Move numbers: 1. or 1...
  // - Moves: SAN (Nf3, e4, O-O, exd5) or UCI (g1f3, e2e4)
  // - Comments: {text}
  // - Annotations: !, ?, !!, ??, !?, ?!
  // - Results: 1-0, 0-1, 1/2-1/2, *

  const tokenRegex = /(\d+\.+)|(\{[^}]*\})|([!?]{1,2})|([a-h][1-8][a-h][1-8][qrbnQRBN]?)|([KQRBN]?[a-h]?[1-8]?x?[a-h][1-8](?:=[QRBN])?[+#]?)|([O]-[O](?:-[O])?[+#]?)|(1-0|0-1|1\/2-1\/2|\*)/g;

  interface Token {
    type: 'moveNum' | 'comment' | 'annotation' | 'move' | 'result';
    value: string;
    index: number;
    length: number;
  }

  const tokens: Token[] = [];
  let match;

  while ((match = tokenRegex.exec(moveText)) !== null) {
    const value = match[0];
    let type: Token['type'];

    if (match[1]) type = 'moveNum';
    else if (match[2]) type = 'comment';
    else if (match[3]) type = 'annotation';
    else if (match[4] || match[5] || match[6]) type = 'move';
    else if (match[7]) type = 'result';
    else continue;

    tokens.push({ type, value, index: match.index, length: value.length });
  }

  console.log('[updatePgnComment] tokenized', {
    tokenCount: tokens.length,
    moveTokens: tokens.filter(t => t.type === 'move').length,
    firstFewTokens: tokens.slice(0, 10).map(t => ({ type: t.type, value: t.value }))
  });

  // Find the moveIndex-th move token
  let moveCount = -1;
  let targetTokenIndex = -1;

  for (let i = 0; i < tokens.length; i++) {
    if (tokens[i]?.type === 'move') {
      moveCount++;
      if (moveCount === moveIndex) {
        targetTokenIndex = i;
        break;
      }
    }
  }

  if (targetTokenIndex === -1) {
    console.log('[updatePgnComment] target move not found', { moveIndex, totalMoves: moveCount + 1 });
    return pgn;
  }

  const targetToken = tokens[targetTokenIndex];
  if (!targetToken) {
    console.log('[updatePgnComment] target token undefined');
    return pgn;
  }

  console.log('[updatePgnComment] found target', { targetTokenIndex, targetToken });

  // Find what comes after the move: could be annotation, comment, another move, etc.
  let insertPosition = targetToken.index + targetToken.length;
  let removeLength = 0;

  // Check for annotation after the move
  const nextToken = tokens[targetTokenIndex + 1];
  if (nextToken?.type === 'annotation') {
    insertPosition = nextToken.index + nextToken.length;
    // Check for comment after annotation
    const afterAnnotation = tokens[targetTokenIndex + 2];
    if (afterAnnotation?.type === 'comment') {
      removeLength = (afterAnnotation.index + afterAnnotation.length) - insertPosition;
    }
  } else if (nextToken?.type === 'comment') {
    // Comment directly after move - replace it
    removeLength = (nextToken.index + nextToken.length) - insertPosition;
  }

  // Build the new comment part
  const commentPart = comment ? ` {${comment}}` : '';

  // Reconstruct the move text
  const before = moveText.substring(0, insertPosition);
  const after = moveText.substring(insertPosition + removeLength);
  moveText = before + commentPart + after;

  console.log('[updatePgnComment] done', { insertPosition, removeLength, commentPart });

  return headers ? `${headers}\n${moveText}` : moveText;
}

export function ChessViewer({ pgn, defaultFlipped = false, onPgnChange }: ChessViewerProps) {
  const { chessConfig } = useUI();
  const [currentIndex, setCurrentIndex] = useState(-1); // -1 = starting position
  const [moves, setMoves] = useState<ParsedMove[]>([]);
  const [positions, setPositions] = useState<string[]>([STARTING_FEN]);
  const [lastMoves, setLastMoves] = useState<(LastMove | undefined)[]>([undefined]);
  const [error, setError] = useState<string | null>(null);
  const [analysisEnabled, setAnalysisEnabled] = useState(false);
  const [flipped, setFlipped] = useState(defaultFlipped);
  const [metadata, setMetadata] = useState<GameMetadata>({});
  const containerRef = useRef<HTMLDivElement>(null);

  // Parse PGN on mount
  useEffect(() => {
    try {
      const chess = new Chess();

      // Parse NAGs and comments from original PGN text before chess.js strips them
      const nagMap = parseNagsFromPgn(pgn);
      const commentMap = parseCommentsFromPgn(pgn);

      // Check for FlipBoard header
      const flipMatch = /\[FlipBoard\s+"true"\]/i.exec(pgn);
      if (flipMatch && !defaultFlipped) {
        setFlipped(true);
      }

      // Parse game metadata from headers
      const whiteMatch = /\[White\s+"([^"]+)"\]/i.exec(pgn);
      const blackMatch = /\[Black\s+"([^"]+)"\]/i.exec(pgn);
      const whiteEloMatch = /\[WhiteElo\s+"([^"]+)"\]/i.exec(pgn);
      const blackEloMatch = /\[BlackElo\s+"([^"]+)"\]/i.exec(pgn);
      const dateMatch = /\[Date\s+"([^"]+)"\]/i.exec(pgn);
      const resultMatch = /\[Result\s+"([^"]+)"\]/i.exec(pgn);
      const timeControlMatch = /\[TimeControl\s+"([^"]+)"\]/i.exec(pgn);

      setMetadata({
        whitePlayer: whiteMatch?.[1],
        blackPlayer: blackMatch?.[1],
        whiteElo: whiteEloMatch?.[1],
        blackElo: blackEloMatch?.[1],
        date: dateMatch?.[1],
        result: resultMatch?.[1],
        timeControl: timeControlMatch?.[1],
      });

      // Check for custom starting FEN
      const fenMatch = /\[FEN\s+"([^"]+)"\]/i.exec(pgn);
      const startingFen = fenMatch?.[1] || STARTING_FEN;

      // Try standard PGN parsing first
      let history = chess.history({ verbose: true });
      let pgnParsed = false;

      try {
        chess.loadPgn(pgn);
        history = chess.history({ verbose: true });
        pgnParsed = history.length > 0;
      } catch {
        // PGN parsing failed, will try UCI fallback
      }

      // If standard parsing failed or found no moves, try UCI move parsing
      if (!pgnParsed) {
        // Extract move text (everything after headers)
        const moveTextMatch = pgn.match(/\]\s*\n\s*\n([\s\S]+)$/);
        const moveText = moveTextMatch?.[1] || pgn;

        // Extract UCI-style moves (4-5 char patterns like d2d4, e7e8q)
        const uciMoveRegex = /\b([a-h][1-8][a-h][1-8][qrbn]?)\b/gi;
        const uciMoves: string[] = [];
        let match;
        while ((match = uciMoveRegex.exec(moveText)) !== null) {
          if (match[1]) uciMoves.push(match[1].toLowerCase());
        }

        if (uciMoves.length > 0) {
          // Replay UCI moves to build history
          const uciChess = new Chess(startingFen);
          for (const uciMove of uciMoves) {
            const from = uciMove.slice(0, 2);
            const to = uciMove.slice(2, 4);
            const promotion = uciMove[4];
            let moved = false;

            // Try with promotion first if present
            if (promotion) {
              try {
                uciChess.move({ from, to, promotion });
                moved = true;
              } catch {
                // Promotion failed, will try without
              }
            }

            // Try without promotion
            if (!moved) {
              try {
                uciChess.move({ from, to });
                moved = true;
              } catch {
                // Invalid move, stop parsing
                break;
              }
            }
          }
          history = uciChess.history({ verbose: true });
        }
      }

      const parsedMoves: ParsedMove[] = [];
      const positionList: string[] = [startingFen];
      const lastMoveList: (LastMove | undefined)[] = [undefined];

      // Replay moves to get positions at each step
      const replayChess = new Chess(startingFen);
      for (let i = 0; i < history.length; i++) {
        const move = history[i];
        if (!move) continue;
        replayChess.move(move.san);
        positionList.push(replayChess.fen());
        lastMoveList.push({ from: move.from, to: move.to });

        const nags = nagMap.get(i);
        const comment = commentMap.get(i);
        parsedMoves.push({
          san: move.san,
          from: move.from,
          to: move.to,
          piece: move.piece,
          color: move.color,
          captured: move.captured,
          promotion: move.promotion,
          ...(nags && { nags }),
          ...(comment && { comment }),
        });
      }

      setMoves(parsedMoves);
      setPositions(positionList);
      setLastMoves(lastMoveList);
      setError(null);
    } catch (e) {
      setError(`Invalid PGN: ${e instanceof Error ? e.message : 'Unknown error'}`);
    }
  }, [pgn, defaultFlipped]);

  // Navigation handlers
  const goToMove = useCallback((index: number) => {
    const clampedIndex = Math.max(-1, Math.min(index, moves.length - 1));
    setCurrentIndex(clampedIndex);
  }, [moves.length]);

  const goFirst = useCallback(() => goToMove(-1), [goToMove]);
  const goPrev = useCallback(() => goToMove(currentIndex - 1), [currentIndex, goToMove]);
  const goNext = useCallback(() => goToMove(currentIndex + 1), [currentIndex, goToMove]);
  const goLast = useCallback(() => goToMove(moves.length - 1), [moves.length, goToMove]);

  // Handle move annotation
  const handleAnnotateMove = useCallback((moveIndex: number, nag: NAG | null) => {
    if (!onPgnChange) return;

    // Update the PGN with the new annotation
    const newPgn = updatePgnAnnotation(pgn, moveIndex, nag, moves);

    // Update local moves state immediately for responsive UI
    setMoves(prevMoves => {
      const newMoves = [...prevMoves];
      const move = newMoves[moveIndex];
      if (move) {
        // Remove existing move quality NAGs (1-6)
        const otherNags = move.nags?.filter(n => n < 1 || n > 6) || [];
        const newNags = nag ? [...otherNags, nag] : (otherNags.length > 0 ? otherNags : undefined);
        // Create new move object, conditionally including nags
        const updatedMove: ParsedMove = {
          san: move.san,
          from: move.from,
          to: move.to,
          piece: move.piece,
          color: move.color,
        };
        if (move.captured) updatedMove.captured = move.captured;
        if (move.promotion) updatedMove.promotion = move.promotion;
        if (newNags) updatedMove.nags = newNags;
        if (move.comment) updatedMove.comment = move.comment;
        newMoves[moveIndex] = updatedMove;
      }
      return newMoves;
    });

    // Notify parent of PGN change
    onPgnChange(newPgn);
  }, [pgn, moves, onPgnChange]);

  // Handle move comment
  const handleCommentMove = useCallback((moveIndex: number, comment: string) => {
    console.log('[ChessViewer] handleCommentMove called', { moveIndex, comment, hasOnPgnChange: !!onPgnChange });
    if (!onPgnChange) {
      console.log('[ChessViewer] onPgnChange is undefined, returning early');
      return;
    }

    // Update the PGN with the new comment
    const newPgn = updatePgnComment(pgn, moveIndex, comment, moves);
    console.log('[ChessViewer] updatePgnComment result', { original: pgn.substring(0, 100), new: newPgn.substring(0, 100), changed: pgn !== newPgn });

    // Update local moves state immediately for responsive UI
    setMoves(prevMoves => {
      const newMoves = [...prevMoves];
      const move = newMoves[moveIndex];
      if (move) {
        // Create new move object, conditionally including comment
        const updatedMove: ParsedMove = {
          san: move.san,
          from: move.from,
          to: move.to,
          piece: move.piece,
          color: move.color,
        };
        if (move.captured) updatedMove.captured = move.captured;
        if (move.promotion) updatedMove.promotion = move.promotion;
        if (move.nags) updatedMove.nags = move.nags;
        if (comment) updatedMove.comment = comment;
        newMoves[moveIndex] = updatedMove;
      }
      return newMoves;
    });

    // Notify parent of PGN change
    onPgnChange(newPgn);
  }, [pgn, moves, onPgnChange]);

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
    depth: chessConfig.engineDepth,
    multiPv: chessConfig.multiPv,
    debounceMs: 300,
  });
  const opening = useOpening(currentPosition);

  // Build arrows for engine best move (green)
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
      <div className="chess-layout">
        <EvalBar analysis={analysis} loading={loading} disabled={!analysisEnabled} />
        <div className="chess-main">
          <ChessBoard
            position={currentPosition}
            size={400}
            lastMove={currentLastMove}
            arrows={arrows}
            flipped={flipped}
            metadata={metadata}
          />
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
          {chessConfig.multiPv > 1 && analysis.lines && analysis.lines.length > 1 ? (
            // Multiple lines display
            <>
              <div className="chess-analysis-header">
                {loading ? 'Analyzing...' : `Depth ${analysis.depth}`}
              </div>
              {analysis.lines.map((line, idx) => (
                <div key={idx} className="chess-analysis-multi-line">
                  <span className="chess-analysis-line-score">{formatLineScore(line)}</span>
                  <span className="chess-analysis-line-pv">
                    {uciLinesToSan(currentPosition, line.pv.slice(0, 6)).join(' ')}
                    {line.pv.length > 6 && '...'}
                  </span>
                </div>
              ))}
            </>
          ) : (
            // Single line display (original)
            <>
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
            </>
          )}
        </div>
      )}

      {moves.length > 0 && (
        <ChessMoveList
          moves={moves}
          currentIndex={currentIndex}
          onMoveClick={goToMove}
          onAnnotateMove={onPgnChange ? handleAnnotateMove : undefined}
          onCommentMove={onPgnChange ? handleCommentMove : undefined}
        />
      )}
    </div>
  );
}
