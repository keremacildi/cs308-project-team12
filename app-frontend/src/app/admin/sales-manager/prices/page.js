"use client";
import { useState } from "react";

export default function PriceManagerPage() {
  const [products, setProducts] = useState([
    { id: 1, name: "Tablet", price: null },
    { id: 2, name: "Headphones", price: null }
  ]);

  const updatePrice = (id, price) => {
    setProducts(products.map(p => p.id === id ? { ...p, price } : p));
  };

  return (
    <div style={{ padding: 24 }}>
      <h2>Price Management</h2>
      {products.map(p => (
        <div key={p.id} style={{ marginBottom: 10 }}>
          {p.name} – Current Price: {p.price ? `$${p.price}` : "Not Set"}
          <input
            type="number"
            placeholder="Enter price"
            onChange={(e) => updatePrice(p.id, parseFloat(e.target.value))}
            style={{ marginLeft: 8 }}
          />
        </div>
      ))}
    </div>
  );
}
