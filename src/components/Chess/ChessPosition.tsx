// Temporarily simplified to debug React Error #300
import { ChessPositionProps } from './types';
import { ChessBoard } from './ChessBoard';

export function ChessPosition({ fen }: ChessPositionProps) {
  return (
    <div className="chess-position">
      <div className="chess-board-with-eval">
        <ChessBoard position={fen} size={400} arrows={[]} />
      </div>
    </div>
  );
}
