import React, { useEffect, useState, useRef, useCallback } from "react";
import { api } from "../api/client.js";
import { CommentTree } from "./CommentTree.jsx";
import { SummaryPanel } from "./SummaryPanel.jsx";
import { Icons } from "./Icons.jsx";

export function DetailPanel({ story, summaryHook }) {
  const [item, setItem] = useState(null);
  const [comments, setComments] = useState([]);
  const [loading, setLoading] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState(null);
  const [offset, setOffset] = useState(0);
  const [totalComments, setTotalComments] = useState(0);
  const [hasMore, setHasMore] = useState(true);
  const observerTarget = useRef(null);

  const loadComments = useCallback(async (storyId, currentOffset) => {
    try {
      const data = await api.getItem(storyId, currentOffset, 20);
      if (currentOffset === 0) {
        setItem(data);
        setComments(data.comments || []);
        setTotalComments(data.totalComments || 0);
      } else {
        setComments(prev => [...prev, ...(data.comments || [])]);
      }
      setOffset(currentOffset + 20);
      setHasMore((currentOffset + 20) < (data.totalComments || 0));
    } catch (e) {
      setError(e.message);
    }
  }, []);

  useEffect(() => {
    if (!story) { 
      setItem(null);
      setComments([]);
      setOffset(0);
      setTotalComments(0);
      setHasMore(true);
      return;
    }
    setLoading(true);
    setError(null);
    setComments([]);
    setOffset(0);
    setHasMore(true);
    loadComments(story.id, 0)
      .finally(() => setLoading(false));
  }, [story, loadComments]);

  useEffect(() => {
    const observer = new IntersectionObserver(
      entries => {
        if (entries[0].isIntersecting && hasMore && !loadingMore && !loading && story) {
          setLoadingMore(true);
          loadComments(story.id, offset)
            .finally(() => setLoadingMore(false));
        }
      },
      { threshold: 0.1 }
    );

    if (observerTarget.current) {
      observer.observe(observerTarget.current);
    }

    return () => observer.disconnect();
  }, [hasMore, loadingMore, loading, offset, story, loadComments]);

  if (!story) {
    return (
      <div className="detail-panel empty">
        <Icons.Panel />
        <span>Select a story to read</span>
      </div>
    );
  }

  const { getSummary, isLoading, getError, summarize } = summaryHook;

  return (
    <div className="detail-panel">
      {/* Header */}
      <div className="detail-header">
        <h2>{story.title}</h2>
        {story.url && (
          <a href={story.url} target="_blank" rel="noopener noreferrer">
            {new URL(story.url).hostname.replace("www.", "")} <Icons.ExternalLink />
          </a>
        )}
        <div className="detail-meta">
          <span className="meta-chip score">
            <Icons.ArrowUp /> {story.score} pts
          </span>
          <span className="meta-chip">
            <Icons.User /> {story.by}
          </span>
          <span className="meta-chip comments">
            <Icons.MessageSquare /> {story.descendants || 0} comments
          </span>
        </div>
      </div>

      {/* Summary */}
      {(story.descendants > 0) && (
        <SummaryPanel
          storyId={story.id}
          title={story.title}
          summary={getSummary(story.id)}
          loading={isLoading(story.id)}
          error={getError(story.id)}
          onSummarize={summarize}
        />
      )}

      {/* Comments */}
      <div className="comments-section">
        {loading && (
          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={`skeleton-${i}`} style={{ padding: "10px 0" }}>
                <div className="skeleton" style={{ width: 80, height: 11, marginBottom: 6 }} />
                <div className="skeleton" style={{ width: "90%", height: 12, marginBottom: 4 }} />
                <div className="skeleton" style={{ width: "70%", height: 12 }} />
              </div>
            ))}
          </div>
        )}
        {error && <div className="error-msg">{error}</div>}
        {item && !loading && (
          <>
            <div className="comments-count">
              {comments.length} of {totalComments} comments
            </div>
            <CommentTree comments={comments} />
            {hasMore && (
              <div ref={observerTarget} style={{ padding: "20px", textAlign: "center" }}>
                {loadingMore && <span style={{ color: "var(--text3)", fontSize: 12 }}>Loading more comments...</span>}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
