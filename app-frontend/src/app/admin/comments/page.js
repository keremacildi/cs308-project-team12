"use client";
import { useState, useEffect } from "react";

export default function CommentModerationPage() {
  // Onay bekleyen yorumları ve yükleme durumunu tutacak state'ler
  const [pendingComments, setPendingComments] = useState([]);
  const [loading, setLoading] = useState(true);

  // Sayfa yüklendiğinde onay bekleyen yorumları çek
  useEffect(() => {
    fetchPendingComments();
  }, []);

  // Backend'den onay bekleyen yorumları getiren fonksiyon
  const fetchPendingComments = () => {
    fetch("http://localhost:8000/api/comments/pending/", {
      credentials: "include" // Cookie/session bilgilerini gönder (auth için)
    })
      .then(res => res.json())
      .then(data => {
        setPendingComments(data);
        setLoading(false);
      })
      .catch(err => {
        console.error("Error fetching pending comments:", err);
        setLoading(false);
      });
  };

  // Yorumu onaylayan fonksiyon
  const approveComment = (commentId) => {
    fetch(`http://localhost:8000/api/comments/${commentId}/approve/`, {
      method: "POST",
      credentials: "include"
    })
      .then(res => res.json())
      .then(() => {
        // Onaylanan yorumu listeden kaldır
        setPendingComments(pendingComments.filter(comment => comment.id !== commentId));
      })
      .catch(err => console.error("Error approving comment:", err));
  };

  // Yorumu reddeden/silen fonksiyon
  const declineComment = (commentId) => {
    fetch(`http://localhost:8000/api/comments/${commentId}/`, {
      method: "DELETE",
      credentials: "include"
    })
      .then(() => {
        // Reddedilen yorumu listeden kaldır
        setPendingComments(pendingComments.filter(comment => comment.id !== commentId));
      })
      .catch(err => console.error("Error declining comment:", err));
  };

  // Yükleme devam ediyorsa loading göster
  if (loading) return <div className="text-center py-12">Loading...</div>;

  return (
    <div className="max-w-3xl mx-auto py-10 px-4">
      <h2 className="text-2xl font-bold mb-6 text-blue-700">Comment Moderation</h2>
      
      {/* Yorum yoksa bilgi mesajı göster */}
      {pendingComments.length === 0 ? (
        <p className="text-gray-500">No pending comments to review.</p>
      ) : (
        <div className="space-y-4">
          {/* Her bir yorumu listele */}
          {pendingComments.map(comment => (
            <div key={comment.id} className="bg-white shadow rounded-lg p-4">
              <div className="flex justify-between items-start mb-2">
                <div>
                  {/* Yorum yapan kullanıcı ve ürün bilgisi */}
                  <p className="font-semibold">
                    {comment.user_details?.username || "Anonymous"} 
                    <span className="text-gray-500 ml-2 text-sm">on product:</span>
                    <span className="ml-1">{comment.product_details?.title || `ID: ${comment.product}`}</span>
                  </p>
                  {/* Yorum tarihi */}
                  <p className="text-gray-500 text-sm">{new Date(comment.created_at).toLocaleString()}</p>
                </div>
                {/* Onay ve Red butonları */}
                <div className="flex gap-2">
                  <button
                    onClick={() => approveComment(comment.id)}
                    className="bg-green-600 hover:bg-green-700 text-white px-3 py-1 rounded text-sm"
                  >
                    Approve
                  </button>
                  <button
                    onClick={() => declineComment(comment.id)}
                    className="bg-red-600 hover:bg-red-700 text-white px-3 py-1 rounded text-sm"
                  >
                    Decline
                  </button>
                </div>
              </div>
              {/* Yorum metni */}
              <p className="text-gray-700">{comment.text}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}