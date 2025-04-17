"use client";
import { useState, useEffect } from "react";
import { User, Mail, MapPin, Lock, Check, X } from "lucide-react";
import styles from "../../styles/profile.module.css";

// Basit bir Base64 şifreleme simülasyonu (gerçek uygulamada bcrypt gibi bir yöntem kullanılmalı)
const encryptPassword = (password) => {
    console.log("Encrypting password:", password);
    return btoa(password); // Base64 encode
};

const decryptPassword = (encryptedPassword) => {
    console.log("Decrypting password:", encryptedPassword);
    return atob(encryptedPassword); // Base64 decode
};

export default function ProfilePage() {
    const [user, setUser] = useState({
        name: "",
        email: "",
        address: "",
        password: "",
    });
    const [errors, setErrors] = useState({});
    const [isEditing, setIsEditing] = useState(false);
    const [isLoggedIn, setIsLoggedIn] = useState(false);
    const [oldPassword, setOldPassword] = useState("");
    const [oldPasswordError, setOldPasswordError] = useState("");

    useEffect(() => {
        // Simüle edilmiş giriş kontrolü
        const loggedIn = localStorage.getItem("isLoggedIn") === "true";
        setIsLoggedIn(loggedIn);

        if (!loggedIn) return;

        // Kullanıcı verilerini localStorage'dan yükle
        const storedUser = JSON.parse(localStorage.getItem("user")) || {
            name: "John Doe",
            email: "john@example.com",
            address: "123 Main St",
            password: encryptPassword("password123"), // Varsayılan parola şifrelenmiş
        };

        // Parolayı çözerek kullanıcıya göster
        setUser({
            ...storedUser,
            password: storedUser.password ? decryptPassword(storedUser.password) : "",
        });
    }, []);

    const validateForm = () => {
        const newErrors = {};

        if (!user.name.trim()) {
            newErrors.name = "Name is required";
        }

        if (!user.email.trim()) {
            newErrors.email = "Email is required";
        } else if (!/\S+@\S+\.\S+/.test(user.email)) {
            newErrors.email = "Email is invalid";
        }

        if (!user.address.trim()) {
            newErrors.address = "Address is required";
        }

        if (isEditing && user.password && user.password.length < 6) {
            newErrors.password = "Password must be at least 6 characters";
        }

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleChange = (e) => {
        const { name, value } = e.target;
        setUser((prev) => ({ ...prev, [name]: value }));

        if (errors[name]) {
            setErrors((prev) => ({ ...prev, [name]: "" }));
        }
    };

    const handleUpdate = () => {
        if (!validateForm()) return;

        if (isEditing && user.password) {
            const storedUser = JSON.parse(localStorage.getItem("user"));
            const storedPassword = storedUser?.password
                ? decryptPassword(storedUser.password)
                : "password123";

            if (oldPassword !== storedPassword) {
                setOldPasswordError("Old password is incorrect");
                return;
            }
        }

        // Parolayı şifreleyerek kaydet
        const updatedUser = {
            ...user,
            password: user.password ? encryptPassword(user.password) : "",
        };
        localStorage.setItem("user", JSON.stringify(updatedUser));
        setIsEditing(false);
        setOldPassword("");
        setOldPasswordError("");
        alert("Profile updated successfully!");
    };

    const InputField = ({ icon: Icon, type, name, value, onChange, error, disabled }) => (
        <div className={styles.inputWrapper}>
            <div className={styles.inputGroup}>
                {Icon && <Icon className={styles.inputIcon} />}
                <input
                    type={type}
                    name={name}
                    value={value}
                    onChange={onChange}
                    placeholder={`Enter your ${name}`}
                    className={`${styles.input} ${error ? styles.inputError : ""}`}
                    disabled={disabled}
                />
            </div>
            {error && <span className={styles.errorText}>{error}</span>}
        </div>
    );

    if (!isLoggedIn) {
        return (
            <div className={styles.profileContainer}>
                <div className={styles.profileCard}>
                    <h1>Please Log In</h1>
                    <p>You need to be logged in to view this page.</p>
                    <button
                        onClick={() => {
                            localStorage.setItem("isLoggedIn", "true");
                            setIsLoggedIn(true);
                        }}
                        className={styles.editButton}
                    >
                        Log In (Simulated)
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className={styles.profileContainer}>
            <div className={styles.profileCard}>
                <div className={styles.profileHeader}>
                    <h1>My Profile</h1>
                    <div className={styles.editToggle}>
                        {!isEditing ? (
                            <button
                                onClick={() => setIsEditing(true)}
                                className={styles.editButton}
                            >
                                Edit Profile
                            </button>
                        ) : (
                            <div className={styles.editActions}>
                                <button onClick={handleUpdate} className={styles.saveButton}>
                                    <Check /> Save
                                </button>
                                <button
                                    onClick={() => {
                                        setIsEditing(false);
                                        setErrors({});
                                        setOldPassword("");
                                        setOldPasswordError("");
                                    }}
                                    className={styles.cancelButton}
                                >
                                    <X /> Cancel
                                </button>
                            </div>
                        )}
                    </div>
                </div>

                <form className={styles.profileForm}>
                    <InputField
                        icon={User}
                        type="text"
                        name="name"
                        value={user.name}
                        onChange={handleChange}
                        error={errors.name}
                        disabled={!isEditing}
                    />

                    <InputField
                        icon={Mail}
                        type="email"
                        name="email"
                        value={user.email}
                        onChange={handleChange}
                        error={errors.email}
                        disabled={!isEditing}
                    />

                    <InputField
                        icon={MapPin}
                        type="text"
                        name="address"
                        value={user.address}
                        onChange={handleChange}
                        error={errors.address}
                        disabled={!isEditing}
                    />

                    <InputField
                        icon={Lock}
                        type="password"
                        name="password"
                        value={user.password}
                        onChange={handleChange}
                        error={errors.password}
                        disabled={!isEditing}
                    />
                </form>
            </div>
        </div>
    );
}