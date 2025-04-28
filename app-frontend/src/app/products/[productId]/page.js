"use client"
// app/products/[productId]/page.js
import AddToCartButton from '../../../components/ui/AddToCartButton';
import Image from 'next/image';
import { useState, useEffect } from 'react';
import { api } from '../../../lib/api';
import React from 'react';
import { Shield, Tag } from 'lucide-react';

export default function ProductDetail({ params }) {
  // Unwrap params using React.use() to handle Promise
  const resolvedParams = React.use(params);
  const productId = resolvedParams.productId;
  
  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [comments, setComments] = useState([]);
  const [loadingComments, setLoadingComments] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        console.log(`Fetching product with ID: ${productId}`);
        // Use the api utility instead of raw fetch for consistency
        const data = await api.products.detail(productId);
        console.log('Received product data:', data);
        
        if (data) {
          setProduct(data);
        } else {
          throw new Error('Product data not found');
        }
      } catch (err) {
        console.error('Error fetching product:', err);
        setError(err);
      } finally {
        setLoading(false);
      }
    };
    
    const fetchComments = async () => {
      try {
        setLoadingComments(true);
        const data = await api.products.comments(productId);
        console.log('Received comments data:', data);
        setComments(data || []);
      } catch (err) {
        console.error('Error fetching comments:', err);
        // Don't set error state for comments as it shouldn't block the whole page
        setComments([]);
      } finally {
        setLoadingComments(false);
      }
    };
    
    fetchData();
    fetchComments();
  }, [productId]);

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
          <p><strong>Error:</strong> {error.message || 'Failed to load product details'}</p>
        </div>
      </div>
    );
  }

  if (!product) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="bg-yellow-100 border border-yellow-400 text-yellow-700 px-4 py-3 rounded">
          <p>Product not found.</p>
        </div>
      </div>
    );
  }

  // Format timestamp for comments
  const formatDate = (dateString) => {
    const options = { year: 'numeric', month: 'long', day: 'numeric' };
    return new Date(dateString).toLocaleDateString(undefined, options);
  };

  // Get warranty status or provide a default
  const warrantyStatus = product.warranty || "No Warranty";

  return (
    <div className="max-w-4xl mx-auto p-6 bg-white shadow-lg rounded-lg my-8">
      <div className="flex flex-wrap items-start justify-between mb-4">
        <h1 className="text-3xl font-bold">{product.title}</h1>
        
        {/* Product ID Badge */}
        <div className="flex items-center bg-gray-100 text-gray-700 px-3 py-1 rounded-full text-sm">
          <Tag className="w-4 h-4 mr-1" />
          <span>Product ID: {product.id}</span>
        </div>
      </div>
      
      <div className="grid md:grid-cols-2 gap-8">
        <div className="relative h-[400px] w-full bg-gray-100 rounded-lg overflow-hidden">
          {product.image_url ? (
            <Image 
              src={product.image_url}
              alt={product.title}
              fill
              sizes="(max-width: 768px) 100vw, 50vw"
              className="object-contain"
              unoptimized={product.image_url.includes('0.0.0.0')}
              onError={(e) => {
                e.target.onerror = null;
                e.target.src = "/iphone.jpg"; // Fallback image path
              }}
            />
          ) : (
            <div className="flex items-center justify-center h-full">
              <p className="text-gray-500">No image available</p>
            </div>
          )}
        </div>
        
        <div className="space-y-4">
          <div className="flex items-center space-x-2">
            <span className="text-2xl font-bold text-blue-600">${parseFloat(product.price).toFixed(2)}</span>
            {product.is_available ? (
              <span className="px-2 py-1 bg-green-100 text-green-800 text-xs rounded-full">In Stock</span>
            ) : (
              <span className="px-2 py-1 bg-red-100 text-red-800 text-xs rounded-full">Out of Stock</span>
            )}
          </div>
          
          {/* Warranty Information */}
          <div className="flex items-center mt-2">
            <Shield className={`mr-2 ${
              warrantyStatus === "No Warranty" 
                ? "text-gray-400" 
                : "text-green-600"
            }`} />
            <span className={`${
              warrantyStatus === "No Warranty" 
                ? "text-gray-600" 
                : "text-green-600 font-medium"
            }`}>
              {warrantyStatus}
            </span>
          </div>
          
          {product.rating !== undefined && (
            <div className="flex items-center">
              <div className="flex items-center mr-2">
                {[1, 2, 3, 4, 5].map((star) => (
                  <svg 
                    key={star}
                    className={`w-5 h-5 ${star <= Math.round(product.rating) ? 'text-yellow-400' : 'text-gray-300'}`}
                    fill="currentColor" 
                    viewBox="0 0 20 20"
                  >
                    <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                  </svg>
                ))}
              </div>
              <span className="text-sm text-gray-600">
                {product.rating.toFixed(1)} ({product.total_ratings || 0} reviews)
              </span>
            </div>
          )}
          
          {product.category && (
            <p className="text-gray-700">
              <span className="font-semibold">Category:</span> {
                typeof product.category === 'object' && product.category.name 
                  ? product.category.name 
                  : product.category
              }
            </p>
          )}
          
          {product.description && (
            <div>
              <h3 className="text-lg font-semibold mb-2">Description</h3>
              <p className="text-gray-700">{product.description}</p>
            </div>
          )}
          
          {product.quantity_in_stock !== undefined && (
            <p className="text-gray-700">
              <span className="font-semibold">In Stock:</span> {product.quantity_in_stock} units
            </p>
          )}
          
          <div className="pt-4">
            <AddToCartButton product={product} />
          </div>
        </div>
      </div>
      
      {/* Comments Section */}
      <div className="mt-10 pt-6 border-t border-gray-200">
        <h2 className="text-2xl font-bold mb-4">Customer Reviews</h2>
        
        {loadingComments ? (
          <div className="flex justify-center py-4">
            <div className="animate-pulse flex space-x-4">
              <div className="flex-1 space-y-4 py-1">
                <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                <div className="space-y-2">
                  <div className="h-4 bg-gray-200 rounded"></div>
                  <div className="h-4 bg-gray-200 rounded w-5/6"></div>
                </div>
              </div>
            </div>
          </div>
        ) : comments.length > 0 ? (
          <div className="space-y-4">
            {comments.map((comment) => (
              <div key={comment.id} className="bg-gray-50 p-4 rounded-lg shadow-sm">
                <div className="flex justify-between items-start">
                  <div>
                    <p className="font-semibold text-gray-900">
                      {comment.user_details?.username || 'Anonymous'}
                    </p>
                    <p className="text-sm text-gray-500">{formatDate(comment.created_at)}</p>
                  </div>
                  {comment.user_details?.rating && (
                    <div className="flex">
                      {[1, 2, 3, 4, 5].map((star) => (
                        <svg 
                          key={star}
                          className={`w-4 h-4 ${star <= comment.user_details.rating ? 'text-yellow-400' : 'text-gray-300'}`}
                          fill="currentColor" 
                          viewBox="0 0 20 20"
                        >
                          <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                        </svg>
                      ))}
                    </div>
                  )}
                </div>
                <p className="mt-2 text-gray-700">{comment.text}</p>
              </div>
            ))}
          </div>
        ) : (
          <div className="bg-gray-50 p-4 rounded-lg text-center">
            <p className="text-gray-500">No reviews yet. Be the first to review this product!</p>
          </div>
        )}
      </div>
    </div>
  );
}
