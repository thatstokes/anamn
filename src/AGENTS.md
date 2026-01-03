# AGENTS.md — Renderer (React UI) for Anamn

This file provides **directory-scoped instructions** for coding agents
working inside the `src/` directory (the React renderer).

These instructions are additive to the root `AGENTS.md`.
If there is a conflict, the root `AGENTS.md` and README.md take precedence.

---

## Purpose of This Directory

The `src/` directory contains the **renderer UI** for Anamn.

This includes:
- React components
- Editor surface
- Panels and layout
- Client-side state
- User interaction logic

This directory does **not** own data authority.

---

## Hard Boundaries (Do Not Cross)

- The renderer MUST NOT:
  - Access the filesystem directly
  - Import Node.js modules (`fs`, `path`, etc.)
  - Perform file watching
  - Assume persistence authority

- All data that originates from disk must co
