'use client';

import { useState } from "react";

export default function AddToCartButton({ product }) {
  const [added, setAdded] = useState(false);

  const handleAddToCart = () => {
    // Check if we're in the browser environment
    if (typeof window === "undefined") {
      console.log("zort");
      return;}
    
    // Prevent adding if out of stock
    if (product.stock === 0) return;

    try {
      // Retrieve the current cart from localStorage or initialize an empty array
      const storedCart = window.localStorage.getItem("cart");
      let cart = storedCart ? JSON.parse(storedCart) : [];

      // Check if the product already exists in the cart
      const productIndex = cart.findIndex((item) => item.id === product.id);
      if (productIndex !== -1) {
        // Increase quantity if already in cart
        cart[productIndex].quantity += 1;
      } else {
        // Add product with initial quantity of 1
        cart.push({ ...product, quantity: 1 });
      }

      // Save the updated cart back to localStorage
      window.localStorage.setItem("cart", JSON.stringify(cart));
      console.log("Cart updated:", cart);

      // Update state to reflect the product was added, then revert after 2 seconds
      setAdded(true);
      setTimeout(() => setAdded(false), 2000);
    } catch (error) {
      console.error("Error saving to cart:", error);
    }
  };

  // Determine if the product is out of stock
  const isOutOfStock = product.stock === 0;

  return (
    <button
      onClick={handleAddToCart}
      disabled={isOutOfStock}
      style={{
        fontSize: "18px",
        padding: "15px 30px",
        color: "white",
        border: "none",
        borderRadius: "5px",
        backgroundColor: isOutOfStock ? "#ccc" : "#0070f3",
        cursor: isOutOfStock ? "not-allowed" : "pointer",
      }}
    >
      {isOutOfStock ? "Out of Stock" : (added ? "Added!" : "Add to Cart")}
    </button>
  );
}
