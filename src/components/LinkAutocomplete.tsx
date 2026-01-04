import type { Note } from "../../shared/types.js";
import { styles } from "../styles/styles.js";

interface LinkAutocompleteProps {
  suggestions: Note[];
  selectedIndex: number;
  onSelect: (noteTitle: string) => void;
}

export function LinkAutocomplete({
  suggestions,
  selectedIndex,
  onSelect,
}: LinkAutocompleteProps) {
  if (suggestions.length === 0) return null;

  return (
    <div style={styles.autocompleteDropdown}>
      {suggestions.map((note, index) => (
        <div
          key={note.path}
          onClick={() => onSelect(note.title)}
          style={{
            ...styles.autocompleteItem,
            background: index === selectedIndex ? "#3a3a3a" : "transparent",
          }}
        >
          {note.title}
        </div>
      ))}
    </div>
  );
}
