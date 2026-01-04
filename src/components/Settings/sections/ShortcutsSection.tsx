import { useState, useEffect, useCallback } from "react";
import type { KeyboardShortcuts } from "../../../../shared/types.js";

interface ShortcutsSectionProps {
  shortcuts: KeyboardShortcuts;
  setShortcuts: (shortcuts: KeyboardShortcuts) => void;
}

const SHORTCUT_LABELS: Record<keyof KeyboardShortcuts, string> = {
  newNote: "New Note",
  search: "Search",
  toggleView: "Toggle View",
  save: "Save",
  closePanel: "Close Panel / Escape",
  commandPalette: "Command Palette",
  rightPanel: "Toggle Right Panel",
  dailyNote: "Open Daily Note",
};

export function ShortcutsSection({
  shortcuts,
  setShortcuts,
}: ShortcutsSectionProps) {
  const [recording, setRecording] = useState<keyof KeyboardShortcuts | null>(null);
  const [recordedKey, setRecordedKey] = useState<string | null>(null);

  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    if (!recording) return;

    e.preventDefault();
    e.stopPropagation();

    // Ignore modifier-only presses
    if (["Control", "Shift", "Alt", "Meta"].includes(e.key)) {
      return;
    }

    const parts: string[] = [];
    if (e.ctrlKey || e.metaKey) parts.push("Ctrl");
    if (e.shiftKey) parts.push("Shift");
    if (e.altKey) parts.push("Alt");

    // Normalize key name
    let key = e.key;
    if (key === " ") key = "Space";
    else if (key.length === 1) key = key.toUpperCase();

    parts.push(key);
    setRecordedKey(parts.join("+"));
  }, [recording]);

  useEffect(() => {
    if (recording) {
      window.addEventListener("keydown", handleKeyDown, true);
      return () => window.removeEventListener("keydown", handleKeyDown, true);
    }
  }, [recording, handleKeyDown]);

  const startRecording = (key: keyof KeyboardShortcuts) => {
    setRecording(key);
    setRecordedKey(null);
  };

  const saveRecording = () => {
    if (recording && recordedKey) {
      setShortcuts({
        ...shortcuts,
        [recording]: recordedKey,
      });
    }
    setRecording(null);
    setRecordedKey(null);
  };

  const cancelRecording = () => {
    setRecording(null);
    setRecordedKey(null);
  };

  return (
    <div>
      <div className="settings-section-title">Keyboard Shortcuts</div>

      <table className="settings-shortcut-table">
        <tbody>
          {(Object.keys(SHORTCUT_LABELS) as Array<keyof KeyboardShortcuts>).map((key) => (
            <tr key={key} className="settings-shortcut-row">
              <td className="settings-shortcut-cell label-cell">
                {SHORTCUT_LABELS[key]}
              </td>
              <td className="settings-shortcut-cell key-cell">
                {recording === key && recordedKey ? (
                  <span className="settings-shortcut-key recording">
                    {recordedKey}
                  </span>
                ) : (
                  <span className="settings-shortcut-key">
                    {shortcuts[key]}
                  </span>
                )}
              </td>
              <td className="settings-shortcut-cell action-cell">
                {recording === key ? (
                  <div className="settings-shortcut-actions">
                    <button
                      onClick={saveRecording}
                      disabled={!recordedKey}
                      className={`settings-shortcut-record-btn ${!recordedKey ? "disabled" : ""}`}
                    >
                      Save
                    </button>
                    <button
                      onClick={cancelRecording}
                      className="settings-shortcut-record-btn"
                    >
                      Cancel
                    </button>
                  </div>
                ) : (
                  <button
                    onClick={() => startRecording(key)}
                    className="settings-shortcut-record-btn"
                  >
                    Record
                  </button>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      {recording && (
        <p className="settings-recording-hint">
          Press any key combination to record...
        </p>
      )}
    </div>
  );
}
