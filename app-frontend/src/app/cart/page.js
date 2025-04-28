"use client";
import React, { useState, useEffect } from "react";
import Link from "next/link";
import CartItem from "./CartItem";
import { AlertTriangle } from "lucide-react";

export default function CartPage() {
    const [cart, setCart] = useState([]);
    const [loading, setLoading] = useState(true);
    const [errorMessage, setErrorMessage] = useState(null);

    // Load cart from localStorage
    useEffect(() => {
        const storedCart = JSON.parse(localStorage.getItem("cart")) || [];
        setCart(storedCart);
        setLoading(false);
    }, []);

    // Update quantity function with stock limit validation
    const updateQuantity = (id, newQuantity) => {
        const updatedCart = cart.map((item) => {
            if (item.id === id) {
                // Get the current stock amount (from either field)
                const stockAmount = item.quantity_in_stock || item.stock || 0;
                
                // Ensure quantity is between 1 and available stock
                if (newQuantity > stockAmount) {
                    // Show error message when trying to exceed stock
                    setErrorMessage(`Only ${stockAmount} item(s) available for "${item.title}"`);
                    setTimeout(() => setErrorMessage(null), 3000);
                    newQuantity = stockAmount;
                }
                
                const quantity = Math.max(1, Math.min(newQuantity, stockAmount));
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

    // Total price calculation - ensure we handle non-number price values
    const totalPrice = cart.reduce(
        (sum, item) => sum + (parseFloat(item.price) || 0) * item.quantity,
        0
    );

    if (loading) {
        return (
            <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
                <div className="max-w-7xl mx-auto">
                    <div className="flex justify-center">
                        <div className="w-12 h-12 border-t-4 border-b-4 border-blue-500 rounded-full animate-spin"></div>
                    </div>
                </div>
            </div>
        );
    }

    if (cart.length === 0) {
        return (
            <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
                <div className="max-w-7xl mx-auto">
                    <div className="text-center">
                        <h1 className="text-3xl font-extrabold   text-blue-600 sm:text-4xl mb-6">Your Cart</h1>
                        <div className="mt-12 mb-12">
                            <svg className="mx-auto h-24 w-24 text-gray-400" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1" d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
                            </svg>
                            <p className="mt-4 text-xl text-gray-500">Your cart is empty</p>
                            <p className="mt-2 text-gray-500">Looks like you haven&apos;t added any products to your cart yet.</p>
                        </div>
                        <Link 
                            href="/products" 
                            className="inline-flex items-center px-6 py-3 border border-transparent rounded-md shadow-sm text-base font-medium text-white bg-blue-600 hover:bg-blue-700 transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                        >
                            <svg className="-ml-1 mr-3 h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 7l5 5m0 0l-5 5m5-5H6" />
                            </svg>
                            Browse Products
                        </Link>
                    </div>
                </div>
            </div>
        );
    }

    // Check for out of stock items and items with reduced availability
    const stockIssues = cart.filter(item => {
        const stockAmount = item.quantity_in_stock || item.stock || 0;
        return stockAmount < item.quantity || stockAmount === 0;
    });

    return (
        <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
            <div className="max-w-7xl mx-auto">
                <div className="text-center">
                    <h1 className="text-3xl font-extrabold text-blue-600 sm:text-4xl mb-6">Your Cart</h1>
                    <p className="text-lg text-gray-500 max-w-2xl mx-auto">
                        Review your items before checkout.
                    </p>
                </div>

                {/* Stock Warning Messages */}
                {stockIssues.length > 0 && (
                    <div className="my-4 p-4 bg-amber-50 border border-amber-200 rounded-md">
                        <div className="flex items-center text-amber-800 mb-2">
                            <AlertTriangle className="w-5 h-5 mr-2" />
                            <span className="font-medium">Availability issues:</span>
                        </div>
                        <ul className="list-disc pl-10 text-sm text-amber-700 space-y-1">
                            {stockIssues.map(item => {
                                const stockAmount = item.quantity_in_stock || item.stock || 0;
                                return (
                                    <li key={`warning-${item.id}`}>
                                        {stockAmount === 0 
                                            ? `"${item.title}" is no longer available` 
                                            : `Only ${stockAmount} units of "${item.title}" are available`}
                                    </li>
                                );
                            })}
                        </ul>
                    </div>
                )}

                {/* Error Message */}
                {errorMessage && (
                    <div className="my-4 p-4 bg-red-50 border border-red-200 rounded-md">
                        <div className="flex items-center text-red-800">
                            <AlertTriangle className="w-5 h-5 mr-2" />
                            <span>{errorMessage}</span>
                        </div>
                    </div>
                )}

                <div className="mt-8 lg:grid lg:grid-cols-12 lg:gap-x-12 lg:items-start">
                    <div className="lg:col-span-7">
                        <div className="space-y-4">
                            {cart.map((item) => (
                                <CartItem
                                    key={item.id}
                                    item={item}
                                    updateQuantity={updateQuantity}
                                    removeItem={removeItem}
                                />
                            ))}
                        </div>
                        
                        <div className="mt-8">
                            <button
                                onClick={clearCart}
                                className="flex items-center justify-center text-sm text-red-600 hover:text-red-800 transition-colors"
                            >
                                <svg className="mr-2 h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                </svg>
                                Clear Cart
                            </button>
                        </div>
                    </div>

                    <div className="mt-12 lg:mt-0 lg:col-span-5">
                        <div className="bg-white shadow-lg rounded-lg overflow-hidden">
                            <div className="px-6 py-6 sm:px-8">
                                <h2 className="text-xl font-semibold text-gray-900">Order Summary</h2>
                                <div className="mt-6 space-y-4 border-t border-gray-200 pt-4">
                                    {cart.map((item) => (
                                        <div key={item.id} className="flex justify-between">
                                            <div className="flex">
                                                <div className="ml-2">
                                                    <p className="text-sm font-medium text-gray-900">{item.title}</p>
                                                    <p className="text-sm text-gray-500">Qty: {item.quantity}</p>
                                                </div>
                                            </div>
                                            <p className="text-sm font-medium text-gray-900">${((parseFloat(item.price) || 0) * item.quantity).toFixed(2)}</p>
                                        </div>
                                    ))}
                                </div>

                                <div className="mt-6 border-t border-b border-gray-200 py-4">
                                    <div className="flex items-center justify-between">
                                        <p className="text-base font-medium text-gray-900">Subtotal</p>
                                        <p className="text-base font-medium text-gray-900">${totalPrice.toFixed(2)}</p>
                                    </div>
                                </div>

                                <div className="mt-6">
                                    <Link
                                        href="/checkout"
                                        className={`w-full flex justify-center items-center px-6 py-4 border border-transparent rounded-md shadow-sm text-base font-medium text-white ${stockIssues.length > 0 ? 'bg-gray-400 cursor-not-allowed' : 'bg-blue-600 hover:bg-blue-700 transition-colors'}`}
                                        onClick={(e) => stockIssues.length > 0 && e.preventDefault()}
                                    >
                                        {stockIssues.length > 0 ? 'Adjust Cart to Continue' : 'Proceed to Checkout'}
                                    </Link>
                                </div>
                                
                                <div className="mt-4 text-center">
                                    <Link
                                        href="/products"
                                        className="inline-flex items-center text-sm text-blue-600 hover:text-blue-800 transition-colors"
                                    >
                                        <svg className="mr-2 h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                                        </svg>
                                        Continue Shopping
                                    </Link>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
