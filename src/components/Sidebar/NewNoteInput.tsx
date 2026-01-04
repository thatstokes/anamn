import { useRef, useEffect } from "react";
import { styles } from "../../styles/styles.js";

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
    <div style={styles.newNoteInput}>
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
        style={styles.input}
      />
    </div>
  );
}
