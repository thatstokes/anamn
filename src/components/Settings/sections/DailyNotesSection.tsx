import { useMemo } from "react";
import { DateTime } from "luxon";
import type { DailyNoteConfig } from "../../../../shared/types.js";

interface DailyNotesSectionProps {
  dailyNote: DailyNoteConfig;
  setDailyNote: (config: DailyNoteConfig) => void;
}

export function DailyNotesSection({
  dailyNote,
  setDailyNote,
}: DailyNotesSectionProps) {
  const preview = useMemo(() => {
    try {
      const dateStr = DateTime.now().toFormat(dailyNote.format);
      return `${dailyNote.prefix}${dateStr}${dailyNote.suffix}.md`;
    } catch {
      return "Invalid date format";
    }
  }, [dailyNote.format, dailyNote.prefix, dailyNote.suffix]);

  const isValidFormat = useMemo(() => {
    try {
      DateTime.now().toFormat(dailyNote.format);
      return true;
    } catch {
      return false;
    }
  }, [dailyNote.format]);

  return (
    <div>
      <div className="settings-section-title">Daily Note Settings</div>

      <label className="settings-label">Date Format (Luxon format)</label>
      <input
        type="text"
        value={dailyNote.format}
        onChange={(e) => setDailyNote({ ...dailyNote, format: e.target.value })}
        className={`settings-input ${!isValidFormat ? "error" : ""}`}
        placeholder="yyyy-MM-dd"
      />

      <label className="settings-label">Prefix</label>
      <input
        type="text"
        value={dailyNote.prefix}
        onChange={(e) => setDailyNote({ ...dailyNote, prefix: e.target.value })}
        className="settings-input"
        placeholder="e.g., Daily - "
      />

      <label className="settings-label">Suffix</label>
      <input
        type="text"
        value={dailyNote.suffix}
        onChange={(e) => setDailyNote({ ...dailyNote, suffix: e.target.value })}
        className="settings-input"
        placeholder="e.g.,  Journal"
      />

      <label className="settings-label">Preview</label>
      <div className={`settings-preview ${!isValidFormat ? "error" : ""}`}>
        {preview}
      </div>

      <p className="settings-help-text">
        Common formats: yyyy-MM-dd, dd-MM-yyyy, MMMM d yyyy, EEE MMM d
      </p>
    </div>
  );
}
