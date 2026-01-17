import type { Note } from "./types.js";

// Matches [[Note Title]] or [[Folder/Note Title]] wiki-style links
const LINK_PATTERN = /\[\[([^\]]+)\]\]/g;

export interface ParsedLink {
  title: string;              // Just the note title (no folder path)
  folder: string | undefined; // Optional folder path if specified
  fullLink: string;           // The full link text as written
  start: number;
  end: number;
}

/**
 * Parse a wiki-link string that may contain a folder path.
 * Examples:
 *   "My Note" -> { title: "My Note" }
 *   "Chess/Openings/Sicilian" -> { folder: "Chess/Openings", title: "Sicilian" }
 */
export function parseWikiLink(link: string): { folder?: string; title: string } {
  const lastSlash = link.lastIndexOf("/");
  if (lastSlash === -1) {
    return { title: link };
  }
  return {
    folder: link.substring(0, lastSlash),
    title: link.substring(lastSlash + 1),
  };
}

/**
 * Find a note matching the wiki-link.
 * If the link includes a folder path, requires exact folder match.
 * If title-only, returns first note with matching title.
 */
export function resolveWikiLink(link: string, notes: Note[]): Note | undefined {
  const { folder, title } = parseWikiLink(link);

  if (folder) {
    // Exact folder match required
    return notes.find((n) => n.title === title && n.folder === folder);
  }

  // Title-only: return first match
  return notes.find((n) => n.title === title);
}

export function parseLinks(content: string): ParsedLink[] {
  const links: ParsedLink[] = [];
  let match: RegExpExecArray | null;

  while ((match = LINK_PATTERN.exec(content)) !== null) {
    const fullLink = match[1];
    if (fullLink) {
      const trimmed = fullLink.trim();
      const parsed = parseWikiLink(trimmed);
      links.push({
        title: parsed.title,
        folder: parsed.folder,
        fullLink: trimmed,
        start: match.index,
        end: match.index + match[0].length,
      });
    }
  }

  return links;
}

export function getUniqueLinks(content: string): string[] {
  const links = parseLinks(content);
  const unique = new Set(links.map((l) => l.title));
  return Array.from(unique).sort((a, b) => a.localeCompare(b));
}
