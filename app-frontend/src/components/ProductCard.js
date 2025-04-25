'use client';
import React, { useState } from "react";
import Link from "next/link";
import AddToCartButton from "./ui/AddToCartButton";
import { Heart, ShoppingCart, Check, AlertCircle } from "lucide-react";

export default function ProductCard({ id, title, price, image, stock, smallImage }) {
  // Create a product object including the stock property
  const product = { id, title, price, image, stock };

  // State for the wishlist button text and action
  const [isInWishlist, setIsInWishlist] = useState(false);
  const [actionFeedback, setActionFeedback] = useState(null);

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

      {/* Product Image */}
      <Link href={`/products/${id}`} className="block relative overflow-hidden pt-[75%]">
        <img 
          src={image || "/iphone.jpg"} 
          alt={title}
          className="absolute top-0 left-0 w-full h-full object-contain p-4 transition-transform duration-300 group-hover:scale-105" 
        />
      </Link>

      {/* Product Info */}
      <div className="p-4 flex flex-col flex-grow">
        <Link href={`/products/${id}`} className="hover:text-primary transition">
          <h3 className="text-gray-800 font-medium text-lg mb-1 line-clamp-2">{title}</h3>
        </Link>
        
        <div className="mt-auto pt-4">
          <div className="flex items-center justify-between mb-3">
            <span className="text-lg font-bold text-gray-900">${price}</span>
            {stock > 0 ? (
              <span className="text-sm text-green-600 bg-green-100 px-2 py-0.5 rounded-full font-medium">
                In Stock
              </span>
            ) : (
              <span className="text-sm text-red-600 bg-red-100 px-2 py-0.5 rounded-full font-medium flex items-center">
                <AlertCircle className="w-3 h-3 mr-1" />
                Out of Stock
              </span>
            )}
          </div>
          
          {/* Actions */}
          <div className="grid grid-cols-1 gap-2">
            <AddToCartButton product={product} disabled={stock === 0} />
            
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
