import { useRef, useEffect } from "react";
import { styles } from "../styles/styles.js";

interface Command {
  id: string;
  label: string;
  action: () => void;
}

interface CommandPaletteProps {
  commands: Command[];
  query: string;
  setQuery: (query: string) => void;
  onClose: () => void;
  onExecute: (command: Command) => void;
}

export function CommandPalette({
  commands,
  query,
  setQuery,
  onClose,
  onExecute,
}: CommandPaletteProps) {
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  const filteredCommands = query.trim()
    ? commands.filter((cmd) => cmd.label.toLowerCase().includes(query.toLowerCase()))
    : commands;

  return (
    <div style={styles.modalOverlay} onClick={onClose}>
      <div style={styles.commandPalette} onClick={(e) => e.stopPropagation()}>
        <input
          ref={inputRef}
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              const firstCmd = filteredCommands[0];
              if (firstCmd) onExecute(firstCmd);
            }
            if (e.key === "Escape") {
              onClose();
            }
          }}
          placeholder="Type a command..."
          style={styles.commandInput}
          autoFocus
        />
        <div style={styles.commandList}>
          {filteredCommands.map((cmd) => (
            <div
              key={cmd.id}
              onClick={() => onExecute(cmd)}
              style={styles.commandItem}
            >
              {cmd.label}
            </div>
          ))}
          {filteredCommands.length === 0 && (
            <div style={styles.commandEmpty}>No matching commands</div>
          )}
        </div>
      </div>
    </div>
  );
}
