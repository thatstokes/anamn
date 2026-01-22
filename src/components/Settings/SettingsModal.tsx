import { useState, useEffect } from "react";
import type {
  Config,
  ViewMode,
  KeyboardShortcuts,
  DailyNoteConfig,
  RightPanelSection,
  ChessConfig,
  ChessImportConfig,
} from "../../../shared/types.js";
import { GeneralSection } from "./sections/GeneralSection.js";
import { ShortcutsSection } from "./sections/ShortcutsSection.js";
import { DailyNotesSection } from "./sections/DailyNotesSection.js";
import { AppearanceSection } from "./sections/AppearanceSection.js";
import { ChessSection } from "./sections/ChessSection.js";

type SettingsSection = "general" | "shortcuts" | "dailyNotes" | "appearance" | "chess";

interface SettingsModalProps {
  onClose: () => void;
  onSave: (config: Partial<Config>) => void;
}

const SECTIONS: { id: SettingsSection; label: string }[] = [
  { id: "general", label: "General" },
  { id: "shortcuts", label: "Shortcuts" },
  { id: "dailyNotes", label: "Daily Notes" },
  { id: "appearance", label: "Appearance" },
  { id: "chess", label: "Chess" },
];

export function SettingsModal({ onClose, onSave }: SettingsModalProps) {
  const [activeSection, setActiveSection] = useState<SettingsSection>("general");
  const [loading, setLoading] = useState(true);

  // Editable config state
  const [defaultViewMode, setDefaultViewMode] = useState<ViewMode>("rendered");
  const [shortcuts, setShortcuts] = useState<KeyboardShortcuts>({
    newNote: "Ctrl+N",
    search: "Ctrl+P",
    toggleView: "Ctrl+E",
    save: "Ctrl+S",
    closePanel: "Escape",
    commandPalette: "Ctrl+Shift+P",
    rightPanel: "Ctrl+G",
    dailyNote: "Ctrl+D",
  });
  const [dailyNote, setDailyNote] = useState<DailyNoteConfig>({
    format: "yyyy-MM-dd",
    prefix: "",
    suffix: "",
  });
  const [rightPanelSections, setRightPanelSections] = useState<RightPanelSection[]>([
    "links",
    "tags",
    "graph",
  ]);
  const [chess, setChess] = useState<ChessConfig>({
    engineDepth: 20,
    multiPv: 1,
  });
  const [chessImport, setChessImport] = useState<ChessImportConfig>({
    gameNoteTitleFormat: "{me} vs {opponent} {gameId}",
  });

  // Original config for reset
  const [originalConfig, setOriginalConfig] = useState<Partial<Config>>({});

  // Load config on mount
  useEffect(() => {
    window.api.config.get().then((config) => {
      setDefaultViewMode(config.default_view_mode);
      setShortcuts(config.shortcuts);
      setDailyNote(config.dailyNote);
      setRightPanelSections(config.rightPanelSections);
      setChess(config.chess ?? { engineDepth: 20, multiPv: 1 });
      setChessImport(config.chessImport ?? { gameNoteTitleFormat: "{me} vs {opponent} {gameId}" });
      setOriginalConfig({
        default_view_mode: config.default_view_mode,
        shortcuts: config.shortcuts,
        dailyNote: config.dailyNote,
        rightPanelSections: config.rightPanelSections,
        chess: config.chess,
        chessImport: config.chessImport,
      });
      setLoading(false);
    });
  }, []);

  // Handle escape to close
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        onClose();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [onClose]);

  const handleReset = () => {
    setDefaultViewMode(originalConfig.default_view_mode ?? "rendered");
    setShortcuts(originalConfig.shortcuts ?? shortcuts);
    setDailyNote(originalConfig.dailyNote ?? dailyNote);
    setRightPanelSections(originalConfig.rightPanelSections ?? rightPanelSections);
    setChess(originalConfig.chess ?? chess);
    setChessImport(originalConfig.chessImport ?? chessImport);
  };

  const handleSave = () => {
    onSave({
      default_view_mode: defaultViewMode,
      shortcuts,
      dailyNote,
      rightPanelSections,
      chess,
      chessImport,
    });
    onClose();
  };

  const handleBackdropClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  if (loading) {
    return (
      <div className="modal-overlay" onClick={handleBackdropClick}>
        <div className="settings-modal">
          <div className="settings-loading">
            Loading...
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="modal-overlay" onClick={handleBackdropClick}>
      <div className="settings-modal" onClick={(e) => e.stopPropagation()}>
        <div className="settings-header">
          <span>Settings</span>
          <button onClick={onClose} className="settings-close-button">
            ✕
          </button>
        </div>

        <div className="settings-body">
          <div className="settings-sidebar">
            {SECTIONS.map((section) => (
              <div
                key={section.id}
                onClick={() => setActiveSection(section.id)}
                className={`settings-sidebar-item ${activeSection === section.id ? "active" : ""}`}
              >
                {section.label}
              </div>
            ))}
          </div>

          <div className="settings-content">
            {activeSection === "general" && (
              <GeneralSection
                defaultViewMode={defaultViewMode}
                setDefaultViewMode={setDefaultViewMode}
              />
            )}
            {activeSection === "shortcuts" && (
              <ShortcutsSection
                shortcuts={shortcuts}
                setShortcuts={setShortcuts}
              />
            )}
            {activeSection === "dailyNotes" && (
              <DailyNotesSection
                dailyNote={dailyNote}
                setDailyNote={setDailyNote}
              />
            )}
            {activeSection === "appearance" && (
              <AppearanceSection
                rightPanelSections={rightPanelSections}
                setRightPanelSections={setRightPanelSections}
              />
            )}
            {activeSection === "chess" && (
              <ChessSection
                chess={chess}
                setChess={setChess}
                chessImport={chessImport}
                setChessImport={setChessImport}
              />
            )}
          </div>
        </div>

        <div className="settings-footer">
          <button onClick={handleReset} className="settings-button">
            Reset
          </button>
          <button onClick={handleSave} className="settings-button primary">
            Save
          </button>
        </div>
      </div>
    </div>
  );
}
