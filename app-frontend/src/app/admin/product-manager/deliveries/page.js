"use client";
import { useState } from "react";

export default function DeliveryManagerPage() {
  const [orders, setOrders] = useState([
    { id: 1, customer: "Alice", status: "processing" },
    { id: 2, customer: "Bob", status: "in-transit" }
  ]);

  const nextStatus = {
    processing: "in-transit",
    "in-transit": "delivered",
    delivered: "delivered"
  };

  const updateStatus = (id) => {
    setOrders(orders.map(o => o.id === id ? { ...o, status: nextStatus[o.status] } : o));
  };

  return (
    <div style={{ padding: 24 }}>
      <h2>Delivery Management</h2>
      <ul>
        {orders.map(order => (
          <li key={order.id}>
            Order #{order.id} for {order.customer} – Status: {order.status}
            <button onClick={() => updateStatus(order.id)}>Advance Status</button>
          </li>
        ))}
      </ul>
    </div>
  );
}
