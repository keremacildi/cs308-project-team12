"use client";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ShoppingCart, Heart, User, Package, LogOut, Settings, Truck, DollarSign, Tag, BarChart2 } from "lucide-react";
import { useState, useEffect } from "react";

export default function Header() {
  const router = useRouter();
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  const [adminRole, setAdminRole] = useState(null);

  // Check authentication status when component mounts
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const user = localStorage.getItem("user");
      const admin = localStorage.getItem("admin");
      const role = localStorage.getItem("adminRole");
      
      setIsLoggedIn(!!user);
      setIsAdmin(!!admin);
      setAdminRole(role);
    }
  }, []);

  const handleLogout = () => {
    if (typeof window !== 'undefined') {
      localStorage.removeItem("user");
      localStorage.removeItem("isLoggedIn");
      localStorage.removeItem("admin");
      localStorage.removeItem("adminRole");
      
      // Redirect to home page after logout
      router.push("/");
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
          
          {/* Conditional links based on login status */}
          {isLoggedIn && !isAdmin && (
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
          
          {/* Admin-specific links */}
          {isAdmin && (
            <>
              {adminRole === 'product-manager' && (
                <>
                  <Link href="/admin/product-manager/products" className="text-white hover:text-blue-100 transition font-medium flex items-center">
                    <Package className="w-4 h-4 mr-1" />
                    Products
                  </Link>
                  <Link href="/admin/product-manager/stocks" className="text-white hover:text-blue-100 transition font-medium flex items-center">
                    <ShoppingCart className="w-4 h-4 mr-1" />
                    Stock
                  </Link>
                  <Link href="/admin/product-manager/deliveries" className="text-white hover:text-blue-100 transition font-medium flex items-center">
                    <Truck className="w-4 h-4 mr-1" />
                    Deliveries
                  </Link>
                </>
              )}
              
              {adminRole === 'sales-manager' && (
                <>
                  <Link href="/admin/sales-manager/prices" className="text-white hover:text-blue-100 transition font-medium flex items-center">
                    <DollarSign className="w-4 h-4 mr-1" />
                    Prices
                  </Link>
                  <Link href="/admin/sales-manager/discounts" className="text-white hover:text-blue-100 transition font-medium flex items-center">
                    <Tag className="w-4 h-4 mr-1" />
                    Discounts
                  </Link>
                  <Link href="/admin/sales-manager/profit" className="text-white hover:text-blue-100 transition font-medium flex items-center">
                    <BarChart2 className="w-4 h-4 mr-1" />
                    Revenue
                  </Link>
                </>
              )}
            </>
          )}
          
          {/* Login/Logout buttons */}
          {isLoggedIn || isAdmin ? (
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
        
        {/* Mobile Navigation */}
        <div className="flex md:hidden items-center space-x-4 order-2">
          <Link href="/cart" className="text-white" aria-label="Cart">
            <ShoppingCart className="w-6 h-6" />
          </Link>
          <Link href="/wishlist" className="text-white" aria-label="Wishlist">
            <Heart className="w-6 h-6" />
          </Link>
          {isLoggedIn && !isAdmin && (
            <Link href="/profile" className="text-white" aria-label="Profile">
              <User className="w-6 h-6" />
            </Link>
          )}
          {isAdmin && (
            <Link href={adminRole === 'product-manager' ? "/admin/product-manager" : "/admin/sales-manager"} className="text-white" aria-label="Admin">
              <Settings className="w-6 h-6" />
            </Link>
          )}
        </div>
      </div>
      
      {/* Mobile Menu */}
      <nav className="md:hidden flex overflow-x-auto py-2 px-4 bg-blue-600 space-x-4 whitespace-nowrap">
        <Link href="/" className="text-white text-sm">Home</Link>
        <Link href="/products" className="text-white text-sm">Products</Link>
        
        {isLoggedIn && !isAdmin && (
          <Link href="/orders" className="text-white text-sm">Orders</Link>
        )}
        
        {isAdmin && adminRole === 'product-manager' && (
          <>
            <Link href="/admin/product-manager/products" className="text-white text-sm">Products</Link>
            <Link href="/admin/product-manager/stocks" className="text-white text-sm">Stock</Link>
            <Link href="/admin/product-manager/deliveries" className="text-white text-sm">Deliveries</Link>
          </>
        )}
        
        {isAdmin && adminRole === 'sales-manager' && (
          <>
            <Link href="/admin/sales-manager/prices" className="text-white text-sm">Prices</Link>
            <Link href="/admin/sales-manager/discounts" className="text-white text-sm">Discounts</Link>
            <Link href="/admin/sales-manager/profit" className="text-white text-sm">Revenue</Link>
          </>
        )}
        
        {isLoggedIn || isAdmin ? (
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
