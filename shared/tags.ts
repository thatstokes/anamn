/**
 * Tag parsing utilities for extracting #hashtags from note content.
 */

export interface ParsedTag {
  text: string;  // The tag text without the # prefix
  start: number; // Start position of the # in the content
  end: number;   // End position (after the tag text)
}

/**
 * Regex pattern for matching tags.
 * Matches # followed by word characters and hyphens.
 * Does not match:
 * - Markdown headers (# at start of line - could be header syntax)
 * - URL fragments (#anchor)
 * - Hex colors (#fff, #ffffff)
 *
 * Tags must be preceded by space/tab or punctuation (not newline or start of line).
 * This avoids ambiguity with markdown headers like #Header or # Header.
 */
const TAG_PATTERN = /(?<=[ \t]|[^\w#/\s])#([\w-]+)/g;

/**
 * Parse all tags from content, returning their positions.
 * Tags are #word patterns where word contains letters, numbers, underscores, or hyphens.
 */
export function parseTags(content: string): ParsedTag[] {
  const tags: ParsedTag[] = [];
  let match: RegExpExecArray | null;

  // Reset regex state
  TAG_PATTERN.lastIndex = 0;

  while ((match = TAG_PATTERN.exec(content)) !== null) {
    const tagText = match[1];
    if (!tagText) continue;

    // With lookbehind, match[0] is just "#tagname" and match.index points to the #
    const start = match.index;
    const end = start + 1 + tagText.length;

    tags.push({
      text: tagText,
      start,
      end,
    });
  }

  return tags;
}

/**
 * Get unique tags from content, sorted alphabetically.
 * Returns the tag text without the # prefix.
 */
export function getUniqueTags(content: string): string[] {
  const tags = parseTags(content);
  const unique = [...new Set(tags.map((t) => t.text))];
  return unique.sort((a, b) => a.localeCompare(b));
}
