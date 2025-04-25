'use client';

import { useState, useEffect } from "react";
import { ShoppingCart, Check, AlertTriangle } from "lucide-react";

export default function AddToCartButton({ product, disabled }) {
  const [buttonState, setButtonState] = useState('idle'); // idle, adding, added, error
  const [quantity, setQuantity] = useState(0);

  // Check if product exists in cart and update quantity on mount
  useEffect(() => {
    if (typeof window !== "undefined") {
      try {
        const cart = JSON.parse(localStorage.getItem("cart") || "[]");
        const existingItem = cart.find(item => item.id === product.id);
        if (existingItem) {
          setQuantity(existingItem.quantity || 0);
        }
      } catch (error) {
        console.error("Error reading cart:", error);
      }
    }
  }, [product.id]);

  const handleAddToCart = () => {
    // Check if we're in the browser environment
    if (typeof window === "undefined") return;
    
    // Prevent adding if out of stock or button disabled
    if (disabled || product.stock === 0) return;

    setButtonState('adding');
    
    try {
      // Retrieve the current cart from localStorage or initialize an empty array
      const storedCart = window.localStorage.getItem("cart");
      let cart = storedCart ? JSON.parse(storedCart) : [];

      // Check if the product already exists in the cart
      const productIndex = cart.findIndex((item) => item.id === product.id);
      if (productIndex !== -1) {
        // Increase quantity if already in cart
        cart[productIndex].quantity += 1;
        setQuantity(cart[productIndex].quantity);
      } else {
        // Add product with initial quantity of 1
        cart.push({ ...product, quantity: 1 });
        setQuantity(1);
      }

      // Save the updated cart back to localStorage
      window.localStorage.setItem("cart", JSON.stringify(cart));
      
      // Update state to show success, then revert after delay
      setButtonState('added');
      setTimeout(() => setButtonState('idle'), 2000);
    } catch (error) {
      console.error("Error saving to cart:", error);
      setButtonState('error');
      setTimeout(() => setButtonState('idle'), 2000);
    }
  };

  // Determine button appearance based on state
  const buttonStyles = {
    idle: disabled 
      ? "bg-gray-200 text-gray-500 cursor-not-allowed" 
      : "bg-primary text-white hover:bg-blue-600 active:bg-blue-700",
    adding: "bg-primary text-white",
    added: "bg-green-600 text-white",
    error: "bg-red-600 text-white"
  };

  const buttonContent = {
    idle: (
      <>
        {disabled ? (
          <>
            <AlertTriangle className="w-5 h-5 mr-2" />
            <span>Out of Stock</span>
          </>
        ) : (
          <>
            <ShoppingCart className="w-5 h-5 mr-2" />
            <span>{quantity > 0 ? `Add More (${quantity})` : "Add to Cart"}</span>
          </>
        )}
      </>
    ),
    adding: (
      <>
        <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
        </svg>
        <span>Adding...</span>
      </>
    ),
    added: (
      <>
        <Check className="w-5 h-5 mr-2" />
        <span>Added to Cart!</span>
      </>
    ),
    error: (
      <>
        <AlertTriangle className="w-5 h-5 mr-2" />
        <span>Failed to Add</span>
      </>
    )
  };

  return (
    <button
      onClick={handleAddToCart}
      disabled={disabled || buttonState === 'adding'}
      className={`flex items-center justify-center py-2.5 px-4 font-medium rounded-lg transition-colors duration-200 ${buttonStyles[buttonState]}`}
      aria-label={disabled ? "Out of Stock" : "Add to Cart"}
    >
      {buttonContent[buttonState]}
    </button>
  );
}
