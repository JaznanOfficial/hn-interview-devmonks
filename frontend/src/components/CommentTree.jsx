import React, { useState } from "react";

function timeAgo(unixTime) {
  const diff = Date.now() / 1000 - unixTime;
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  return `${Math.floor(diff / 86400)}d ago`;
}

function CommentNode({ comment, depth = 0 }) {
  const [collapsed, setCollapsed] = useState(false);

  if (!comment || comment.deleted || comment.dead) return null;

  const text = comment.text || "";
  const hasChildren = comment.children?.length > 0;

  return (
    <div className="comment">
      <div className="comment-inner" style={{ marginLeft: depth > 0 ? 0 : 0 }}>
        <div className="comment-header">
          <span className="comment-author">{comment.by || "deleted"}</span>
          {comment.time && (
            <span className="comment-time">{timeAgo(comment.time)}</span>
          )}
          {hasChildren && (
            <span
              className="toggle-comment"
              onClick={() => setCollapsed(!collapsed)}
            >
              {collapsed ? `[+${countChildren(comment)} hidden]` : "collapse"}
            </span>
          )}
        </div>
        {!collapsed && (
          <div
            className="comment-text"
            dangerouslySetInnerHTML={{ __html: text }}
          />
        )}
      </div>
      {!collapsed && hasChildren && (
        <div className="comment-children">
          {comment.children.map((child) => (
            <CommentNode key={child.id} comment={child} depth={depth + 1} />
          ))}
        </div>
      )}
    </div>
  );
}

function countChildren(comment) {
  if (!comment.children) return 0;
  return comment.children.reduce(
    (sum, c) => sum + 1 + countChildren(c),
    0
  );
}

export function CommentTree({ comments }) {
  if (!comments?.length) {
    return (
      <div style={{ padding: "20px 0", color: "var(--text3)", fontSize: 12, textAlign: "center" }}>
        No comments yet
      </div>
    );
  }

  return (
    <div>
      {comments.map((comment) => (
        <CommentNode key={comment.id} comment={comment} depth={0} />
      ))}
    </div>
  );
}
