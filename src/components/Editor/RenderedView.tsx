import { useState, useCallback } from "react";
import Markdown from "react-markdown";
import remarkGfm from "remark-gfm";
import rehypeHighlight from "rehype-highlight";
import type { Note } from "../../../shared/types.js";
import { ChessPosition, ChessViewer, ChessErrorBoundary } from "../Chess";

interface RenderedViewProps {
  content: string;
  notes: Note[];
  renderedViewRef: React.RefObject<HTMLDivElement | null>;
  onLinkClick: (linkTitle: string) => void;
  onTagClick: (tag: string) => void;
  onContentChange?: ((newContent: string) => void) | undefined;
}

function CodeBlock({ children, ...props }: React.HTMLAttributes<HTMLPreElement>) {
  const [copied, setCopied] = useState(false);

  const handleCopy = useCallback(() => {
    // Extract text content from children
    const extractText = (node: React.ReactNode): string => {
      if (typeof node === "string") return node;
      if (typeof node === "number") return String(node);
      if (!node) return "";
      if (Array.isArray(node)) return node.map(extractText).join("");
      if (typeof node === "object" && "props" in node) {
        const props = node.props as { children?: React.ReactNode };
        return extractText(props.children);
      }
      return "";
    };

    const text = extractText(children);
    navigator.clipboard.writeText(text).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  }, [children]);

  return (
    <div className="code-block-wrapper">
      <button
        className={`code-copy-button ${copied ? "copied" : ""}`}
        onClick={handleCopy}
        title="Copy code"
      >
        {copied ? "Copied!" : "Copy"}
      </button>
      <pre {...props}>{children}</pre>
    </div>
  );
}

export function RenderedView({
  content,
  notes,
  renderedViewRef,
  onLinkClick,
  onTagClick,
  onContentChange,
}: RenderedViewProps) {
  // Create a handler for PGN changes that updates the content
  const handlePgnChange = useCallback((originalPgn: string, newPgn: string) => {
    if (!onContentChange) return;

    // Find the PGN code block in the content and replace it
    // The PGN is wrapped in ```pgn ... ```
    // Use a flexible regex that handles various whitespace
    const pgnBlockRegex = /```pgn\s*\n([\s\S]*?)```/g;
    let match;
    let updatedContent = content;
    let found = false;

    // Normalize for comparison: trim and normalize line endings
    const normalize = (s: string) => s.trim().replace(/\r\n/g, '\n').replace(/\s+/g, ' ');
    const normalizedOriginal = normalize(originalPgn);

    while ((match = pgnBlockRegex.exec(content)) !== null) {
      const blockContent = match[1] ?? '';
      const normalizedBlock = normalize(blockContent);

      // Check if this block matches (either exact or similar enough)
      // Use includes as a fallback for partial matches
      if (normalizedBlock === normalizedOriginal ||
          normalizedBlock.includes(normalizedOriginal.slice(0, 50)) ||
          normalizedOriginal.includes(normalizedBlock.slice(0, 50))) {
        // Found the matching block, replace it
        const fullMatch = match[0];
        const newBlock = '```pgn\n' + newPgn + '\n```';
        updatedContent = content.slice(0, match.index) + newBlock + content.slice(match.index + fullMatch.length);
        found = true;
        break;
      }
    }

    // If no match found but there's only one PGN block, replace it anyway
    if (!found) {
      const singleMatch = content.match(/```pgn\s*\n[\s\S]*?```/);
      if (singleMatch) {
        const newBlock = '```pgn\n' + newPgn + '\n```';
        updatedContent = content.replace(/```pgn\s*\n[\s\S]*?```/, newBlock);
        found = true;
      }
    }

    if (found && updatedContent !== content) {
      onContentChange(updatedContent);
    }
  }, [content, onContentChange]);
  // Process tags in text to make them clickable
  // Tags must be preceded by space/tab or punctuation (not newline or start of line)
  const processTags = (text: string, keyPrefix: string): React.ReactNode[] => {
    const parts: React.ReactNode[] = [];
    // Use lookbehind to require space/tab or punctuation before #
    const tagRegex = /(?<=[ \t]|[^\w#/\s])#([\w-]+)/g;
    let lastIndex = 0;
    let match: RegExpExecArray | null;

    while ((match = tagRegex.exec(text)) !== null) {
      const tagText = match[1];
      // With lookbehind, match.index points directly to the #
      const beforeHash = text.slice(lastIndex, match.index);

      if (beforeHash) {
        parts.push(beforeHash);
      }

      parts.push(
        <span
          key={`${keyPrefix}-tag-${match.index}`}
          onClick={() => onTagClick(tagText ?? "")}
          className="tag-in-content"
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
            className={`wiki-link ${exists ? "exists" : "missing"}`}
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
    <div ref={renderedViewRef} className="rendered-view">
      <Markdown
        remarkPlugins={[remarkGfm]}
        rehypePlugins={[rehypeHighlight]}
        components={{
          p: ({ children }) => (
            <p className="rendered-p">{processWikiLinks(children)}</p>
          ),
          li: ({ children }) => (
            <li>{processWikiLinks(children)}</li>
          ),
          h1: ({ children }) => <h1>{processWikiLinks(children)}</h1>,
          h2: ({ children }) => <h2>{processWikiLinks(children)}</h2>,
          h3: ({ children }) => <h3>{processWikiLinks(children)}</h3>,
          h4: ({ children }) => <h4>{processWikiLinks(children)}</h4>,
          h5: ({ children }) => <h5>{processWikiLinks(children)}</h5>,
          h6: ({ children }) => <h6>{processWikiLinks(children)}</h6>,
          blockquote: ({ children }) => (
            <blockquote>{children}</blockquote>
          ),
          td: ({ children }) => <td>{processWikiLinks(children)}</td>,
          th: ({ children }) => <th>{processWikiLinks(children)}</th>,
          pre: ({ children, ...props }) => {
            // Check if this pre contains a chess code block
            // If so, the code component will handle rendering
            if (children && typeof children === 'object' && 'props' in children) {
              const codeChild = children as { props?: { className?: string } };
              if (codeChild.props?.className) {
                const match = /language-(fen|pgn)/.exec(codeChild.props.className);
                if (match) {
                  // Let the code component render the chess component
                  return <>{children}</>;
                }
              }
            }
            return <CodeBlock {...props}>{children}</CodeBlock>;
          },
          code: ({ children, className, ...props }) => {
            // Check for chess code blocks
            const match = /language-(fen|pgn)/.exec(className || '');
            if (match) {
              const content = String(children).replace(/\n$/, '');
              if (match[1] === 'fen') {
                return (
                  <ChessErrorBoundary>
                    <ChessPosition fen={content} />
                  </ChessErrorBoundary>
                );
              }
              if (match[1] === 'pgn') {
                const originalPgn = content;
                return (
                  <ChessErrorBoundary>
                    <ChessViewer
                      pgn={content}
                      onPgnChange={onContentChange ? (newPgn) => handlePgnChange(originalPgn, newPgn) : undefined}
                    />
                  </ChessErrorBoundary>
                );
              }
            }
            // Regular code (inline or block)
            return <code className={className} {...props}>{children}</code>;
          },
        }}
      >
        {content}
      </Markdown>
    </div>
  );
}
