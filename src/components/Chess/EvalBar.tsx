import type { EngineAnalysis } from '../../../shared/types.js';
import { formatScore, getEvalBarPercent } from './useStockfish';

interface EvalBarProps {
  analysis: EngineAnalysis | null;
  loading?: boolean;
  disabled?: boolean;
  height?: number;
}

export function EvalBar({ analysis, loading = false, disabled = false, height = 400 }: EvalBarProps) {
  // When disabled, show neutral 50/50 position with no score
  const whitePercent = disabled ? 50 : getEvalBarPercent(analysis);
  const score = disabled ? '' : formatScore(analysis);

  // Black on top, white on bottom (like Lichess)
  // whitePercent determines how much of the bar is white (from bottom)
  return (
    <div className={`eval-bar ${disabled ? 'disabled' : ''}`} style={{ height }}>
      <div
        className="eval-bar-black"
        style={{ height: `${100 - whitePercent}%` }}
      />
      <div
        className="eval-bar-white"
        style={{ height: `${whitePercent}%` }}
      />
      {!disabled && (
        <div className={`eval-bar-score ${loading ? 'loading' : ''}`}>
          {loading ? '...' : score || '0.00'}
        </div>
      )}
    </div>
  );
}
