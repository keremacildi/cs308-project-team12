"use client";
import { useState, useEffect } from 'react';
import { Star, StarHalf, Loader2 } from "lucide-react";
import AddToCartButton from '../../../components/ui/AddToCartButton';
import { mockProducts } from '../../data/mock_data/products';
import apiClient from '../../../utils/apiClient';
import { getImageUrl } from '../../../utils/imageUtils';
import Link from 'next/link';

// Star Rating Component
const StarRating = ({ rating }) => {
  // Convert rating to number and ensure it's between 0-5
  const ratingValue = Math.min(Math.max(parseFloat(rating) || 0, 0), 5);
  
  // Calculate full and half stars
  const fullStars = Math.floor(ratingValue);
  const hasHalfStar = ratingValue % 1 >= 0.5;
  
  return (
    <div className="flex items-center">
      {/* Render full stars */}
      {[...Array(fullStars)].map((_, i) => (
        <Star key={`full-${i}`} className="w-5 h-5 fill-amber-400 text-amber-400" />
      ))}
      
      {/* Render half star if needed */}
      {hasHalfStar && <StarHalf className="w-5 h-5 fill-amber-400 text-amber-400" />}
      
      {/* Render empty stars */}
      {[...Array(5 - fullStars - (hasHalfStar ? 1 : 0))].map((_, i) => (
        <Star key={`empty-${i}`} className="w-5 h-5 text-gray-300" />
      ))}
      
      <span className="ml-2 text-base text-gray-600">
        {ratingValue.toFixed(1)}
      </span>
    </div>
  );
};

export default function ProductDetail({ params }) {
  const { productId } = params;
  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchProduct = async () => {
      try {
        setLoading(true);
        // First try to fetch from the API using the apiClient
        const data = await apiClient.products.getDetail(productId);
        setProduct(data);
        setLoading(false);
      } catch (error) {
        console.error("Error fetching product:", error);
        // Fallback to mock data if API fails
        const fallbackProduct = mockProducts.product.find((p) => p.id.toString() === productId);
        if (fallbackProduct) {
          console.log("Using fallback mock data");
          setProduct(fallbackProduct);
        } else {
          setError("Product not found");
        }
        setLoading(false);
      }
    };

    fetchProduct();
  }, [productId]);

  if (loading) {
    return (
      <div className="max-w-3xl mx-auto my-10 p-8 bg-white rounded-xl shadow-sm">
        <div className="flex flex-col items-center justify-center py-10">
          <Loader2 className="w-10 h-10 text-blue-500 animate-spin mb-4" />
          <p className="text-gray-600">Loading product details...</p>
        </div>
      </div>
    );
  }

  if (error || !product) {
    return (
      <div className="max-w-3xl mx-auto my-10 p-8 bg-white rounded-xl shadow-sm">
        <div className="text-center text-red-600 py-8">
          <h2 className="text-xl font-semibold mb-2">Error</h2>
          <p className="mb-4">{error || "Product not found"}</p>
          <Link 
            href="/products" 
            className="inline-block px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 transition"
          >
            Back to Products
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto my-10 p-8 bg-white rounded-xl shadow-sm border border-gray-200">
      <div className="flex justify-between items-start mb-4">
        <h1 className="text-2xl font-bold text-gray-800">{product.title}</h1>
        <div className="bg-gray-100 px-3 py-1 rounded-md">
          <span className="text-sm font-medium text-gray-500">Product ID: {product.id}</span>
        </div>
      </div>
      
      <div className="aspect-square w-full max-h-96 relative mb-8 bg-gray-50 rounded-lg overflow-hidden">
        <img 
          src={getImageUrl(product.image)}
          alt={product.title} 
          className="w-full h-full object-contain p-4 rounded-lg" 
        />
      </div>
      
      <div className="flex items-center gap-2 mb-4">
        <span className="font-medium">Rating:</span> 
        <StarRating rating={product.rating || product.avg_rating || 0} />
      </div>
      
      <p className="text-base text-gray-800 py-2 border-b border-gray-100">
        <span className="font-semibold">Price:</span> ${typeof product.price === 'number' ? product.price.toFixed(2) : product.price}
      </p>
      
      <p className="text-base text-gray-800 py-2 border-b border-gray-100">
        <span className="font-semibold">Category:</span> {product.category?.name || product.category}
      </p>
      
      <p className="text-base text-gray-800 py-2 border-b border-gray-100">
        <span className="font-semibold">Brand:</span> {product.brand?.name || product.brand}
      </p>
      
      <p className="text-base text-gray-800 py-2 border-b border-gray-100">
        <span className="font-semibold">Seller:</span> {product.seller?.name || product.seller}
      </p>

      <p className="text-base py-2 border-b border-gray-100">
        <span className="font-semibold">Availability:</span> 
        {product.quantity_in_stock > 0 ? (
          <span className="ml-2 inline-block px-3 py-1 bg-green-100 text-green-800 rounded-md font-medium">
            {product.quantity_in_stock} in stock
          </span>
        ) : (
          <span className="ml-2 inline-block px-3 py-1 bg-red-100 text-red-800 rounded-md font-medium">
            Out of stock
          </span>
        )}
      </p>
      
      {product.description && (
        <div className="mt-6 pt-4 border-t border-gray-200">
          <h3 className="text-lg font-semibold mb-2">Description</h3>
          <p className="text-gray-700">{product.description}</p>
        </div>
      )}
      
      {/* Add to Cart button */}
      <div className="mt-8">
        <AddToCartButton product={product} />
      </div>
    </div>
  );
}
