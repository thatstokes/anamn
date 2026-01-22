import { useState } from "react";
import type { Note, RightPanelSection } from "../../../shared/types.js";
import { LinksSection } from "./LinksSection.js";
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
  tags: string[];
  onSelectNote: (note: Note) => void;
  onLinkClick: (linkTitle: string) => void;
  onTagClick: (tag: string) => void;
  width?: number;
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
  tags,
  onSelectNote,
  onLinkClick,
  onTagClick,
  width,
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

  const renderSectionHeader = (section: RightPanelSection, label: string) => {
    const headerClasses = [
      "right-panel-section-header",
      dragOverSection === section ? "drag-over" : "",
      draggedSection === section ? "dragging" : "",
    ].filter(Boolean).join(" ");

    return (
      <div
        className={headerClasses}
        onClick={() => toggleSectionCollapse(section)}
        draggable
        onDragStart={(e) => handleDragStart(e, section)}
        onDragOver={(e) => handleDragOver(e, section)}
        onDragLeave={handleDragLeave}
        onDrop={(e) => handleDrop(e, section)}
        onDragEnd={handleDragEnd}
      >
        <span className="drag-handle">⋮⋮</span>
        <span className="collapse-icon">
          {collapsedSections.has(section) ? "▶" : "▼"}
        </span>
        {label}
      </div>
    );
  };

  return (
    <div className="right-panel" style={width ? { width } : undefined}>
      {sections.map((section) => (
        <div
          key={section}
          className={`right-panel-section ${collapsedSections.has(section) ? "collapsed" : ""}`}
          onDragOver={(e) => handleDragOver(e, section)}
          onDrop={(e) => handleDrop(e, section)}
        >
          {section === "links" && (
            <>
              {renderSectionHeader("links", "Links")}
              {!collapsedSections.has("links") && (
                <div className="right-panel-section-content">
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
                <div className="right-panel-section-content">
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
                <div className="right-panel-graph-container">
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
