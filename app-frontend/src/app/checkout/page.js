"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { getImageUrl } from "../../utils/imageUtils";
import apiClient from "../../utils/apiClient";

export default function CheckoutPage() {
    const router = useRouter();
    const [cart, setCart] = useState([]);
    const [loading, setLoading] = useState(true);
    const [isLoggedIn, setIsLoggedIn] = useState(false);
    const [orderComplete, setOrderComplete] = useState(false);
    const [invoice, setInvoice] = useState(null);
    const [paymentMethod, setPaymentMethod] = useState("credit");
    const [shippingMethod, setShippingMethod] = useState("standard");
    const [formData, setFormData] = useState({
        firstName: '',
        lastName: '',
        streetAddress: '',
        city: '',
        state: '',
        postalCode: '',
        cardNumber: '',
        expirationDate: '',
        cvc: ''
    });
    const [submitLoading, setSubmitLoading] = useState(false);
    const [errorMessage, setErrorMessage] = useState('');

    useEffect(() => {
        // Check if user is logged in
        const user = localStorage.getItem("user");
        setIsLoggedIn(!!user);

        // Load cart from localStorage
        const storedCart = JSON.parse(localStorage.getItem("cart")) || [];
        setCart(storedCart);
        setLoading(false);
    }, []);

    const handleFormChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: value
        }));
    };

    const handleCheckout = async (e) => {
        e.preventDefault();
        setSubmitLoading(true);
        setErrorMessage('');
        
        // Validate required fields
        if (!formData.firstName || !formData.lastName || !formData.streetAddress || 
            !formData.city || !formData.state || !formData.postalCode) {
            setErrorMessage('Please fill in all required shipping information fields');
            setSubmitLoading(false);
            return;
        }
        
        // Validate payment information if using credit card
        if (paymentMethod === 'credit' && (!formData.cardNumber || !formData.expirationDate || !formData.cvc)) {
            setErrorMessage('Please fill in all payment information fields');
            setSubmitLoading(false);
            return;
        }
        
        try {
            // Prepare order items for API
            const orderItems = cart.map(item => ({
                product: item.id,
                quantity: item.quantity,
                price_at_purchase: parseFloat(item.price)
            }));
            
            // Gather address
            const deliveryAddress = `${formData.streetAddress}, ${formData.city}, ${formData.state} ${formData.postalCode}`;
            
            // Create order data object
            const orderData = {
                order_items: orderItems,
                total_price: calculateTotal(),
                delivery_address: deliveryAddress,
                payment_method: paymentMethod,
                shipping_method: shippingMethod
            };
            
            console.log('Sending order data:', orderData);
            
            // Get user token from localStorage to verify it's available
            const userInfo = localStorage.getItem('user');
            const token = localStorage.getItem('token');
            console.log('User info:', userInfo ? 'Available' : 'Not available');
            console.log('Auth token:', token ? 'Available' : 'Not available');
            
            // Send order to API using apiClient
            const response = await apiClient.orders.create(orderData);
            
            console.log('Order response:', response);
            
            // Setup invoice data
            setInvoice({
                orderNumber: response.order.id,
                date: new Date().toISOString(),
                items: cart,
                subtotal: calculateSubtotal(),
                shipping: calculateShipping(),
                tax: calculateTax(),
                total: calculateTotal(),
                deliveryAddress
            });
            
            // Mark order as complete
            setOrderComplete(true);
            
            // Clear cart after successful order
            localStorage.removeItem("cart");
            setCart([]);
        } catch (error) {
            console.error("Checkout error:", error);
            setErrorMessage(error.message || "Failed to process order. Please try again.");
        } finally {
            setSubmitLoading(false);
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
                                <p className="text-sm text-gray-600 mt-2">
                                    <span className="font-medium">Delivery Address:</span> {invoice.deliveryAddress}
                                </p>
                            </div>
                            
                            <div className="space-y-3 my-6">
                                {invoice.items.map((item) => (
                                    <div key={item.id} className="flex justify-between py-2 border-b border-gray-200">
                                        <div className="flex">
                                            <div className="flex-shrink-0 w-12 h-12 bg-gray-100 rounded-md overflow-hidden mr-3">
                                                <img 
                                                    src={getImageUrl(item.image)} 
                                                    alt={item.title}
                                                    className="w-full h-full object-cover"
                                                />
                                            </div>
                                            <div className="ml-2">
                                                <p className="text-sm font-medium text-gray-900">{item.title} <span className="text-gray-600">× {item.quantity}</span></p>
                                            </div>
                                        </div>
                                        <p className="text-sm font-medium text-gray-900">${(parseFloat(item.price) * item.quantity).toFixed(2)}</p>
                                    </div>
                                ))}
                            </div>
                            
                            <div className="border-t border-gray-200 pt-4">
                                <div className="flex justify-between mt-2">
                                    <span className="text-gray-600">Subtotal</span>
                                    <span className="text-gray-900">${invoice.subtotal.toFixed(2)}</span>
                                </div>
                                <div className="flex justify-between mt-2">
                                    <span className="text-gray-600">Shipping</span>
                                    <span className="text-gray-900">${invoice.shipping.toFixed(2)}</span>
                                </div>
                                <div className="flex justify-between mt-2">
                                    <span className="text-gray-600">Tax</span>
                                    <span className="text-gray-900">${invoice.tax.toFixed(2)}</span>
                                </div>
                                <div className="flex justify-between mt-4 pt-4 border-t border-gray-200">
                                    <span className="text-lg font-bold text-gray-900">Total</span>
                                    <span className="text-lg font-bold text-gray-900">${invoice.total.toFixed(2)}</span>
                                </div>
                            </div>
                        </div>
                        
                        <p className="text-center text-gray-600 mb-6">A copy of your receipt has been sent to your email.</p>
                        
                        <div className="flex justify-center space-x-4">
                            <Link 
                                href="/" 
                                className="inline-flex items-center px-6 py-3 border border-transparent rounded-md shadow-sm text-base font-medium text-white bg-blue-600 hover:bg-blue-700 transition-colors"
                            >
                                Return to Home
                            </Link>
                            <Link 
                                href="/orders" 
                                className="inline-flex items-center px-6 py-3 border border-gray-300 rounded-md shadow-sm text-base font-medium text-gray-700 bg-white hover:bg-gray-50 transition-colors"
                            >
                                View My Orders
                            </Link>
                        </div>
                        
                        <div className="mt-4 flex justify-center">
                            <button
                                onClick={() => {
                                    // Extract the numeric part of the order ID
                                    let orderId = invoice.orderNumber;
                                    console.log("Original order ID:", orderId, typeof orderId);
                                    
                                    // Don't convert the order ID, send it as is
                                    // The backend has been updated to handle different formats
                                    apiClient.orders.downloadInvoice(orderId);
                                }}
                                className="inline-flex items-center px-6 py-3 border border-gray-300 rounded-md shadow-sm text-base font-medium text-gray-700 bg-white hover:bg-gray-50 transition-colors"
                            >
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                                </svg>
                                Download Invoice
                            </button>
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
                                    <label htmlFor="firstName" className="block text-sm font-medium text-gray-700">First name</label>
                                    <input 
                                        type="text" 
                                        name="firstName" 
                                        id="firstName" 
                                        value={formData.firstName}
                                        onChange={handleFormChange}
                                        autoComplete="given-name" 
                                        className="mt-1 focus:ring-blue-500 focus:border-blue-500 block w-full shadow-sm sm:text-sm border-gray-300 rounded-md" 
                                    />
                                </div>

                                <div className="col-span-6 sm:col-span-3">
                                    <label htmlFor="lastName" className="block text-sm font-medium text-gray-700">Last name</label>
                                    <input 
                                        type="text" 
                                        name="lastName" 
                                        id="lastName" 
                                        value={formData.lastName}
                                        onChange={handleFormChange}
                                        autoComplete="family-name" 
                                        className="mt-1 focus:ring-blue-500 focus:border-blue-500 block w-full shadow-sm sm:text-sm border-gray-300 rounded-md" 
                                    />
                                </div>

                                <div className="col-span-6">
                                    <label htmlFor="streetAddress" className="block text-sm font-medium text-gray-700">Street address</label>
                                    <input 
                                        type="text" 
                                        name="streetAddress" 
                                        id="streetAddress" 
                                        value={formData.streetAddress}
                                        onChange={handleFormChange}
                                        autoComplete="street-address" 
                                        className="mt-1 focus:ring-blue-500 focus:border-blue-500 block w-full shadow-sm sm:text-sm border-gray-300 rounded-md" 
                                    />
                                </div>

                                <div className="col-span-6 sm:col-span-6 lg:col-span-2">
                                    <label htmlFor="city" className="block text-sm font-medium text-gray-700">City</label>
                                    <input 
                                        type="text" 
                                        name="city" 
                                        id="city" 
                                        value={formData.city}
                                        onChange={handleFormChange}
                                        autoComplete="address-level2" 
                                        className="mt-1 focus:ring-blue-500 focus:border-blue-500 block w-full shadow-sm sm:text-sm border-gray-300 rounded-md" 
                                    />
                                </div>

                                <div className="col-span-6 sm:col-span-3 lg:col-span-2">
                                    <label htmlFor="state" className="block text-sm font-medium text-gray-700">State / Province</label>
                                    <input 
                                        type="text" 
                                        name="state" 
                                        id="state" 
                                        value={formData.state}
                                        onChange={handleFormChange}
                                        autoComplete="address-level1" 
                                        className="mt-1 focus:ring-blue-500 focus:border-blue-500 block w-full shadow-sm sm:text-sm border-gray-300 rounded-md" 
                                    />
                                </div>

                                <div className="col-span-6 sm:col-span-3 lg:col-span-2">
                                    <label htmlFor="postalCode" className="block text-sm font-medium text-gray-700">ZIP / Postal code</label>
                                    <input 
                                        type="text" 
                                        name="postalCode" 
                                        id="postalCode" 
                                        value={formData.postalCode}
                                        onChange={handleFormChange}
                                        autoComplete="postal-code" 
                                        className="mt-1 focus:ring-blue-500 focus:border-blue-500 block w-full shadow-sm sm:text-sm border-gray-300 rounded-md" 
                                    />
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
                                        <label htmlFor="cardNumber" className="block text-sm font-medium text-gray-700">Card number</label>
                                        <input 
                                            type="text" 
                                            name="cardNumber" 
                                            id="cardNumber" 
                                            value={formData.cardNumber}
                                            onChange={handleFormChange}
                                            placeholder="•••• •••• •••• ••••" 
                                            className="mt-1 focus:ring-blue-500 focus:border-blue-500 block w-full shadow-sm sm:text-sm border-gray-300 rounded-md" 
                                        />
                                    </div>

                                    <div className="col-span-6 sm:col-span-3">
                                        <label htmlFor="expirationDate" className="block text-sm font-medium text-gray-700">Expiration date</label>
                                        <input 
                                            type="text" 
                                            name="expirationDate"
                                            id="expirationDate" 
                                            value={formData.expirationDate}
                                            onChange={handleFormChange}
                                            placeholder="MM / YY" 
                                            className="mt-1 focus:ring-blue-500 focus:border-blue-500 block w-full shadow-sm sm:text-sm border-gray-300 rounded-md" 
                                        />
                                    </div>

                                    <div className="col-span-6 sm:col-span-3">
                                        <label htmlFor="cvc" className="block text-sm font-medium text-gray-700">CVC</label>
                                        <input 
                                            type="text" 
                                            name="cvc" 
                                            id="cvc" 
                                            value={formData.cvc}
                                            onChange={handleFormChange}
                                            placeholder="•••" 
                                            className="mt-1 focus:ring-blue-500 focus:border-blue-500 block w-full shadow-sm sm:text-sm border-gray-300 rounded-md" 
                                        />
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                    
                    <div className="lg:col-span-5 mt-10 lg:mt-0">
                        <div className="bg-white rounded-lg shadow-sm p-6 lg:sticky lg:top-10">
                            <h2 className="text-xl font-semibold text-gray-900 mb-6">Order Summary</h2>
                            
                            <div className="mt-6 space-y-4 border-t border-gray-200 pt-4">
                                {cart.map((item) => (
                                    <div key={item.id} className="flex justify-between">
                                        <div className="flex">
                                            <div className="flex-shrink-0 w-12 h-12 bg-gray-100 rounded-md overflow-hidden mr-3">
                                                <img 
                                                    src={getImageUrl(item.image)} 
                                                    alt={item.title}
                                                    className="w-full h-full object-cover"
                                                />
                                            </div>
                                            <div>
                                                <p className="text-sm font-medium text-gray-900">{item.title}</p>
                                                <p className="text-sm text-gray-500">Qty: {item.quantity}</p>
                                            </div>
                                        </div>
                                        <p className="text-sm font-medium text-gray-900">${(parseFloat(item.price) * item.quantity).toFixed(2)}</p>
                                    </div>
                                ))}
                            </div>
                            
                            <div className="mt-6 border-gray-200 pt-6 mt-6">
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
                            
                            {/* Error message display */}
                            {errorMessage && (
                                <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded relative mt-4" role="alert">
                                    <span className="block sm:inline">{errorMessage}</span>
                                </div>
                            )}
                            
                            <div className="mt-6">
                                <button
                                    type="button"
                                    onClick={handleCheckout}
                                    disabled={submitLoading}
                                    className={`w-full border border-transparent rounded-md py-3 px-4 text-base font-medium text-white transition-colors ${
                                        submitLoading ? 'bg-gray-400 cursor-not-allowed' : 'bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500'
                                    }`}
                                >
                                    {submitLoading ? (
                                        <span className="flex items-center justify-center">
                                            <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                            </svg>
                                            Processing...
                                        </span>
                                    ) : (
                                        'Complete Order'
                                    )}
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