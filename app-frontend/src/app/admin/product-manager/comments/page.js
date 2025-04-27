"use client";
import { useState } from "react";
import { CheckCircle, XCircle } from "lucide-react";

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
    <div className="max-w-2xl mx-auto py-10 px-4">
      <h2 className="text-2xl font-bold mb-8 text-blue-700">Comment Approval</h2>
      {comments.length === 0 ? (
        <div className="text-center text-gray-500 py-16 bg-white rounded-xl shadow-sm">No comments to review.</div>
      ) : (
        <div className="space-y-6">
          {comments.map(c => (
            <div key={c.id} className="bg-white rounded-xl shadow p-6 flex flex-col md:flex-row md:items-center md:justify-between border border-gray-100">
              <div>
                <div className="font-semibold text-gray-800 mb-1">{c.user}</div>
                <div className="text-gray-700 mb-2">{c.text}</div>
                {c.approved && (
                  <span className="inline-flex items-center text-green-600 font-medium mt-2">
                    <CheckCircle className="w-5 h-5 mr-1" /> Approved
                  </span>
                )}
              </div>
              {!c.approved && (
                <div className="flex gap-2 mt-4 md:mt-0">
                  <button
                    onClick={() => approveComment(c.id)}
                    className="inline-flex items-center px-4 py-2 bg-green-500 hover:bg-green-600 text-white rounded-lg font-medium shadow transition"
                  >
                    <CheckCircle className="w-4 h-4 mr-1" /> Approve
                  </button>
                  <button
                    onClick={() => rejectComment(c.id)}
                    className="inline-flex items-center px-4 py-2 bg-red-500 hover:bg-red-600 text-white rounded-lg font-medium shadow transition"
                  >
                    <XCircle className="w-4 h-4 mr-1" /> Reject
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
