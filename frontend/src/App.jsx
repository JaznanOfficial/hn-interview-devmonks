import React, { useState } from "react";
import { StoryList } from "./components/StoryList.jsx";
import { DetailPanel } from "./components/DetailPanel.jsx";
import { BookmarksView } from "./components/BookmarksView.jsx";
import { Icons } from "./components/Icons.jsx";
import { useStories } from "./hooks/useStories.js";
import { useBookmarks } from "./hooks/useBookmarks.js";
import { useSummary } from "./hooks/useSummary.js";

const FEEDS = ["top", "new", "best"];

export default function App() {
  const [view, setView] = useState("feed"); // "feed" | "bookmarks"
  const [selectedStory, setSelectedStory] = useState(null);

  const storiesHook = useStories();
  const bookmarksHook = useBookmarks();
  const summaryHook = useSummary();

  const totalPages = Math.ceil(storiesHook.total / storiesHook.pageSize);

  return (
    <div className="app">
      {/* ── Sidebar ───────────────────────────────────────────── */}
      <aside className="sidebar">
        <div className="sidebar-logo">
          <h1>HN Reader</h1>
          <span>AI-powered client</span>
        </div>

        <nav className="sidebar-nav">
          <div className="nav-section">Feed</div>
          <div
            className={`nav-item ${view === "feed" ? "active" : ""}`}
            onClick={() => setView("feed")}
          >
            <Icons.Fire /> Stories
          </div>

          <div className="nav-section" style={{ marginTop: 8 }}>Saved</div>
          <div
            className={`nav-item ${view === "bookmarks" ? "active" : ""}`}
            onClick={() => { setView("bookmarks"); bookmarksHook.refresh(); }}
          >
            <Icons.Bookmark filled={false} />
            Bookmarks
            {bookmarksHook.bookmarks.length > 0 && (
              <span style={{
                marginLeft: "auto",
                background: "var(--bg4)",
                color: "var(--text3)",
                fontSize: 10,
                fontFamily: "'DM Mono', monospace",
                padding: "1px 6px",
                borderRadius: 10,
              }}>
                {bookmarksHook.bookmarks.length}
              </span>
            )}
          </div>
        </nav>

        <div style={{
          padding: "16px 20px",
          borderTop: "1px solid var(--border)",
          fontSize: 10,
          color: "var(--text3)",
          fontFamily: "'DM Mono', monospace",
          lineHeight: 1.6,
        }}>
          Data from<br />
          <span style={{ color: "var(--accent)" }}>Hacker News API</span><br />
          AI by <span style={{ color: "var(--accent)" }}>OpenAI GPT-4o</span>
        </div>
      </aside>

      {/* ── Main ──────────────────────────────────────────────── */}
      <main className="main">

        {view === "feed" && (
          <>
            {/* Topbar */}
            <div className="topbar">
              <span className="topbar-title">
                {storiesHook.feed.charAt(0).toUpperCase() + storiesHook.feed.slice(1)} Stories
              </span>
              <div className="feed-tabs">
                {FEEDS.map((f) => (
                  <button
                    key={f}
                    className={`tab-btn ${storiesHook.feed === f ? "active" : ""}`}
                    onClick={() => { storiesHook.changeFeed(f); setSelectedStory(null); }}
                  >
                    {f}
                  </button>
                ))}
              </div>
            </div>

            {/* Two-pane layout */}
            <div style={{ display: "flex", flex: 1, overflow: "hidden" }}>
              <div className="content">
                <StoryList
                  stories={storiesHook.stories}
                  loading={storiesHook.loading}
                  error={storiesHook.error}
                  feed={storiesHook.feed}
                  page={storiesHook.page}
                  totalPages={totalPages}
                  onPageChange={storiesHook.setPage}
                  selectedId={selectedStory?.id}
                  onSelect={setSelectedStory}
                  isBookmarked={bookmarksHook.isBookmarked}
                  onBookmarkToggle={bookmarksHook.toggle}
                />
              </div>

              <DetailPanel
                story={selectedStory}
                summaryHook={summaryHook}
              />
            </div>
          </>
        )}

        {view === "bookmarks" && (
          <>
            <div className="topbar">
              <span className="topbar-title">Bookmarks</span>
              <span style={{ fontSize: 12, color: "var(--text3)", fontFamily: "'DM Mono', monospace" }}>
                {bookmarksHook.bookmarks.length} saved
              </span>
            </div>
            <div className="content">
              <BookmarksView
                bookmarks={bookmarksHook.bookmarks}
                query={bookmarksHook.query}
                setQuery={bookmarksHook.setQuery}
                loading={bookmarksHook.loading}
                onRemove={bookmarksHook.remove}
              />
            </div>
          </>
        )}
      </main>
    </div>
  );
}
