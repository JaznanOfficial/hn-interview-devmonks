import React from "react";
import { Icons } from "./Icons.jsx";

function timeAgo(dateStr) {
  const diff = (Date.now() - new Date(dateStr + "Z").getTime()) / 1000;
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  return `${Math.floor(diff / 86400)}d ago`;
}

export function BookmarksView({ bookmarks, query, setQuery, loading, onRemove }) {
  return (
    <div className="bookmarks-view">
      <div className="search-bar">
        <Icons.Search />
        <input
          type="text"
          placeholder="Search bookmarks..."
          value={query}
          onChange={(e) => setQuery(e.target.value)}
        />
      </div>

      {loading && (
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} style={{ background: "var(--bg3)", borderRadius: "var(--radius-lg)", padding: 16 }}>
              <div className="skeleton" style={{ width: "65%", height: 14, marginBottom: 8 }} />
              <div className="skeleton" style={{ width: "40%", height: 11, marginBottom: 8 }} />
              <div className="skeleton" style={{ width: "50%", height: 11 }} />
            </div>
          ))}
        </div>
      )}

      {!loading && bookmarks.length === 0 && (
        <div className="empty-state">
          <Icons.Inbox />
          <span style={{ fontFamily: "'Syne', sans-serif", fontWeight: 600, fontSize: 15 }}>
            {query ? "No results found" : "No bookmarks yet"}
          </span>
          <span style={{ fontSize: 12 }}>
            {query ? "Try a different search term" : "Bookmark stories from the feed to save them here"}
          </span>
        </div>
      )}

      {!loading && bookmarks.map((b) => (
        <div key={b.id} className="bookmark-card">
          <div className="bookmark-card-title">{b.title}</div>
          {b.url && (
            <div className="bookmark-card-url">
              {(() => { try { return new URL(b.url).hostname.replace("www.", ""); } catch { return b.url; } })()}
            </div>
          )}
          <div className="bookmark-card-footer">
            <div className="detail-meta" style={{ gap: 10 }}>
              <span className="meta-chip score">
                <Icons.ArrowUp /> {b.score}
              </span>
              <span className="meta-chip">
                <Icons.User /> {b.author}
              </span>
              <span className="meta-chip comments">
                <Icons.MessageSquare /> {b.comment_count}
              </span>
              <span className="meta-chip">
                <Icons.Clock /> {timeAgo(b.created_at)}
              </span>
            </div>
            <button className="remove-btn" onClick={() => onRemove(b.hn_id)}>
              remove
            </button>
          </div>
        </div>
      ))}
    </div>
  );
}
