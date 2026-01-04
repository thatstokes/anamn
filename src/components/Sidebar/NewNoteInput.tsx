import { useRef, useEffect } from "react";

interface NewNoteInputProps {
  value: string;
  onChange: (value: string) => void;
  onCreate: () => void;
  onCancel: () => void;
}

export function NewNoteInput({
  value,
  onChange,
  onCreate,
  onCancel,
}: NewNoteInputProps) {
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  return (
    <div className="new-note-input">
      <input
        ref={inputRef}
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === "Enter") onCreate();
          if (e.key === "Escape") onCancel();
        }}
        placeholder="Note title..."
        autoFocus
        className="new-note-input-field"
      />
    </div>
  );
}
