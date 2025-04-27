'use client';

import { useState, useEffect } from "react";
import { ShoppingCart, Check, AlertTriangle } from "lucide-react";

export default function AddToCartButton({ product, disabled }) {
  const [buttonState, setButtonState] = useState('idle'); // idle, adding, added, error
  const [quantity, setQuantity] = useState(0);
  const [isMounted, setIsMounted] = useState(false);

  // Stock can be in different fields depending on backend response
  const stockAmount = product.quantity_in_stock || product.stock || 0;
  const isOutOfStock = stockAmount <= 0;

  // Set mounted state on client side
  useEffect(() => {
    setIsMounted(true);
  }, []);

  // Check if product exists in cart and update quantity on mount
  useEffect(() => {
    if (isMounted) {
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
  }, [product.id, isMounted]);

  const handleAddToCart = () => {
    // Check if we're in the browser environment
    if (!isMounted) return;
    
    // Prevent adding if out of stock or button disabled
    if (disabled || isOutOfStock) {
      setButtonState('error');
      setTimeout(() => setButtonState('idle'), 2000);
      return;
    }

    setButtonState('adding');
    
    try {
      // Retrieve the current cart from localStorage or initialize an empty array
      const storedCart = window.localStorage.getItem("cart");
      let cart = storedCart ? JSON.parse(storedCart) : [];

      // Check if the product already exists in the cart
      const productIndex = cart.findIndex((item) => item.id === product.id);
      
      if (productIndex !== -1) {
        // Check if adding one more would exceed stock
        const currentQuantity = cart[productIndex].quantity;
        
        if (currentQuantity >= stockAmount) {
          // Can't add more than available stock
          setButtonState('error');
          setTimeout(() => {
            setButtonState('idle');
          }, 2000);
          return;
        }
        
        // Increase quantity if already in cart
        cart[productIndex].quantity += 1;
        // Make sure stock info is up to date
        cart[productIndex].stock = stockAmount;
        cart[productIndex].quantity_in_stock = stockAmount;
        setQuantity(cart[productIndex].quantity);
      } else {
        // Add product with initial quantity of 1
        cart.push({ 
          ...product, 
          quantity: 1,
          // Ensure stock info is included and consistent
          stock: stockAmount,
          quantity_in_stock: stockAmount
        });
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

  // Check if current cart quantity is at stock limit
  const isAtStockLimit = quantity >= stockAmount;

  // Determine button appearance based on state
  const buttonStyles = {
    idle: (disabled || isOutOfStock || isAtStockLimit)
      ? "bg-gray-200 text-gray-500 cursor-not-allowed" 
      : "bg-primary text-white hover:bg-blue-600 active:bg-blue-700",
    adding: "bg-primary text-white",
    added: "bg-green-600 text-white",
    error: "bg-red-600 text-white"
  };

  const buttonContent = {
    idle: (
      <>
        {isOutOfStock ? (
          <>
            <AlertTriangle className="w-5 h-5 mr-2" />
            <span>Out of Stock</span>
          </>
        ) : isAtStockLimit ? (
          <>
            <AlertTriangle className="w-5 h-5 mr-2" />
            <span>Stock Limit Reached</span>
          </>
        ) : (
          <>
            <ShoppingCart className="w-5 h-5 mr-2" />
            <span>{quantity > 0 ? `Add More (${quantity}/${stockAmount})` : "Add to Cart"}</span>
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
        <span>{isAtStockLimit ? "Stock Limit Reached" : "Failed to Add"}</span>
      </>
    )
  };

  return (
    <button
      onClick={handleAddToCart}
      disabled={disabled || buttonState === 'adding' || isOutOfStock || isAtStockLimit}
      className={`flex items-center justify-center py-2.5 px-4 font-medium rounded-lg transition-colors duration-200 ${buttonStyles[buttonState]}`}
      aria-label={isOutOfStock ? "Out of Stock" : isAtStockLimit ? "Stock Limit Reached" : "Add to Cart"}
    >
      {buttonContent[buttonState]}
    </button>
  );
}
