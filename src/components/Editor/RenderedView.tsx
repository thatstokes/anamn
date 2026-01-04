import Markdown from "react-markdown";
import type { Note } from "../../../shared/types.js";
import { styles } from "../../styles/styles.js";

interface RenderedViewProps {
  content: string;
  notes: Note[];
  renderedViewRef: React.RefObject<HTMLDivElement | null>;
  onLinkClick: (linkTitle: string) => void;
}

export function RenderedView({
  content,
  notes,
  renderedViewRef,
  onLinkClick,
}: RenderedViewProps) {
  // Process wiki links in rendered markdown to make them clickable
  const processWikiLinks = (children: React.ReactNode): React.ReactNode => {
    if (typeof children === "string") {
      const parts: React.ReactNode[] = [];
      const regex = /\[\[([^\]]+)\]\]/g;
      let lastIndex = 0;
      let match: RegExpExecArray | null;

      while ((match = regex.exec(children)) !== null) {
        if (match.index > lastIndex) {
          parts.push(children.slice(lastIndex, match.index));
        }
        const linkTitle = match[1];
        const exists = notes.some((n) => n.title === linkTitle);
        parts.push(
          <span
            key={match.index}
            onClick={() => onLinkClick(linkTitle ?? "")}
            style={{
              ...styles.wikiLink,
              color: exists ? "#6b9eff" : "#888",
            }}
          >
            {linkTitle}
          </span>
        );
        lastIndex = regex.lastIndex;
      }
      if (lastIndex < children.length) {
        parts.push(children.slice(lastIndex));
      }
      return parts.length > 0 ? parts : children;
    }
    if (Array.isArray(children)) {
      return children.map((child, i) => (
        <span key={i}>{processWikiLinks(child)}</span>
      ));
    }
    return children;
  };

  return (
    <div ref={renderedViewRef} style={styles.renderedView}>
      <Markdown
        components={{
          p: ({ children }) => (
            <p style={styles.renderedP}>{processWikiLinks(children)}</p>
          ),
          li: ({ children }) => (
            <li>{processWikiLinks(children)}</li>
          ),
        }}
      >
        {content}
      </Markdown>
    </div>
  );
}
