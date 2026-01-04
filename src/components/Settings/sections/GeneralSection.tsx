import type { ViewMode } from "../../../../shared/types.js";

interface GeneralSectionProps {
  defaultViewMode: ViewMode;
  setDefaultViewMode: (mode: ViewMode) => void;
}

export function GeneralSection({
  defaultViewMode,
  setDefaultViewMode,
}: GeneralSectionProps) {
  return (
    <div>
      <div className="settings-section-title">General Settings</div>

      <label className="settings-label">Default View Mode</label>
      <div className="settings-radio-group">
        <label className="settings-radio-label">
          <input
            type="radio"
            name="viewMode"
            checked={defaultViewMode === "rendered"}
            onChange={() => setDefaultViewMode("rendered")}
          />
          Rendered
        </label>
        <label className="settings-radio-label">
          <input
            type="radio"
            name="viewMode"
            checked={defaultViewMode === "edit"}
            onChange={() => setDefaultViewMode("edit")}
          />
          Edit
        </label>
      </div>
      <p className="settings-help-text">
        This sets the default view when opening a note.
      </p>
    </div>
  );
}
