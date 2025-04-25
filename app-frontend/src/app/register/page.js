"use client";
import { useState } from "react";
import Link from "next/link";
import styles from "../../styles/auth.module.css";

export default function RegisterPage() {
    const [form, setForm] = useState({
        name: "",
        email: "",
        password: "",
        confirmPassword: "",
    });
    const [error, setError] = useState("");
    const [success, setSuccess] = useState(false);

    const handleRegister = async (e) => {
        e.preventDefault();
        setError("");

        if (form.password !== form.confirmPassword) {
            setError("Passwords do not match!");
            return;
        }

        try {
            const res = await fetch("/api/auth/register", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(form),
            });

            if (res.ok) {
                setSuccess(true);
                setTimeout(() => (window.location.href = "/login"), 2000);
            } else {
                const data = await res.json();
                setError(data.message || "Registration failed");
            }
        } catch (err) {
            setError("Connection error. Please try again.");
        }
    };

    if (success) {
        return (
            <div className={styles.authContainer}>
                <div className={styles.authBox}>
                    <h2 className={styles.authSuccess}>
                        Account Created! Redirecting to Login...
                    </h2>
                </div>
            </div>
        );
    }

    return (
        <div className={styles.authContainer}>
            <div className={styles.authBox}>
                <h2 className={styles.authTitle}>Create an Account</h2>
                {error && <p className={styles.errorText}>{error}</p>}
                <form onSubmit={handleRegister}>
                    {["name", "email", "password", "confirmPassword"].map((field) => (
                        <input
                            key={field}
                            type={field === "password" || field === "confirmPassword" ? "password" : field === "email" ? "email" : "text"}
                            placeholder={field.charAt(0).toUpperCase() + field.slice(1).replace("confirmPassword", "Confirm Password")}
                            className={styles.inputField}
                            value={form[field]}
                            onChange={(e) => setForm({ ...form, [field]: e.target.value })}
                            required
                        />
                    ))}
                    <button type="submit" className={styles.submitButton}>
                        Register
                    </button>
                </form>
                <p className={styles.footerText}>
                    Already have an account?{" "}
                    <Link href="/login" className={styles.linkText}>
                        Login
                    </Link>
                </p>
            </div>
        </div>
    );
}