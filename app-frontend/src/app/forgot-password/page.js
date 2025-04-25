"use client";
import { useState } from "react";
import Link from "next/link";
import styles from "../../styles/auth.module.css";

export default function ForgotPasswordPage() {
    const [email, setEmail] = useState("");
    const [message, setMessage] = useState("");

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            const res = await fetch("/api/auth/forgot-password", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ email }),
            });

            if (res.ok) {
                setMessage("Check your email for reset link.");
            } else {
                setMessage("Email not found.");
            }
        } catch (err) {
            setMessage("Connection error. Please try again.");
        }
    };

    return (
        <div className={styles.authContainer}>
            <div className={styles.authBox}>
                <h2 className={styles.authTitle}>Reset Your Password</h2>
                {message && (
                    <p className={message.includes("found") || message.includes("error") ? styles.errorText : styles.successText}>
                        {message}
                    </p>
                )}
                <form onSubmit={handleSubmit}>
                    <input
                        type="email"
                        placeholder="Enter your email"
                        className={styles.inputField}
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        required
                    />
                    <button type="submit" className={styles.submitButton}>
                        Send Reset Link
                    </button>
                </form>
                <p className={styles.footerText}>
                    Remembered your password?{" "}
                    <Link href="/login" className={styles.linkText}>
                        Login
                    </Link>
                </p>
            </div>
        </div>
    );
}