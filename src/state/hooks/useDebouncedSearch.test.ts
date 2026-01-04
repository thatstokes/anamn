import { renderHook, waitFor } from "@testing-library/react";
import { useDebouncedSearch } from "./useDebouncedSearch.js";
import { mockApi } from "../../test/setup.js";

describe("useDebouncedSearch", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should return empty results for empty query", () => {
    const { result } = renderHook(() => useDebouncedSearch({ query: "" }));

    expect(result.current.results).toEqual([]);
    expect(result.current.isSearching).toBe(false);
  });

  it("should return empty results for whitespace-only query", () => {
    const { result } = renderHook(() => useDebouncedSearch({ query: "   " }));

    expect(result.current.results).toEqual([]);
    expect(result.current.isSearching).toBe(false);
  });

  it("should set isSearching true initially for non-empty query", () => {
    const { result } = renderHook(() => useDebouncedSearch({ query: "test" }));

    expect(result.current.isSearching).toBe(true);
  });

  it("should call search API and return results", async () => {
    const mockResults = [
      { note: { path: "/test/note1.md", title: "note1" }, snippet: "test snippet" },
    ];
    mockApi.notes.search.mockResolvedValueOnce(mockResults);

    const { result } = renderHook(() =>
      useDebouncedSearch({ query: "test", debounceMs: 10 })
    );

    await waitFor(() => {
      expect(result.current.isSearching).toBe(false);
    });

    expect(mockApi.notes.search).toHaveBeenCalledWith("test");
    expect(result.current.results).toEqual(mockResults);
  });

  it("should clear results when query becomes empty", async () => {
    const mockResults = [
      { note: { path: "/test/note1.md", title: "note1" }, snippet: "test" },
    ];
    mockApi.notes.search.mockResolvedValueOnce(mockResults);

    const { result, rerender } = renderHook(
      ({ query }) => useDebouncedSearch({ query, debounceMs: 10 }),
      { initialProps: { query: "test" } }
    );

    await waitFor(() => {
      expect(result.current.results).toEqual(mockResults);
    });

    rerender({ query: "" });

    expect(result.current.results).toEqual([]);
    expect(result.current.isSearching).toBe(false);
  });
});
