"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

export default function Header() {
  const router = useRouter();
  const [searchInput, setSearchInput] = useState("");

  const handleSearch = async (e) => {
    e.preventDefault();
    // Replace the URL below with your actual API endpoint
    const res = await fetch(`/api/search?query=${encodeURIComponent(searchInput)}`);
    
    if (res.ok) {
      const data = await res.json();
      // Assume your API returns an object with a productId property
      const productId = data.productId;
      if (productId) {
        // Navigate to the dynamic product page
        router.push(`/products/${productId}`);
      } else {
        alert("No product found.");
      }
    } else {
      alert("Error fetching product data.");
    }
  };

  return (
    <header style={styles.header}>
      <div style={styles.logo}>🛒 CS308 Store</div>
      <nav style={styles.nav}>
        <Link href="/" style={styles.link}>Home</Link>
        <Link href="/products" style={styles.link}>Products</Link>
        <Link href="/cart" style={styles.link}>Cart</Link>
        <Link href="/wishlist" style={styles.link}>Wishlist</Link>
        <Link href="/profile" style={styles.link}>Profile</Link>
        <Link href="/login" style={styles.link}>Login</Link>
      </nav>
      <form onSubmit={handleSearch} style={styles.searchForm}>
        <input 
          type="text" 
          placeholder="Search products..." 
          value={searchInput}
          onChange={(e) => setSearchInput(e.target.value)}
          style={styles.searchInput}
        />
        <button type="submit" style={styles.searchButton}>Search</button>
      </form>
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
