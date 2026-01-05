import { ChessPositionProps } from './types';
import { ChessBoard } from './ChessBoard';

export function ChessPosition({ fen }: ChessPositionProps) {
  return (
    <div className="chess-position">
      <ChessBoard position={fen} size={400} />
    </div>
  );
}
