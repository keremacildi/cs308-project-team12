'use client';
import React, { useState } from "react";
import Link from "next/link";
import AddToCartButton from "./ui/AddToCartButton";
import { Heart, ShoppingCart, Check, AlertCircle, Star } from "lucide-react";

export default function ProductCard({ id, title, price, image, stock, rating, ratingCount, totalRating, smallImage }) {
  // Create a product object including all properties
  const product = { id, title, price, image, stock, rating, ratingCount, totalRating };

  // State for the wishlist button text and action
  const [isInWishlist, setIsInWishlist] = useState(false);
  const [actionFeedback, setActionFeedback] = useState(null);

  // Convert rating to a number between 0-5 or default to 0
  const ratingValue = rating ? parseFloat(rating) : 0;
  // Format rating count or use default value
  const formattedRatingCount = ratingCount ? parseInt(ratingCount) : 0;
  // Format total rating or use default
  const formattedTotalRating = totalRating ? parseInt(totalRating) : 0;
  
  // Generate stars based on rating
  const renderStars = () => {
    const stars = [];
    const fullStars = Math.floor(ratingValue);
    const hasHalfStar = ratingValue % 1 >= 0.5;
    
    // Add full stars
    for (let i = 0; i < fullStars; i++) {
      stars.push(
        <Star key={`full-${i}`} className="w-4 h-4 fill-yellow-400 text-yellow-400" />
      );
    }
    
    // Add half star if needed
    if (hasHalfStar) {
      stars.push(
        <div key="half" className="relative w-4 h-4">
          <Star className="w-4 h-4 text-yellow-400" />
          <div className="absolute top-0 left-0 w-1/2 h-full overflow-hidden">
            <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
          </div>
        </div>
      );
    }
    
    // Add empty stars
    const emptyStars = 5 - fullStars - (hasHalfStar ? 1 : 0);
    for (let i = 0; i < emptyStars; i++) {
      stars.push(
        <Star key={`empty-${i}`} className="w-4 h-4 text-gray-300" />
      );
    }
    
    return stars;
  };

  const handleAddToWishlist = (e) => {
    // Prevent any parent click handlers from firing
    e.stopPropagation();
    if (typeof window !== "undefined") {
      let wishlist = [];
      const storedWishlist = localStorage.getItem("wishlist");
      if (storedWishlist) {
        wishlist = JSON.parse(storedWishlist);
      }
      // Check if the product is already in the wishlist
      const exists = wishlist.some((item) => item.id === id);
      if (!exists) {
        wishlist.push(product);
        localStorage.setItem("wishlist", JSON.stringify(wishlist));
        setIsInWishlist(true);
        setActionFeedback("Added to wishlist");
        setTimeout(() => setActionFeedback(null), 2000);
      } else {
        setActionFeedback("Already in wishlist");
        setTimeout(() => setActionFeedback(null), 2000);
      }
    }
  };

  return (
    <div className="group bg-white rounded-xl shadow-sm hover:shadow-md transition-all duration-300 overflow-hidden flex flex-col h-full relative">
      {/* Feedback Toast Notification */}
      {actionFeedback && (
        <div className="absolute top-2 right-2 left-2 bg-gray-800 text-white text-sm py-1 px-2 rounded-lg z-10 flex items-center justify-center">
          <Check className="w-4 h-4 mr-1" />
          {actionFeedback}
        </div>
      )}

      {/* Discount Tag - Example */}
      {Math.random() > 0.5 && (
        <div className="absolute top-3 left-3 bg-red-500 text-white text-xs font-bold px-2 py-1 rounded-full z-10">
          SALE
        </div>
      )}

      {/* Low Stock Indicator at the top */}
      {stock > 0 && stock < 5 && (
        <div className="absolute top-3 right-3 bg-orange-100 border border-orange-200 text-orange-700 text-xs font-bold px-2 py-1 rounded-full z-10 animate-pulse">
          Low Stock
        </div>
      )}

      {/* Product Image */}
      <div className="block relative overflow-hidden pt-[75%]">
        <Link href={`/products/${id}`} className="block absolute inset-0">
          <img 
            src={getImageUrl(image)} 
            alt={title}
            className="w-full h-full object-contain p-4 transition-transform duration-300 group-hover:scale-105" 
          />
        </Link>
        </div>

      {/* Product Info */}
      <div className="p-4 flex flex-col flex-grow">
        <Link href={`/products/${id}`} className="hover:text-primary transition">
          <h3 className="text-gray-800 font-medium text-lg mb-1 line-clamp-2">{title}</h3>
        </Link>
        
        {/* Rating stars and information */}
        {ratingValue > 0 && (
          <div className="flex flex-col mt-1 mb-2">
            <div className="flex items-center">
              <div className="flex items-center mr-2">
                {renderStars()}
              </div>
              <span className="text-sm text-gray-600">
                {ratingValue.toFixed(1)}
                <span className="text-gray-500 ml-1">
                  
                </span>
              </span>
            </div>
            
            {formattedTotalRating > 0 && (
              <div className="text-xs text-gray-500 mt-0.5">
                {formattedTotalRating} total reviews
              </div>
            )}
          </div>
        )}
        
        <div className="mt-auto pt-4">
          <div className="flex items-center justify-between mb-3">
            <span className="text-lg font-bold text-gray-900">${price}</span>
            {stock > 0 ? (
              stock < 5 ? (
                <span className="text-sm text-orange-600 bg-orange-100 px-2 py-0.5 rounded-full font-medium flex items-center">
                  <AlertCircle className="w-3 h-3 mr-1 animate-pulse" />
                  Only {stock} left
                </span>
              ) : (
                <span className="text-sm text-green-600 bg-green-100 px-2 py-0.5 rounded-full font-medium">
                  {stock} in Stock
                </span>
              )
            ) : (
              <span className="text-sm text-red-600 bg-red-100 px-2 py-0.5 rounded-full font-medium flex items-center">
                <AlertCircle className="w-3 h-3 mr-1" />
                Out of Stock
              </span>
            )}
          </div>
          
          {/* Actions */}
          <div className="grid grid-cols-1 gap-2">
            <AddToCartButton product={product} disabled={stock === 0} maxQuantity={stock} />
            
            <button 
              onClick={handleAddToWishlist} 
              className={`flex items-center justify-center gap-2 py-2 px-4 rounded-lg border transition-colors ${
                isInWishlist
                  ? "bg-pink-50 text-pink-600 border-pink-200"
                  : "bg-white text-gray-700 border-gray-300 hover:border-gray-400"
              }`}
            >
              <Heart className={`w-4 h-4 ${isInWishlist ? "fill-pink-600 text-pink-600" : ""}`} />
              <span className="text-sm font-medium">Wishlist</span>
          </button>
          </div>
        </div>
      </div>
    </div>
  );
}
