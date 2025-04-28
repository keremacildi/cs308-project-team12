"use client";
import { useState } from "react";

export default function DiscountManagerPage() {
  const [products, setProducts] = useState([
    { id: 1, name: "Camera", discount: 0 },
    { id: 2, name: "Smartwatch", discount: 0 }
  ]);

  const updateDiscount = (id, discount) => {
    setProducts(products.map(p => p.id === id ? { ...p, discount } : p));
  };

  return (
    <div style={{ padding: 24 }}>
      <h2>Discount Management</h2>
      {products.map(p => (
        <div key={p.id}>
          {p.name} – Discount: {p.discount}%
          <input
            type="number"
            min={0}
            max={100}
            placeholder="Set discount %"
            onChange={(e) => updateDiscount(p.id, parseInt(e.target.value))}
            style={{ marginLeft: 8 }}
          />
        </div>
      ))}
    </div>
  );
}
