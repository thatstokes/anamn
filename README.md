# Anamn

**Anamn** is a local-first, terminal-native second brain.

It treats Markdown files as memory, links as recall, and structure as thought.
There is no cloud, no proprietary format, and no abstraction between you and your notes.

Anamn is designed for builders who think in systems and want their knowledge to last.

---

## Philosophy

Anamn is built on a small set of non-negotiable principles:

- **One note = one file**
- **The filesystem is the source of truth**
- **Markdown is the storage format**
- **Filenames are note titles**
- **Links create structure**
- **All derived data is rebuildable**
- **The tool is optional — the notes are permanent**

Anamn does not hide your data behind an internal database.
It respects the filesystem and makes its behavior explicit.

---

## What Anamn Is

- A **local-first Electron app** (Linux and macOS first)
- A **single-user knowledge system**
- A **Markdown-native editor** with Vim keybindings
- A **link-driven knowledge graph** (derived, not stored)
- A foundation for **local, inspectable AI augmentation**

---

## What Anamn Is Not

- A cloud service
- A collaboration platform
- A proprietary note silo
- A database disguised as files
- A SaaS product with offline mode

Anamn optimizes for **clarity, durability, and builder joy**, not mass adoption.

---

## Core Concepts

### Notes

- Each note is a single `.md` file
- The filename is the note title
- Notes live directly in a workspace folder on disk
- Notes remain valid Markdown outside of Anamn

Example:

- Agentic Reasoning.md
- Distributed Systems.md
- Personal Knowledge Management.md

---

### Links

Anamn uses explicit wiki-style links:
```[[Agentic Reasoning]]```


Links:
- Open the referenced note
- Create edges in the knowledge graph
- Enable backlinks and traversal
- Form the foundation for future AI reasoning

If a linked note does not exist, Anamn can create it.

---

### Graph

Anamn maintains an implicit knowledge graph:

- **Nodes**: notes (files)
- **Edges**: explicit `[[links]]`
- **Backlinks**: always derived, never stored

The graph is deterministic and rebuildable at any time.

---

## Editing Experience

Anamn uses a Markdown editor with Vim keybindings.

- Modal editing
- Keyboard-first workflows
- Minimal UI, maximum focus

The goal is not to perfectly replicate Vim or LazyVim.
The goal is to feel fast, predictable, and comfortable for Vim users.

---

## Keybindings

Anamn uses vim-style modal editing. Notes open in **view mode** by default.

### View Mode (Normal Mode)

#### Navigation
| Key | Action |
|-----|--------|
| `j` | Scroll down |
| `k` | Scroll up |
| `gg` | Go to top of document |
| `G` | Go to bottom of document |
| `Ctrl+d` | Half-page down |
| `Ctrl+u` | Half-page up |

#### Entering Edit Mode
| Key | Action |
|-----|--------|
| `i` | Enter edit mode |
| `a` | Enter edit mode (cursor at end) |
| `A` | Enter edit mode (cursor at end) |
| `o` | Add new line at end, enter edit mode |
| `O` | Add new line at beginning, enter edit mode |

#### Search
| Key | Action |
|-----|--------|
| `/` | Open find bar |
| `n` | Next search result |
| `N` | Previous search result |

#### Command Mode
| Key | Action |
|-----|--------|
| `:` | Open command palette |

### Edit Mode (Insert Mode)

| Key | Action |
|-----|--------|
| `Escape` | Exit edit mode, return to view mode |
| `[[` | Open link autocomplete |

### Visual Mode

Enter visual mode from view mode to select text.

#### Entering Visual Mode
| Key | Action |
|-----|--------|
| `v` | Enter character-wise visual mode |
| `V` | Enter line-wise visual mode |

#### In Visual Mode
| Key | Action |
|-----|--------|
| `h` | Extend selection left (char mode) |
| `l` | Extend selection right (char mode) |
| `j` | Extend selection down |
| `k` | Extend selection up |
| `y` | Yank (copy) selection |
| `d` | Delete selection |
| `Escape` | Exit visual mode |

### Command Palette

Open with `:` in view mode or `Ctrl+Shift+P` anywhere.

| Command | Action |
|---------|--------|
| `:w` | Save note |
| `:q` | Close note |
| `:wq` | Save and close note |
| `:e` | Enter edit mode |
| `:new` | Create new note |
| `:find` | Search notes |
| `:panel` | Toggle right panel |
| `:cd` | Change workspace folder |

### Global Shortcuts

These work regardless of mode:

| Key | Action |
|-----|--------|
| `Ctrl+P` | Focus search bar |
| `Ctrl+N` | New note |
| `Ctrl+S` | Save note |
| `Ctrl+E` | Toggle view/edit mode |
| `Ctrl+G` | Toggle right panel |
| `Ctrl+F` | Find in current note |
| `Escape` | Close active panel/dialog |

### Sidebar Navigation

When the sidebar note list is focused:

| Key | Action |
|-----|--------|
| `↑` / `↓` | Navigate notes |
| `Enter` | Open selected note |
| `Escape` | Unfocus sidebar |

---

## Architecture (High Level)

Anamn is split into two major parts:

### Electron Main Process
- Workspace discovery and configuration
- File reading and atomic writing
- File watching and change detection
- Note indexing and link parsing
- IPC API exposed to the renderer

### React Renderer
- File tree and navigation
- Editor panes and tabs
- Link navigation
- Search and derived views

All state that can be derived from files is treated as disposable.

---

## Status

Anamn is early and under active development.

Expect:
- Sharp edges
- Breaking changes
- Strong opinions

Do not expect:
- Cloud sync
- Collaboration
- Hidden automation

---

## Name

**Anamn** comes from *anamnesis* — recollection, the act of bringing
knowledge back into awareness.

That is the job this tool is built to do.

---

## License

TBD
