"use client";
import { useState } from "react";
import Link from "next/link";
import styles from "@/styles/auth.module.css";

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
            
            // First get CSRF token
            const csrfResponse = await fetch("http://localhost:8000/api/auth/login/", {
                method: "GET",
                credentials: "include",
            });
            
            const res = await fetch("http://localhost:8000/api/auth/login/", {
                method: "POST",
                headers: { 
                    "Content-Type": "application/json",
                    "Accept": "application/json",
                    "X-CSRFToken": document.cookie.split('; ')
                        .find(row => row.startsWith('csrftoken='))
                        ?.split('=')[1] || '',
                },
                credentials: "include",
                body: JSON.stringify({ email, password }),
            });

            console.log('Login response status:', res.status);
            const data = await res.json();
            console.log('Login response data:', data);

            if (res.ok) {
                // Store user data in localStorage and set cookie
                localStorage.setItem("user", JSON.stringify(data));
                localStorage.setItem("isLoggedIn", "true");
                
                // Set user cookie
                document.cookie = `user=${JSON.stringify(data)}; path=/; max-age=86400`; // 24 hours
                
                setSuccess(true);

                // Redirect based on user type
                const redirectPath = data.is_staff ? "/admin/dashboard" : "/profile";
                setTimeout(() => (window.location.href = redirectPath), 2000);
            } else {
                setError(data.error || "Login failed. Please check your credentials.");
            }
        } catch (err) {
            console.error('Login error:', err);
            setError("Connection error. Please try again.");
        }
    };
    
    
    

    if (success) {
        return (
            <div className={styles.authContainer}>
                <div className={styles.authBox}>
                    <h2 className={styles.authSuccess}>Welcome back!</h2>
                </div>
            </div>
        );
    }

    return (
        <div className={styles.authContainer}>
            <div className={styles.authBox}>
                <h2 className={styles.authTitle}>Login to CS308 Store</h2>
                {error && <p className={styles.errorText}>{error}</p>}
                <form onSubmit={handleLogin}>
                    <input
                        className={styles.inputField}
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder="Email"
                        type="email"
                        required
                    />
                    <input
                        className={styles.inputField}
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        placeholder="Password"
                        type="password"
                        required
                    />
                    <div className={styles.formActions}>
                        <Link href="/forgot-password" className={styles.linkText}>
                            Forgot Password?
                        </Link>
                        <button type="submit" className={styles.submitButton}>
                            Login
                        </button>
                    </div>
                </form>
                <p className={styles.footerText}>
                    Don't have an account?{" "}
                    <Link href="/register" className={styles.linkText}>
                        Register
                    </Link>
                </p>
            </div>
        </div>
    );
}
