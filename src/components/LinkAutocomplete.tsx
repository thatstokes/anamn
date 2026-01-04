import type { Note } from "../../shared/types.js";

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
    <div className="autocomplete-dropdown">
      {suggestions.map((note, index) => (
        <div
          key={note.path}
          onClick={() => onSelect(note.title)}
          className={`autocomplete-item ${index === selectedIndex ? "selected" : ""}`}
        >
          {note.title}
        </div>
      ))}
    </div>
  );
}
