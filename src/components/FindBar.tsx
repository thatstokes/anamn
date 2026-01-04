import { useRef, useEffect } from "react";

interface FindBarProps {
  findQuery: string;
  setFindQuery: (query: string) => void;
  findMatches: number[];
  currentMatchIndex: number;
  findNext: () => void;
  findPrevious: () => void;
  closeFindBar: () => void;
}

export function FindBar({
  findQuery,
  setFindQuery,
  findMatches,
  currentMatchIndex,
  findNext,
  findPrevious,
  closeFindBar,
}: FindBarProps) {
  const findInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    findInputRef.current?.focus();
  }, []);

  return (
    <div className="find-bar">
      <input
        ref={findInputRef}
        type="text"
        value={findQuery}
        onChange={(e) => setFindQuery(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === "Enter") {
            e.shiftKey ? findPrevious() : findNext();
          }
          if (e.key === "Escape") {
            closeFindBar();
          }
        }}
        placeholder="Find in note..."
        className="find-input"
        autoFocus
      />
      <span className="find-count">
        {findMatches.length > 0
          ? `${currentMatchIndex + 1} / ${findMatches.length}`
          : findQuery
          ? "No matches"
          : ""}
      </span>
      <button onClick={findPrevious} className="find-button" title="Previous (Shift+Enter)">
        ↑
      </button>
      <button onClick={findNext} className="find-button" title="Next (Enter)">
        ↓
      </button>
      <button onClick={closeFindBar} className="find-button" title="Close (Escape)">
        ×
      </button>
    </div>
  );
}
