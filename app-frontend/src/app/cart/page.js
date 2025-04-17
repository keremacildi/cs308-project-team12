"use client";
import React, { useState, useEffect } from "react";
import Link from "next/link";
import CartItem from "./cartItem";
import styles from "../../styles/cart.module.css";

export default function CartPage() {
    const [cart, setCart] = useState([]);
    const [loading, setLoading] = useState(true);

    // Load cart from localStorage
    useEffect(() => {
        const storedCart = JSON.parse(localStorage.getItem("cart")) || [];
        setCart(storedCart);
        setLoading(false);
    }, []);

    // Update quantity function
    const updateQuantity = (id, newQuantity) => {
        const updatedCart = cart.map((item) => {
            if (item.id === id) {
                const quantity = Math.min(Math.max(newQuantity, 1), item.stock); // Limit between 1 and available stock
                return { ...item, quantity };
            }
            return item;
        });
        setCart(updatedCart);
        localStorage.setItem("cart", JSON.stringify(updatedCart));
    };

    // Remove item function
    const removeItem = (id) => {
        const updatedCart = cart.filter((item) => item.id !== id);
        setCart(updatedCart);
        localStorage.setItem("cart", JSON.stringify(updatedCart));
    };

    // Clear cart function
    const clearCart = () => {
        setCart([]);
        localStorage.removeItem("cart");
    };

    // Total price calculation
    const totalPrice = cart.reduce(
        (sum, item) => sum + item.price * item.quantity,
        0
    );

    if (loading) {
        return <div className={styles.cartContainer}>Loading...</div>;
    }

    if (cart.length === 0) {
        return (
            <div className={styles.cartContainer}>
                <h1 className={styles.title}>Your Cart</h1>
                <p className={styles.emptyMessage}>Your cart is empty.</p>
                <Link href="/" className={styles.backLink}>
                    Continue Shopping
                </Link>
            </div>
        );
    }

    return (
        <div className={styles.cartContainer}>
            <h1 className={styles.title}>Your Cart</h1>
            <div className={styles.cartItems}>
                {cart.map((item) => (
                    <CartItem
                        key={item.id}
                        item={item}
                        updateQuantity={updateQuantity}
                        removeItem={removeItem}
                    />
                ))}
            </div>
            <div className={styles.summary}>
                {/* List each item with its price for addition */}
                <div className={styles.itemSummary}>
                    {cart.map((item) => (
                        <div key={item.id} className={styles.itemLine}>
                            <span>{item.title}</span>
                            <span>${(item.price * item.quantity).toFixed(2)}</span>
                        </div>
                    ))}
                </div>
                <h2>Total: ${totalPrice.toFixed(2)}</h2>
                <button className={styles.clearButton} onClick={clearCart}>
                    Clear Cart
                </button>
                <Link href="/checkout" className={styles.checkoutButton}>
                    Proceed to Checkout
                </Link>
            </div>
        </div>
    );
}
