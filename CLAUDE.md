# CLAUDE.md

This file guides Claude Code when working with **InstruMap AI** — a React + Vite application for P&ID (Piping and Instrumentation Diagram) extraction and analysis.

## Project Overview

- **Stack**: React 19, Vite, Tailwind CSS v4, Supabase, PDF.js
- **Purpose**: AI-powered P&ID extraction, instrument tagging, and Excel export
- **Key integrations**: Supabase (auth + database), Claude API (extraction), PDF.js (rendering)

## Dev Commands

```bash
npm run dev       # Start dev server
npm run build     # Production build
npm run lint      # ESLint
npm run preview   # Preview production build
```

## Architecture

```
src/
  components/    # Reusable UI components
  pages/         # Route-level page components
  utils/         # Shared utilities
  data/          # Static data / constants
api/             # Python API scripts (DWG conversion, etc.)
python/          # Python processing scripts
```

## Claude Code Plugin (from everything-claude-code)

This project includes a full Claude Code harness in `.claude/`:

- **`.claude/agents/`** — 38 specialized subagents (planner, code-reviewer, tdd-guide, security-reviewer, typescript-reviewer, etc.)
- **`.claude/commands/`** — 72 slash commands (/tdd, /plan, /e2e, /code-review, /build-fix, /learn, etc.)
- **`.claude/rules/`** — Language-specific coding guidelines (common, typescript, python, web, etc.)

### Key Slash Commands

| Command | Purpose |
|---------|---------|
| `/tdd` | Test-driven development workflow |
| `/plan` | Implementation planning |
| `/code-review` | Quality assurance review |
| `/build-fix` | Fix build/compile errors |
| `/e2e` | Generate and run E2E tests |
| `/learn` | Extract patterns from sessions |
| `/skill-create` | Generate skills from git history |

### Key Agents to Delegate To

| Agent | When to use |
|-------|-------------|
| `planner` | Before implementing any non-trivial feature |
| `code-reviewer` | After writing significant code |
| `typescript-reviewer` | When touching JSX/TS files |
| `security-reviewer` | When handling auth, API keys, or user data |
| `tdd-guide` | When adding tests |
| `performance-optimizer` | When optimizing renders or API calls |

## Project-Specific Guidelines

- Always use Tailwind CSS v4 utility classes — no inline styles
- Supabase client is initialized in `src/utils/` — do not create new instances
- PDF rendering uses local `pdfjs-dist` (not CDN) — respect the 15s render timeout
- Excel export uses `xlsx-js-style` for styled output
- Claude API calls go through `api/` Python scripts — do not call Claude directly from frontend
- No secrets or API keys in source files — use environment variables (`.env`)

## Rules

Rules in `.claude/rules/` apply always. Key ones for this project:
- `common/` — cross-language principles (security, git, testing, style)
- `typescript/` — React/JSX patterns
- `web/` — frontend best practices
- `python/` — for `api/` and `python/` scripts
