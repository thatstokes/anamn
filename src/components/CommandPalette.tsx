import { useRef, useEffect } from "react";

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
    <div className="modal-overlay" onClick={onClose}>
      <div className="command-palette" onClick={(e) => e.stopPropagation()}>
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
          className="command-input"
          autoFocus
        />
        <div className="command-list">
          {filteredCommands.map((cmd) => (
            <div
              key={cmd.id}
              onClick={() => onExecute(cmd)}
              className="command-item"
            >
              {cmd.label}
            </div>
          ))}
          {filteredCommands.length === 0 && (
            <div className="command-empty">No matching commands</div>
          )}
        </div>
      </div>
    </div>
  );
}
