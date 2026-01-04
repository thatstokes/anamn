import { createContext, useContext, useState, useMemo, useRef } from "react";
import type { ViewMode, Note } from "../../../shared/types.js";
import { useAutoSave } from "../hooks/useAutoSave.js";

interface Selection {
  type: "char" | "line";
  anchor: number;
}

interface EditorContextValue {
  content: string;
  setContent: React.Dispatch<React.SetStateAction<string>>;
  viewMode: ViewMode;
  setViewMode: React.Dispatch<React.SetStateAction<ViewMode>>;
  saveNote: () => Promise<void>;
  lastSavedContentRef: React.MutableRefObject<string>;
  selection: Selection | null;
  setSelection: React.Dispatch<React.SetStateAction<Selection | null>>;
  // Refs
  textareaRef: React.RefObject<HTMLTextAreaElement | null>;
  renderedViewRef: React.RefObject<HTMLDivElement | null>;
  contentRef: React.RefObject<string>;
}

const EditorContext = createContext<EditorContextValue | null>(null);

export function EditorProvider({
  children,
  selectedNote,
  initialViewMode = "rendered",
}: {
  children: React.ReactNode;
  selectedNote: Note | null;
  initialViewMode?: ViewMode;
}) {
  const [content, setContent] = useState("");
  const [viewMode, setViewMode] = useState<ViewMode>(initialViewMode);
  const [selection, setSelection] = useState<Selection | null>(null);

  // Refs
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const renderedViewRef = useRef<HTMLDivElement>(null);
  const contentRef = useRef<string>(content);
  contentRef.current = content;

  // Auto-save hook
  const { saveNote, lastSavedContentRef } = useAutoSave({
    note: selectedNote,
    content,
  });

  const value = useMemo<EditorContextValue>(() => ({
    content,
    setContent,
    viewMode,
    setViewMode,
    saveNote,
    lastSavedContentRef,
    selection,
    setSelection,
    textareaRef,
    renderedViewRef,
    contentRef,
  }), [
    content,
    viewMode,
    saveNote,
    lastSavedContentRef,
    selection,
  ]);

  return <EditorContext.Provider value={value}>{children}</EditorContext.Provider>;
}

export function useEditor(): EditorContextValue {
  const context = useContext(EditorContext);
  if (!context) {
    throw new Error("useEditor must be used within an EditorProvider");
  }
  return context;
}
