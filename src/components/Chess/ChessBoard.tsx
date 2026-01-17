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

// Format time control for display (e.g., "600+5" -> "10+5")
function formatTimeControl(tc: string): string {
  // Handle common formats: "600" (seconds), "600+5" (base+increment), "1/300" (moves/seconds)
  const baseIncrement = tc.match(/^(\d+)\+(\d+)$/);
  if (baseIncrement && baseIncrement[1] && baseIncrement[2]) {
    const minutes = Math.floor(parseInt(baseIncrement[1], 10) / 60);
    return `${minutes}+${baseIncrement[2]}`;
  }
  const secondsOnly = tc.match(/^(\d+)$/);
  if (secondsOnly && secondsOnly[1]) {
    const minutes = Math.floor(parseInt(secondsOnly[1], 10) / 60);
    return `${minutes} min`;
  }
  return tc; // Return as-is if unknown format
}

// Format date for display (e.g., "2024.01.15" -> "Jan 15, 2024")
function formatDate(dateStr: string): string {
  // PGN dates are typically YYYY.MM.DD
  const parts = dateStr.split('.');
  if (parts.length !== 3) return dateStr;
  const [year, month, day] = parts;
  const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  const monthIdx = parseInt(month || '0', 10) - 1;
  if (monthIdx < 0 || monthIdx > 11) return dateStr;
  return `${monthNames[monthIdx]} ${parseInt(day || '0', 10)}, ${year}`;
}

export function ChessBoard({
  position,
  size = 400,
  flipped = false,
  lastMove,
  arrows = [],
  metadata,
}: ChessBoardProps) {
  const pieces = parseFEN(position);
  const squareSize = size / 8;

  // Get files and ranks in correct order based on flip state
  const files = flipped ? [...FILES].reverse() : [...FILES];
  const ranks = flipped ? [...RANKS].reverse() : [...RANKS];

  // Player at top/bottom depends on board orientation
  const topPlayer = flipped ? metadata?.whitePlayer : metadata?.blackPlayer;
  const bottomPlayer = flipped ? metadata?.blackPlayer : metadata?.whitePlayer;
  const topElo = flipped ? metadata?.whiteElo : metadata?.blackElo;
  const bottomElo = flipped ? metadata?.blackElo : metadata?.whiteElo;

  // Extract metadata values
  const gameDate = metadata?.date;
  const gameResult = metadata?.result;
  const gameTimeControl = metadata?.timeControl;
  const hasHeaderInfo = gameDate || gameResult || gameTimeControl;

  const isLastMoveSquare = (square: string): boolean => {
    if (!lastMove) return false;
    return square === lastMove.from || square === lastMove.to;
  };

  return (
    <div className="chess-board-wrapper">
      {hasHeaderInfo && (
        <div className="chess-game-info">
          {gameDate && (
            <span className="chess-game-date">{formatDate(gameDate)}</span>
          )}
          {gameTimeControl && (
            <span className="chess-game-time">{formatTimeControl(gameTimeControl)}</span>
          )}
          {gameResult && gameResult !== '*' && (
            <span className="chess-game-result">{gameResult}</span>
          )}
        </div>
      )}
      {topPlayer && (
        <div className="chess-player-name chess-player-top">
          <span className="chess-player-name-text">{topPlayer}</span>
          {topElo && <span className="chess-player-elo">({topElo})</span>}
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
          <span className="chess-player-name-text">{bottomPlayer}</span>
          {bottomElo && <span className="chess-player-elo">({bottomElo})</span>}
        </div>
      )}
    </div>
  );
}
