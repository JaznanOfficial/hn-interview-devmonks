# HN Reader — AI-Powered Hacker News Client

A full-stack Hacker News client with AI discussion summaries, bookmarking, and nested comment threads.

---

## Quick Start

### Step 1 — Add your OpenAI API key

Open **`config.js`** in the root of this project and replace the placeholder with your real key:

```js
// config.js
module.exports = {
  OPENAI_API_KEY: "sk-proj-YOUR-REAL-KEY-HERE",   // ← edit this line
  OPENAI_MODEL:   "gpt-4o",
  PORT:           3001,
};
```

> This file is intentionally committed and public so that `docker-compose up` works with zero extra setup steps. No `.env` file needed.

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

### Why `config.js` instead of `.env`?
The evaluator runs `docker-compose up` without any setup beyond cloning the repo. A `.env` file would require manual creation. A committed `config.js` with a clear placeholder comment makes the one required step (inserting the API key) obvious and hard to miss.

### Why no streaming on the summary endpoint?
The spec asks for a loading state and graceful timeout handling — a spinner while awaiting JSON satisfies that. Streaming adds SSE headers, partial-text state management on the frontend, and makes JSON parsing trickier. Non-streaming is simpler and equally correct for this scope.

### Comment fetching strategy
Comments are fetched recursively to 4 levels deep, with a max of 20 children per node. This balances completeness against HN API rate limits. The flat representation sent to OpenAI preserves depth via indentation, which helps the model understand reply context.

### Summary caching (two layers)
1. **In-memory Map** — instant hit on repeated clicks within the same session
2. **SQLite `summaries` table** — survives container restarts; re-opening the app never re-calls the API for a story already summarized

---

## Tradeoffs

| Decision | What was traded |
|----------|----------------|
| SQLite | No concurrent writes (fine for single-user) |
| No streaming | Summary feels slower on weak API connections |
| Comment truncation (150 top-level, ~12k chars) | Very large threads lose tail comments |
| No auth | Single-user only; anyone with the URL sees all bookmarks |
| Comments fetched on-demand | Cold load of a busy thread can take 2-4s |

---

## What I'd Add With More Time

- **Streaming summary** — pipe OpenAI's SSE response through to the frontend so text appears word-by-word
- **Story search** — full-text search across HN via Algolia's HN Search API
- **Read/unread tracking** — persist which stories and comments have been seen
- **Comment search** — highlight matching text within a thread
- **Offline support** — cache comment trees in SQLite so previously-opened stories work without network
- **Export bookmarks** — JSON / CSV download
- **Tests** — unit tests for the summarize prompt builder and comment flattener; integration test for the bookmark CRUD routes

---

## API Reference

| Method | Path | Description |
|--------|------|-------------|
| GET | `/api/stories?feed=top\|new\|best&page=1` | Paginated story list |
| GET | `/api/item/:id` | Story + nested comment tree |
| POST | `/api/summarize` | `{ storyId, title }` → AI summary |
| GET | `/api/bookmarks?q=search` | List / search bookmarks |
| POST | `/api/bookmarks` | Save a story |
| DELETE | `/api/bookmarks/:id` | Remove a bookmark |
