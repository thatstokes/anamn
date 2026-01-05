import { ChessMoveListProps, ParsedMove, PIECE_SYMBOLS } from './types';

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
        <>
          <div key={`num-${pair.number}`} className="chess-move-number">
            {pair.number}.
          </div>
          <div
            key={`white-${pair.number}`}
            className={`chess-move ${currentIndex === pair.whiteIndex ? 'active' : ''}`}
            onClick={() => onMoveClick(pair.whiteIndex)}
          >
            {pair.white ? formatMoveWithSymbols(pair.white.san) : ''}
          </div>
          <div
            key={`black-${pair.number}`}
            className={`chess-move ${pair.black ? (currentIndex === pair.blackIndex ? 'active' : '') : 'empty'}`}
            onClick={() => pair.black && onMoveClick(pair.blackIndex)}
          >
            {pair.black ? formatMoveWithSymbols(pair.black.san) : ''}
          </div>
        </>
      ))}
    </div>
  );
}
