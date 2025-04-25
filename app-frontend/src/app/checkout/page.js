"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

export default function CheckoutPage() {
    const router = useRouter();
    const [cart, setCart] = useState([]);
    const [loading, setLoading] = useState(true);
    const [isLoggedIn, setIsLoggedIn] = useState(false);
    const [orderComplete, setOrderComplete] = useState(false);
    const [invoice, setInvoice] = useState(null);
    const [paymentMethod, setPaymentMethod] = useState("credit");
    const [shippingMethod, setShippingMethod] = useState("standard");

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
                    total: calculateTotal(),
                    paymentMethod,
                    shippingMethod
                }),
            });

            if (response.ok) {
                const data = await response.json();
                setInvoice({
                    ...data.invoice,
                    orderNumber: `ORD-${Date.now()}`,
                    date: new Date().toISOString(),
                    items: cart,
                    total: calculateTotal(),
                });
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

    const calculateSubtotal = () => {
        return cart.reduce((sum, item) => sum + item.price * item.quantity, 0);
    };

    const calculateShipping = () => {
        const subtotal = calculateSubtotal();
        if (shippingMethod === "express") return 12.99;
        if (shippingMethod === "standard") return subtotal > 100 ? 0 : 5.99;
        return 0;
    };

    const calculateTax = () => {
        return calculateSubtotal() * 0.08; // Assuming 8% tax
    };

    const calculateTotal = () => {
        return calculateSubtotal() + calculateShipping() + calculateTax();
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center">
                <div className="w-12 h-12 border-t-4 border-b-4 border-blue-500 rounded-full animate-spin"></div>
            </div>
        );
    }

    if (!isLoggedIn) {
        return (
            <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
                <div className="max-w-md mx-auto bg-white rounded-xl shadow-md overflow-hidden md:max-w-2xl">
                    <div className="p-8">
                        <div className="text-center mb-6">
                            <svg xmlns="http://www.w3.org/2000/svg" className="mx-auto h-12 w-12 text-yellow-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                            </svg>
                            <h2 className="mt-4 text-2xl font-bold text-gray-900">Authentication Required</h2>
                            <p className="mt-2 text-gray-600">Please sign in to continue with your purchase</p>
                        </div>
                        <div className="flex justify-center">
                            <Link 
                                href="/login"
                                className="inline-flex items-center px-6 py-3 border border-transparent rounded-md shadow-sm text-base font-medium text-white bg-blue-600 hover:bg-blue-700 transition-colors"
                            >
                                Sign In
                            </Link>
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    if (cart.length === 0 && !orderComplete) {
        return (
            <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
                <div className="max-w-md mx-auto bg-white rounded-xl shadow-md overflow-hidden md:max-w-2xl">
                    <div className="p-8">
                        <div className="text-center mb-6">
                            <svg xmlns="http://www.w3.org/2000/svg" className="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
                            </svg>
                            <h2 className="mt-4 text-2xl font-bold text-gray-900">Your Cart is Empty</h2>
                            <p className="mt-2 text-gray-600">Add some products to your cart and come back to checkout.</p>
                        </div>
                        <div className="flex justify-center">
                            <Link 
                                href="/products" 
                                className="inline-flex items-center px-6 py-3 border border-transparent rounded-md shadow-sm text-base font-medium text-white bg-blue-600 hover:bg-blue-700 transition-colors"
                            >
                                Browse Products
                            </Link>
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    if (orderComplete && invoice) {
        return (
            <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
                <div className="max-w-3xl mx-auto bg-white rounded-xl shadow-lg overflow-hidden">
                    <div className="p-8">
                        <div className="text-center mb-8">
                            <div className="flex justify-center">
                                <div className="rounded-full bg-green-100 p-4">
                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                                    </svg>
                                </div>
                            </div>
                            <h1 className="mt-4 text-3xl font-extrabold text-gray-900">Order Complete!</h1>
                            <p className="mt-2 text-gray-600">Thank you for your purchase. Your order has been received.</p>
                        </div>
                        
                        <div className="bg-gray-50 rounded-lg p-6 mb-8">
                            <div className="flex justify-between items-center mb-4">
                                <h2 className="text-xl font-bold text-gray-900">Order Summary</h2>
                                <span className="text-gray-600">#{invoice.orderNumber}</span>
                            </div>
                            
                            <div className="border-t border-gray-200 pt-4 mb-4">
                                <p className="text-sm text-gray-600">
                                    <span className="font-medium">Date:</span> {new Date(invoice.date).toLocaleDateString()}
                                </p>
                            </div>
                            
                            <div className="space-y-3 my-6">
                                {invoice.items.map((item) => (
                                    <div key={item.id} className="flex justify-between py-2 border-b border-gray-200">
                                        <div className="flex">
                                            <div className="ml-2">
                                                <p className="text-sm font-medium text-gray-900">{item.title} <span className="text-gray-600">× {item.quantity}</span></p>
                                            </div>
                                        </div>
                                        <p className="text-sm font-medium text-gray-900">${(item.price * item.quantity).toFixed(2)}</p>
                                    </div>
                                ))}
                            </div>
                            
                            <div className="border-t border-gray-200 pt-4">
                                <div className="flex justify-between mt-2">
                                    <span className="text-gray-600">Subtotal</span>
                                    <span className="text-gray-900">${calculateSubtotal().toFixed(2)}</span>
                                </div>
                                <div className="flex justify-between mt-2">
                                    <span className="text-gray-600">Shipping</span>
                                    <span className="text-gray-900">${calculateShipping().toFixed(2)}</span>
                                </div>
                                <div className="flex justify-between mt-2">
                                    <span className="text-gray-600">Tax</span>
                                    <span className="text-gray-900">${calculateTax().toFixed(2)}</span>
                                </div>
                                <div className="flex justify-between mt-4 pt-4 border-t border-gray-200">
                                    <span className="text-lg font-bold text-gray-900">Total</span>
                                    <span className="text-lg font-bold text-gray-900">${invoice.total.toFixed(2)}</span>
                                </div>
                            </div>
                        </div>
                        
                        <p className="text-center text-gray-600 mb-6">A copy of your receipt has been sent to your email.</p>
                        
                        <div className="flex justify-center">
                            <Link 
                                href="/" 
                                className="inline-flex items-center px-6 py-3 border border-transparent rounded-md shadow-sm text-base font-medium text-white bg-blue-600 hover:bg-blue-700 transition-colors"
                            >
                                Return to Home
                            </Link>
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
            <div className="max-w-7xl mx-auto">
                <h1 className="text-3xl font-extrabold text-gray-900 text-center mb-10">Checkout</h1>
                
                <div className="lg:grid lg:grid-cols-12 lg:gap-x-12">
                    <div className="lg:col-span-7">
                        <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
                            <h2 className="text-xl font-semibold text-gray-900 mb-4">Shipping Information</h2>
                            
                            <div className="grid grid-cols-6 gap-6">
                                <div className="col-span-6 sm:col-span-3">
                                    <label htmlFor="first-name" className="block text-sm font-medium text-gray-700">First name</label>
                                    <input type="text" name="first-name" id="first-name" autoComplete="given-name" className="mt-1 focus:ring-blue-500 focus:border-blue-500 block w-full shadow-sm sm:text-sm border-gray-300 rounded-md" />
                                </div>

                                <div className="col-span-6 sm:col-span-3">
                                    <label htmlFor="last-name" className="block text-sm font-medium text-gray-700">Last name</label>
                                    <input type="text" name="last-name" id="last-name" autoComplete="family-name" className="mt-1 focus:ring-blue-500 focus:border-blue-500 block w-full shadow-sm sm:text-sm border-gray-300 rounded-md" />
                                </div>

                                <div className="col-span-6">
                                    <label htmlFor="street-address" className="block text-sm font-medium text-gray-700">Street address</label>
                                    <input type="text" name="street-address" id="street-address" autoComplete="street-address" className="mt-1 focus:ring-blue-500 focus:border-blue-500 block w-full shadow-sm sm:text-sm border-gray-300 rounded-md" />
                                </div>

                                <div className="col-span-6 sm:col-span-6 lg:col-span-2">
                                    <label htmlFor="city" className="block text-sm font-medium text-gray-700">City</label>
                                    <input type="text" name="city" id="city" autoComplete="address-level2" className="mt-1 focus:ring-blue-500 focus:border-blue-500 block w-full shadow-sm sm:text-sm border-gray-300 rounded-md" />
                                </div>

                                <div className="col-span-6 sm:col-span-3 lg:col-span-2">
                                    <label htmlFor="region" className="block text-sm font-medium text-gray-700">State / Province</label>
                                    <input type="text" name="region" id="region" autoComplete="address-level1" className="mt-1 focus:ring-blue-500 focus:border-blue-500 block w-full shadow-sm sm:text-sm border-gray-300 rounded-md" />
                                </div>

                                <div className="col-span-6 sm:col-span-3 lg:col-span-2">
                                    <label htmlFor="postal-code" className="block text-sm font-medium text-gray-700">ZIP / Postal code</label>
                                    <input type="text" name="postal-code" id="postal-code" autoComplete="postal-code" className="mt-1 focus:ring-blue-500 focus:border-blue-500 block w-full shadow-sm sm:text-sm border-gray-300 rounded-md" />
                                </div>
                            </div>
                        </div>
                        
                        <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
                            <h2 className="text-xl font-semibold text-gray-900 mb-4">Shipping Method</h2>
                            
                            <div className="space-y-4">
                                <div className="flex items-center">
                                    <input 
                                        id="shipping-standard" 
                                        name="shipping-method" 
                                        type="radio" 
                                        checked={shippingMethod === 'standard'} 
                                        onChange={() => setShippingMethod('standard')}
                                        className="focus:ring-blue-500 h-4 w-4 text-blue-600 border-gray-300" 
                                    />
                                    <label htmlFor="shipping-standard" className="ml-3 block text-sm font-medium text-gray-700">
                                        <span className="flex justify-between">
                                            <span>Standard Shipping</span>
                                            <span>{calculateSubtotal() > 100 ? 'Free' : '$5.99'}</span>
                                        </span>
                                        <span className="text-gray-500 text-xs">4-7 business days</span>
                                    </label>
                                </div>
                                
                                <div className="flex items-center">
                                    <input 
                                        id="shipping-express" 
                                        name="shipping-method" 
                                        type="radio" 
                                        checked={shippingMethod === 'express'} 
                                        onChange={() => setShippingMethod('express')}
                                        className="focus:ring-blue-500 h-4 w-4 text-blue-600 border-gray-300" 
                                    />
                                    <label htmlFor="shipping-express" className="ml-3 block text-sm font-medium text-gray-700">
                                        <span className="flex justify-between">
                                            <span>Express Shipping</span>
                                            <span>$12.99</span>
                                        </span>
                                        <span className="text-gray-500 text-xs">1-3 business days</span>
                                    </label>
                                </div>
                            </div>
                        </div>
                        
                        <div className="bg-white rounded-lg shadow-sm p-6">
                            <h2 className="text-xl font-semibold text-gray-900 mb-4">Payment Details</h2>
                            
                            <div className="space-y-4 mb-6">
                                <div className="flex items-center">
                                    <input 
                                        id="payment-credit" 
                                        name="payment-method" 
                                        type="radio" 
                                        checked={paymentMethod === 'credit'} 
                                        onChange={() => setPaymentMethod('credit')}
                                        className="focus:ring-blue-500 h-4 w-4 text-blue-600 border-gray-300" 
                                    />
                                    <label htmlFor="payment-credit" className="ml-3 block text-sm font-medium text-gray-700">
                                        Credit Card
                                    </label>
                                </div>
                                
                                <div className="flex items-center">
                                    <input 
                                        id="payment-paypal" 
                                        name="payment-method" 
                                        type="radio" 
                                        checked={paymentMethod === 'paypal'} 
                                        onChange={() => setPaymentMethod('paypal')}
                                        className="focus:ring-blue-500 h-4 w-4 text-blue-600 border-gray-300" 
                                    />
                                    <label htmlFor="payment-paypal" className="ml-3 block text-sm font-medium text-gray-700">
                                        PayPal
                                    </label>
                                </div>
                            </div>
                            
                            {paymentMethod === 'credit' && (
                                <div className="grid grid-cols-6 gap-6">
                                    <div className="col-span-6">
                                        <label htmlFor="card-number" className="block text-sm font-medium text-gray-700">Card number</label>
                                        <input type="text" name="card-number" id="card-number" placeholder="•••• •••• •••• ••••" className="mt-1 focus:ring-blue-500 focus:border-blue-500 block w-full shadow-sm sm:text-sm border-gray-300 rounded-md" />
                                    </div>

                                    <div className="col-span-6 sm:col-span-3">
                                        <label htmlFor="expiration-date" className="block text-sm font-medium text-gray-700">Expiration date</label>
                                        <input type="text" name="expiration-date" id="expiration-date" placeholder="MM / YY" className="mt-1 focus:ring-blue-500 focus:border-blue-500 block w-full shadow-sm sm:text-sm border-gray-300 rounded-md" />
                                    </div>

                                    <div className="col-span-6 sm:col-span-3">
                                        <label htmlFor="cvc" className="block text-sm font-medium text-gray-700">CVC</label>
                                        <input type="text" name="cvc" id="cvc" placeholder="•••" className="mt-1 focus:ring-blue-500 focus:border-blue-500 block w-full shadow-sm sm:text-sm border-gray-300 rounded-md" />
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                    
                    <div className="lg:col-span-5 mt-10 lg:mt-0">
                        <div className="bg-white rounded-lg shadow-sm p-6 lg:sticky lg:top-10">
                            <h2 className="text-xl font-semibold text-gray-900 mb-6">Order Summary</h2>
                            
                            <div className="mt-6 space-y-4">
                                {cart.map((item) => (
                                    <div key={item.id} className="flex">
                                        <div className="flex-shrink-0 w-16 h-16 border border-gray-200 rounded-md overflow-hidden">
                                            <img src={item.image} alt={item.title} className="w-full h-full object-cover" />
                                        </div>
                                        <div className="ml-4 flex-1 flex flex-col">
                                            <div>
                                                <div className="flex justify-between text-sm font-medium text-gray-900">
                                                    <h3>{item.title}</h3>
                                                    <p className="ml-4">${(item.price * item.quantity).toFixed(2)}</p>
                                                </div>
                                                <p className="mt-1 text-sm text-gray-500">Qty {item.quantity}</p>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                            
                            <div className="border-t border-gray-200 pt-6 mt-6">
                                <div className="flex justify-between text-sm">
                                    <p className="text-gray-600">Subtotal</p>
                                    <p className="text-gray-900 font-medium">${calculateSubtotal().toFixed(2)}</p>
                                </div>
                                <div className="flex justify-between text-sm mt-2">
                                    <p className="text-gray-600">Shipping</p>
                                    <p className="text-gray-900 font-medium">${calculateShipping().toFixed(2)}</p>
                                </div>
                                <div className="flex justify-between text-sm mt-2">
                                    <p className="text-gray-600">Tax</p>
                                    <p className="text-gray-900 font-medium">${calculateTax().toFixed(2)}</p>
                                </div>
                                <div className="flex justify-between mt-4 pt-4 border-t border-gray-200">
                                    <p className="text-base font-medium text-gray-900">Total</p>
                                    <p className="text-base font-medium text-gray-900">${calculateTotal().toFixed(2)}</p>
                                </div>
                            </div>
                            
                            <div className="mt-8">
                                <button
                                    type="button"
                                    onClick={handleCheckout}
                                    className="w-full bg-blue-600 border border-transparent rounded-md py-3 px-4 text-base font-medium text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors"
                                >
                                    Complete Order
                                </button>
                            </div>
                            
                            <div className="mt-4 text-center">
                                <Link href="/cart" className="text-sm text-blue-600 hover:text-blue-800 transition-colors">
                                    Return to cart
                                </Link>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
} 