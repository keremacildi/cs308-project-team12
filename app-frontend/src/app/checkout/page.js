"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import styles from "../../styles/checkout.module.css";

export default function CheckoutPage() {
    const router = useRouter();
    const [cart, setCart] = useState([]);
    const [loading, setLoading] = useState(true);
    const [isLoggedIn, setIsLoggedIn] = useState(false);
    const [orderComplete, setOrderComplete] = useState(false);
    const [invoice, setInvoice] = useState(null);

    useEffect(() => {
        // Check if user is logged in
        const user = localStorage.getItem("user");
        setIsLoggedIn(!!user);

        // Load cart from localStorage
        const storedCart = JSON.parse(localStorage.getItem("cart")) || [];
        setCart(storedCart);
        setLoading(false);
    }, []);

    const handleCheckout = async (e) => {
        e.preventDefault();
        
        try {
            // Create order
            const response = await fetch("/api/orders", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    items: cart,
                    total: cart.reduce((sum, item) => sum + item.price * item.quantity, 0),
                }),
            });

            if (response.ok) {
                const data = await response.json();
                setInvoice(data.invoice);
                setOrderComplete(true);
                
                // Clear cart after successful order
                localStorage.removeItem("cart");
                setCart([]);
            } else {
                throw new Error("Failed to create order");
            }
        } catch (error) {
            console.error("Checkout error:", error);
            alert("Failed to process order. Please try again.");
        }
    };

    if (loading) {
        return <div className={styles.container}>Loading...</div>;
    }

    if (!isLoggedIn) {
        return (
            <div className={styles.container}>
                <h1>Checkout</h1>
                <p>Please <Link href="/login">login</Link> to complete your purchase.</p>
            </div>
        );
    }

    if (cart.length === 0 && !orderComplete) {
        return (
            <div className={styles.container}>
                <h1>Checkout</h1>
                <p>Your cart is empty.</p>
                <Link href="/products" className={styles.backLink}>
                    Continue Shopping
                </Link>
            </div>
        );
    }

    if (orderComplete && invoice) {
        return (
            <div className={styles.container}>
                <h1>Order Complete!</h1>
                <div className={styles.invoice}>
                    <h2>Invoice</h2>
                    <p>Order Number: {invoice.orderNumber}</p>
                    <p>Date: {new Date(invoice.date).toLocaleDateString()}</p>
                    <div className={styles.items}>
                        {invoice.items.map((item) => (
                            <div key={item.id} className={styles.item}>
                                <span>{item.title}</span>
                                <span>${(item.price * item.quantity).toFixed(2)}</span>
                            </div>
                        ))}
                    </div>
                    <div className={styles.total}>
                        <span>Total:</span>
                        <span>${invoice.total.toFixed(2)}</span>
                    </div>
                </div>
                <p>A copy of your invoice has been sent to your email.</p>
                <Link href="/" className={styles.backLink}>
                    Return to Home
                </Link>
            </div>
        );
    }

    return (
        <div className={styles.container}>
            <h1>Checkout</h1>
            <div className={styles.cartSummary}>
                <h2>Order Summary</h2>
                {cart.map((item) => (
                    <div key={item.id} className={styles.item}>
                        <span>{item.title} x {item.quantity}</span>
                        <span>${(item.price * item.quantity).toFixed(2)}</span>
                    </div>
                ))}
                <div className={styles.total}>
                    <span>Total:</span>
                    <span>${cart.reduce((sum, item) => sum + item.price * item.quantity, 0).toFixed(2)}</span>
                </div>
            </div>
            <form onSubmit={handleCheckout} className={styles.checkoutForm}>
                <button type="submit" className={styles.submitButton}>
                    Complete Purchase
                </button>
            </form>
        </div>
    );
} 