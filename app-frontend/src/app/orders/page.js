"use client";
import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import apiClient from '../../utils/apiClient';
import { getImageUrl } from '../../utils/imageUtils';

export default function OrderHistory() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    const checkAuth = () => {
      // Check if user is logged in
      const user = localStorage.getItem("user");
      setIsLoggedIn(!!user);
      return !!user;
    };

    const fetchOrders = async () => {
      if (checkAuth()) {
        try {
          const ordersData = await apiClient.orders.getHistory();
          console.log('Orders data:', ordersData);
          setOrders(ordersData);
        } catch (error) {
          console.error('Error fetching orders:', error);
          setError(error.message || 'Failed to load orders');
        } finally {
          setLoading(false);
        }
      } else {
        setLoading(false);
      }
    };

    fetchOrders();
  }, []);

  const getStatusColor = (status) => {
    switch (status) {
      case 'processing':
        return 'text-yellow-500';
      case 'shipped':
        return 'text-purple-500';
      case 'in_transit':
        return 'text-blue-500';
      case 'delivered':
        return 'text-green-500';
      case 'cancelled':
        return 'text-red-500';
      case 'refunded':
        return 'text-orange-500';
      default:
        return 'text-gray-500';
    }
  };

  const formatStatus = (status) => {
    return status.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="w-12 h-12 border-t-4 border-b-4 border-blue-500 rounded-full animate-spin"></div>
      </div>
    );
  }

  if (!isLoggedIn) {
    return (
      <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-md mx-auto bg-white rounded-xl shadow-md overflow-hidden md:max-w-2xl">
          <div className="p-8">
            <div className="text-center mb-6">
              <svg xmlns="http://www.w3.org/2000/svg" className="mx-auto h-12 w-12 text-yellow-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
              </svg>
              <h2 className="mt-4 text-2xl font-bold text-gray-900">Authentication Required</h2>
              <p className="mt-2 text-gray-600">Please sign in to view your order history</p>
            </div>
            <div className="flex justify-center">
              <Link 
                href="/login"
                className="inline-flex items-center px-6 py-3 border border-transparent rounded-md shadow-sm text-base font-medium text-white bg-blue-600 hover:bg-blue-700 transition-colors"
              >
                Sign In
              </Link>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-md mx-auto bg-white rounded-xl shadow-md overflow-hidden md:max-w-2xl">
          <div className="p-8">
            <div className="text-center mb-6">
              <svg xmlns="http://www.w3.org/2000/svg" className="mx-auto h-12 w-12 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <h2 className="mt-4 text-2xl font-bold text-gray-900">Error Loading Orders</h2>
              <p className="mt-2 text-gray-600">{error}</p>
            </div>
            <div className="flex justify-center">
              <button 
                onClick={() => window.location.reload()}
                className="inline-flex items-center px-6 py-3 border border-transparent rounded-md shadow-sm text-base font-medium text-white bg-blue-600 hover:bg-blue-700 transition-colors"
              >
                Try Again
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-extrabold text-gray-900 text-center mb-10">Order History</h1>
        
        {orders.length === 0 ? (
          <div className="bg-white rounded-lg shadow p-6 text-center">
            <svg xmlns="http://www.w3.org/2000/svg" className="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
            </svg>
            <p className="mt-4 text-lg text-gray-600">You have no orders yet.</p>
            <div className="mt-6">
              <Link href="/products" className="inline-flex items-center px-6 py-3 border border-transparent rounded-md shadow-sm text-base font-medium text-white bg-blue-600 hover:bg-blue-700 transition-colors">
                Start Shopping
              </Link>
            </div>
          </div>
        ) : (
          <div className="space-y-6">
            {orders.map((order) => (
              <div key={order.id} className="bg-white rounded-lg shadow overflow-hidden">
                <div className="px-6 py-4 border-b border-gray-200 bg-gray-50">
                  <div className="flex justify-between items-center">
                    <div>
                      <h2 className="text-xl font-semibold text-gray-900">Order #{order.id}</h2>
                      <p className="text-sm text-gray-500">
                        Placed on {new Date(order.created_at).toLocaleDateString()} at {new Date(order.created_at).toLocaleTimeString()}
                      </p>
                    </div>
                    <div className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(order.status)}`}>
                      {formatStatus(order.status)}
                    </div>
                  </div>
                </div>
                
                <div className="px-6 py-4">
                  <h3 className="text-lg font-medium text-gray-900 mb-3">Items</h3>
                  <div className="divide-y divide-gray-200">
                    {order.items.map((item) => (
                      <div key={item.id} className="py-3 flex justify-between items-center">
                        <div className="flex items-center">
                          {item.product.image && (
                            <div className="flex-shrink-0 h-16 w-16 bg-gray-100 rounded-md overflow-hidden mr-4">
                              <img 
                                src={getImageUrl(item.product.image)} 
                                alt={item.product.title}
                                className="h-full w-full object-cover" 
                              />
                            </div>
                          )}
                          <div>
                            <h4 className="text-sm font-medium text-gray-900">{item.product.title}</h4>
                            <p className="text-sm text-gray-500">Qty: {item.quantity}</p>
                            <p className="text-sm text-gray-500">Price: ${parseFloat(item.price_at_purchase).toFixed(2)}</p>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="text-sm font-medium text-gray-900">
                            ${(parseFloat(item.price_at_purchase) * item.quantity).toFixed(2)}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
                
                <div className="px-6 py-4 bg-gray-50 border-t border-gray-200">
                  <div className="flex justify-between items-center">
                    <div>
                      <p className="text-sm text-gray-500 mb-1">Total Amount:</p>
                      <p className="text-xl font-bold text-gray-900">${parseFloat(order.total_price).toFixed(2)}</p>
                    </div>
                    
                    <div className="flex space-x-2">
                      <button 
                        onClick={() => apiClient.orders.downloadInvoice(order.id)}
                        className="px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 transition-colors flex items-center"
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                        </svg>
                        Invoice
                      </button>
                      
                      {order.status === 'processing' && (
                        <button 
                          onClick={async () => {
                            try {
                              await apiClient.orders.cancel(order.id);
                              // Refresh orders after cancellation
                              const updatedOrders = await apiClient.orders.getHistory();
                              setOrders(updatedOrders);
                            } catch (error) {
                              console.error('Error cancelling order:', error);
                              setError('Failed to cancel order. Please try again.');
                            }
                          }}
                          className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-red-600 hover:bg-red-700 transition-colors"
                        >
                          Cancel Order
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
