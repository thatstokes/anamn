import { renderHook, act } from "@testing-library/react";
import { useAutoSave } from "./useAutoSave.js";
import { mockApi } from "../../test/setup.js";

describe("useAutoSave", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should not save when note is null", async () => {
    const { result } = renderHook(() =>
      useAutoSave({ note: null, content: "test content" })
    );

    await act(async () => {
      await result.current.saveNote();
    });

    expect(mockApi.notes.write).not.toHaveBeenCalled();
  });

  it("should not save when content matches lastSavedContent", async () => {
    const note = { path: "/test/note.md", title: "note", folder: "" };

    const { result } = renderHook(() =>
      useAutoSave({ note, content: "same content" })
    );

    result.current.lastSavedContentRef.current = "same content";

    await act(async () => {
      await result.current.saveNote();
    });

    expect(mockApi.notes.write).not.toHaveBeenCalled();
  });

  it("should save via saveNote when content differs from lastSaved", async () => {
    const note = { path: "/test/note.md", title: "note", folder: "" };

    const { result } = renderHook(() =>
      useAutoSave({ note, content: "new content" })
    );

    result.current.lastSavedContentRef.current = "old content";

    await act(async () => {
      await result.current.saveNote();
    });

    expect(mockApi.notes.write).toHaveBeenCalledWith("/test/note.md", "new content");
  });

  it("should update lastSavedContentRef after save", async () => {
    const note = { path: "/test/note.md", title: "note", folder: "" };

    const { result } = renderHook(() =>
      useAutoSave({ note, content: "updated content" })
    );

    result.current.lastSavedContentRef.current = "";

    await act(async () => {
      await result.current.saveNote();
    });

    expect(result.current.lastSavedContentRef.current).toBe("updated content");
  });
});
