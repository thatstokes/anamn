import Markdown from "react-markdown";
import type { Note } from "../../../shared/types.js";
import { styles } from "../../styles/styles.js";

interface RenderedViewProps {
  content: string;
  notes: Note[];
  renderedViewRef: React.RefObject<HTMLDivElement | null>;
  onLinkClick: (linkTitle: string) => void;
  onTagClick: (tag: string) => void;
}

export function RenderedView({
  content,
  notes,
  renderedViewRef,
  onLinkClick,
  onTagClick,
}: RenderedViewProps) {
  // Process tags in text to make them clickable
  const processTags = (text: string, keyPrefix: string): React.ReactNode[] => {
    const parts: React.ReactNode[] = [];
    const tagRegex = /(?:^|[^\w#/])#([\w-]+)/g;
    let lastIndex = 0;
    let match: RegExpExecArray | null;

    while ((match = tagRegex.exec(text)) !== null) {
      const tagText = match[1];
      const hashIndex = match[0].lastIndexOf("#");
      const beforeHash = text.slice(lastIndex, match.index + hashIndex);

      if (beforeHash) {
        parts.push(beforeHash);
      }

      parts.push(
        <span
          key={`${keyPrefix}-tag-${match.index}`}
          onClick={() => onTagClick(tagText ?? "")}
          style={styles.tagInContent}
        >
          #{tagText}
        </span>
      );
      lastIndex = match.index + match[0].length;
    }

    if (lastIndex < text.length) {
      parts.push(text.slice(lastIndex));
    }

    return parts.length > 0 ? parts : [text];
  };

  // Process wiki links in rendered markdown to make them clickable
  const processWikiLinks = (children: React.ReactNode): React.ReactNode => {
    if (typeof children === "string") {
      const parts: React.ReactNode[] = [];
      const regex = /\[\[([^\]]+)\]\]/g;
      let lastIndex = 0;
      let match: RegExpExecArray | null;

      while ((match = regex.exec(children)) !== null) {
        if (match.index > lastIndex) {
          // Process tags in the text before the link
          const textBefore = children.slice(lastIndex, match.index);
          parts.push(...processTags(textBefore, `before-${match.index}`));
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
        // Process tags in the remaining text
        const textAfter = children.slice(lastIndex);
        parts.push(...processTags(textAfter, `after-${lastIndex}`));
      }
      return parts.length > 0 ? parts : processTags(children, "root");
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
