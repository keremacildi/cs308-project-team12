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
    const [address, setAddress] = useState("");
    const [submitting, setSubmitting] = useState(false);
    const [errorMessage, setErrorMessage] = useState("");

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
        if (e) e.preventDefault();
        
        if (!address.trim()) {
            setErrorMessage("Please enter a delivery address");
            return;
        }

        setSubmitting(true);
        setErrorMessage("");

        try {
            // Get user from localStorage
            const user = JSON.parse(localStorage.getItem("user") || "{}");
            if (!user || !user.id) {
                setErrorMessage("You must be logged in to checkout");
                setSubmitting(false);
                return;
            }
            
            // Format order data with user ID
            const orderData = {
                user: user.id,
                delivery_address: address,
                order_items: cart.map(item => ({
                    product: item.id,
                    quantity: item.quantity,
                    price_at_purchase: item.price
                })),
                total_price: calculateTotal()
            };

            console.log('Sending order data:', orderData);
            
            // Direct request to the backend with user ID in the body
            try {
                const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/orders/`, {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json",
                    },
                    body: JSON.stringify(orderData),
                });
                
                console.log('API response status:', response.status);
                
                const data = await response.json();
                console.log('API response data:', data);
                
                if (response.ok) {
                    setInvoice({
                        orderNumber: data.order?.id || `ORD-${Date.now()}`,
                        date: new Date().toISOString(),
                        items: cart,
                        total: calculateTotal(),
                        delivery_address: address,
                        payment_method: paymentMethod,
                        shipping_method: shippingMethod
                    });
                    setOrderComplete(true);
                    
                    // Clear cart after successful order
                    localStorage.removeItem("cart");
                    setCart([]);
                } else {
                    // Show error message
                    const errorDetail = typeof data === 'object' ? 
                      (data.error || data.detail || JSON.stringify(data)) : 
                      'Failed to create order. Please try again.';
                      
                    setErrorMessage(errorDetail);
                    console.error('Order creation failed:', data);
                }
            } catch (apiError) {
                console.error('API call failed:', apiError);
                setErrorMessage(`API error: ${apiError.message}`);
            }
        } catch (error) {
            console.error("Checkout error:", error);
            setErrorMessage(`Failed to process order: ${error.message}`);
        } finally {
            setSubmitting(false);
        }
    };

    const calculateSubtotal = () => {
        return cart.reduce((sum, item) => sum + parseFloat(item.price || 0) * item.quantity, 0);
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
                <div className="text-center mb-12">
                    <h1 className="text-3xl font-extrabold text-blue-600 sm:text-4xl">Checkout</h1>
                    <p className="mt-4 text-lg text-gray-600 max-w-2xl mx-auto">
                        Complete your purchase by providing your shipping and payment details below.
                    </p>
                </div>

                {errorMessage && (
                    <div className="max-w-3xl mx-auto mb-8 bg-red-50 border-l-4 border-red-400 p-4">
                        <div className="flex">
                            <div className="flex-shrink-0">
                                <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                                </svg>
                            </div>
                            <div className="ml-3">
                                <p className="text-sm text-red-700">{errorMessage}</p>
                            </div>
                        </div>
                    </div>
                )}

                <div className="mt-12 lg:grid lg:grid-cols-12 lg:gap-x-12">
                    <div className="lg:col-span-7">
                        <form onSubmit={handleCheckout}>
                            {/* Shipping Address */}
                            <div className="bg-white shadow-md rounded-lg p-6 mb-8">
                                <h2 className="text-lg font-medium text-gray-900 mb-4">Shipping Information</h2>
                                
                                <div className="mb-4">
                                    <label htmlFor="address" className="block text-sm font-medium text-gray-700 mb-1">
                                        Delivery Address
                                    </label>
                                    <textarea
                                        id="address"
                                        name="address"
                                        rows="3"
                                        className="shadow-sm block w-full focus:ring-blue-500 focus:border-blue-500 sm:text-sm border border-gray-300 rounded-md p-2"
                                        placeholder="Enter your full address"
                                        value={address}
                                        onChange={(e) => setAddress(e.target.value)}
                                        required
                                    ></textarea>
                                </div>

                                <div className="mb-4">
                                    <label htmlFor="shipping-method" className="block text-sm font-medium text-gray-700 mb-1">
                                        Shipping Method
                                    </label>
                                    <div className="mt-1">
                                        <select
                                            id="shipping-method"
                                            name="shipping-method"
                                            className="shadow-sm focus:ring-blue-500 focus:border-blue-500 block w-full sm:text-sm border-gray-300 rounded-md p-2"
                                            value={shippingMethod}
                                            onChange={(e) => setShippingMethod(e.target.value)}
                                        >
                                            <option value="standard">Standard Shipping (3-5 business days)</option>
                                            <option value="express">Express Shipping (1-2 business days)</option>
                                        </select>
                                    </div>
                                </div>
                            </div>

                            {/* Payment Information */}
                            <div className="bg-white shadow-md rounded-lg p-6 mb-8">
                                <h2 className="text-lg font-medium text-gray-900 mb-4">Payment Information</h2>
                                
                                <div className="mb-4">
                                    <label htmlFor="payment-method" className="block text-sm font-medium text-gray-700 mb-1">
                                        Payment Method
                                    </label>
                                    <div className="mt-1">
                                        <select
                                            id="payment-method"
                                            name="payment-method"
                                            className="shadow-sm focus:ring-blue-500 focus:border-blue-500 block w-full sm:text-sm border-gray-300 rounded-md p-2"
                                            value={paymentMethod}
                                            onChange={(e) => setPaymentMethod(e.target.value)}
                                        >
                                            <option value="credit">Credit Card</option>
                                            <option value="paypal">PayPal</option>
                                        </select>
                                    </div>
                                </div>
                                
                                {paymentMethod === "credit" && (
                                    <div>
                                        <div className="mb-4">
                                            <label htmlFor="card-number" className="block text-sm font-medium text-gray-700 mb-1">
                                                Card Number
                                            </label>
                                            <input
                                                type="text"
                                                id="card-number"
                                                placeholder="1234 5678 9012 3456"
                                                className="shadow-sm focus:ring-blue-500 focus:border-blue-500 block w-full sm:text-sm border-gray-300 rounded-md p-2"
                                            />
                                        </div>
                                        
                                        <div className="grid grid-cols-2 gap-4">
                                            <div className="mb-4">
                                                <label htmlFor="expiration" className="block text-sm font-medium text-gray-700 mb-1">
                                                    Expiration (MM/YY)
                                                </label>
                                                <input
                                                    type="text"
                                                    id="expiration"
                                                    placeholder="MM/YY"
                                                    className="shadow-sm focus:ring-blue-500 focus:border-blue-500 block w-full sm:text-sm border-gray-300 rounded-md p-2"
                                                />
                                            </div>
                                            
                                            <div className="mb-4">
                                                <label htmlFor="cvc" className="block text-sm font-medium text-gray-700 mb-1">
                                                    CVC
                                                </label>
                                                <input
                                                    type="text"
                                                    id="cvc"
                                                    placeholder="123"
                                                    className="shadow-sm focus:ring-blue-500 focus:border-blue-500 block w-full sm:text-sm border-gray-300 rounded-md p-2"
                                                />
                                            </div>
                                        </div>
                                    </div>
                                )}
                            </div>

                            <button
                                type="submit"
                                disabled={submitting}
                                className={`w-full px-6 py-3 rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 ${
                                    submitting ? "opacity-75 cursor-not-allowed" : ""
                                }`}
                            >
                                {submitting ? (
                                    <span className="flex items-center justify-center">
                                        <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                        </svg>
                                        Processing...
                                    </span>
                                ) : (
                                    "Complete Order"
                                )}
                            </button>
                        </form>
                    </div>

                    <div className="lg:col-span-5 mt-8 lg:mt-0">
                        <div className="bg-white shadow-md rounded-lg overflow-hidden">
                            <div className="p-6">
                                <h2 className="text-lg font-medium text-gray-900 mb-4">Order Summary</h2>
                                
                                <div className="mt-6 border-t border-gray-200 pt-4">
                                    <div className="flow-root">
                                        <ul className="-my-4 divide-y divide-gray-200">
                                            {cart.map((item) => (
                                                <li key={item.id} className="py-4 flex">
                                                    <div className="ml-3 flex-1 flex flex-col">
                                                        <div className="flex justify-between text-base font-medium text-gray-900">
                                                            <h3>{item.title}</h3>
                                                            <p className="ml-4">${((parseFloat(item.price) || 0) * item.quantity).toFixed(2)}</p>
                                                        </div>
                                                        <p className="mt-1 text-sm text-gray-500">Qty: {item.quantity}</p>
                                                    </div>
                                                </li>
                                            ))}
                                        </ul>
                                    </div>
                                </div>
                                
                                <div className="border-t border-gray-200 py-4 mt-4">
                                    <div className="flex justify-between text-sm text-gray-600">
                                        <p>Subtotal</p>
                                        <p>${calculateSubtotal().toFixed(2)}</p>
                                    </div>
                                    <div className="flex justify-between text-sm text-gray-600 mt-2">
                                        <p>Shipping</p>
                                        <p>${calculateShipping().toFixed(2)}</p>
                                    </div>
                                    <div className="flex justify-between text-sm text-gray-600 mt-2">
                                        <p>Tax</p>
                                        <p>${calculateTax().toFixed(2)}</p>
                                    </div>
                                    <div className="flex justify-between text-base font-medium text-gray-900 mt-4">
                                        <p>Total</p>
                                        <p>${calculateTotal().toFixed(2)}</p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
} 