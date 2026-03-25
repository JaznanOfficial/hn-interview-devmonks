const express = require("express");
const cors = require("cors");
const path = require("path");
const fetch = require("node-fetch");
const OpenAI = require("openai");
const Database = require("better-sqlite3");

// ── Config ────────────────────────────────────────────────────────────────────
const config = require("../../config.js");

const app = express();
app.use(cors());
app.use(express.json());

// ── OpenAI client ─────────────────────────────────────────────────────────────
const openai = new OpenAI({ apiKey: config.OPENAI_API_KEY });

// ── SQLite DB ─────────────────────────────────────────────────────────────────
const DB_PATH = path.join(__dirname, "../../data/hn.db");
const db = new Database(DB_PATH);

db.exec(`
  CREATE TABLE IF NOT EXISTS bookmarks (
    id            INTEGER PRIMARY KEY AUTOINCREMENT,
    hn_id         INTEGER UNIQUE NOT NULL,
    title         TEXT NOT NULL,
    url           TEXT,
    author        TEXT,
    score         INTEGER,
    comment_count INTEGER,
    created_at    TEXT DEFAULT (datetime('now'))
  );

  CREATE TABLE IF NOT EXISTS summaries (
    hn_id      INTEGER PRIMARY KEY,
    summary    TEXT,
    key_points TEXT,
    sentiment  TEXT,
    created_at TEXT DEFAULT (datetime('now'))
  );
`);

// ── In-memory summary cache ───────────────────────────────────────────────────
const summaryCache = new Map();

// ── HN API helpers ────────────────────────────────────────────────────────────
const HN = "https://hacker-news.firebaseio.com/v0";

async function fetchJSON(url) {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`HN fetch failed: ${url}`);
  return res.json();
}

async function fetchItem(id) {
  return fetchJSON(`${HN}/item/${id}.json`);
}

async function fetchComments(item, depth = 0, maxDepth = 4, offset = 0, limit = 20) {
  if (!item || !item.kids || depth >= maxDepth) return [];
  const kids = item.kids.slice(offset, offset + limit);
  const children = await Promise.all(
    kids.map((id) => fetchItem(id))
  );
  const results = [];
  for (const child of children) {
    if (!child || child.deleted || child.dead) continue;
    const nested = await fetchComments(child, depth + 1, maxDepth, 0, limit);
    results.push({ ...child, depth, children: nested });
  }
  return results;
}

function flattenComments(comments, lines = []) {
  for (const c of comments) {
    const indent = "  ".repeat(c.depth);
    const text = (c.text || "").replace(/<[^>]+>/g, "").slice(0, 500);
    lines.push(`${indent}[${c.by || "anon"}]: ${text}`);
    if (c.children?.length) flattenComments(c.children, lines);
  }
  return lines;
}

// ── Routes ────────────────────────────────────────────────────────────────────

