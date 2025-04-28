"use client";
import React, { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import ProductCard from "../../../components/ProductCard"; // Adjust the path as needed

export default function ReviewPage() {
  const { productId } = useParams();
  const [product, setProduct] = useState(null);
  const [review, setReview] = useState("");
  const [rating, setRating] = useState(5);
  const [submitted, setSubmitted] = useState(false);

  

  const handleSubmit = (e) => {
    e.preventDefault();
    console.log("Review submitted:", { rating, review });
    setSubmitted(true);
    setReview("");
  };

  if (!product) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <p className="text-xl text-gray-600">Loading product details...</p>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6">
      <h1 className="text-4xl font-bold text-center mb-8">Review Product</h1>
      <div className="mb-8">
        <ProductCard
          id={product.id}
          title={product.title}
          price={product.price}
          image={product.image}
          stock={product.stock}
          smallImage={true}  // Pass the prop to use a smaller image size
        />
      </div>
      <div className="bg-zinc-800 p-6 rounded shadow-md max-w-xl mx-auto">
       
        <h2 className="text-2xl font-semibold mb-4">Leave Your Review</h2>
        
        <form onSubmit={handleSubmit}>
          <div className="mb-4">
            <label htmlFor="rating" className="block text-gray-700 font-medium mb-2">
              Rating
            </label>
            <select
              id="rating"
              value={rating}
              onChange={(e) => setRating(Number(e.target.value))}
              className="border border-gray-300 p-2 rounded w-full"
            >
              <option value={1}>1 - Poor</option>
              <option value={2}>2 - Fair</option>
              <option value={3}>3 - Good</option>
              <option value={4}>4 - Very Good</option>
              <option value={5}>5 - Excellent</option>
            </select>
          </div>
          <div className="mb-4">
            <label htmlFor="review" className="block text-gray-700 font-medium mb-2">
              Your Review
            </label>
            <textarea
              id="review"
              value={review}
              onChange={(e) => setReview(e.target.value)}
              rows={4}
              placeholder="Write your review here..."
              className="border border-gray-300 p-2 rounded w-full"
              required
            />
          </div>
          <button
  type="submit"
  disabled={submitted}
  className={`${
    submitted ? "bg-green-500 hover:bg-green-600" : "bg-blue-500 hover:bg-blue-600"
  } text-white px-4 py-2 rounded transition duration-200 w-full`}
>
  {submitted ? "Thanks for your review!" : "Submit Review"}
</button>

        </form>
      </div>
    </div>
  );
}
