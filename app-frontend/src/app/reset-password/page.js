"use client";
import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { Lock, Eye, EyeOff, CheckCircle, AlertCircle, ArrowLeft } from 'lucide-react';

export default function ResetPasswordPage() {
    const [password, setPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");
    const [showPassword, setShowPassword] = useState(false);
    const [status, setStatus] = useState({ type: null, message: "" });
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [tokenValid, setTokenValid] = useState(true);
    const [isComplete, setIsComplete] = useState(false);

    const router = useRouter();
    const searchParams = useSearchParams();
    const token = searchParams?.get('token');

    // Validate token when component mounts
    useEffect(() => {
        if (!token) {
            setTokenValid(false);
            setStatus({
                type: "error",
                message: "Invalid or missing reset token. Please request a new password reset link."
            });
            return;
        }

        // For demo purposes - in a real app, you would verify the token with your API
        // This is just a placeholder simulation
        const validateToken = async () => {
            try {
                // Simulate API call to validate token
                await new Promise(resolve => setTimeout(resolve, 500));
                
                // For demo, we'll pretend the token is valid if it's at least 10 chars
                if (token.length < 10) {
                    setTokenValid(false);
                    setStatus({
                        type: "error",
                        message: "Reset token has expired or is invalid. Please request a new password reset link."
                    });
                }
                
                // In a real implementation, you would call your API:
                // const res = await fetch("/api/auth/validate-reset-token", {
                //     method: "POST",
                //     headers: { "Content-Type": "application/json" },
                //     body: JSON.stringify({ token }),
                // });
                //
                // if (!res.ok) {
                //     setTokenValid(false);
                //     const data = await res.json();
                //     setStatus({
                //         type: "error",
                //         message: data.message || "Invalid or expired token."
                //     });
                // }
            } catch (err) {
                setTokenValid(false);
                setStatus({
                    type: "error",
                    message: "Error validating reset token. Please try again."
                });
            }
        };

        validateToken();
    }, [token]);

    const handleSubmit = async (e) => {
        e.preventDefault();
        
        // Validate passwords match
        if (password !== confirmPassword) {
            setStatus({
                type: "error",
                message: "Passwords do not match. Please try again."
            });
            return;
        }

        // Password strength validation
        if (password.length < 8) {
            setStatus({
                type: "error",
                message: "Password must be at least 8 characters long."
            });
            return;
        }

        setIsSubmitting(true);
        setStatus({ type: null, message: "" });

        try {
            // For demo purposes - replace with actual API call
            await new Promise(resolve => setTimeout(resolve, 1000));
            
            // Simulate successful password reset
            setIsComplete(true);
            setStatus({
                type: "success",
                message: "Your password has been successfully reset."
            });
            
            // In a real implementation, you would call your API:
            // const res = await fetch("/api/auth/reset-password", {
            //     method: "POST",
            //     headers: { "Content-Type": "application/json" },
            //     body: JSON.stringify({ token, password }),
            // });
            //
            // if (res.ok) {
            //     setIsComplete(true);
            //     setStatus({
            //         type: "success",
            //         message: "Your password has been successfully reset."
            //     });
            // } else {
            //     const data = await res.json();
            //     setStatus({
            //         type: "error",
            //         message: data.message || "Failed to reset password."
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

    // User is redirected to login after success
    const handleRedirectToLogin = () => {
        router.push('/login');
    };

    // Success state
    if (isComplete) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-blue-600 to-indigo-900 flex items-center justify-center p-6">
                <div className="w-full max-w-md backdrop-blur-lg bg-white/90 rounded-3xl shadow-2xl p-8 transition-all duration-500 animate-fadeIn">
                    <div className="text-center">
                        <div className="mb-6 inline-flex p-4 bg-green-100 rounded-full">
                            <CheckCircle className="h-12 w-12 text-green-600" />
                        </div>
                        <h2 className="text-3xl font-bold text-gray-800 mb-2">Password Reset Complete</h2>
                        <p className="text-gray-600 mb-6">
                            {status.message} You can now log in with your new password.
                        </p>
                        <button 
                            onClick={handleRedirectToLogin}
                            className="px-6 py-3 bg-gradient-to-r from-blue-600 to-indigo-700 text-white font-medium rounded-xl shadow-lg hover:shadow-blue-500/30 hover:translate-y-[-2px] transition-all duration-200"
                        >
                            Go to Login
                        </button>
                    </div>
                </div>
            </div>
        );
    }

    // Invalid token state
    if (!tokenValid) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-blue-600 to-indigo-900 flex items-center justify-center p-6">
                <div className="w-full max-w-md backdrop-blur-lg bg-white/90 rounded-3xl shadow-2xl p-8">
                    <div className="text-center">
                        <div className="mb-6 inline-flex p-4 bg-red-100 rounded-full">
                            <AlertCircle className="h-12 w-12 text-red-600" />
                        </div>
                        <h2 className="text-3xl font-bold text-gray-800 mb-2">Invalid Reset Link</h2>
                        <p className="text-gray-600 mb-6">
                            {status.message}
                        </p>
                        <Link 
                            href="/forgot-password" 
                            className="px-6 py-3 bg-gradient-to-r from-blue-600 to-indigo-700 text-white font-medium rounded-xl shadow-lg hover:shadow-blue-500/30 hover:translate-y-[-2px] transition-all duration-200 inline-block"
                        >
                            Request New Link
                        </Link>
                    </div>
                </div>
            </div>
        );
    }

    // Main form
    return (
        <div className="min-h-screen bg-gradient-to-br from-blue-600 to-indigo-900 flex items-center justify-center p-6">
            <div className="w-full max-w-md backdrop-blur-lg bg-white/90 rounded-3xl shadow-2xl p-8 transition-all duration-300 hover:shadow-blue-900/20">
                <div className="text-center mb-8">
                    <h2 className="text-3xl font-extrabold text-gray-800 mb-2">Reset Your Password</h2>
                    <p className="text-gray-600">Create a new secure password</p>
                </div>
                
                {status.type === "error" && (
                    <div className="mb-6 p-4 rounded-lg bg-red-50 text-red-600 animate-[shake_0.5s_ease] flex items-start">
                        <AlertCircle className="h-5 w-5 mr-2 flex-shrink-0 mt-0.5" />
                        <p>{status.message}</p>
                    </div>
                )}
                
                <form onSubmit={handleSubmit} className="space-y-6">
                    <div>
                        <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1 ml-1">New Password</label>
                        <div className="relative">
                            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                <Lock className="h-5 w-5 text-gray-400" />
                            </div>
                            <input
                                id="password"
                                type={showPassword ? "text" : "password"}
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                placeholder="••••••••"
                                required
                                className="block w-full pl-10 pr-10 py-4 border-0 rounded-xl text-gray-900 bg-gray-50 focus:ring-2 focus:ring-blue-600 shadow-sm"
                            />
                            <button
                                type="button"
                                className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600"
                                onClick={() => setShowPassword(!showPassword)}
                            >
                                {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                            </button>
                        </div>
                        <p className="text-xs text-gray-500 mt-1 ml-1">
                            Password must be at least 8 characters long
                        </p>
                    </div>
                    
                    <div>
                        <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700 mb-1 ml-1">Confirm Password</label>
                        <div className="relative">
                            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                <Lock className="h-5 w-5 text-gray-400" />
                            </div>
                            <input
                                id="confirmPassword"
                                type={showPassword ? "text" : "password"}
                                value={confirmPassword}
                                onChange={(e) => setConfirmPassword(e.target.value)}
                                placeholder="••••••••"
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
                        ) : 'Reset Password'}
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