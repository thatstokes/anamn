import { ChessMoveListProps, ParsedMove, PIECE_SYMBOLS, NAG, NAG_SYMBOLS, NAG_CLASSES } from './types';

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
}: ChessMoveListProps) {
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

  return (
    <div className="chess-moves">
      {movePairs.map((pair) => (
        <div key={pair.number} className="chess-move-row">
          <div className="chess-move-number">
            {pair.number}.
          </div>
          <div
            className={`chess-move ${currentIndex === pair.whiteIndex ? 'active' : ''} ${getPrimaryNagClass(pair.white?.nags)}`}
            onClick={() => onMoveClick(pair.whiteIndex)}
          >
            {pair.white ? formatMoveWithSymbols(pair.white.san) : ''}
            {pair.white && renderNags(pair.white.nags)}
          </div>
          <div
            className={`chess-move ${pair.black ? (currentIndex === pair.blackIndex ? 'active' : '') : 'empty'} ${getPrimaryNagClass(pair.black?.nags)}`}
            onClick={() => pair.black && onMoveClick(pair.blackIndex)}
          >
            {pair.black ? formatMoveWithSymbols(pair.black.san) : ''}
            {pair.black && renderNags(pair.black.nags)}
          </div>
          {(pair.white?.comment || pair.black?.comment) && (
            <div className="chess-move-comments">
              {pair.white?.comment && (
                <span className="chess-comment white-comment">{pair.white.comment}</span>
              )}
              {pair.black?.comment && (
                <span className="chess-comment black-comment">{pair.black.comment}</span>
              )}
            </div>
          )}
        </div>
      ))}
    </div>
  );
}
