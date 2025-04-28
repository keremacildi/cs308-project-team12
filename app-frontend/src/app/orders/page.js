"use client";
import React, { useEffect, useState } from 'react';
import Link from 'next/link';

export default function OrderHistory() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [userId, setUserId] = useState(null);
  const [error, setError] = useState(null);
  const [debugInfo, setDebugInfo] = useState(null);
  const [ratings, setRatings] = useState({});
  const [reviews, setReviews] = useState({});
  const [submitting, setSubmitting] = useState({});
  const [existingRatings, setExistingRatings] = useState({});
  const [existingComments, setExistingComments] = useState({});

  useEffect(() => {
    // Check if user is logged in via localStorage
    try {
      const user = JSON.parse(localStorage.getItem("user") || "{}");
      console.log("User from localStorage:", user);
      const loggedIn = !!user && !!user.id;
      setIsLoggedIn(loggedIn);
      setUserId(user?.id);

      if (loggedIn && user.id) {
        fetchOrders(user.id);
        fetchDebugInfo(user.id);
      } else {
        setLoading(false);
      }
    } catch (err) {
      console.error("Error reading user from localStorage:", err);
      setLoading(false);
      setError("Could not verify login status");
    }
  }, []);

  // Fetch existing ratings and comments for all products in orders
  useEffect(() => {
    if (orders.length > 0 && userId) {
      fetchExistingFeedback();
    }
  }, [orders, userId]);

  const fetchExistingFeedback = async () => {
    try {
      const API_URL = process.env.NEXT_PUBLIC_API_URL;
      const productIds = new Set();
      
      // Collect all product IDs from orders
      orders.forEach(order => {
        if (order.items && Array.isArray(order.items)) {
          order.items.forEach(item => {
            const productId = item.product?.id || 
              (typeof item.product === 'number' ? item.product : null);
            if (productId) {
              productIds.add(productId);
            }
          });
        }
      });
      
      // Fetch existing ratings for all products
      const ratingsPromises = Array.from(productIds).map(async (productId) => {
        try {
          const response = await fetch(`${API_URL}/api/ratings/?product=${productId}&user=${userId}`);
          if (response.ok) {
            const data = await response.json();
            if (data && data.length > 0) {
              return { productId, rating: data[0].score };
            }
          }
          return null;
        } catch (error) {
          console.error(`Error fetching rating for product ${productId}:`, error);
          return null;
        }
      });
      
      // Fetch existing comments for all products
      const commentsPromises = Array.from(productIds).map(async (productId) => {
        try {
          const response = await fetch(`${API_URL}/api/comments/?product=${productId}&user=${userId}`);
          if (response.ok) {
            const data = await response.json();
            if (data && data.length > 0) {
              return { productId, comment: data[0].text };
            }
          }
          return null;
        } catch (error) {
          console.error(`Error fetching comment for product ${productId}:`, error);
          return null;
        }
      });
      
      // Process all responses
      const ratingsResults = await Promise.all(ratingsPromises);
      const commentsResults = await Promise.all(commentsPromises);
      
      // Update state with existing ratings and comments
      const newRatings = {};
      const newComments = {};
      
      ratingsResults.forEach(result => {
        if (result) {
          newRatings[result.productId] = result.rating;
        }
      });
      
      commentsResults.forEach(result => {
        if (result) {
          newComments[result.productId] = result.comment;
        }
      });
      
      setExistingRatings(newRatings);
      setExistingComments(newComments);
      
      // Pre-populate ratings and reviews state with existing data
      const initialRatings = {};
      const initialReviews = {};
      
      orders.forEach(order => {
        if (order.items && Array.isArray(order.items)) {
          order.items.forEach(item => {
            const productId = item.product?.id || 
              (typeof item.product === 'number' ? item.product : null);
            
            if (productId) {
              const key = `${order.id}-${productId}`;
              if (newRatings[productId]) {
                initialRatings[key] = newRatings[productId];
              }
              if (newComments[productId]) {
                initialReviews[key] = newComments[productId];
              }
            }
          });
        }
      });
      
      setRatings(initialRatings);
      setReviews(initialReviews);
      
    } catch (error) {
      console.error("Error fetching existing feedback:", error);
    }
  };

  const fetchDebugInfo = async (userId) => {
    try {
      const response = await fetch(`/api/orders/debug?userId=${userId}`);
      if (response.ok) {
        const data = await response.json();
        setDebugInfo(data);
        console.log("Debug info:", data);
      }
    } catch (error) {
      console.error("Error fetching debug info:", error);
    }
  };

  const fetchOrders = async (userId) => {
    try {
      console.log(`Fetching orders for user ID: ${userId}`);
      
      // Use the new API endpoint with userId as query parameter
      const response = await fetch(`/api/orders/history?userId=${userId}`);
      console.log("Order history API response status:", response.status);
      
      const data = await response.json();
      console.log("Order history API response data:", JSON.stringify(data, null, 2));
      
      // Make sure data is an array before setting it
      if (Array.isArray(data)) {
        console.log(`Setting ${data.length} orders`);
        setOrders(data);
      } else if (data && Array.isArray(data.orders)) { 
        // Some APIs wrap the orders in an object
        console.log(`Setting ${data.orders.length} orders from data.orders`);
        setOrders(data.orders);
      } else {
        console.error('Unexpected response format:', data);
        setError(`Could not load orders: Unexpected data format`);
        setOrders([]);
      }
    } catch (error) {
      console.error('Error fetching orders:', error);
      setError(`Could not load orders: ${error.message}`);
      setOrders([]);
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'processing':
        return 'text-yellow-500';
      case 'in_transit':
        return 'text-blue-500';
      case 'delivered':
        return 'text-green-500';
      case 'cancelled':
        return 'text-red-500';
      case 'refunded':
        return 'text-purple-500';
      default:
        return 'text-gray-500';
    }
  };

  const isDelivered = (status) => {
    return status === 'delivered';
  };

  const handleRatingChange = (productId, orderId, rating) => {
    setRatings({
      ...ratings,
      [`${orderId}-${productId}`]: rating
    });
  };

  const handleReviewChange = (productId, orderId, review) => {
    setReviews({
      ...reviews,
      [`${orderId}-${productId}`]: review
    });
  };

  const handleSubmit = async (productId, orderId) => {
    const key = `${orderId}-${productId}`;
    const rating = ratings[key];
    const review = reviews[key];
    
    if (!rating && !review) {
      return; // Don't submit if both are empty
    }
    
    setSubmitting({...submitting, [key]: true});
    
    try {
      // Submit rating if provided
      if (rating) {
        try {
          console.log('Submitting rating with data:', {
            product_id: productId,
            user_id: userId,
            rating_value: rating // Debug log
          });
          
          const ratingResponse = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/ratings/`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              product_id: productId,
              user_id: userId,
              rating: rating  // Changed from 'rating' to 'rating_value' to match backend
            }),
          });
          
          if (!ratingResponse.ok) {
            const errorData = await ratingResponse.json();
            console.error('Rating API error:', errorData);
            throw new Error(errorData.error || 'Failed to submit rating');
          }
          
          console.log('Rating submitted successfully');
        } catch (ratingError) {
          console.error('Rating submission error:', ratingError);
          throw new Error(`Rating error: ${ratingError.message}`);
        }
      }
      
      // Submit review if provided
      if (review && review.trim()) {
        try {
          console.log('Submitting comment with data:', {
            product_id: productId,
            user_id: userId,
            comment_text: review // Debug log
          });
          
          const reviewResponse = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/comments/`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              product_id: productId,
              user_id: userId,
              comment_text: review
            }),
          });
          
          if (!reviewResponse.ok) {
            const errorData = await reviewResponse.json();
            console.error('Comment API error:', errorData);
            throw new Error(errorData.error || 'Failed to submit review');
          }
          
          console.log('Comment submitted successfully');
        } catch (reviewError) {
          console.error('Review submission error:', reviewError);
          throw new Error(`Review error: ${reviewError.message}`);
        }
      }
      
      // Clear form after successful submission
      if (rating) {
        const updatedRatings = {...ratings};
        delete updatedRatings[key];
        setRatings(updatedRatings);
      }
      
      if (review) {
        const updatedReviews = {...reviews};
        delete updatedReviews[key];
        setReviews(updatedReviews);
      }
      
      alert('Thank you for your feedback!');
    } catch (error) {
      console.error('Error submitting review/rating:', error);
      alert(error.message || 'Failed to submit feedback. Please try again.');
    } finally {
      setSubmitting({...submitting, [key]: false});
    }
  };

  const handleDownloadInvoice = async (orderId) => {
    try {
      const API_URL = process.env.NEXT_PUBLIC_API_URL;
      const user = JSON.parse(localStorage.getItem("user") || "{}");
      
      if (!user || !user.id) {
        throw new Error("User ID not found. Please log in again.");
      }

      const response = await fetch(`${API_URL}/api/orders/${orderId}/invoice/?user=${user.id}`, {
        credentials: 'include',
      });
      
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || error.message || 'Failed to download invoice');
      }
      
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.style.display = 'none';
      a.href = url;
      a.download = `invoice-order-${orderId}.pdf`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Error downloading invoice:', error);
      alert('Failed to download invoice. Please try again later.');
    }
  };

  // Star rating component
  const StarRating = ({ productId, orderId }) => {
    const key = `${orderId}-${productId}`;
    const rating = ratings[key] || 0;
    const hasExistingRating = existingRatings[productId];
    
    return (
      <div className="flex items-center">
        {[1, 2, 3, 4, 5].map((star) => (
          <button
            key={star}
            type="button"
            onClick={() => handleRatingChange(productId, orderId, star)}
            className="focus:outline-none"
          >
            <svg 
              className={`w-5 h-5 ${star <= rating ? 'text-yellow-400' : 'text-gray-300'}`}
              fill="currentColor" 
              viewBox="0 0 20 20"
            >
              <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
            </svg>
          </button>
        ))}
        {hasExistingRating && (
          <span className="ml-2 text-sm text-green-600">✓ Previously rated</span>
        )}
      </div>
    );
  };

  if (loading) {
    return <div className="container mx-auto p-4">Loading order history...</div>;
  }

  if (!isLoggedIn) {
    return (
      <div className="container mx-auto p-4">
        <p>Please <Link href="/login" className="text-blue-500">login</Link> to view your order history.</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container mx-auto p-4">
        <div className="bg-red-50 border-l-4 border-red-500 p-4 mb-4">
          <p className="text-red-700">{error}</p>
        </div>
        <p>Please try again later or contact support if the problem persists.</p>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-2xl font-bold mb-6">Order History</h1>
      
      {!orders || orders.length === 0 ? (
        <p>You have no orders yet.</p>
      ) : (
        <div className="space-y-6">
          {orders.map((order) => (
            <div key={order.id} className="border rounded-lg p-4">
              <div className="flex justify-between items-start mb-4">
                <div>
                  <h2 className="text-xl font-semibold">Order #{order.id}</h2>
                  <p className="text-gray-500">
                    Ordered on {new Date(order.created_at).toLocaleDateString()}
                  </p>
                </div>
                <div className={`font-semibold ${getStatusColor(order.status)}`}>
                  {order.status.replace('_', ' ').toUpperCase()}
                </div>
              </div>
              
              <div className="mb-4">
                <h3 className="font-semibold mb-2">Items:</h3>
                {!order.items || !Array.isArray(order.items) || order.items.length === 0 ? (
                  <p className="text-gray-500">No items found</p>
                ) : (
                  <ul className="space-y-2">
                    {order.items.map((item, index) => (
                      <li key={item.id || index} className="flex justify-between">
                        <span>
                          {/* Handle the nested product object structure based on the OrderItemSerializer */}
                          {item.product && typeof item.product === 'object' ? 
                            (item.product.title || 'Product') : 
                            `Product #${item.product || index}`
                          } x {item.quantity}
                        </span>
                        <span>${((parseFloat(item.price_at_purchase) || 0) * item.quantity).toFixed(2)}</span>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
              
              <div className="flex justify-between items-start border-t pt-4">
                <div>
                  <p className="text-gray-500">Total Amount:</p>
                  <p className="font-semibold">${parseFloat(order.total_price).toFixed(2)}</p>
                </div>
                <button
                  onClick={() => handleDownloadInvoice(order.id)}
                  className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-colors"
                >
                  Download Invoice
                </button>
              </div>
              
              {/* Review and Rating Section - only for delivered orders */}
              {isDelivered(order.status) && order.items && Array.isArray(order.items) && (
                <div className="mt-4 border-t pt-4">
                  <h3 className="font-semibold mb-3">Review Your Purchase</h3>
                  <div className="space-y-4">
                    {order.items.map((item, index) => {
                      const productId = item.product?.id || 
                        (typeof item.product === 'number' ? item.product : null);
                        
                      if (!productId) return null;
                      
                      const key = `${order.id}-${productId}`;
                      const hasExistingComment = existingComments[productId];
                      
                      return (
                        <div key={`review-${item.id || index}`} className="bg-gray-50 p-3 rounded-lg">
                          <h4 className="font-medium mb-2">
                            {item.product?.title || `Product #${productId}`}
                          </h4>
                          
                          <div className="mb-2">
                            <label className="block text-sm text-gray-600 mb-1">Rating:</label>
                            <StarRating productId={productId} orderId={order.id} />
                          </div>
                          
                          <div className="mb-3">
                            <label className="block text-sm text-gray-600 mb-1">Review:</label>
                            <textarea
                              value={reviews[key] || ''}
                              onChange={(e) => handleReviewChange(productId, order.id, e.target.value)}
                              className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                              rows="2"
                              placeholder="Write your review here..."
                            ></textarea>
                            {hasExistingComment && (
                              <p className="text-sm text-green-600 mt-1">✓ You&apos;ve already submitted a review for this product</p>
                            )}
                          </div>
                          
                          <button
                            type="button"
                            onClick={() => handleSubmit(productId, order.id)}
                            disabled={submitting[key] || (!ratings[key] && !reviews[key])}
                            className={`px-4 py-2 text-sm font-medium rounded-md text-white 
                              ${(!ratings[key] && !reviews[key]) ? 'bg-gray-300 cursor-not-allowed' : 
                              submitting[key] ? 'bg-blue-400' : 'bg-blue-600 hover:bg-blue-700'} 
                              focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500`}
                          >
                            {submitting[key] ? 'Submitting...' : (
                              (existingRatings[productId] || existingComments[productId]) ? 
                              'Update Feedback' : 'Submit Feedback'
                            )}
                          </button>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
      
      {/* Add debug information section if needed */}
      {debugInfo && (
        <div className="mt-8 p-4 bg-gray-50 rounded-lg">
          <h3 className="text-lg font-semibold mb-2">Debug Information</h3>
          <div className="overflow-x-auto">
            <pre className="text-xs">{JSON.stringify(debugInfo, null, 2)}</pre>
          </div>
        </div>
      )}
    </div>
  );
}
