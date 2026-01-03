// Matches [[Note Title]] wiki-style links
const LINK_PATTERN = /\[\[([^\]]+)\]\]/g;

export interface ParsedLink {
  title: string;
  start: number;
  end: number;
}

export function parseLinks(content: string): ParsedLink[] {
  const links: ParsedLink[] = [];
  let match: RegExpExecArray | null;

  while ((match = LINK_PATTERN.exec(content)) !== null) {
    const title = match[1];
    if (title) {
      links.push({
        title: title.trim(),
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
