import type { Note } from "../../../shared/types.js";
import { styles } from "../../styles/styles.js";
import { LinkAutocomplete } from "../LinkAutocomplete.js";

interface LinkAutocompleteState {
  show: boolean;
  query: string;
  startPos: number;
  selectedIndex: number;
}

interface EditViewProps {
  content: string;
  textareaRef: React.RefObject<HTMLTextAreaElement | null>;
  linkAutocomplete: LinkAutocompleteState;
  linkSuggestions: Note[];
  onTextareaChange: (e: React.ChangeEvent<HTMLTextAreaElement>) => void;
  onTextareaKeyDown: (e: React.KeyboardEvent<HTMLTextAreaElement>) => void;
  onInsertLink: (noteTitle: string) => void;
}

export function EditView({
  content,
  textareaRef,
  linkAutocomplete,
  linkSuggestions,
  onTextareaChange,
  onTextareaKeyDown,
  onInsertLink,
}: EditViewProps) {
  return (
    <div style={styles.textareaContainer}>
      <textarea
        ref={textareaRef}
        value={content}
        onChange={onTextareaChange}
        onKeyDown={onTextareaKeyDown}
        style={styles.textarea}
      />
      {linkAutocomplete.show && linkSuggestions.length > 0 && (
        <LinkAutocomplete
          suggestions={linkSuggestions}
          selectedIndex={linkAutocomplete.selectedIndex}
          onSelect={onInsertLink}
        />
      )}
    </div>
  );
}
