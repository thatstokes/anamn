import { useState } from "react";
import type { RightPanelSection, ThemeMode } from "../../../../shared/types.js";
import { useTheme } from "../../ThemeProvider.js";

interface AppearanceSectionProps {
  rightPanelSections: RightPanelSection[];
  setRightPanelSections: (sections: RightPanelSection[]) => void;
}

const ALL_SECTIONS: RightPanelSection[] = ["recents", "links", "tags", "graph"];

const SECTION_LABELS: Record<RightPanelSection, string> = {
  recents: "Recent Notes",
  links: "Links",
  tags: "Tags",
  graph: "Graph",
};

export function AppearanceSection({
  rightPanelSections,
  setRightPanelSections,
}: AppearanceSectionProps) {
  const { theme, setTheme } = useTheme();
  const [draggedItem, setDraggedItem] = useState<RightPanelSection | null>(null);

  const handleThemeModeChange = async (mode: ThemeMode) => {
    if (mode === "custom" && !theme.customCssPath) {
      // Keep current mode until a CSS file is selected
      return;
    }
    await setTheme({ ...theme, mode });
  };

  const handleSelectCustomCss = async () => {
    const path = await window.api.theme.selectCustomCss();
    if (path) {
      await setTheme({ mode: "custom", customCssPath: path });
    }
  };

  const toggleSection = (section: RightPanelSection) => {
    if (rightPanelSections.includes(section)) {
      setRightPanelSections(rightPanelSections.filter((s) => s !== section));
    } else {
      setRightPanelSections([...rightPanelSections, section]);
    }
  };

  const handleDragStart = (e: React.DragEvent, section: RightPanelSection) => {
    setDraggedItem(section);
    e.dataTransfer.effectAllowed = "move";
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";
  };

  const handleDrop = (e: React.DragEvent, targetSection: RightPanelSection) => {
    e.preventDefault();
    if (!draggedItem || draggedItem === targetSection) {
      setDraggedItem(null);
      return;
    }

    // Only reorder within enabled sections
    if (!rightPanelSections.includes(draggedItem) || !rightPanelSections.includes(targetSection)) {
      setDraggedItem(null);
      return;
    }

    const newSections = [...rightPanelSections];
    const draggedIndex = newSections.indexOf(draggedItem);
    const targetIndex = newSections.indexOf(targetSection);

    newSections.splice(draggedIndex, 1);
    newSections.splice(targetIndex, 0, draggedItem);

    setRightPanelSections(newSections);
    setDraggedItem(null);
  };

  const handleDragEnd = () => {
    setDraggedItem(null);
  };

  // Show enabled sections first (in order), then disabled sections
  const sortedSections = [
    ...rightPanelSections,
    ...ALL_SECTIONS.filter((s) => !rightPanelSections.includes(s)),
  ];

  return (
    <div>
      <div className="settings-section-title">Theme</div>
      <div className="settings-radio-group">
        <label className="settings-radio-label">
          <input
            type="radio"
            name="theme"
            checked={theme.mode === "dark"}
            onChange={() => handleThemeModeChange("dark")}
          />
          Dark
        </label>
        <label className="settings-radio-label">
          <input
            type="radio"
            name="theme"
            checked={theme.mode === "light"}
            onChange={() => handleThemeModeChange("light")}
          />
          Light
        </label>
        <label className="settings-radio-label">
          <input
            type="radio"
            name="theme"
            checked={theme.mode === "custom"}
            onChange={() => {
              if (theme.customCssPath) {
                handleThemeModeChange("custom");
              } else {
                handleSelectCustomCss();
              }
            }}
          />
          Custom
        </label>
      </div>

      {theme.mode === "custom" && (
        <div style={{ marginBottom: "1rem" }}>
          <label className="settings-label">Custom CSS File</label>
          <div style={{ display: "flex", gap: "0.5rem", alignItems: "center" }}>
            <input
              type="text"
              value={theme.customCssPath ?? ""}
              readOnly
              className="settings-input"
              style={{ flex: 1, marginBottom: 0 }}
              placeholder="No file selected"
            />
            <button
              onClick={handleSelectCustomCss}
              className="settings-button"
              style={{ whiteSpace: "nowrap" }}
            >
              Browse...
            </button>
          </div>
        </div>
      )}

      <div className="settings-section-title" style={{ marginTop: "1.5rem" }}>Right Panel Sections</div>
      <p className="settings-help-text" style={{ marginBottom: "1rem" }}>
        Check to enable, drag to reorder. Order only applies to enabled sections.
      </p>

      {sortedSections.map((section) => {
        const isEnabled = rightPanelSections.includes(section);
        return (
          <div
            key={section}
            className={`settings-section-item ${isEnabled ? "" : "disabled"}`}
            draggable={isEnabled}
            onDragStart={(e) => handleDragStart(e, section)}
            onDragOver={handleDragOver}
            onDrop={(e) => handleDrop(e, section)}
            onDragEnd={handleDragEnd}
          >
            <input
              type="checkbox"
              checked={isEnabled}
              onChange={() => toggleSection(section)}
              className="settings-section-checkbox"
            />
            <span className="settings-section-label">
              {SECTION_LABELS[section]}
            </span>
            {isEnabled && (
              <span className="settings-drag-handle">⋮⋮</span>
            )}
          </div>
        );
      })}
    </div>
  );
}
