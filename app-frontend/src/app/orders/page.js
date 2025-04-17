"use client";
import React, { useState, useEffect } from "react";
import Link from "next/link";
import { mockOrders } from "../data/mock_data/orders";
import { mockProducts } from "../data/mock_data/products";

// Destructure the product array from mockProducts
const productsArray = mockProducts.product;

const OrderDetails = ({ order }) => {
  return (
    <div className="mt-4 p-4 bg-gray-500 rounded-lg">
      <h4 className="text-xl font-semibold mb-4">Order Details</h4>
      <div className="space-y-4">
        {order.items.map((item) => {
          // Correctly using productsArray.find
          const product = productsArray.find((p) => p.id === item.productId);
          return (
            <div
              key={item.productId}
              className="flex flex-col md:flex-row items-center justify-between border-b pb-2"
            >
              <div className="flex items-center space-x-4 w-full md:w-auto">
                {product && (
                  <img
                    src={product.image}
                    alt={product.title}
                    className="w-12 h-12 object-cover rounded"
                  />
                )}
                <div>
                  <p className="font-medium">
                    {product ? product.title : item.title}
                  </p>
                  <p className="text-sm text-gray-600">
                    Price: ${item.price.toFixed(2)}
                  </p>
                </div>
              </div>
              <div className="w-full md:w-auto text-right mt-2 md:mt-0">
                <p className="text-sm">Quantity: {item.quantity}</p>
                <p className="font-semibold">
                  Subtotal: ${(item.price * item.quantity).toFixed(2)}
                </p>
              </div>
              <div className="w-full md:w-auto mt-2 md:mt-0">
                {order.status === "Delivered" ? (
                  <Link
                    href={`/review/${item.productId}`}
                  >
                    <button className="bg-blue-500 hover:bg-blue-600 text-white px-3 py-1 rounded transition duration-200">
                      Review
                    </button>
                  </Link>
                ) : (
                  <button
                    className="bg-gray-400 text-white px-3 py-1 rounded cursor-not-allowed"
                    disabled
                  >
                    Review
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

const OrderCard = ({ order, isExpanded, toggleOrder }) => {
  return (
    <div className="border border-gray-200 rounded-lg shadow-md p-4 mb-6">
      <div
        className="flex flex-col md:flex-row justify-between items-center cursor-pointer"
        onClick={() => toggleOrder(order.id)}
      >
        <div className="flex flex-col space-y-1">
          <span className="text-lg font-bold">Order #{order.id}</span>
          <span className="text-sm text-gray-600">
            Date: {new Date(order.date).toLocaleDateString()}
          </span>
          <span className="text-sm text-gray-600">
            Customer: {order.customerName}
          </span>
          <span className="text-sm font-semibold">
            Total: ${order.total.toFixed(2)}
          </span>
          <span
            className={`inline-block mt-1 px-2 py-1 rounded-full text-xs font-semibold ${
              order.status === "Delivered"
                ? "bg-green-100 text-green-800"
                : order.status === "Processing"
                ? "bg-yellow-100 text-yellow-800"
                : order.status === "Shipped"
                ? "bg-blue-100 text-blue-800"
                : "bg-red-100 text-red-800"
            }`}
          >
            {order.status}
          </span>
        </div>
        <div className="flex space-x-2 mt-4 md:mt-0">
          {order.items.map((item) => {
            const product = productsArray.find((p) => p.id === item.productId);
            return (
              product && (
                <img
                  key={item.productId}
                  src={product.image}
                  alt={product.title}
                  className="w-16 h-16 object-cover rounded"
                />
              )
            );
          })}
        </div>
      </div>
      <div className="flex justify-end mt-2">
        <button
          onClick={(e) => {
            e.stopPropagation();
            toggleOrder(order.id);
          }}
          className="text-blue-600 hover:text-blue-800 focus:outline-none transition duration-200"
        >
          {isExpanded ? "Hide Details" : "Show Details"}
        </button>
      </div>
      {isExpanded && <OrderDetails order={order} />}
    </div>
  );
};

export default function OrdersPage() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [expandedOrders, setExpandedOrders] = useState({});

  const toggleOrder = (orderId) => {
    setExpandedOrders((prev) => ({
      ...prev,
      [orderId]: !prev[orderId],
    }));
  };

  useEffect(() => {
    // Simulate fetching orders with a delay
    setTimeout(() => {
      try {
        setOrders(mockOrders);
      } catch (err) {
        setError("Error loading orders. Please try again later.");
      } finally {
        setLoading(false);
      }
    }, 500);
  }, []);

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <p className="text-xl text-gray-600">Loading orders...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <p className="text-red-600 text-xl">{error}</p>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6">
      <h1 className="text-4xl font-bold mb-8 text-center">Orders</h1>
      {orders.length > 0 ? (
        orders.map((order) => (
          <OrderCard
            key={order.id}
            order={order}
            isExpanded={expandedOrders[order.id]}
            toggleOrder={toggleOrder}
          />
        ))
      ) : (
        <p className="text-gray-600">No orders found.</p>
      )}
    </div>
  );
}
