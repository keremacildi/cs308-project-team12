"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Search, ShoppingCart, Heart, User, Package, LogOut } from "lucide-react";
import { api } from "../lib/api";

export default function Header() {
  const router = useRouter();
  const [searchInput, setSearchInput] = useState("");
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [user, setUser] = useState(null);

  useEffect(() => {
    // Check if user is logged in
    const userJson = localStorage.getItem("user");
    const loggedInStatus = localStorage.getItem("isLoggedIn") === "true";
    setIsLoggedIn(loggedInStatus);
    
    if (userJson) {
      try {
        setUser(JSON.parse(userJson));
      } catch (e) {
        console.error("Error parsing user data:", e);
      }
    }
  }, []);

  const handleSearch = async (e) => {
    e.preventDefault();
    router.push(`/search?q=${encodeURIComponent(searchInput)}`);
  };

  const handleLogout = async () => {
    try {
      await api.auth.logout();
      // Refresh the page after logout
      window.location.href = "/";
    } catch (error) {
      console.error("Logout failed:", error);
    }
  };

  return (
    <header className="sticky top-0 z-50 w-full bg-primary text-white shadow-md">
      <div className="container mx-auto px-4 py-3 flex flex-wrap items-center justify-between">
        <Link href="/" className="flex items-center space-x-2 text-xl md:text-2xl font-bold">
          <span className="text-2xl">🛒</span>
          <span>CS308 Store</span>
        </Link>
        
        <nav className="hidden md:flex items-center space-x-6">
          <Link href="/" className="text-white hover:text-blue-100 transition font-medium">
            Home
          </Link>
          <Link href="/products" className="text-white hover:text-blue-100 transition font-medium">
            Products
          </Link>
          <Link href="/cart" className="text-white hover:text-blue-100 transition font-medium flex items-center">
            <ShoppingCart className="w-4 h-4 mr-1" />
            Cart
          </Link>
          <Link href="/wishlist" className="text-white hover:text-blue-100 transition font-medium flex items-center">
            <Heart className="w-4 h-4 mr-1" />
            Wishlist
          </Link>
          {isLoggedIn && (
            <>
              <Link href="/profile" className="text-white hover:text-blue-100 transition font-medium flex items-center">
                <User className="w-4 h-4 mr-1" />
                Profile
              </Link>
              <Link href="/orders" className="text-white hover:text-blue-100 transition font-medium flex items-center">
                <Package className="w-4 h-4 mr-1" />
                Orders
              </Link>
            </>
          )}
          
          {isLoggedIn ? (
            <button 
              onClick={handleLogout} 
              className="bg-white text-primary hover:bg-blue-50 px-4 py-1.5 rounded-full font-medium transition-colors flex items-center"
            >
              <LogOut className="w-4 h-4 mr-1" />
              Logout
            </button>
          ) : (
            <Link href="/login" className="bg-white text-primary hover:bg-blue-50 px-4 py-1.5 rounded-full font-medium transition-colors">
              Login
            </Link>
          )}
        </nav>
        
        <form onSubmit={handleSearch} className="relative w-full md:w-auto mt-4 md:mt-0 order-3 md:order-2">
          <div className="relative flex items-center">
            <input 
              type="text" 
              placeholder="Search products..." 
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              className="w-full md:w-64 bg-white/10 text-white placeholder-blue-100 px-4 py-2 rounded-full border border-blue-400 focus:outline-none focus:ring-2 focus:ring-white"
            />
            <button 
              type="submit" 
              className="absolute right-2 text-blue-100 hover:text-white transition"
              aria-label="Search"
            >
              <Search className="w-5 h-5" />
            </button>
          </div>
        </form>
        
        {/* Mobile Navigation */}
        <div className="flex md:hidden items-center space-x-4 order-2 md:order-3">
          <Link href="/cart" className="text-white" aria-label="Cart">
            <ShoppingCart className="w-6 h-6" />
          </Link>
          <Link href="/wishlist" className="text-white" aria-label="Wishlist">
            <Heart className="w-6 h-6" />
          </Link>
          {isLoggedIn ? (
            <div className="flex items-center space-x-2">
              <Link href="/profile" className="text-white" aria-label="Profile">
                <User className="w-6 h-6" />
              </Link>
              <button onClick={handleLogout} className="text-white" aria-label="Logout">
                <LogOut className="w-6 h-6" />
              </button>
            </div>
          ) : (
            <Link href="/login" className="text-white" aria-label="Login">
              <User className="w-6 h-6" />
            </Link>
          )}
        </div>
      </div>
      
      {/* Mobile Menu */}
      <nav className="md:hidden flex overflow-x-auto py-2 px-4 bg-blue-600 space-x-4 whitespace-nowrap">
        <Link href="/" className="text-white text-sm">Home</Link>
        <Link href="/products" className="text-white text-sm">Products</Link>
        {isLoggedIn && <Link href="/orders" className="text-white text-sm">Orders</Link>}
        {isLoggedIn ? (
          <button onClick={handleLogout} className="text-white text-sm">Logout</button>
        ) : (
          <Link href="/login" className="text-white text-sm">Login</Link>
        )}
      </nav>
    </header>
  );
}

const styles = {
  header: {
    width: "100%",
    padding: "10px 20px",
    backgroundColor: "#0070f3",
    color: "white",
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    flexWrap: "wrap",
    boxSizing: "border-box",
  },
  logo: {
    fontSize: "20px",
    fontWeight: "bold",
    whiteSpace: "nowrap",
  },
  nav: {
    display: "flex",
    gap: "15px",
    flexWrap: "wrap",
  },
  link: {
    color: "white",
    textDecoration: "none",
    fontWeight: "500",
    whiteSpace: "nowrap",
    cursor: "pointer",
  },
  searchForm: {
    display: "flex",
    alignItems: "center",
  },
  searchInput: {
    backgroundColor: "#2b2b2b",
    padding: "5px",
    borderRadius: "3px",
    border: "none",
  },
  searchButton: {
    marginLeft: "5px",
    padding: "5px 10px",
    borderRadius: "3px",
    border: "none",
    backgroundColor: "#fff",
    color: "#0070f3",
    cursor: "pointer",
  },
};
