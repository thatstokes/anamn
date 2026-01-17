import { ChessBoardProps, ChessPiece, PieceType, PieceColor, FILES, RANKS, Arrow, ArrowColor } from './types';
import { Piece } from './pieces';

// Arrow color definitions
const ARROW_COLORS: Record<ArrowColor, string> = {
  green: '#15781b',
  blue: '#003088',
  red: '#882020',
  yellow: '#b8a000',
};

// Convert square name to pixel coordinates (center of square)
function squareToCoords(
  square: string,
  squareSize: number,
  flipped: boolean
): { x: number; y: number } {
  const file = square.charAt(0);
  const rank = square.charAt(1);

  const fileIdx = FILES.indexOf(file as typeof FILES[number]);
  const rankIdx = RANKS.indexOf(rank as typeof RANKS[number]);

  if (fileIdx === -1 || rankIdx === -1) {
    return { x: 0, y: 0 };
  }

  // For unflipped: a=0, h=7 for x; 8=0, 1=7 for y
  // For flipped: h=0, a=7 for x; 1=0, 8=7 for y
  const x = flipped
    ? (7 - fileIdx + 0.5) * squareSize
    : (fileIdx + 0.5) * squareSize;
  const y = flipped
    ? (7 - rankIdx + 0.5) * squareSize
    : (rankIdx + 0.5) * squareSize;

  return { x, y };
}

// SVG Arrow component
function ArrowOverlay({
  arrows,
  size,
  squareSize,
  flipped,
}: {
  arrows: Arrow[];
  size: number;
  squareSize: number;
  flipped: boolean;
}) {
  if (arrows.length === 0) return null;

  return (
    <svg
      className="chess-board-arrows"
      width={size}
      height={size}
      viewBox={`0 0 ${size} ${size}`}
    >
      <defs>
        {/* Define arrowhead markers for each color */}
        {(Object.keys(ARROW_COLORS) as ArrowColor[]).map((color) => (
          <marker
            key={color}
            id={`arrowhead-${color}`}
            markerWidth="4"
            markerHeight="4"
            refX="2.5"
            refY="2"
            orient="auto"
          >
            <polygon
              points="0 0, 4 2, 0 4"
              fill={ARROW_COLORS[color]}
            />
          </marker>
        ))}
      </defs>
      {arrows.map((arrow, idx) => {
        const from = squareToCoords(arrow.from, squareSize, flipped);
        const to = squareToCoords(arrow.to, squareSize, flipped);
        const color = arrow.color || 'green';

        // Shorten the line slightly so arrowhead doesn't overlap center
        const dx = to.x - from.x;
        const dy = to.y - from.y;
        const len = Math.sqrt(dx * dx + dy * dy);
        const shortenBy = squareSize * 0.3;
        const ratio = (len - shortenBy) / len;

        const toX = from.x + dx * ratio;
        const toY = from.y + dy * ratio;

        return (
          <line
            key={idx}
            x1={from.x}
            y1={from.y}
            x2={toX}
            y2={toY}
            stroke={ARROW_COLORS[color]}
            strokeWidth={squareSize * 0.15}
            strokeLinecap="round"
            opacity={0.8}
            markerEnd={`url(#arrowhead-${color})`}
          />
        );
      })}
    </svg>
  );
}

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
  arrows = [],
  whitePlayer,
  blackPlayer,
}: ChessBoardProps) {
  const pieces = parseFEN(position);
  const squareSize = size / 8;

  // Get files and ranks in correct order based on flip state
  const files = flipped ? [...FILES].reverse() : [...FILES];
  const ranks = flipped ? [...RANKS].reverse() : [...RANKS];

  // Player at top/bottom depends on board orientation
  const topPlayer = flipped ? whitePlayer : blackPlayer;
  const bottomPlayer = flipped ? blackPlayer : whitePlayer;

  const isLastMoveSquare = (square: string): boolean => {
    if (!lastMove) return false;
    return square === lastMove.from || square === lastMove.to;
  };

  return (
    <div className="chess-board-wrapper">
      {topPlayer && (
        <div className="chess-player-name chess-player-top">
          {topPlayer}
        </div>
      )}
      <div
        className="chess-board-container"
        style={{ width: size, height: size, position: 'relative' }}
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
      <ArrowOverlay
        arrows={arrows}
        size={size}
        squareSize={squareSize}
        flipped={flipped}
      />
      </div>
      {bottomPlayer && (
        <div className="chess-player-name chess-player-bottom">
          {bottomPlayer}
        </div>
      )}
    </div>
  );
}
