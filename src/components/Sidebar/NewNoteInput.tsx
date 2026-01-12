import { useRef, useEffect, useState } from "react";
import { isChessUrl } from "../../../shared/chessUrlUtils.js";

interface NewNoteInputProps {
  value: string;
  onChange: (value: string) => void;
  onCreate: () => void;
  onCancel: () => void;
  onImportChess?: ((url: string) => Promise<void>) | undefined;
  isImporting?: boolean | undefined;
}

export function NewNoteInput({
  value,
  onChange,
  onCreate,
  onCancel,
  onImportChess,
  isImporting = false,
}: NewNoteInputProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [isUrl, setIsUrl] = useState(false);

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  // Detect if the current value is a chess URL
  useEffect(() => {
    setIsUrl(isChessUrl(value));
  }, [value]);

  const handleSubmit = async () => {
    if (isUrl && onImportChess) {
      await onImportChess(value);
    } else {
      onCreate();
    }
  };

  return (
    <div className="new-note-input">
      <input
        ref={inputRef}
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === "Enter" && !isImporting) handleSubmit();
          if (e.key === "Escape") onCancel();
        }}
        placeholder={isUrl ? "Importing chess game..." : "Note title or chess URL..."}
        autoFocus
        className="new-note-input-field"
        disabled={isImporting}
      />
      {isImporting && (
        <span className="new-note-loading">Loading...</span>
      )}
    </div>
  );
}
