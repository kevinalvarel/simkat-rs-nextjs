<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->

# Sistem Ahli Gizi (SIMKAT RS)

## Stack

- **Language / Runtime**: TypeScript 5, Node.js 20
- **Framework**: Next.js 16.3.0 App Router, React 19.2.8
- **Key dependencies**: Drizzle ORM, Neon Postgres, Better Auth, Tailwind CSS 4, Lucide React
- **Package manager**: npm

## Build approach

Tracer Bullet, vertical end to end slices from clinical data to kitchen production

## Commands

```bash
# Install
npm install

# Dev server
npm run dev

# Build
npm run build

# Lint
npm run lint

# Database Studio
npm run studio
```

## Specs

Stored in `docs/specs/`. Format: `docs/specs/NNNN-title.md`.

## Rules

- Do not create a src directory; app, components, types, and db live at root.
- Keep page files as thin composition layers only.
- Place major layout components in layout and smaller controls in ui folders.
- Keep globals.css clean; use Tailwind utility classes for component styling.
- Centralize all domain types in types/namatypes.ts; avoid using any.
- All date and time calculations must use lib/wib.ts for Asia/Jakarta time.
- Use soft delete with is_active flag on master mapping tables; never hard delete.

## Context files

- [servers/AGENTS.md](servers/AGENTS.md): Backend services, Drizzle ORM queries, and snapshot business logic
- [components/AGENTS.md](components/AGENTS.md): Component architecture, layout vs ui separation, and Tailwind styling
- [db/AGENTS.md](db/AGENTS.md): Database schemas, relations, soft deletes, and patient table semantics

_Drafted by /audit from the repo, worth a quick human pass. Edit freely: once a line stops matching this draft, later runs treat it as curated and will flag rather than overwrite it._
