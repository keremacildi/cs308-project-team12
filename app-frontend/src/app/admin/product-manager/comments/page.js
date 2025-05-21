"use client";
import { useState } from "react";
import { CheckCircle, XCircle } from "lucide-react";
import Image from "next/image";
import { MessageCircle } from "lucide-react";

export default function CommentApprovalPage() {
  const [comments, setComments] = useState([
    { id: 1, user: "Alice", text: "Great product!", approved: false, product: { name: "Wireless Headphones", image: "/images/headphones.jpg" }, date: "2024-05-01" },
    { id: 2, user: "Bob", text: "Didn't like it.", approved: false, product: { name: "Smart Watch", image: "/images/smartwatch.jpg" }, date: "2024-05-02" }
  ]);

  const approveComment = (id) => {
    setComments(comments.map(c => c.id === id ? { ...c, approved: true, rejected: false } : c));
  };

  const rejectComment = (id) => {
    setComments(comments.map(c => c.id === id ? { ...c, approved: false, rejected: true } : c));
  };

  return (
    <div className="max-w-3xl mx-auto py-10 px-4">
      <h2 className="text-3xl font-extrabold mb-10 text-blue-700 tracking-tight flex items-center gap-2">
        <MessageCircle className="w-7 h-7 text-blue-400" /> Comment Approval
      </h2>
      {comments.length === 0 ? (
        <div className="flex flex-col items-center justify-center text-gray-500 py-20 bg-white rounded-xl shadow-sm">
          <MessageCircle className="w-12 h-12 mb-4 text-blue-300" />
          <div className="text-lg font-semibold">No comments to review.</div>
        </div>
      ) : (
        <div className="space-y-8">
          {comments.map(c => (
            <div key={c.id} className="bg-white rounded-2xl shadow-lg p-6 flex flex-col md:flex-row md:items-center md:justify-between border border-gray-100 gap-6 md:gap-0">
              {/* Ürün görseli ve adı */}
              <div className="flex items-center gap-4 mb-4 md:mb-0">
                <Image src={c.product.image} alt={c.product.name} width={56} height={56} className="rounded-xl object-cover border border-gray-200 shadow-sm" />
                <div>
                  <div className="text-base font-semibold text-blue-700">{c.product.name}</div>
                  <div className="text-xs text-gray-400">{new Date(c.date).toLocaleDateString()} by <span className="font-medium">{c.user}</span></div>
                </div>
              </div>
              {/* Yorum metni */}
              <div className="flex-1 mx-0 md:mx-6">
                <div className="bg-blue-50 border border-blue-100 rounded-xl px-4 py-3 text-gray-800 text-base shadow-sm">
                  {c.text}
                </div>
                {/* Onay/Ret rozetleri */}
                {c.approved && (
                  <span className="inline-flex items-center text-green-600 font-medium mt-2">
                    <CheckCircle className="w-5 h-5 mr-1" /> Approved
                  </span>
                )}
                {c.rejected && (
                  <span className="inline-flex items-center text-red-500 font-medium mt-2">
                    <XCircle className="w-5 h-5 mr-1" /> Rejected
                  </span>
                )}
              </div>
              {/* Butonlar */}
              {!c.approved && !c.rejected && (
                <div className="flex flex-col gap-3 min-w-[140px]">
                  <button
                    onClick={() => approveComment(c.id)}
                    className="inline-flex items-center justify-center px-5 py-2.5 bg-gradient-to-r from-green-400 to-green-600 hover:from-green-500 hover:to-green-700 text-white rounded-xl font-semibold shadow-md text-base transition-all duration-200"
                  >
                    <CheckCircle className="w-5 h-5 mr-2" /> Approve
                  </button>
                  <button
                    onClick={() => rejectComment(c.id)}
                    className="inline-flex items-center justify-center px-5 py-2.5 bg-gradient-to-r from-red-400 to-red-600 hover:from-red-500 hover:to-red-700 text-white rounded-xl font-semibold shadow-md text-base transition-all duration-200"
                  >
                    <XCircle className="w-5 h-5 mr-2" /> Reject
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
