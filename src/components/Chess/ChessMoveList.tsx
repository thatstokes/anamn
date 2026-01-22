import { useState, useEffect, useCallback, useRef } from 'react';
import { ChessMoveListProps, ParsedMove, PIECE_SYMBOLS, NAG, NAG_SYMBOLS, NAG_CLASSES, MOVE_QUALITY_NAGS, NAG_LABELS } from './types';

interface AnnotationMenuState {
  moveIndex: number;
  x: number;
  y: number;
}

interface CommentEditState {
  moveIndex: number;
  comment: string;
}

// Convert piece letter in SAN to unicode symbol
// Always use white piece symbols as they have better font support
// The column already indicates whose move it is
function formatMoveWithSymbols(san: string): string {
  // Replace piece letters with symbols (K, Q, R, B, N)
  // Pawns don't have a letter in SAN
  return san.replace(/^([KQRBN])/, (_, piece) => {
    const pieceType = piece.toLowerCase() as keyof typeof PIECE_SYMBOLS;
    return PIECE_SYMBOLS[pieceType].w;
  });
}

// Get the primary NAG class for styling the move (first move quality NAG)
function getPrimaryNagClass(nags: NAG[] | undefined): string {
  if (!nags || nags.length === 0) return '';
  // Move quality NAGs are 1-6
  const moveNag = nags.find(n => n >= 1 && n <= 6);
  if (moveNag) {
    return NAG_CLASSES[moveNag];
  }
  return '';
}

// Render NAG symbols
function renderNags(nags: NAG[] | undefined): React.ReactNode {
  if (!nags || nags.length === 0) return null;

  return (
    <>
      {nags.map((nag, i) => (
        <span key={i} className={`chess-nag ${NAG_CLASSES[nag]}`}>
          {NAG_SYMBOLS[nag]}
        </span>
      ))}
    </>
  );
}

