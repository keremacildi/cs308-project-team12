'use client';
import React, { useState } from 'react';
import { useSession } from 'next-auth/react';

export default function ReviewForm({ productId }) {
  const { data: session } = useSession();
  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (!session) {
      setError('Please login to submit a review');
      return;
    }

    if (rating < 1 || rating > 10) {
      setError('Please select a rating between 1 and 10');
      return;
    }

    try {
      const response = await fetch(`/api/products/${productId}/reviews`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ rating, comment }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to submit review');
      }

      setSuccess('Review submitted successfully!');
      setRating(0);
      setComment('');
    } catch (err) {
      setError(err.message);
    }
  };

  return (
    <div className="bg-white p-6 rounded-lg shadow-md">
      <h3 className="text-xl font-semibold mb-4">Write a Review</h3>
      {error && <div className="text-red-500 mb-4">{error}</div>}
      {success && <div className="text-green-500 mb-4">{success}</div>}
      
      <form onSubmit={handleSubmit}>
        <div className="mb-4">
          <label className="block text-gray-700 mb-2">Rating (1-10)</label>
          <div className="flex space-x-2">
            {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((value) => (
              <button
                key={value}
                type="button"
                onClick={() => setRating(value)}
                className={`w-10 h-10 rounded-full ${
                  rating >= value ? 'bg-yellow-400' : 'bg-gray-200'
                }`}
              >
                {value}
              </button>
            ))}
          </div>
        </div>

        <div className="mb-4">
          <label className="block text-gray-700 mb-2">Comment</label>
          <textarea
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            className="w-full p-2 border rounded"
            rows="4"
            placeholder="Share your experience with this product..."
          />
        </div>

        <button
          type="submit"
          className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
        >
          Submit Review
        </button>
      </form>
    </div>
  );
} 