# HN Reader — AI-Powered Hacker News Client

A full-stack Hacker News client with AI discussion summaries, bookmarking, and nested comment threads.

---

## Quick Start

### Step 1 — Set up environment variables

Copy the example environment file and add your OpenAI API key:

```bash
cp .env.example .env
```

Edit **`.env`** and add your real OpenAI API key:

```bash
OPENAI_API_KEY=sk-proj-YOUR-REAL-KEY-HERE
OPENAI_MODEL=gpt-4o-mini
PORT=3001
```

> The `.env` file is git-ignored and never committed. Your secrets stay local and safe. But for this project, I've added the API key to the `.env` file for convenience.

### Step 2 — Run

```bash
docker-compose up --build
```

That's it.

| Service  | URL                    |
|----------|------------------------|
| Frontend | http://localhost:5173  |
| Backend  | http://localhost:3001  |

---

## Features

- **Feed** — Top / New / Best stories from the Hacker News API with pagination
- **Comments** — Full nested/threaded comment tree with collapse/expand
- **Infinite Scroll Comments** — Load comments on-demand as you scroll; shows progress (X of Y comments)
- **AI Summary** — Click "Summarize discussion" on any story to get key points, overall sentiment, and a short summary powered by GPT-4o
- **Bookmarks** — Save and remove stories; persisted in SQLite across restarts
- **Search** — Filter bookmarks by title or author

---

## Project Structure

```
hn-reader/
├── config.js               ← API key + config (edit this before running)
├── docker-compose.yml
├── data/                   ← SQLite database file (auto-created, persisted)
│
├── backend/
│   ├── Dockerfile
│   ├── package.json
│   └── src/
│       └── index.js        ← Express server, all routes, OpenAI call, SQLite
│
└── frontend/
    ├── Dockerfile
    ├── vite.config.js
    ├── index.html
    └── src/
        ├── App.jsx
        ├── index.css
        ├── api/client.js   ← Typed fetch wrapper
        ├── hooks/
        │   ├── useStories.js
        │   ├── useBookmarks.js
        │   └── useSummary.js
        └── components/
            ├── StoryList.jsx
            ├── DetailPanel.jsx
            ├── CommentTree.jsx
            ├── SummaryPanel.jsx
            ├── BookmarksView.jsx
            └── Icons.jsx
```

---

## Architecture Decisions

### Why Express over Next.js / NestJS?
Express is the most readable backend for a code review — every route is a plain function. NestJS adds decorators and DI that take time to explain. For a 4-8 hour project, simplicity is a feature.

### Why SQLite over PostgreSQL / MongoDB?
The data is two simple tables (bookmarks, summaries) with a 1:1 relationship keyed on `hn_id`. SQLite is a single file in a Docker volume — zero ops, zero config, instant startup. PostgreSQL would require its own container, health checks, and connection pooling. MongoDB doesn't fit the relational shape of the data. SQLite is architecturally correct here, not a shortcut.

### Why raw OpenAI SDK over LangChain / Vercel AI SDK?
LangChain solves problems this project doesn't have (retrieval chains, agents, multi-step tool use). The Vercel AI SDK is designed around Next.js streaming patterns. Using `openai` directly means every line of the AI integration is readable and explainable — critical for a live code review.

### Why `.env` files for secrets?
Secrets should never be committed to version control. The `.env` file is git-ignored and never committed. A `.env.example` template shows what variables are needed. This is the industry standard for secure credential management.

### Why no streaming on the summary endpoint?
The spec asks for a loading state and graceful timeout handling — a spinner while awaiting JSON satisfies that. Streaming adds SSE headers, partial-text state management on the frontend, and makes JSON parsing trickier. Non-streaming is simpler and equally correct for this scope.

### Comment fetching strategy
Comments are fetched recursively to 4 levels deep, with a max of 20 children per node. This balances completeness against HN API rate limits. The flat representation sent to OpenAI preserves depth via indentation, which helps the model understand reply context.

### Summary caching (two layers)
1. **In-memory Map** — instant hit on repeated clicks within the same session
2. **SQLite `summaries` table** — survives container restarts; re-opening the app never re-calls the API for a story already summarized

### Infinite scroll for comments
Instead of loading all comments upfront (which can be slow for busy threads), comments are paginated server-side with `offset` and `limit` query parameters. The frontend uses `IntersectionObserver` to detect when the user scrolls near the bottom and automatically fetches the next batch. This approach:
- Reduces initial load time for large threads
- Respects HN API rate limits by fetching in chunks
- Provides smooth UX with a "Loading more comments..." indicator
- Shows progress with "X of Y comments" counter

---

## Tradeoffs

| Decision | What was traded |
|----------|----------------|
| SQLite | No concurrent writes (fine for single-user) |
| No streaming | Summary feels slower on weak API connections |
| Comment truncation (150 top-level, ~12k chars) | Very large threads lose tail comments |
| No auth | Single-user only; anyone with the URL sees all bookmarks |
| Paginated comment loading | Extra network requests as user scrolls (vs. load-all-at-once) |
| IntersectionObserver for infinite scroll | Requires JavaScript; no progressive enhancement for non-JS clients |

---

## What I'd Add With More Time

- **Streaming summary** — pipe OpenAI's SSE response through to the frontend so text appears word-by-word
- **Story search** — full-text search across HN via Algolia's HN Search API
- **Read/unread tracking** — persist which stories and comments have been seen
- **Comment search** — highlight matching text within a thread
- **Offline support** — cache comment trees in SQLite so previously-opened stories work without network
- **Export bookmarks** — JSON / CSV download
- **Tests** — unit tests for the summarize prompt builder and comment flattener; integration test for the bookmark CRUD routes
- **Nested comment infinite scroll** — extend pagination to nested replies, not just top-level comments
- **Comment filtering** — hide deleted/dead comments by default with toggle to show them
- **Dark mode toggle** — persist theme preference in localStorage
- **Rate limiting** — add request throttling to prevent API abuse
- **Error recovery** — retry failed comment fetches with exponential backoff

---

## API Reference

| Method | Path | Description |
|--------|------|-------------|
| GET | `/api/stories?feed=top\|new\|best&page=1` | Paginated story list |
| GET | `/api/item/:id?offset=0&limit=20` | Story + paginated comment tree (infinite scroll) |
| POST | `/api/summarize` | `{ storyId, title }` → AI summary |
| GET | `/api/bookmarks?q=search` | List / search bookmarks |
| POST | `/api/bookmarks` | Save a story |
| DELETE | `/api/bookmarks/:id` | Remove a bookmark |

### Comment Pagination Parameters
- **`offset`** — number of top-level comments to skip (default: 0)
- **`limit`** — max comments to return per request (default: 20, max: 100)
- **Response includes:**
  - `comments` — array of comment objects
  - `totalComments` — total number of top-level comments available
  - `offset` — offset used in request
  - `limit` — limit used in request
