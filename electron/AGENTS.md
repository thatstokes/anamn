# AGENTS.md — Electron Main Process (Anamn)

This file provides **additional, directory-scoped instructions** for coding agents
working inside the `electron/` directory.

These instructions are additive to the root `AGENTS.md`.
If there is a conflict, the root `AGENTS.md` and README.md take precedence.

---

## Purpose of This Directory

The `electron/` directory contains the **authoritative application engine** for Anamn.

This includes:
- Filesystem access
- Workspace management
- File watching
- Note reading/writing
- Indexing and link parsing
- IPC APIs exposed to the renderer

Nothing in this directory is UI code.

---

## Non-Negotiable Boundaries

- This directory is the **only place** where filesystem I/O may occur.
- The renderer must never access the filesystem directly.
- All filesystem access must be exposed through explicit IPC APIs.
- Do not introduce side channels (shared memory, globals, env hacks).

If an operation touches disk, it belongs here.

---

## IPC Rules

- Use `ipcMain.handle()` + `ipcRenderer.invoke()`
- Do not use event-based IPC unless explicitly requested
- IPC APIs must be:
  - Narrow
  - Explicit
  - Typed
  - Intentionally named

Good:
- `notes.list()`
- `notes.read(path)`
- `notes.write(path, content)`
- `workspace.select()`

Bad:
- `fs.exec(anything)`
- `notes.doStuff()`
- `eval`-style generic channels

IPC contracts should be easy to audit.

---

## Files and Responsibilities

### `main.ts`
- Electron app lifecycle
- Window creation
- App-level configuration
- IPC handler registration

This file should remain small and boring.

### `preload.ts`
- Define the **only** API the renderer can access
- Use `contextBridge.exposeInMainWorld`
- Do not leak Node primitives
- Prefer explicit, typed function surfaces

### `ipc/`
- Each file defines a coherent IPC surface
- Group by domain (e.g. `notes`, `workspace`)
- IPC handlers should call pure logic where possible

---

## Filesystem Semantics (Critical)

- The filesystem is the source of truth.
- Notes are plain `.md` files.
- Filenames equal note titles.
- No internal database is authoritative.

### Writing files
- Writes must be **atomic**
  - Write to temp file
  - Rename into place
- Never partially write a note
- Never silently overwrite without user intent

### Renaming files
- Renames are explicit user actions
- If implemented, inbound/outbound links must be updated deliberately
- Do not