export function ChessMoveList({
  moves,
  currentIndex,
  onMoveClick,
  onAnnotateMove,
  onCommentMove,
}: ChessMoveListProps) {
  const [annotationMenu, setAnnotationMenu] = useState<AnnotationMenuState | null>(null);
  const [commentEdit, setCommentEdit] = useState<CommentEditState | null>(null);
  const commentInputRef = useRef<HTMLTextAreaElement>(null);

  // Close menu on click outside
  useEffect(() => {
    if (!annotationMenu) return;
    const handleClick = () => setAnnotationMenu(null);
    window.addEventListener('click', handleClick);
    return () => window.removeEventListener('click', handleClick);
  }, [annotationMenu]);

  // Focus comment input when opened
  useEffect(() => {
    if (commentEdit && commentInputRef.current) {
      commentInputRef.current.focus();
      // Move cursor to end
      commentInputRef.current.selectionStart = commentInputRef.current.value.length;
    }
  }, [commentEdit]);

  const handleContextMenu = useCallback((e: React.MouseEvent, moveIndex: number) => {
    if (!onAnnotateMove) return;
    e.preventDefault();
    e.stopPropagation();
    setAnnotationMenu({ moveIndex, x: e.clientX, y: e.clientY });
  }, [onAnnotateMove]);

  const handleAnnotate = useCallback((nag: NAG | null) => {
    if (annotationMenu && onAnnotateMove) {
      onAnnotateMove(annotationMenu.moveIndex, nag);
    }
    setAnnotationMenu(null);
  }, [annotationMenu, onAnnotateMove]);

  // Double-click to add/edit comment
  const handleDoubleClick = useCallback((e: React.MouseEvent, moveIndex: number) => {
    if (!onCommentMove) return;
    e.preventDefault();
    e.stopPropagation();
    const existingComment = moves[moveIndex]?.comment || '';
    setCommentEdit({ moveIndex, comment: existingComment });
  }, [onCommentMove, moves]);

  // Click on existing comment to edit
  const handleCommentClick = useCallback((e: React.MouseEvent, moveIndex: number) => {
    if (!onCommentMove) return;
    e.stopPropagation();
    const existingComment = moves[moveIndex]?.comment || '';
    setCommentEdit({ moveIndex, comment: existingComment });
  }, [onCommentMove, moves]);

  const handleCommentSave = useCallback(() => {
    if (commentEdit && onCommentMove) {
      onCommentMove(commentEdit.moveIndex, commentEdit.comment.trim());
    }
    setCommentEdit(null);
  }, [commentEdit, onCommentMove]);

  const handleCommentCancel = useCallback(() => {
    setCommentEdit(null);
  }, []);

  const handleCommentKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleCommentSave();
    } else if (e.key === 'Escape') {
      handleCommentCancel();
    }
  }, [handleCommentSave, handleCommentCancel]);

  // Group moves into pairs (white, black)
  interface MovePair {
    number: number;
    white: ParsedMove | undefined;
    black: ParsedMove | undefined;
    whiteIndex: number;
    blackIndex: number;
  }
  const movePairs: MovePair[] = [];

  for (let i = 0; i < moves.length; i += 2) {
    const moveNumber = Math.floor(i / 2) + 1;
    movePairs.push({
      number: moveNumber,
      white: moves[i],
      black: moves[i + 1],
      whiteIndex: i,
      blackIndex: i + 1,
    });
  }

  // Get current NAG for the selected move (for highlighting in menu)
  const currentMoveNag = annotationMenu
    ? moves[annotationMenu.moveIndex]?.nags?.find(n => n >= 1 && n <= 6)
    : undefined;

  // Check if we're editing a comment for a specific move pair
  const getCommentEditForPair = (pair: MovePair) => {
    if (!commentEdit) return null;
    if (commentEdit.moveIndex === pair.whiteIndex) return 'white';
    if (commentEdit.moveIndex === pair.blackIndex) return 'black';
    return null;
  };

  return (
    <div className="chess-moves">
      {movePairs.map((pair) => {
        const editingFor = getCommentEditForPair(pair);
        const showComments = pair.white?.comment || pair.black?.comment || editingFor;

        return (
        <div key={pair.number} className="chess-move-row">
          <div className="chess-move-number">
            {pair.number}.
          </div>
          <div
            className={`chess-move ${currentIndex === pair.whiteIndex ? 'active' : ''} ${getPrimaryNagClass(pair.white?.nags)} ${onAnnotateMove ? 'annotatable' : ''} ${onCommentMove ? 'commentable' : ''}`}
            onClick={() => onMoveClick(pair.whiteIndex)}
            onDoubleClick={(e) => pair.white && handleDoubleClick(e, pair.whiteIndex)}
            onContextMenu={(e) => pair.white && handleContextMenu(e, pair.whiteIndex)}
          >
            {pair.white ? formatMoveWithSymbols(pair.white.san) : ''}
            {pair.white && renderNags(pair.white.nags)}
          </div>
          <div
            className={`chess-move ${pair.black ? (currentIndex === pair.blackIndex ? 'active' : '') : 'empty'} ${getPrimaryNagClass(pair.black?.nags)} ${onAnnotateMove && pair.black ? 'annotatable' : ''} ${onCommentMove && pair.black ? 'commentable' : ''}`}
            onClick={() => pair.black && onMoveClick(pair.blackIndex)}
            onDoubleClick={(e) => pair.black && handleDoubleClick(e, pair.blackIndex)}
            onContextMenu={(e) => pair.black && handleContextMenu(e, pair.blackIndex)}
          >
            {pair.black ? formatMoveWithSymbols(pair.black.san) : ''}
            {pair.black && renderNags(pair.black.nags)}
          </div>
          {showComments && (
            <div className="chess-move-comments">
              {/* White's comment */}
              {editingFor === 'white' ? (
                <div className="chess-comment-edit">
                  <textarea
                    ref={commentInputRef}
                    className="chess-comment-input"
                    value={commentEdit?.comment || ''}
                    onChange={(e) => setCommentEdit(prev => prev ? { ...prev, comment: e.target.value } : null)}
                    onKeyDown={handleCommentKeyDown}
                    onBlur={handleCommentSave}
                    placeholder="Add a comment..."
                    rows={2}
                  />
                </div>
              ) : pair.white?.comment ? (
                <span
                  className={`chess-comment white-comment ${onCommentMove ? 'editable' : ''}`}
                  onClick={(e) => handleCommentClick(e, pair.whiteIndex)}
                >
                  {pair.white.comment}
                </span>
              ) : null}
              {/* Black's comment */}
              {editingFor === 'black' ? (
                <div className="chess-comment-edit">
                  <textarea
                    ref={editingFor === 'black' ? commentInputRef : undefined}
                    className="chess-comment-input"
                    value={commentEdit?.comment || ''}
                    onChange={(e) => setCommentEdit(prev => prev ? { ...prev, comment: e.target.value } : null)}
                    onKeyDown={handleCommentKeyDown}
                    onBlur={handleCommentSave}
                    placeholder="Add a comment..."
                    rows={2}
                  />
                </div>
              ) : pair.black?.comment ? (
                <span
                  className={`chess-comment black-comment ${onCommentMove ? 'editable' : ''}`}
                  onClick={(e) => handleCommentClick(e, pair.blackIndex)}
                >
                  {pair.black.comment}
                </span>
              ) : null}
            </div>
          )}
        </div>
        );
      })}

      {/* Annotation context menu */}
      {annotationMenu && (
        <div
          className="chess-annotation-menu"
          style={{ left: annotationMenu.x, top: annotationMenu.y }}
          onClick={(e) => e.stopPropagation()}
        >
          <div className="chess-annotation-menu-header">Annotate move</div>
          {MOVE_QUALITY_NAGS.map((nag) => (
            <div
              key={nag}
              className={`chess-annotation-menu-item ${NAG_CLASSES[nag]} ${currentMoveNag === nag ? 'selected' : ''}`}
              onClick={() => handleAnnotate(nag)}
            >
              <span className="chess-annotation-menu-symbol">{NAG_SYMBOLS[nag]}</span>
              <span className="chess-annotation-menu-label">{NAG_LABELS[nag]}</span>
            </div>
          ))}
          {currentMoveNag && (
            <>
              <div className="chess-annotation-menu-divider" />
              <div
                className="chess-annotation-menu-item chess-annotation-menu-clear"
                onClick={() => handleAnnotate(null)}
              >
                Clear annotation
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
}
