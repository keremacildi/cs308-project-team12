"use client";
import { useState } from "react";

export default function CommentApprovalPage() {
  const [comments, setComments] = useState([
    { id: 1, user: "Alice", text: "Great product!", approved: false },
    { id: 2, user: "Bob", text: "Didn't like it.", approved: false }
  ]);

  const approveComment = (id) => {
    setComments(comments.map(c => c.id === id ? { ...c, approved: true } : c));
  };

  const rejectComment = (id) => {
    setComments(comments.filter(c => c.id !== id));
  };

  return (
    <div style={{ padding: 24 }}>
      <h2>Comment Approval</h2>
      {comments.map(c => (
        <div key={c.id}>
          <p><strong>{c.user}</strong>: {c.text}</p>
          {c.approved ? (
            <span>✅ Approved</span>
          ) : (
            <>
              <button onClick={() => approveComment(c.id)}>Approve</button>
              <button onClick={() => rejectComment(c.id)}>Reject</button>
            </>
          )}
        </div>
      ))}
    </div>
  );
}
