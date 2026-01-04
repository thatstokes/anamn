import { useState, useEffect, useRef } from "react";
import type { SearchResult } from "../../../shared/types.js";

interface UseDebouncedSearchOptions {
  query: string;
  debounceMs?: number;
}

interface UseDebouncedSearchResult {
  results: SearchResult[];
  isSearching: boolean;
}

export function useDebouncedSearch({
  query,
  debounceMs = 200,
}: UseDebouncedSearchOptions): UseDebouncedSearchResult {
  const [results, setResults] = useState<SearchResult[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const searchTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
    }

    if (!query.trim()) {
      setResults([]);
      setIsSearching(false);
      return;
    }

    setIsSearching(true);
    searchTimeoutRef.current = setTimeout(async () => {
      const searchResults = await window.api.notes.search(query);
      setResults(searchResults);
      setIsSearching(false);
    }, debounceMs);

    return () => {
      if (searchTimeoutRef.current) {
        clearTimeout(searchTimeoutRef.current);
      }
    };
  }, [query, debounceMs]);

  return { results, isSearching };
}
