import { renderHook, act } from "@testing-library/react";
import { useFindInNote } from "./useFindInNote.js";
import { createRef } from "react";

describe("useFindInNote", () => {
  const createMockTextareaRef = () => {
    const ref = createRef<HTMLTextAreaElement>();
    // @ts-expect-error - mocking ref.current
    ref.current = {
      focus: vi.fn(),
      setSelectionRange: vi.fn(),
      scrollTop: 0,
      clientHeight: 400,
    };
    return ref;
  };

  it("should initialize with find bar hidden", () => {
    const textareaRef = createMockTextareaRef();
    const { result } = renderHook(() =>
      useFindInNote({ content: "test content", viewMode: "edit", textareaRef })
    );

    expect(result.current.showFindBar).toBe(false);
    expect(result.current.findQuery).toBe("");
    expect(result.current.findMatches).toEqual([]);
    expect(result.current.currentMatchIndex).toBe(0);
  });

  it("should find matches in content", () => {
    const textareaRef = createMockTextareaRef();
    const { result } = renderHook(() =>
      useFindInNote({
        content: "hello world hello universe",
        viewMode: "edit",
        textareaRef,
      })
    );

    act(() => {
      result.current.setFindQuery("hello");
    });

    expect(result.current.findMatches).toEqual([0, 12]);
  });

  it("should be case insensitive", () => {
    const textareaRef = createMockTextareaRef();
    const { result } = renderHook(() =>
      useFindInNote({
        content: "Hello World HELLO Universe",
        viewMode: "edit",
        textareaRef,
      })
    );

    act(() => {
      result.current.setFindQuery("hello");
    });

    expect(result.current.findMatches).toEqual([0, 12]);
  });

  it("should return empty matches for empty query", () => {
    const textareaRef = createMockTextareaRef();
    const { result } = renderHook(() =>
      useFindInNote({
        content: "hello world",
        viewMode: "edit",
        textareaRef,
      })
    );

    act(() => {
      result.current.setFindQuery("test");
    });

    act(() => {
      result.current.setFindQuery("");
    });

    expect(result.current.findMatches).toEqual([]);
  });

  it("should navigate to next match with wraparound", () => {
    const textareaRef = createMockTextareaRef();
    const { result } = renderHook(() =>
      useFindInNote({
        content: "test test test",
        viewMode: "edit",
        textareaRef,
      })
    );

    act(() => {
      result.current.setFindQuery("test");
    });

    expect(result.current.findMatches).toEqual([0, 5, 10]);
    expect(result.current.currentMatchIndex).toBe(0);

    act(() => {
      result.current.findNext();
    });
    expect(result.current.currentMatchIndex).toBe(1);

    act(() => {
      result.current.findNext();
    });
    expect(result.current.currentMatchIndex).toBe(2);

    // Should wrap around
    act(() => {
      result.current.findNext();
    });
    expect(result.current.currentMatchIndex).toBe(0);
  });

  it("should navigate to previous match with wraparound", () => {
    const textareaRef = createMockTextareaRef();
    const { result } = renderHook(() =>
      useFindInNote({
        content: "test test test",
        viewMode: "edit",
        textareaRef,
      })
    );

    act(() => {
      result.current.setFindQuery("test");
    });

    expect(result.current.currentMatchIndex).toBe(0);

    // Should wrap around to last match
    act(() => {
      result.current.findPrevious();
    });
    expect(result.current.currentMatchIndex).toBe(2);

    act(() => {
      result.current.findPrevious();
    });
    expect(result.current.currentMatchIndex).toBe(1);
  });

  it("should close find bar and clear state", () => {
    const textareaRef = createMockTextareaRef();
    const { result } = renderHook(() =>
      useFindInNote({
        content: "test content",
        viewMode: "edit",
        textareaRef,
      })
    );

    act(() => {
      result.current.setShowFindBar(true);
      result.current.setFindQuery("test");
    });

    expect(result.current.showFindBar).toBe(true);
    expect(result.current.findQuery).toBe("test");

    act(() => {
      result.current.closeFindBar();
    });

    expect(result.current.showFindBar).toBe(false);
    expect(result.current.findQuery).toBe("");
    expect(result.current.findMatches).toEqual([]);
  });

  it("should reset currentMatchIndex when query changes", () => {
    const textareaRef = createMockTextareaRef();
    const { result } = renderHook(() =>
      useFindInNote({
        content: "foo foo bar bar",
        viewMode: "edit",
        textareaRef,
      })
    );

    act(() => {
      result.current.setFindQuery("foo");
    });

    act(() => {
      result.current.findNext();
    });
    expect(result.current.currentMatchIndex).toBe(1);

    act(() => {
      result.current.setFindQuery("bar");
    });

    // Should reset to 0
    expect(result.current.currentMatchIndex).toBe(0);
  });
});
