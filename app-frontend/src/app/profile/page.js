"use client";
import { useState, useEffect } from "react";
import { User, Mail, MapPin, Lock, Check, X, PenLine, Shield, History, CreditCard, AlertTriangle, Loader } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import apiClient from "../../utils/apiClient";

// Simple Base64 encryption simulation (bcrypt should be used in real app)
const encryptPassword = (password) => {
    return btoa(password); // Base64 encode
};

const decryptPassword = (encryptedPassword) => {
    return atob(encryptedPassword); // Base64 decode
};

export default function ProfilePage() {
    const router = useRouter();
    const [user, setUser] = useState({
        name: "",
        email: "",
        address: "",
        password: "",
    });
    const [errors, setErrors] = useState({});
    const [isEditing, setIsEditing] = useState(false);
    const [isLoggedIn, setIsLoggedIn] = useState(false);
    const [isLoading, setIsLoading] = useState(true);
    const [authError, setAuthError] = useState("");
    const [oldPassword, setOldPassword] = useState("");
    const [oldPasswordError, setOldPasswordError] = useState("");
    const [activeTab, setActiveTab] = useState("profile");
    const [redirectCounter, setRedirectCounter] = useState(0);

    useEffect(() => {
        // Check authentication status through API
        const checkAuth = async () => {
            setIsLoading(true);
            try {
                // Make API call to check auth status
                const authStatus = await apiClient.auth.checkAuth();
                
                // If authenticated, load user profile from API
                try {
                    const profileData = await apiClient.auth.getUserProfile();
                    // Map profile data to our local user state
                    setUser({
                        name: profileData.name || profileData.username || "User",
                        email: profileData.email || "",
                        address: profileData.address || "",
                        password: ""  // We don't want to display the password
                    });
                    setIsLoggedIn(true);
                } catch (profileError) {
                    console.error("Failed to load profile:", profileError);
                    // Show auth required screen if profile fetch fails
                    setIsLoggedIn(false);
                    setAuthError("Unable to load your profile data");
                }
            } catch (error) {
                console.error("Authentication check failed:", error);
                setIsLoggedIn(false);
                setAuthError("Your session has expired or you're not logged in");
            } finally {
                setIsLoading(false);
            }
        };

        checkAuth();
    }, []);

    // Auto-redirect effect
    useEffect(() => {
        if (!isLoggedIn && !isLoading) {
            // Start countdown from 3
            setRedirectCounter(3);
            
            const countdownInterval = setInterval(() => {
                setRedirectCounter(prev => {
                    if (prev <= 1) {
                        clearInterval(countdownInterval);
                        router.push('/login');
                        return 0;
                    }
                    return prev - 1;
                });
            }, 1000);

            return () => clearInterval(countdownInterval);
        }
    }, [isLoggedIn, isLoading, router]);

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

    const handleUpdate = async () => {
        if (!validateForm()) return;

        // For password change, verify old password
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

        // In a real app, this would call the API to update the profile
        try {
            // Mock API call
            // await apiClient.auth.updateProfile(user);
            
            // For now, update localStorage
            const updatedUser = {
                ...user,
                password: user.password ? encryptPassword(user.password) : "",
            };
            localStorage.setItem("user", JSON.stringify(updatedUser));
            setIsEditing(false);
            setOldPassword("");
            setOldPasswordError("");
            alert("Profile updated successfully!");
        } catch (error) {
            console.error("Failed to update profile:", error);
            alert("Failed to update profile. Please try again.");
        }
    };

    const InputField = ({ icon: Icon, type, name, value, onChange, error, disabled }) => (
        <div className="relative mb-6">
            <label htmlFor={name} className="block text-sm font-medium text-gray-700 mb-1">
                {name.charAt(0).toUpperCase() + name.slice(1)}
            </label>
            <div className={`flex items-center rounded-md shadow-sm overflow-hidden border ${error ? 'border-red-500' : 'border-gray-300'}`}>
                <div className="pl-3 bg-gray-50 border-r border-gray-300 text-gray-500">
                    <Icon size={20} />
                </div>
                <input
                    id={name}
                    type={type}
                    name={name}
                    value={value}
                    onChange={onChange}
                    placeholder={`Enter your ${name}`}
                    className={`block w-full py-3 px-4 focus:ring-blue-500 focus:border-blue-500 ${disabled ? 'bg-gray-100' : 'bg-white'}`}
                    disabled={disabled}
                />
            </div>
            {error && <p className="mt-1 text-sm text-red-600">{error}</p>}
        </div>
    );

    if (isLoading) {
        return (
            <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8 flex items-center justify-center">
                <div className="flex flex-col items-center">
                    <Loader className="h-10 w-10 text-blue-600 animate-spin mb-4" />
                    <p className="text-gray-600">Verifying your account...</p>
                </div>
            </div>
        );
    }

    if (!isLoggedIn) {
        return (
            <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8 flex items-center justify-center">
                <div className="max-w-md w-full bg-white rounded-xl shadow-lg p-8 animate-fadeIn">
                    <div className="text-center">
                        <div className="mx-auto flex items-center justify-center h-16 w-16 rounded-full bg-amber-100">
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-amber-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                            </svg>
                        </div>
                        <h2 className="mt-4 text-2xl font-bold text-gray-900">Authentication Required</h2>
                        <p className="mt-2 text-gray-600 mb-6">
                            Please sign in to continue with your purchase
                        </p>
                    </div>
                    <div className="space-y-4">
                        <Link
                            href="/login"
                            className="w-full flex items-center justify-center py-3 px-4 border border-transparent rounded-md shadow-sm text-base font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors"
                        >
                            Sign In {redirectCounter > 0 && `(${redirectCounter})`}
                        </Link>
                        <Link
                            href="/"
                            className="w-full flex items-center justify-center py-3 px-4 border border-gray-300 rounded-md shadow-sm text-base font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors"
                        >
                            Return to Home
                        </Link>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
            <div className="max-w-6xl mx-auto">
                <div className="flex flex-col md:flex-row">
                    {/* Sidebar */}
                    <div className="w-full md:w-64 bg-white rounded-xl shadow-sm p-6 mb-6 md:mb-0 md:mr-6">
                        <div className="mb-8 text-center">
                            <div className="w-20 h-20 rounded-full bg-gray-200 mx-auto mb-4 flex items-center justify-center">
                                <span className="text-2xl font-bold text-gray-600">
                                    {user.name.split(' ').map(n => n[0]).join('')}
                                </span>
                            </div>
                            <h3 className="text-lg font-medium text-gray-900">{user.name}</h3>
                            <p className="text-sm text-gray-500">{user.email}</p>
                        </div>
                        
                        <nav className="space-y-1">
                            <button
                                onClick={() => setActiveTab("profile")}
                                className={`w-full flex items-center px-3 py-3 text-sm font-medium rounded-md ${
                                    activeTab === "profile" 
                                        ? "bg-blue-50 text-blue-700" 
                                        : "text-gray-700 hover:bg-gray-100"
                                }`}
                            >
                                <User className="mr-3 h-5 w-5" />
                                <span>Profile</span>
                            </button>
                            
                            <button
                                onClick={() => setActiveTab("orders")}
                                className={`w-full flex items-center px-3 py-3 text-sm font-medium rounded-md ${
                                    activeTab === "orders" 
                                        ? "bg-blue-50 text-blue-700" 
                                        : "text-gray-700 hover:bg-gray-100"
                                }`}
                            >
                                <History className="mr-3 h-5 w-5" />
                                <span>Order History</span>
                            </button>
                            
                            <button
                                onClick={() => setActiveTab("payment")}
                                className={`w-full flex items-center px-3 py-3 text-sm font-medium rounded-md ${
                                    activeTab === "payment" 
                                        ? "bg-blue-50 text-blue-700" 
                                        : "text-gray-700 hover:bg-gray-100"
                                }`}
                            >
                                <CreditCard className="mr-3 h-5 w-5" />
                                <span>Payment Methods</span>
                            </button>
                            
                            <button
                                onClick={() => setActiveTab("security")}
                                className={`w-full flex items-center px-3 py-3 text-sm font-medium rounded-md ${
                                    activeTab === "security" 
                                        ? "bg-blue-50 text-blue-700" 
                                        : "text-gray-700 hover:bg-gray-100"
                                }`}
                            >
                                <Shield className="mr-3 h-5 w-5" />
                                <span>Security</span>
                            </button>
                        </nav>
                    </div>

                    {/* Main Content */}
                    <div className="flex-1">
                        {activeTab === "profile" && (
                            <div className="bg-white rounded-xl shadow-sm overflow-hidden">
                                <div className="flex justify-between items-center border-b border-gray-200 px-6 py-4">
                                    <h2 className="text-xl font-semibold text-gray-900">Personal Information</h2>
                                    
                                    {!isEditing ? (
                                        <button
                                            onClick={() => setIsEditing(true)}
                                            className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                                        >
                                            <PenLine className="mr-2 h-4 w-4" />
                                            Edit Profile
                                        </button>
                                    ) : (
                                        <div className="flex gap-2">
                                            <button
                                                onClick={handleUpdate}
                                                className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
                                            >
                                                <Check className="mr-2 h-4 w-4" />
                                                Save
                                            </button>
                                            <button
                                                onClick={() => {
                                                    setIsEditing(false);
                                                    setOldPassword("");
                                                    setOldPasswordError("");
                                                }}
                                                className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                                            >
                                                <X className="mr-2 h-4 w-4" />
                                                Cancel
                                            </button>
                                        </div>
                                    )}
                                </div>
                                
                                <div className="p-6">
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

                                    {isEditing && (
                                        <>
                                            <div className="mt-8 mb-4">
                                                <h3 className="text-lg font-medium text-gray-900">Change Password</h3>
                                                <p className="text-sm text-gray-500 mt-1">
                                                    Leave blank if you don't want to change your password
                                                </p>
                                            </div>
                                            
                                            <div className="relative mb-6">
                                                <label htmlFor="oldPassword" className="block text-sm font-medium text-gray-700 mb-1">
                                                    Current Password
                                                </label>
                                                <div className={`flex items-center rounded-md shadow-sm overflow-hidden border ${oldPasswordError ? 'border-red-500' : 'border-gray-300'}`}>
                                                    <div className="pl-3 bg-gray-50 border-r border-gray-300 text-gray-500">
                                                        <Lock size={20} />
                                                    </div>
                                                    <input
                                                        id="oldPassword"
                                                        type="password"
                                                        value={oldPassword}
                                                        onChange={(e) => {
                                                            setOldPassword(e.target.value);
                                                            if (oldPasswordError) setOldPasswordError("");
                                                        }}
                                                        placeholder="Enter your current password"
                                                        className="block w-full py-3 px-4 focus:ring-blue-500 focus:border-blue-500 bg-white"
                                                    />
                                                </div>
                                                {oldPasswordError && <p className="mt-1 text-sm text-red-600">{oldPasswordError}</p>}
                                            </div>
                                            
                                            <InputField
                                                icon={Lock}
                                                type="password"
                                                name="password"
                                                value={user.password}
                                                onChange={handleChange}
                                                error={errors.password}
                                                disabled={false}
                                            />
                                        </>
                                    )}
                                </div>
                            </div>
                        )}
                        
                        {activeTab === "orders" && (
                            <div className="bg-white rounded-xl shadow-sm overflow-hidden">
                                <div className="px-6 py-4 border-b border-gray-200">
                                    <h2 className="text-xl font-semibold text-gray-900">Order History</h2>
                                </div>
                                <div className="p-6">
                                    <p className="text-gray-500 text-center py-12">Your order history will appear here.</p>
                                </div>
                            </div>
                        )}
                        
                        {activeTab === "payment" && (
                            <div className="bg-white rounded-xl shadow-sm overflow-hidden">
                                <div className="px-6 py-4 border-b border-gray-200">
                                    <h2 className="text-xl font-semibold text-gray-900">Payment Methods</h2>
                                </div>
                                <div className="p-6">
                                    <p className="text-gray-500 text-center py-12">Your payment methods will appear here.</p>
                                </div>
                            </div>
                        )}
                        
                        {activeTab === "security" && (
                            <div className="bg-white rounded-xl shadow-sm overflow-hidden">
                                <div className="px-6 py-4 border-b border-gray-200">
                                    <h2 className="text-xl font-semibold text-gray-900">Security Settings</h2>
                                </div>
                                <div className="p-6">
                                    <p className="text-gray-500 text-center py-12">Your security settings will appear here.</p>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}