"use client";
import { useState } from "react";

export default function StockManagerPage() {
  const [products, setProducts] = useState([
    { id: 1, name: "Laptop", stock: 5 },
    { id: 2, name: "Phone", stock: 10 }
  ]);

  const updateStock = (id, newStock) => {
    setProducts(products.map(p => p.id === id ? { ...p, stock: newStock } : p));
  };

  return (
    <div style={{ padding: 24 }}>
      <h2>Stock Management</h2>
      {products.map(p => (
        <div key={p.id}>
          {p.name} – Stock:
          <input
            type="number"
            value={p.stock}
            onChange={(e) => updateStock(p.id, parseInt(e.target.value))}
            style={{ marginLeft: 8 }}
          />
        </div>
      ))}
    </div>
  );
}
