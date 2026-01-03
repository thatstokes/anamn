# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Build and Development Commands

```bash
npm install          # Install dependencies
npm run dev          # Start Vite dev server + Electron concurrently
npm run build        # Build React renderer with Vite
npm run typecheck    # Type-check both renderer and main process
npm run preview      # Preview Vite build
npm run electron     # Run Electron directly
```

## Architecture

Anamn is an Electron + React + TypeScript application for local-first, markdown-based note-taking with wiki-style `[[links]]`.

### Process Boundary (Critical)

**Electron Main (`electron/`)** — owns all filesystem I/O:
- `main.ts`: App lifecycle, window creation, IPC handler registration
- `preload.ts`: Exposes typed API to renderer via `contextBridge`
- `ipc/`: Domain-grouped IPC handlers (notes, workspace)

**React Renderer (`src/`)** — UI only:
- Cannot access filesystem directly
- Cannot import Node.js modules
- Communicates via `window.api` (exposed by preload)

**Shared (`shared/`)** — cross-process utilities:
- Type definitions
- Pure functions (link parsing, utilities)

### IPC Pattern

Use promise-based IPC exclusively:
- Main: `ipcMain.handle('channel', handler)`
- Renderer: `ipcRenderer.invoke('channel', ...args)`

IPC APIs must be narrow, explicit, and typed. Examples: `notes.list()`, `notes.read(path)`, `notes.write(path, content)`, `workspace.select()`.

Avoid generic channels like `fs.exec(anything)` or event-based IPC.

## Non-Negotiables

- **Filesystem is source of truth** — no hidden database as authority
- **One note = one `.md` file** — filename equals note title (no IDs)
- **Links are explicit `[[WikiLink]]` syntax** — preserved in file content
- **Atomic writes only** — write to temp file, then rename into place
- **All derived data is rebuildable** — index, backlinks, graph must be derivable from files
- **Renderer has no Node.js access** — all I/O through IPC

## V1 Scope

Focus only on:
- Workspace folder selection/config
- Create/read/edit/save Markdown notes
- Atomic file writes
- Click `[[links]]` to open/create target notes
- Optional: basic search (title + plaintext)

Explicitly later: graph visualization, embeddings, semantic search, agent features.

## Additional Agent Instructions

See `AGENTS.md` at repo root and in `electron/` and `src/` directories for detailed coding guidelines. Root AGENTS.md and README.md take precedence on conflicts.
