import { useState } from "react";
import type { Note, RightPanelSection } from "../../../shared/types.js";
import { styles } from "../../styles/styles.js";
import { LinksSection } from "./LinksSection.js";
import { RecentNotesSection } from "./RecentNotesSection.js";
import { GraphView } from "./GraphView.js";
import { TagsSection } from "./TagsSection.js";

interface RightPanelProps {
  sections: RightPanelSection[];
  setSections: React.Dispatch<React.SetStateAction<RightPanelSection[]>>;
  collapsedSections: Set<RightPanelSection>;
  toggleSectionCollapse: (section: RightPanelSection) => void;
  notes: Note[];
  selectedNote: Note | null;
  outgoingLinks: string[];
  backlinks: Note[];
  recentNotes: string[];
  tags: string[];
  onSelectNote: (note: Note) => void;
  onLinkClick: (linkTitle: string) => void;
  onTagClick: (tag: string) => void;
}

export function RightPanel({
  sections,
  setSections,
  collapsedSections,
  toggleSectionCollapse,
  notes,
  selectedNote,
  outgoingLinks,
  backlinks,
  recentNotes,
  tags,
  onSelectNote,
  onLinkClick,
  onTagClick,
}: RightPanelProps) {
  const [draggedSection, setDraggedSection] = useState<RightPanelSection | null>(null);
  const [dragOverSection, setDragOverSection] = useState<RightPanelSection | null>(null);

  const handleDragStart = (e: React.DragEvent, section: RightPanelSection) => {
    e.dataTransfer.effectAllowed = "move";
    e.dataTransfer.setData("text/plain", section);
    setDraggedSection(section);
  };

  const handleDragOver = (e: React.DragEvent, section: RightPanelSection) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";
    if (draggedSection && draggedSection !== section) {
      setDragOverSection(section);
    }
  };

  const handleDragLeave = () => {
    setDragOverSection(null);
  };

  const handleDrop = (e: React.DragEvent, targetSection: RightPanelSection) => {
    e.preventDefault();
    e.stopPropagation();

    if (!draggedSection || draggedSection === targetSection) {
      setDraggedSection(null);
      setDragOverSection(null);
      return;
    }

    setSections((prev) => {
      const newSections = [...prev];
      const draggedIndex = newSections.indexOf(draggedSection);
      const targetIndex = newSections.indexOf(targetSection);

      newSections.splice(draggedIndex, 1);
      newSections.splice(targetIndex, 0, draggedSection);

      window.api.config.set({ rightPanelSections: newSections });
      return newSections;
    });

    setDraggedSection(null);
    setDragOverSection(null);
  };

  const handleDragEnd = () => {
    setDraggedSection(null);
    setDragOverSection(null);
  };

  const renderSectionHeader = (section: RightPanelSection, label: string) => (
    <div
      style={{
        ...styles.rightPanelSectionHeader,
        ...(dragOverSection === section ? styles.dragOver : {}),
        ...(draggedSection === section ? styles.dragging : {}),
      }}
      onClick={() => toggleSectionCollapse(section)}
      draggable
      onDragStart={(e) => handleDragStart(e, section)}
      onDragOver={(e) => handleDragOver(e, section)}
      onDragLeave={handleDragLeave}
      onDrop={(e) => handleDrop(e, section)}
      onDragEnd={handleDragEnd}
    >
      <span style={styles.dragHandle}>⋮⋮</span>
      <span style={styles.collapseIcon}>
        {collapsedSections.has(section) ? "▶" : "▼"}
      </span>
      {label}
    </div>
  );

  return (
    <div style={styles.rightPanel}>
      {sections.map((section) => (
        <div
          key={section}
          style={{
            ...styles.rightPanelSection,
            flex: collapsedSections.has(section) ? "none" : 1,
          }}
          onDragOver={(e) => handleDragOver(e, section)}
          onDrop={(e) => handleDrop(e, section)}
        >
          {section === "recents" && (
            <>
              {renderSectionHeader("recents", "Recent Notes")}
              {!collapsedSections.has("recents") && (
                <div style={styles.rightPanelSectionContent}>
                  <RecentNotesSection
                    recentNotes={recentNotes}
                    notes={notes}
                    selectedNote={selectedNote}
                    onSelectNote={onSelectNote}
                  />
                </div>
              )}
            </>
          )}
          {section === "links" && (
            <>
              {renderSectionHeader("links", "Links")}
              {!collapsedSections.has("links") && (
                <div style={styles.rightPanelSectionContent}>
                  <LinksSection
                    selectedNote={selectedNote}
                    outgoingLinks={outgoingLinks}
                    backlinks={backlinks}
                    notes={notes}
                    onLinkClick={onLinkClick}
                    onSelectNote={onSelectNote}
                  />
                </div>
              )}
            </>
          )}
          {section === "tags" && (
            <>
              {renderSectionHeader("tags", "Tags")}
              {!collapsedSections.has("tags") && (
                <div style={styles.rightPanelSectionContent}>
                  <TagsSection
                    selectedNote={selectedNote}
                    tags={tags}
                    onTagClick={onTagClick}
                  />
                </div>
              )}
            </>
          )}
          {section === "graph" && (
            <>
              {renderSectionHeader("graph", "Graph")}
              {!collapsedSections.has("graph") && (
                <div style={styles.rightPanelGraphContainer}>
                  <GraphView
                    notes={notes}
                    selectedNote={selectedNote}
                    onSelectNote={onSelectNote}
                  />
                </div>
              )}
            </>
          )}
        </div>
      ))}
    </div>
  );
}
