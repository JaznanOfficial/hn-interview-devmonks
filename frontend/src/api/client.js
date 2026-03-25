// In Docker (production build), VITE_API_URL is injected at build time.
// In local dev, Vite proxies /api → backend, so we use "/api".
const BASE = (import.meta.env.VITE_API_URL || "") + "/api";

async function request(path, options = {}) {
  const res = await fetch(`${BASE}${path}`, {
    headers: { "Content-Type": "application/json" },
    ...options,
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: res.statusText }));
    throw new Error(err.error || "Request failed");
  }
  return res.json();
}

export const api = {
  // Feed
  getStories: (feed = "top", page = 1) =>
    request(`/stories?feed=${feed}&page=${page}`),

  getItem: (id, offset = 0, limit = 20) =>
    request(`/item/${id}?offset=${offset}&limit=${limit}`),

  // Summarize
  summarize: (storyId, title) =>
    request("/summarize", {
      method: "POST",
      body: JSON.stringify({ storyId, title }),
    }),

  // Bookmarks
  getBookmarks: (q = "") =>
    request(`/bookmarks${q ? `?q=${encodeURIComponent(q)}` : ""}`),

  addBookmark: (story) =>
    request("/bookmarks", {
      method: "POST",
      body: JSON.stringify({
        hn_id: story.id,
        title: story.title,
        url: story.url,
        author: story.by,
        score: story.score,
        comment_count: story.descendants,
      }),
    }),

  removeBookmark: (hnId) =>
    request(`/bookmarks/${hnId}`, { method: "DELETE" }),
};