// GET /api/stories?feed=top|new|best&page=1
app.get("/api/stories", async (req, res) => {
  try {
    const feed = ["top", "new", "best"].includes(req.query.feed)
      ? req.query.feed
      : "top";
    const page = Math.max(1, parseInt(req.query.page) || 1);
    const pageSize = 20;

    const ids = await fetchJSON(`${HN}/${feed}stories.json`);
    const slice = ids.slice((page - 1) * pageSize, page * pageSize);

    const stories = await Promise.all(slice.map(fetchItem));
    const valid = stories.filter(Boolean);

    res.json({ stories: valid, total: ids.length, page, pageSize });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/item/:id?offset=0&limit=20
app.get("/api/item/:id", async (req, res) => {
  try {
    const item = await fetchItem(req.params.id);
    if (!item) return res.status(404).json({ error: "Not found" });

    const offset = Math.max(0, parseInt(req.query.offset) || 0);
    const limit = Math.max(1, Math.min(100, parseInt(req.query.limit) || 20));
    const comments = await fetchComments(item, 0, 4, offset, limit);
    const totalComments = item.kids?.length || 0;
    res.json({ ...item, comments, totalComments, offset, limit });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/summarize  { storyId, title, comments[] }
app.post("/api/summarize", async (req, res) => {
  try {
    const { storyId, title, comments } = req.body;
    if (!storyId) return res.status(400).json({ error: "storyId required" });

    // 1. Return from memory cache
    if (summaryCache.has(storyId)) {
      return res.json({ ...summaryCache.get(storyId), cached: true });
    }

    // 2. Return from DB
    const saved = db
      .prepare("SELECT * FROM summaries WHERE hn_id = ?")
      .get(storyId);
    if (saved) {
      const result = {
        summary: saved.summary,
        key_points: JSON.parse(saved.key_points),
        sentiment: saved.sentiment,
      };
      summaryCache.set(storyId, result);
      return res.json({ ...result, cached: true });
    }

    // 3. Fetch comments if not provided
    let flat;
    if (comments && comments.length > 0) {
      flat = comments;
    } else {
      const item = await fetchItem(storyId);
      const tree = await fetchComments(item);
      flat = flattenComments(tree);
    }

    const truncated = flat.slice(0, 150).join("\n").slice(0, 12000);

    // 4. Call OpenAI
    const completion = await openai.chat.completions.create({
      model: config.OPENAI_MODEL,
      response_format: { type: "json_object" },
      messages: [
        {
          role: "system",
          content: `You are an expert at summarizing Hacker News discussion threads.
Return ONLY valid JSON in exactly this shape — no markdown, no extra keys:
{
  "summary": "2-3 sentence overview of the discussion",
  "key_points": ["point 1", "point 2", "point 3", "point 4"],
  "sentiment": "positive" | "negative" | "mixed" | "neutral"
}`,
        },
        {
          role: "user",
          content: `Story: "${title}"\n\nComment thread:\n${truncated}`,
        },
      ],
      max_tokens: 600,
      temperature: 0.3,
    });

    const raw = completion.choices[0].message.content;
    const result = JSON.parse(raw);

    // 5. Persist to DB and cache
    db.prepare(
      `INSERT OR REPLACE INTO summaries (hn_id, summary, key_points, sentiment)
       VALUES (?, ?, ?, ?)`
    ).run(storyId, result.summary, JSON.stringify(result.key_points), result.sentiment);

    summaryCache.set(storyId, result);
    res.json(result);
  } catch (err) {
    console.error("Summarize error:", err.message);
    res.status(500).json({ error: err.message });
  }
});

// GET /api/bookmarks?q=search
app.get("/api/bookmarks", (req, res) => {
  const q = req.query.q?.trim();
  let rows;
  if (q) {
    rows = db
      .prepare(
        `SELECT * FROM bookmarks WHERE title LIKE ? OR author LIKE ?
         ORDER BY created_at DESC`
      )
      .all(`%${q}%`, `%${q}%`);
  } else {
    rows = db.prepare("SELECT * FROM bookmarks ORDER BY created_at DESC").all();
  }
  res.json(rows);
});

// POST /api/bookmarks
app.post("/api/bookmarks", (req, res) => {
  const { hn_id, title, url, author, score, comment_count } = req.body;
  if (!hn_id || !title) return res.status(400).json({ error: "hn_id and title required" });
  try {
    db.prepare(
      `INSERT OR IGNORE INTO bookmarks (hn_id, title, url, author, score, comment_count)
       VALUES (?, ?, ?, ?, ?, ?)`
    ).run(hn_id, title, url || null, author || null, score || 0, comment_count || 0);
    res.json({ ok: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// DELETE /api/bookmarks/:id
app.delete("/api/bookmarks/:id", (req, res) => {
  db.prepare("DELETE FROM bookmarks WHERE hn_id = ?").run(req.params.id);
  res.json({ ok: true });
});

// ── Start ─────────────────────────────────────────────────────────────────────
app.listen(config.PORT, () => {
  console.log(`Backend running on http://localhost:${config.PORT}`);
});
