import { useState, useEffect, useRef, useCallback } from "react";
import type { ViewMode } from "../../../shared/types.js";

interface UseFindInNoteOptions {
  content: string;
  viewMode: ViewMode;
  textareaRef: React.RefObject<HTMLTextAreaElement | null>;
}

interface UseFindInNoteResult {
  showFindBar: boolean;
  setShowFindBar: React.Dispatch<React.SetStateAction<boolean>>;
  findQuery: string;
  setFindQuery: React.Dispatch<React.SetStateAction<string>>;
  findMatches: number[];
  currentMatchIndex: number;
  setCurrentMatchIndex: React.Dispatch<React.SetStateAction<number>>;
  findNext: () => void;
  findPrevious: () => void;
  closeFindBar: () => void;
}

export function useFindInNote({
  content,
  viewMode,
  textareaRef,
}: UseFindInNoteOptions): UseFindInNoteResult {
  const [showFindBar, setShowFindBar] = useState(false);
  const [findQuery, setFindQuery] = useState("");
  const [findMatches, setFindMatches] = useState<number[]>([]);
  const [currentMatchIndex, setCurrentMatchIndex] = useState(0);
  const lastMatchIndexRef = useRef<number>(-1);

  // Find matches in content
  useEffect(() => {
    if (!findQuery.trim() || !content) {
      setFindMatches([]);
      setCurrentMatchIndex(0);
      return;
    }

    const matches: number[] = [];
    const query = findQuery.toLowerCase();
    const text = content.toLowerCase();
    let index = 0;

    while ((index = text.indexOf(query, index)) !== -1) {
      matches.push(index);
      index += 1;
    }

    setFindMatches(matches);
    setCurrentMatchIndex(0);
  }, [findQuery, content]);

  // Scroll to match in textarea when navigating
  useEffect(() => {
    if (findMatches.length === 0 || !textareaRef.current || viewMode !== "edit") return;

    const matchIndex = findMatches[currentMatchIndex];
    if (matchIndex === undefined) return;

    if (lastMatchIndexRef.current !== matchIndex) {
      lastMatchIndexRef.current = matchIndex;

      const textarea = textareaRef.current;
      const lineHeight = 20;
      const linesAbove = content.slice(0, matchIndex).split("\n").length - 1;
      textarea.scrollTop = linesAbove * lineHeight - textarea.clientHeight / 2;
    }
  }, [findMatches, currentMatchIndex, viewMode, content, textareaRef]);

  const findNext = useCallback(() => {
    if (findMatches.length === 0) return;
    setCurrentMatchIndex((prev) => {
      const next = (prev + 1) % findMatches.length;
      setTimeout(() => {
        const matchIndex = findMatches[next];
        if (matchIndex !== undefined && textareaRef.current) {
          textareaRef.current.focus();
          textareaRef.current.setSelectionRange(matchIndex, matchIndex + findQuery.length);
        }
      }, 0);
      return next;
    });
  }, [findMatches, findQuery.length, textareaRef]);

  const findPrevious = useCallback(() => {
    if (findMatches.length === 0) return;
    setCurrentMatchIndex((prev) => {
      const next = (prev - 1 + findMatches.length) % findMatches.length;
      setTimeout(() => {
        const matchIndex = findMatches[next];
        if (matchIndex !== undefined && textareaRef.current) {
          textareaRef.current.focus();
          textareaRef.current.setSelectionRange(matchIndex, matchIndex + findQuery.length);
        }
      }, 0);
      return next;
    });
  }, [findMatches, findQuery.length, textareaRef]);

  const closeFindBar = useCallback(() => {
    setShowFindBar(false);
    setFindQuery("");
    setFindMatches([]);
    textareaRef.current?.focus();
  }, [textareaRef]);

  return {
    showFindBar,
    setShowFindBar,
    findQuery,
    setFindQuery,
    findMatches,
    currentMatchIndex,
    setCurrentMatchIndex,
    findNext,
    findPrevious,
    closeFindBar,
  };
}
