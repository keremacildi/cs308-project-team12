"use client";
import { useState } from "react";

export default function CategoryManagerPage() {
  const [categories, setCategories] = useState([]);
  const [newCategory, setNewCategory] = useState("");

  const handleAdd = () => {
    if (newCategory) {
      setCategories([...categories, newCategory]);
      setNewCategory("");
    }
  };

  const handleDelete = (name) => {
    setCategories(categories.filter(c => c !== name));
  };

  return (
    <div style={{ padding: 24 }}>
      <h2>Category Management</h2>
      <input value={newCategory} onChange={(e) => setNewCategory(e.target.value)} placeholder="New Category" />
      <button onClick={handleAdd}>Add</button>

      <ul>
        {categories.map((cat, idx) => (
          <li key={idx}>
            {cat}
            <button onClick={() => handleDelete(cat)}>Remove</button>
          </li>
        ))}
      </ul>
    </div>
  );
}
