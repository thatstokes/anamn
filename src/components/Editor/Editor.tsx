import type { Note, ViewMode } from "../../../shared/types.js";
import { FindBar } from "../FindBar.js";
import { EditorHeader } from "./EditorHeader.js";
import { EditView } from "./EditView.js";
import { RenderedView } from "./RenderedView.js";

interface LinkAutocompleteState {
  show: boolean;
  query: string;
  startPos: number;
  selectedIndex: number;
}

interface EditorProps {
  selectedNote: Note | null;
  content: string;
  viewMode: ViewMode;
  setViewMode: React.Dispatch<React.SetStateAction<ViewMode>>;
  notes: Note[];
  // Rename state
  isRenaming: boolean;
  renameTitle: string;
  setRenameTitle: (title: string) => void;
  onStartRename: () => void;
  onRename: () => void;
  onCancelRename: () => void;
  onDelete: () => void;
  // Find bar
  showFindBar: boolean;
  findQuery: string;
  setFindQuery: (query: string) => void;
  findMatches: number[];
  currentMatchIndex: number;
  findNext: () => void;
  findPrevious: () => void;
  closeFindBar: () => void;
  // Refs
  textareaRef: React.RefObject<HTMLTextAreaElement | null>;
  renderedViewRef: React.RefObject<HTMLDivElement | null>;
  // Link autocomplete
  linkAutocomplete: LinkAutocompleteState;
  linkSuggestions: Note[];
  onTextareaChange: (e: React.ChangeEvent<HTMLTextAreaElement>) => void;
  onTextareaKeyDown: (e: React.KeyboardEvent<HTMLTextAreaElement>) => void;
  onInsertLink: (noteTitle: string) => void;
  onLinkClick: (linkTitle: string) => void;
  onTagClick: (tag: string) => void;
  onContentChange?: ((newContent: string) => void) | undefined;
}

export function Editor({
  selectedNote,
  content,
  viewMode,
  setViewMode,
  notes,
  isRenaming,
  renameTitle,
  setRenameTitle,
  onStartRename,
  onRename,
  onCancelRename,
  onDelete,
  showFindBar,
  findQuery,
  setFindQuery,
  findMatches,
  currentMatchIndex,
  findNext,
  findPrevious,
  closeFindBar,
  textareaRef,
  renderedViewRef,
  linkAutocomplete,
  linkSuggestions,
  onTextareaChange,
  onTextareaKeyDown,
  onInsertLink,
  onLinkClick,
  onTagClick,
  onContentChange,
}: EditorProps) {
  if (!selectedNote) {
    return (
      <div className="editor">
        <div className="placeholder">Select a note or create a new one</div>
      </div>
    );
  }

  return (
    <div className="editor">
      <EditorHeader
        selectedNote={selectedNote}
        isRenaming={isRenaming}
        renameTitle={renameTitle}
        setRenameTitle={setRenameTitle}
        onStartRename={onStartRename}
        onRename={onRename}
        onCancelRename={onCancelRename}
        onDelete={onDelete}
        viewMode={viewMode}
        setViewMode={setViewMode}
      />
      {showFindBar && (
        <FindBar
          findQuery={findQuery}
          setFindQuery={setFindQuery}
          findMatches={findMatches}
          currentMatchIndex={currentMatchIndex}
          findNext={findNext}
          findPrevious={findPrevious}
          closeFindBar={closeFindBar}
        />
      )}
      {viewMode === "edit" ? (
        <EditView
          content={content}
          textareaRef={textareaRef}
          linkAutocomplete={linkAutocomplete}
          linkSuggestions={linkSuggestions}
          onTextareaChange={onTextareaChange}
          onTextareaKeyDown={onTextareaKeyDown}
          onInsertLink={onInsertLink}
        />
      ) : (
        <RenderedView
          content={content}
          notes={notes}
          renderedViewRef={renderedViewRef}
          onLinkClick={onLinkClick}
          onTagClick={onTagClick}
          onContentChange={onContentChange}
        />
      )}
    </div>
  );
}
