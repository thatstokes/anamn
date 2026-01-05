# Anamn

**Anamn** is a local-first, desktop-native second brain.

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

- A **local-first Electron desktop app** (Linux and macOS)
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

### Markdown

Anamn supports full Markdown with GitHub Flavored Markdown extensions and syntax highlighting.

#### Text Formatting

```markdown
**Bold text** and *italic text*

~~Strikethrough text~~

`Inline code` for short snippets
```

#### Headings

```markdown
# Heading 1
## Heading 2
### Heading 3
#### Heading 4
```

#### Lists

```markdown
- Unordered list item
- Another item
  - Nested item

1. Ordered list item
2. Another item
   1. Nested numbered item
```

#### Task Lists

```markdown
- [x] Completed task
- [ ] Incomplete task
- [ ] Another todo
```

#### Blockquotes

```markdown
> This is a blockquote.
> It can span multiple lines.
>
> And have multiple paragraphs.
```

#### Code Blocks

Fenced code blocks with syntax highlighting for 190+ languages. Hover to reveal the copy button.

````markdown
```javascript
function greet(name) {
  return `Hello, ${name}!`;
}
```

```python
def fibonacci(n):
    if n <= 1:
        return n
    return fibonacci(n-1) + fibonacci(n-2)
```

```sql
SELECT users.name, COUNT(orders.id)
FROM users
LEFT JOIN orders ON users.id = orders.user_id
GROUP BY users.id;
```
````

#### Chess Notation

Anamn renders chess positions and games directly in your notes.

**FEN positions** — Use a `fen` code block to display a board position:

````markdown
```fen
rnbqkbnr/pppppppp/8/8/4P3/8/PPPP1PPP/RNBQKBNR b KQkq e3 0 1
```
````

FEN positions support engine analysis (click the gear icon) and opening detection.

**PGN games** — Use a `pgn` code block for interactive game viewers:

````markdown
```pgn
1. e4 e5 2. Nf3 Nc6 3. Bb5 a6 4. Ba4 Nf6 5. O-O
```
````

PGN viewer controls:
- **Arrow keys** — Navigate moves (Left/Right) or jump to start/end (Home/End)
- **Click moves** — Jump to any position in the move list
- **Engine toggle** — Click the gear icon to enable Stockfish analysis

**Stockfish Analysis** — When enabled, the viewer shows:
- **Eval bar** — Visual advantage indicator (white on bottom, black on top)
- **Score** — Numeric evaluation (e.g., +0.45 means white is ahead by ~half a pawn)
- **Best move** — Engine's recommended move in standard notation
- **Best move arrow** — Green arrow overlay on the board showing the recommended move
- **Line** — Principal variation (the best sequence of moves)

Mate scores display as `M+3` (white mates in 3) or `M-2` (black mates in 2).

**Opening Detection** — Anamn automatically identifies chess openings using the ECO (Encyclopaedia of Chess Openings) database. When a position matches a known opening, the ECO code and opening name are displayed (e.g., "B90 · Sicilian Defense: Najdorf Variation").

#### Tables

```markdown
| Feature   | Status    | Notes              |
|-----------|-----------|-------------------|
| Tables    | Supported | With alignment    |
| Task lists| Supported | Checkboxes work   |
| Code      | Supported | Syntax highlighting|
```

#### Horizontal Rules

```markdown
---
```

#### Images

```markdown
![Alt text](path/to/image.png)
```

---

### Links

Anamn uses explicit wiki-style links:

```markdown
Check out [[Agentic Reasoning]] for more details.

You can link to [[notes that don't exist yet]] and Anamn will create them when clicked.
```

Links:
- Open the referenced note when clicked
- Create edges in the knowledge graph
- Enable backlinks and traversal
- Form the foundation for future AI reasoning

Missing links are styled differently so you can see which notes need to be created.

---

### Tags

Use hashtags to categorize and find notes:

```markdown
This note is about #programming and #typescript.

Tags can include hyphens: #my-project #work-in-progress
```

Tags:
- Click any tag to search for all notes containing it
- Visible in the right panel for the current note
- Useful for cross-cutting categorization beyond links

---

### Graph

Anamn maintains an implicit knowledge graph:

- **Nodes**: notes (files)
- **Edges**: explicit `[[links]]`
- **Backlinks**: always derived, never stored

The graph is deterministic and rebuildable at any time.
A force-directed visualization is available in the right panel.

---

## Editing Experience

Anamn uses a Markdown editor with Vim keybindings.

- Modal editing (view/edit modes)
- Keyboard-first workflows
- Minimal UI, maximum focus
- Link autocomplete with `[[`

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

### Selecting Text

Press `v` or `V` in view mode to start selecting text.

| Key | Action |
|-----|--------|
| `v` | Start character-wise selection |
| `V` | Start line-wise selection |
| `h` | Extend selection left (char mode) |
| `l` | Extend selection right (char mode) |
| `j` | Extend selection down |
| `k` | Extend selection up |
| `y` | Yank (copy) selection |
| `d` | Delete selection |
| `Escape` | Cancel selection |

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

## Architecture

Anamn is an Electron + React + TypeScript application with a clear process boundary.

### Electron Main Process (`electron/`)
- App lifecycle and window management
- All filesystem I/O (notes are never accessed from renderer)
- Atomic file writes (temp file → rename)
- Workspace configuration and persistence
- IPC handlers for notes, workspace, and config

### React Renderer (`src/`)
- Single-page UI with sidebar, editor, and right panel
- Communicates exclusively via typed IPC (`window.api`)
- No direct Node.js or filesystem access
- Markdown rendering with clickable wiki links

### Shared (`shared/`)
- Type definitions shared across processes
- Pure functions (link parsing, utilities)

All state that can be derived from files is treated as disposable.

---

## Getting Started

```bash
npm install          # Install dependencies
npm run dev          # Start dev server + Electron
npm run build        # Build for production
npm run typecheck    # Type-check all code
```

On first launch, Anamn will prompt you to select a workspace folder.
All notes are stored as `.md` files in that folder.

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
