/*

"use client";
import { useState } from "react";
import Link from "next/link";
import styles from "@/styles/auth.module.css";

export default function AdminLoginPage() {
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [error, setError] = useState("");
    const [success, setSuccess] = useState(false);

    const handleLogin = async (e) => {
        e.preventDefault();
        setError("");
        try {
            const res = await fetch("/api/auth/admin-login", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ email, password }),
            });
            if (res.ok) {
                setSuccess(true);
                // Redirect to the admin dashboard after a brief delay.
                setTimeout(() => (window.location.href = "/admin/dashboard"), 2000);
            } else {
                const data = await res.json();
                setError(data.message || "Login failed");
            }
        } catch (err) {
            setError("Connection error. Please try again.");
        }
    };

    if (success) {
        return (
            <div className={styles.authContainer}>
                <div className={styles.authBox}>
                    <h2 className={styles.authSuccess}>Welcome, Admin!</h2>
                </div>
            </div>
        );
    }

    return (
        <div className={styles.authContainer}>
            <div className={styles.authBox}>
                <h2 className={styles.authTitle}>Admin Login - CS308 Store</h2>
                {error && <p className={styles.errorText}>{error}</p>}
                <form onSubmit={handleLogin}>
                    <input
                        className={styles.inputField}
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder="Admin Email"
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
                        <button type="submit" className={styles.submitButton}>
                            Login
                        </button>
                    </div>
                </form>
                <p className={styles.footerText}>
                    Return to{" "}
                    <Link href="/" className={styles.linkText}>
                        Home
                    </Link>
                </p>
            </div>
        </div>
    );
}
*/

"use client";
import { useState } from "react";
import Link from "next/link";
import styles from "../../../styles/auth.module.css";

export default function LoginPage() {
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [error, setError] = useState("");
    const [success, setSuccess] = useState(false);

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
                const userData = await res.json(); // expect { name, role, ... }

                // Save user or admin data in localStorage
                if (userData.role === "user") {
                    localStorage.setItem("user", JSON.stringify(userData));
                    localStorage.setItem("isLoggedIn", "true");
                    setSuccess(true);
                    setTimeout(() => (window.location.href = "/profile"), 2000);
                } else if (userData.role === "product-manager") {
                    localStorage.setItem("admin", JSON.stringify(userData));
                    localStorage.setItem("adminRole", "product-manager");
                    setSuccess(true);
                    setTimeout(() => (window.location.href = "/admin/product-manager/products"), 2000);
                } else if (userData.role === "sales-manager") {
                    localStorage.setItem("admin", JSON.stringify(userData));
                    localStorage.setItem("adminRole", "sales-manager");
                    setSuccess(true);
                    setTimeout(() => (window.location.href = "/admin/sales-manager/prices"), 2000);
                } else {
                    setError("Unknown role.");
                }
            } else {
                const data = await res.json();
                setError(data.message || "Login failed");
            }
        } catch (err) {
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
                <h2 className={styles.authTitle}>Login - CS308 Store</h2>
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
