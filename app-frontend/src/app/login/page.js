"use client";
import { useState } from "react";
import Link from "next/link";
import { Mail, Lock, CheckCircle, AlertCircle } from 'lucide-react';
import apiClient from '../../utils/apiClient';
import Image from "next/image";

export default function LoginPage() {
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [error, setError] = useState("");
    const [success, setSuccess] = useState(false);
    /*
    const handleLogin = async (e) => {
        e.preventDefault();
        setError("");
        try {
            const res = await fetch("/api/auth/login", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ email, password }),
            });

            if (res.ok) {
                const userData = await res.json();

                // 🔒 Kullanıcı bilgilerini localStorage'a kaydet
                localStorage.setItem("user", JSON.stringify(userData));
                localStorage.setItem("isLoggedIn", "true");

                // ✔️ Sepet bilgisi zaten localStorage'ta durduğu için ayrıca taşımaya gerek yok

                setSuccess(true);
                setTimeout(() => (window.location.href = "/"), 2000);
            } else {
                const data = await res.json();
                setError(data.message || "Login failed");
            }
        } catch (err) {
            setError("Connection error. Please try again.");
        }
    };
    */
    const encryptPassword = (password) => btoa(password);
    const decryptPassword = (encryptedPassword) => atob(encryptedPassword);

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
                const redirectPath = data.user.is_staff ? "/" : "/";
                setTimeout(() => (window.location.href = redirectPath), 2000);
            } catch (err) {
                console.error('Login error:', err);
                setError(err.message || "Login failed. Please check your credentials.");
            }
        } catch (err) {
            console.error('Login error:', err);
            setError("Connection error. Please try again.");
        }
    };
    
    
    

    if (success) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-blue-600 to-indigo-900 flex items-center justify-center p-6">
                <div className="w-full max-w-md backdrop-blur-lg bg-white/90 rounded-3xl shadow-2xl p-8 transition-all duration-500 animate-fadeIn">
                    <div className="text-center">
                        <div className="mb-6 inline-flex p-4 bg-green-100 rounded-full">
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                            </svg>
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
            <div className="w-full max-w-md backdrop-blur-lg bg-white/80 rounded-3xl shadow-2xl p-8 transition-all duration-300 hover:shadow-blue-900/30 hover:border-2 hover:border-blue-400/60 border border-transparent group relative">
                {/* Logo/Icon */}
                <div className="flex justify-center mb-6">
                    <div className="bg-blue-100 rounded-full p-3 shadow-md">
                        <span className="text-3xl">🛒</span>
                    </div>
                </div>
                <div className="text-center mb-8">
                    <h2 className="text-3xl font-extrabold text-gray-800 mb-2">Welcome Back</h2>
                    <p className="text-gray-600">Sign in to your CS308 Store account</p>
                </div>
                {error && (
                    <div className="mb-6 p-4 rounded-lg bg-red-50 text-red-600 animate-[shake_0.5s_ease]">
                        <p className="flex items-center">
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" viewBox="0 0 20 20" fill="currentColor">
                                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                            </svg>
                            {error}
                        </p>
                    </div>
                )}
                <form onSubmit={handleLogin} className="space-y-6">
                    <div>
                        <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1 ml-1">Email Address</label>
                        <div className="relative">
                            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-gray-400" viewBox="0 0 20 20" fill="currentColor">
                                    <path d="M2.003 5.884L10 9.882l7.997-3.998A2 2 0 0016 4H4a2 2 0 00-1.997 1.884z" />
                                    <path d="M18 8.118l-8 4-8-4V14a2 2 0 002 2h12a2 2 0 002-2V8.118z" />
                                </svg>
                            </div>
                            <input
                                id="email"
                                type="email"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                placeholder="you@example.com"
                                required
                                className="block w-full pl-10 pr-3 py-4 border-0 rounded-xl text-gray-900 bg-gray-50 focus:ring-2 focus:ring-blue-600 focus:outline-none focus:border-blue-400 shadow-sm transition-all duration-200 focus:shadow-lg"
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
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-gray-400" viewBox="0 0 20 20" fill="currentColor">
                                    <path fillRule="evenodd" d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z" clipRule="evenodd" />
                                </svg>
                            </div>
                            <input
                                id="password"
                                type="password"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                placeholder="••••••••"
                                required
                                className="block w-full pl-10 pr-3 py-4 border-0 rounded-xl text-gray-900 bg-gray-50 focus:ring-2 focus:ring-blue-600 focus:outline-none focus:border-blue-400 shadow-sm transition-all duration-200 focus:shadow-lg"
                            />
                        </div>
                    </div>
                    <button 
                        type="submit"
                        className="w-full py-4 bg-gradient-to-r from-blue-600 to-indigo-700 text-white font-medium rounded-xl shadow-lg hover:shadow-blue-500/30 hover:translate-y-[-2px] transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-blue-600 focus:ring-offset-2"
                    >
                        Sign In
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
                {/* Slogan/Branding */}
                <div className="mt-8 text-center text-xs text-gray-400 select-none">
                    Powered by <span className="font-semibold text-blue-600">CS308 Store</span>
                </div>
            </div>
        </div>
    );
}
