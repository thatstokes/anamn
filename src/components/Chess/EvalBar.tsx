import type { EngineAnalysis } from '../../../shared/types.js';
import { formatScore, getEvalBarPercent } from './useStockfish';

interface EvalBarProps {
  analysis: EngineAnalysis | null;
  loading?: boolean;
  height?: number;
}

export function EvalBar({ analysis, loading = false, height = 400 }: EvalBarProps) {
  const whitePercent = getEvalBarPercent(analysis);
  const score = formatScore(analysis);

  // Black on top, white on bottom (like Lichess)
  // whitePercent determines how much of the bar is white (from bottom)
  return (
    <div className="eval-bar" style={{ height }}>
      <div
        className="eval-bar-black"
        style={{ height: `${100 - whitePercent}%` }}
      />
      <div
        className="eval-bar-white"
        style={{ height: `${whitePercent}%` }}
      />
      <div className={`eval-bar-score ${loading ? 'loading' : ''}`}>
        {loading ? '...' : score || '0.00'}
      </div>
    </div>
  );
}
