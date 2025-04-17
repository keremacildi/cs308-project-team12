"use client";
import { useState } from "react";

export default function ProductListPage() {
  const [products, setProducts] = useState([]);
  const [form, setForm] = useState({ name: "", stock: 0, price: 0 });

  const handleAddProduct = () => {
    const newProduct = { ...form, id: Date.now() };
    setProducts([...products, newProduct]);
    setForm({ name: "", stock: 0, price: 0 });
  };

  const handleDelete = (id) => {
    setProducts(products.filter((p) => p.id !== id));
  };

  return (
    <div style={{ padding: 24 }}>
      <h2>Product Management</h2>
      <input placeholder="Product Name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
      <input placeholder="Stock" type="number" value={form.stock} onChange={(e) => setForm({ ...form, stock: parseInt(e.target.value) })} />
      <input placeholder="Price" type="number" value={form.price} onChange={(e) => setForm({ ...form, price: parseFloat(e.target.value) })} />
      <button onClick={handleAddProduct}>Add Product</button>

      <ul>
        {products.map((p) => (
          <li key={p.id}>
            {p.name} – {p.stock} units – ${p.price}
            <button onClick={() => handleDelete(p.id)}>Delete</button>
          </li>
        ))}
      </ul>
    </div>
  );
}
