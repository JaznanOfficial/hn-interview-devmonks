import React from "react";
import { Icons } from "./Icons.jsx";

function timeAgo(unixTime) {
  const diff = Date.now() / 1000 - unixTime;
  if (diff < 3600) return `${Math.floor(diff / 60)}m`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h`;
  return `${Math.floor(diff / 86400)}d`;
}

function hostname(url) {
  try { return new URL(url).hostname.replace("www.", ""); }
  catch { return null; }
}

function SkeletonItem() {
  return (
    <div style={{ padding: "16px 24px", borderBottom: "1px solid var(--border)", display: "flex", gap: 14 }}>
      <div className="skeleton" style={{ width: 24, height: 14, marginTop: 2 }} />
      <div style={{ flex: 1 }}>
        <div className="skeleton" style={{ width: "70%", height: 14, marginBottom: 8 }} />
        <div className="skeleton" style={{ width: "40%", height: 11, marginBottom: 6 }} />
        <div className="skeleton" style={{ width: "50%", height: 11 }} />
      </div>
    </div>
  );
}

export function StoryList({ stories, loading, error, feed, onFeedChange, page, totalPages, onPageChange, selectedId, onSelect, isBookmarked, onBookmarkToggle }) {
  if (error) return <div className="error-msg" style={{ margin: "20px 24px" }}>{error}</div>;

  return (
    <div style={{ display: "flex", flexDirection: "column", height: "100%" }}>
      {/* Feed tabs in topbar handled by parent, but we render list here */}
      <div className="story-list" style={{ flex: 1 }}>
        {loading
          ? Array.from({ length: 12 }).map((_, i) => <SkeletonItem key={i} />)
          : stories.map((story, idx) => (
            <div
              key={story.id}
              className={`story-item ${selectedId === story.id ? "active" : ""}`}
              onClick={() => onSelect(story)}
            >
              <span className="story-rank">{(page - 1) * 20 + idx + 1}</span>
              <div className="story-body">
                <div className="story-title">{story.title}</div>
                {story.url && (
                  <div className="story-url">{hostname(story.url)}</div>
                )}
                <div className="story-meta">
                  <span className="meta-chip score">
                    <Icons.ArrowUp /> {story.score}
                  </span>
                  <span className="meta-chip">
                    <Icons.User /> {story.by}
                  </span>
                  <span className="meta-chip comments">
                    <Icons.MessageSquare /> {story.descendants || 0}
                  </span>
                  <span className="meta-chip">
                    <Icons.Clock /> {timeAgo(story.time)}
                  </span>
                </div>
              </div>
              <button
                className={`bookmark-btn ${isBookmarked(story.id) ? "bookmarked" : ""}`}
                onClick={(e) => { e.stopPropagation(); onBookmarkToggle(story); }}
                title={isBookmarked(story.id) ? "Remove bookmark" : "Bookmark"}
              >
                <Icons.Bookmark filled={isBookmarked(story.id)} />
              </button>
            </div>
          ))}
      </div>

      {/* Pagination */}
      {!loading && (
        <div className="pagination">
          <button className="page-btn" onClick={() => onPageChange(page - 1)} disabled={page <= 1}>
            <Icons.ChevronLeft />
          </button>
          <span className="page-info">page {page} / {totalPages}</span>
          <button className="page-btn" onClick={() => onPageChange(page + 1)} disabled={page >= totalPages}>
            <Icons.ChevronRight />
          </button>
        </div>
      )}
    </div>
  );
}
