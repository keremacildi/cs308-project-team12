"use client";
import { useState } from "react";
import Link from "next/link";
import { Mail, ArrowLeft, CheckCircle, AlertCircle } from 'lucide-react';

export default function ForgotPasswordPage() {
    const [email, setEmail] = useState("");
    const [status, setStatus] = useState({ type: null, message: "" });
    const [isSubmitting, setIsSubmitting] = useState(false);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setIsSubmitting(true);
        setStatus({ type: null, message: "" });

        try {
            // For demo purposes - replace with actual API call
            await new Promise(resolve => setTimeout(resolve, 1000));
            
            // Simulate API response - Replace with actual implementation
            // const res = await fetch("/api/auth/forgot-password", {
            //     method: "POST",
            //     headers: { "Content-Type": "application/json" },
            //     body: JSON.stringify({ email }),
            // });

            // Success case - remove this when implementing actual API
            setStatus({
                type: "success",
                message: "Password reset link has been sent to your email address."
            });
            
            // Uncomment this for real implementation
            // if (res.ok) {
            //     setStatus({
            //         type: "success",
            //         message: "Password reset link has been sent to your email address."
            //     });
            // } else {
            //     const data = await res.json();
            //     setStatus({
            //         type: "error",
            //         message: data.message || "Email not found in our records."
            //     });
            // }
        } catch (err) {
            setStatus({
                type: "error",
                message: "Connection error. Please try again later."
            });
        } finally {
            setIsSubmitting(false);
        }
    };

    if (status.type === "success") {
        return (
            <div className="min-h-screen bg-gradient-to-br from-blue-600 to-indigo-900 flex items-center justify-center p-6">
                <div className="w-full max-w-md backdrop-blur-lg bg-white/90 rounded-3xl shadow-2xl p-8 transition-all duration-500 animate-fadeIn">
                    <div className="text-center">
                        <div className="mb-6 inline-flex p-4 bg-green-100 rounded-full">
                            <CheckCircle className="h-12 w-12 text-green-600" />
                        </div>
                        <h2 className="text-3xl font-bold text-gray-800 mb-2">Check Your Email</h2>
                        <p className="text-gray-600 mb-6">
                            {status.message}
                        </p>
                        <Link href="/login" className="inline-flex items-center text-blue-600 hover:text-blue-800 font-medium">
                            <ArrowLeft className="w-4 h-4 mr-2" />
                            Back to Login
                        </Link>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-blue-600 to-indigo-900 flex items-center justify-center p-6">
            <div className="w-full max-w-md backdrop-blur-lg bg-white/90 rounded-3xl shadow-2xl p-8 transition-all duration-300 hover:shadow-blue-900/20">
                <div className="text-center mb-8">
                    <h2 className="text-3xl font-extrabold text-gray-800 mb-2">Forgot Password</h2>
                    <p className="text-gray-600">Enter your email to receive a reset link</p>
                </div>
                
                {status.type === "error" && (
                    <div className="mb-6 p-4 rounded-lg bg-red-50 text-red-600 animate-[shake_0.5s_ease] flex items-start">
                        <AlertCircle className="h-5 w-5 mr-2 flex-shrink-0 mt-0.5" />
                        <p>{status.message}</p>
                    </div>
                )}
                
                <form onSubmit={handleSubmit} className="space-y-6">
                    <div>
                        <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1 ml-1">Email Address</label>
                        <div className="relative">
                            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                <Mail className="h-5 w-5 text-gray-400" />
                            </div>
                            <input
                                id="email"
                                type="email"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                placeholder="you@example.com"
                                required
                                className="block w-full pl-10 pr-3 py-4 border-0 rounded-xl text-gray-900 bg-gray-50 focus:ring-2 focus:ring-blue-600 shadow-sm"
                            />
                        </div>
                    </div>
                    
                    <button 
                        type="submit"
                        disabled={isSubmitting}
                        className={`w-full py-4 bg-gradient-to-r from-blue-600 to-indigo-700 text-white font-medium rounded-xl shadow-lg hover:shadow-blue-500/30 hover:translate-y-[-2px] transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-blue-600 focus:ring-offset-2 ${
                            isSubmitting ? 'opacity-75 cursor-not-allowed' : ''
                        }`}
                    >
                        {isSubmitting ? (
                            <span className="flex items-center justify-center">
                                <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                </svg>
                                Processing...
                            </span>
                        ) : 'Send Reset Link'}
                    </button>
                </form>
                
                <div className="mt-8 text-center">
                    <Link 
                        href="/login" 
                        className="inline-flex items-center text-blue-600 hover:text-blue-800 font-medium"
                    >
                        <ArrowLeft className="w-4 h-4 mr-2" />
                        Back to Login
                    </Link>
                </div>
            </div>
        </div>
    );
}