"use client";
import { useState } from "react";
import Link from "next/link";
import { api } from '../../lib/api';

export default function LoginPage() {
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [error, setError] = useState("");
    const [success, setSuccess] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);

    const handleLogin = async (e) => {
        e.preventDefault();
        setError("");
        try {
            console.log('Attempting login with:', { email, password });
            
            try {
                const data = await api.auth.login({ email, password });
                console.log('Login response data:', data);

                // Store user data in localStorage and set cookie
                localStorage.setItem("user", JSON.stringify(data.user));
                localStorage.setItem("isLoggedIn", "true");
                
                // Set additional cookies to ensure auth state is preserved
                document.cookie = `userSession=${data.user.id}; path=/; max-age=86400`; // 24 hours
                document.cookie = `isAuthenticated=true; path=/; max-age=86400`; // 24 hours
                
                // Set user cookie
                document.cookie = `user=${JSON.stringify(data.user)}; path=/; max-age=86400`; // 24 hours
                
                // If there's a CSRF token, also set it
                if (data.csrftoken) {
                    document.cookie = `csrftoken=${data.csrftoken}; path=/; max-age=86400`;
                } else {
                    // The CSRF token might be extracted from the response instead
                    const csrfToken = document.querySelector('meta[name="csrf-token"]')?.getAttribute('content');
                    if (csrfToken) {
                        document.cookie = `csrftoken=${csrfToken}; path=/; max-age=86400`;
                    }
                }
                
                setSuccess(true);

                // Redirect based on user type
                const redirectPath = data.user.is_staff ? "/admin/dashboard" : "/profile";
                setTimeout(() => (window.location.href = redirectPath), 2000);
            } catch (err) {
                console.error('Login error:', err);
                setError(err.message || "Login failed. Please check your credentials.");
            }
        } catch (err) {
            console.error('Login error:', err);
            setError(err.message || "Connection error. Please try again.");
        } finally {
            setIsSubmitting(false);
        }
    };

    if (success) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-blue-600 to-indigo-900 flex items-center justify-center p-6">
                <div className="w-full max-w-md backdrop-blur-lg bg-white/90 rounded-3xl shadow-2xl p-8 transition-all duration-500 animate-fadeIn">
                    <div className="text-center">
                        <div className="mb-6 inline-flex p-4 bg-green-100 rounded-full">
                            <CheckCircle className="h-12 w-12 text-green-600" />
                        </div>
                        <h2 className="text-3xl font-bold text-gray-800 mb-2">Welcome Back!</h2>
                        <p className="text-gray-600">You&apos;ve successfully logged in. Redirecting you now...</p>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-blue-600 to-indigo-900 flex items-center justify-center p-6">
            <div className="w-full max-w-md backdrop-blur-lg bg-white/90 rounded-3xl shadow-2xl p-8 transition-all duration-300 hover:shadow-blue-900/20">
                <div className="text-center mb-8">
                    <h2 className="text-3xl font-extrabold text-gray-800 mb-2">Welcome Back</h2>
                    <p className="text-gray-600">Sign in to your CS308 Store account</p>
                </div>
                
                {error && (
                    <div className="mb-6 p-4 rounded-lg bg-red-50 text-red-600 animate-[shake_0.5s_ease] flex items-start">
                        <AlertCircle className="h-5 w-5 mr-2 flex-shrink-0 mt-0.5" />
                        <p>{error}</p>
                    </div>
                )}
                
                <form onSubmit={handleLogin} className="space-y-6">
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
                    
                    <div>
                        <div className="flex items-center justify-between mb-1">
                            <label htmlFor="password" className="block text-sm font-medium text-gray-700 ml-1">Password</label>
                            <Link href="/forgot-password" className="text-sm text-blue-600 hover:text-blue-800 font-medium">
                                Forgot Password?
                            </Link>
                        </div>
                        <div className="relative">
                            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                <Lock className="h-5 w-5 text-gray-400" />
                            </div>
                            <input
                                id="password"
                                type="password"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
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
                        ) : 'Sign In'}
                    </button>
                </form>
                
                <div className="mt-8 text-center">
                    <p className="text-gray-700">
                        Don&apos;t have an account?{" "}
                        <Link href="/register" className="text-blue-600 hover:text-blue-800 font-medium">
                            Create an account
                        </Link>
                    </p>
                </div>
            </div>
        </div>
    );
}
