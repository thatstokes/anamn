import { ChessBoardProps, ChessPiece, PieceType, PieceColor, FILES, RANKS } from './types';
import { Piece } from './pieces';

// Parse FEN position string to get piece placements
function parseFEN(fen: string): Map<string, ChessPiece> {
  const pieces = new Map<string, ChessPiece>();
  const parts = fen.split(' ');
  const position = parts[0];
  if (!position) return pieces;

  const rows = position.split('/');

  for (let rankIdx = 0; rankIdx < 8; rankIdx++) {
    const row = rows[rankIdx];
    if (!row) continue;
    let fileIdx = 0;

    for (const char of row) {
      if (/\d/.test(char)) {
        // Number indicates empty squares
        fileIdx += parseInt(char, 10);
      } else {
        // Letter indicates a piece
        const file = FILES[fileIdx];
        const rank = RANKS[rankIdx];
        if (file && rank) {
          const square = file + rank;
          const color: PieceColor = char === char.toUpperCase() ? 'w' : 'b';
          const type = char.toLowerCase() as PieceType;
          pieces.set(square, { type, color });
        }
        fileIdx++;
      }
    }
  }

  return pieces;
}

export function ChessBoard({
  position,
  size = 400,
  flipped = false,
  lastMove,
}: ChessBoardProps) {
  const pieces = parseFEN(position);
  const squareSize = size / 8;

  // Get files and ranks in correct order based on flip state
  const files = flipped ? [...FILES].reverse() : [...FILES];
  const ranks = flipped ? [...RANKS].reverse() : [...RANKS];

  const isLastMoveSquare = (square: string): boolean => {
    if (!lastMove) return false;
    return square === lastMove.from || square === lastMove.to;
  };

  return (
    <div
      className="chess-board-container"
      style={{ width: size, height: size }}
    >
      <div className="chess-board">
        {ranks.map((rank, rankIdx) =>
          files.map((file, fileIdx) => {
            const square = file + rank;
            const piece = pieces.get(square);
            const isLight = (rankIdx + fileIdx) % 2 === 0;
            const isHighlighted = isLastMoveSquare(square);

            return (
              <div
                key={square}
                className={`chess-square ${isLight ? 'light' : 'dark'} ${isHighlighted ? 'highlighted' : ''}`}
                style={{ width: squareSize, height: squareSize }}
                data-square={square}
              >
                {piece && (
                  <Piece
                    type={piece.type}
                    color={piece.color}
                    size={squareSize * 0.85}
                  />
                )}
                {/* File label on bottom rank */}
                {rankIdx === 7 && (
                  <span className={`chess-label file-label ${isLight ? 'on-light' : 'on-dark'}`}>
                    {file}
                  </span>
                )}
                {/* Rank label on first file */}
                {fileIdx === 0 && (
                  <span className={`chess-label rank-label ${isLight ? 'on-light' : 'on-dark'}`}>
                    {rank}
                  </span>
                )}
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
