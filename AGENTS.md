# AGENTS.md — Anamn (agent instructions)

This file is for coding agents (Codex, etc.). It complements README.md.

## Read first
- Read README.md before making changes.
- If instructions conflict: README.md + this file win for repo conventions; explicit user prompts win overall.

## Project snapshot
- Product: Anamn — local-first, single-user “second brain”.
- App type: Electron (main process) + React (renderer) + TypeScript.
- Platforms: Linux first, macOS supported; Windows later.
- Storage: plain `.md` files on the local filesystem.
- Linking: `[[Note Title]]` syntax maps to filenames (title == filename).

## Non-negotiables (do not violate)
- One note = one Markdown file.
- Filesystem is the source of truth (no hidden DB as the authority).
- Filename == note title (no IDs).
- Links are explicit `[[...]]` and must be preserved in file content.
- No silent mutation of user files. Always make writes intentional and reviewable.
- Derived data (index, backlinks, graph, embeddings) must be rebuildable from files.

## Security / boundaries (Electron)
- Renderer MUST NOT have direct Node.js access.
- All filesystem I/O must happen in the Electron main process.
- Use `preload.ts` + `contextBridge` + `ipcRenderer.invoke` APIs for renderer ↔ main.
- Avoid enabling insecure Electron settings (no `nodeIntegration` in renderer).

## Repository layout (expected)
- `electron/`:
  - `main.ts`: app lifecycle + IPC handlers + filesystem logic
  - `preload.ts`: expose a narrow, typed API to the renderer
  - `ipc/*.ts`: IPC route implementations
- `src/` (renderer): React UI
- `shared/`: shared types + pure functions (e.g., link parsing) usable by both sides

## Commands (use exact commands; don't guess)
- Install deps: `npm install`
- Dev (Vite + Electron): `npm run dev`
- Build renderer: `npm run build`
- Type-check: `npm run typecheck`
- Preview renderer (if needed): `npm run preview`

If you add scripts (lint/test), also update this file.

## Development workflow
- Prefer small, reviewable commits. Avoid large refactors unless requested.
- If you introduce a dependency, justify it briefly and keep it minimal.
- Prefer explicit, typed IPC contracts over “generic” channels.
- Prefer pure functions in `shared/` for parsing/link logic.

## Coding conventions
- TypeScript: strict, typed interfaces for IPC and core models.
- Keep side effects contained:
  - main process: filesystem, watchers, persistence
  - renderer: UI state only
- Avoid cleverness. Make behavior inspectable.

## V1 scope (don’t build ahead)
V1 focus:
- Workspace folder selection/config
- List/create/open/edit/save Markdown notes
- Atomic writes (write temp + rename)
- Click `[[links]]` to open target note (offer create if missing)
Optional for v1:
- Basic search (title + plaintext content)
Explicitly later:
- Graph visualization UI
- Embeddings / semantic search
- Agent features beyond scaffolding hooks

## When implementing file writes
- Use atomic write semantics.
- Avoid partial writes.
- Do not auto-rename/delete files without an explicit user action.

## How to proceed on a new task
1. Identify the smallest slice that delivers value.
2. Implement it end-to-end (main ↔ preload ↔ renderer) with minimal UI.
3. Ensure `npm run dev` works.
4. Stop and ask what to build next.
