"use client";
import React, { useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import Link from 'next/link';

export default function OrderHistory() {
  const { data: session } = useSession();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchOrders = async () => {
      if (session?.user) {
        try {
          const response = await fetch('/api/orders/history');
          const data = await response.json();
          setOrders(data);
        } catch (error) {
          console.error('Error fetching orders:', error);
        } finally {
          setLoading(false);
        }
      }
    };

    fetchOrders();
  }, [session]);

  const getStatusColor = (status) => {
    switch (status) {
      case 'processing':
        return 'text-yellow-500';
      case 'in_transit':
        return 'text-blue-500';
      case 'delivered':
        return 'text-green-500';
      default:
        return 'text-gray-500';
    }
  };

  if (loading) {
    return <div className="container mx-auto p-4">Loading...</div>;
  }

  if (!session) {
    return (
      <div className="container mx-auto p-4">
        <p>Please <Link href="/login" className="text-blue-500">login</Link> to view your order history.</p>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-2xl font-bold mb-6">Order History</h1>
      {orders.length === 0 ? (
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
                <ul className="space-y-2">
                  {order.items.map((item) => (
                    <li key={item.id} className="flex justify-between">
                      <span>{item.product.name} x {item.quantity}</span>
                      <span>${(item.price_at_purchase * item.quantity).toFixed(2)}</span>
                    </li>
                  ))}
                </ul>
              </div>
              
              <div className="flex justify-between items-center border-t pt-4">
                <div>
                  <p className="text-gray-500">Delivery Address:</p>
                  <p>{order.delivery?.delivery_address || 'Not specified'}</p>
                </div>
                <div className="text-right">
                  <p className="text-gray-500">Total Amount:</p>
                  <p className="font-semibold">${order.total_price.toFixed(2)}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
