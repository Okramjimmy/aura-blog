# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
npm run dev        # Start dev server (Express + Vite middleware) on port 3000
npm run build      # Production build to dist/
npm run preview    # Preview production build
npm run lint       # TypeScript type check (tsc --noEmit) — run after every code change
npm run clean      # Remove dist/
```

## Environment

Copy `.env.example` to `.env.local` and set:
- `SECRET_KEY` — JWT signing secret (defaults to a dev placeholder if unset)
- `GITHUB_TOKEN` — GitHub personal access token (`read:user` scope). Required for the contribution heatmap (GraphQL API). Without it, the heatmap is silently hidden on the public page and shows an amber banner in the admin dashboard.
- `DISABLE_HMR=true` — disables Vite HMR (used during AI Studio agent edits)

## Database

PostgreSQL — database `blog`, user `postgres`, password `root`, host `localhost:5432`. Connection hardcoded in `server/db.ts`.

**Direct DB access:**
```bash
PGPASSWORD=root psql -U postgres -d blog
```

**Tables:**
- `posts` — id TEXT, title, slug UNIQUE, excerpt, category, content TEXT (JSON blocks), is_published BOOLEAN, created_at, updated_at
- `projects` — id TEXT, title, category, description, tags TEXT (JSON array), status, image_seed, sort_order INT, created_at
- `contacts` — id TEXT, name, email, subject, message, is_read BOOLEAN, created_at
- `newsletters` — id TEXT, email UNIQUE, is_active BOOLEAN, created_at

`initDb()` in `server/db.ts` creates all tables and seeds posts + projects if both tables are empty. Re-runs only on server start — if you drop a table mid-session, restart the server.

**Content blocks** (posts.content format):
```json
[
  { "type": "h1",         "text": "Title" },
  { "type": "h2",         "text": "Section heading" },
  { "type": "paragraph",  "text": "Body text" },
  { "type": "blockquote", "text": "Pull quote or key lesson" }
]
```

## Architecture

Full-stack TypeScript monorepo: Express backend + React SPA frontend, served from one process on port 3000.

**Server** (`server.ts` + `server/`):
- Express on port 3000. In dev, Vite runs as middleware (`appType: 'custom'` — NOT `'spa'`, which would intercept `/api` routes via `connect-history-api-fallback`).
- All `/api` routes are registered before Vite middleware. A catch-all `app.all('/api/*')` returns 404 JSON so unmatched API paths never fall through to the SPA.
- REST API under `/api/v1/`:
  - `POST   /auth/login` — returns JWT. Credentials: `admin@aurablog.com` / `admin`
  - `GET    /posts`, `GET /posts/:id`, `GET /posts/slug/:slug` — public
  - `POST   /posts` — create post (auth required)
  - `PATCH  /posts/:id` — update post (auth required)
  - `GET    /projects`, `GET /projects/:id` — public
  - `POST   /projects`, `PATCH /projects/:id`, `DELETE /projects/:id` — auth required
  - `GET    /stats` — dashboard stats (auth required)
  - `POST   /contacts` — public contact form submission
  - `GET    /contacts`, `PATCH /contacts/:id/read`, `DELETE /contacts/:id` — auth required; supports `?page=&limit=&sort=&order=&search=&unread=`
  - `POST   /newsletters/subscribe` — public; deduplicates + reactivates inactive emails
  - `GET    /newsletters`, `DELETE /newsletters/:id` — auth required; supports `?page=&limit=&search=&active=`
  - `GET    /github` — proxies GitHub REST API (paginates all repos), 5-min in-memory cache
  - `GET    /github/contributions` — GitHub GraphQL API contribution calendar, 1-hour cache; returns 403 if `GITHUB_TOKEN` not set

**Frontend** (`src/`):
- React Router v6 with two layout groups:
  - Public (`<Layout>`): Home, About, Projects, ProjectDetail, Blog, BlogPost, Contact, **GitHub** (`/github`)
  - Admin (`<AdminLayout>`): Login, Dashboard, Editor, ProjectEditor, Contacts, Subscribers, Media, **GitHub** (`/admin/github`)
- Admin JWT stored in `localStorage` as `admin_token`. `src/lib/api.ts` exports `apiFetch` / `apiJson` / `authHeaders` — always use these instead of raw `fetch` to get proper Content-Type validation and clear error messages.

**Styling**: Tailwind CSS v4. Design tokens as CSS variables in `src/index.css`:
- `--color-canvas` (#FAF9F5), `--color-accent` (#D97757), `--color-ink` (#2D2926), `--color-subtle` (#E5E2D9)
- Fonts: Cormorant Garamond (serif) + Inter (sans-serif) via Google Fonts

**Path alias**: `@/` resolves to the project root (Vite + TypeScript).

## Known gotchas

**React 19 + TypeScript `key` prop**: In React 19, TypeScript treats `key` as a component prop. This causes a type error when using `.map(item => <MyComponent key={item.id} prop={item} />)`. Fix by wrapping in `React.Fragment`:
```tsx
items.map(item => (
  <React.Fragment key={item.id}>
    <MyComponent prop={item} />
  </React.Fragment>
))
```

**Vite SPA intercept**: Never change `appType` back to `'spa'` in `server.ts`. The `'spa'` mode adds `connect-history-api-fallback` which silently returns `index.html` (200, `text/html`) for all unmatched GET requests including `/api/*`, causing "Unexpected token '<'" JSON parse errors.

**GitHub rate limits**: Unauthenticated REST API = 60 req/hr. Set `GITHUB_TOKEN` for 5,000 req/hr. GraphQL (contributions) always requires a token. The in-memory cache is shared across all requests; `?bust=1` clears all cache entries.

## Skills (slash commands)

Project-level skills in `.claude/commands/`:
- `/POST_JOURNAL` — writes a blog post and inserts it into the database. Includes the full content block schema, slug rules, and the exact `psql` insert command with dollar-quoting.
- `/POST_PROJECT` — saves a project to the database. Includes field reference, status/category guide, and SQL examples.
