import React from "react";
import { Icons } from "./Icons.jsx";

export function SummaryPanel({ storyId, title, summary, loading, error, onSummarize }) {
  if (loading) {
    return (
      <div className="summary-bar">
        <button className="summarize-btn" disabled>
          <span className="loading-spinner" />
          Analysing {title?.split(" ").slice(0, 4).join(" ")}...
        </button>
      </div>
    );
  }

  if (error) {
    return (
      <div className="summary-bar">
        <div className="error-msg">{error}</div>
        <button className="summarize-btn" onClick={() => onSummarize(storyId, title)}>
          <Icons.Sparkle /> Retry summary
        </button>
      </div>
    );
  }

  if (summary) {
    return (
      <div className="summary-bar">
        <div className="summary-card">
          <div className="summary-header">
            <span className="summary-label">AI Summary</span>
            <span className={`sentiment-badge ${summary.sentiment}`}>
              {summary.sentiment}
            </span>
          </div>
          <p className="summary-text">{summary.summary}</p>
          {summary.key_points?.length > 0 && (
            <div className="key-points">
              {summary.key_points.map((pt, i) => (
                <div key={i} className="key-point">{pt}</div>
              ))}
            </div>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="summary-bar">
      <button className="summarize-btn" onClick={() => onSummarize(storyId, title)}>
        <Icons.Sparkle /> Summarize discussion
      </button>
    </div>
  );
}
