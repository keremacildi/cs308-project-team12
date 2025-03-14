'use client';
import React, { useState } from "react";
import Link from "next/link";
import AddToCartButton from "./ui/AddToCartButton";

export default function ProductCard({ id, title, price, image, stock }) {
  // Create a product object including the stock property
  const product = { id, title, price, image, stock };

  // State for the wishlist button text
  const [wishlistButtonText, setWishlistButtonText] = useState("Add to Wishlist");

  const handleAddToWishlist = (e) => {
    // Prevent any parent click handlers from firing
    e.stopPropagation();
    if (typeof window !== "undefined") {
      let wishlist = [];
      const storedWishlist = localStorage.getItem("wishlist");
      if (storedWishlist) {
        wishlist = JSON.parse(storedWishlist);
      }
      // Check if the product is already in the wishlist
      const exists = wishlist.some((item) => item.id === id);
      if (!exists) {
        wishlist.push(product);
        localStorage.setItem("wishlist", JSON.stringify(wishlist));
        setWishlistButtonText("Added!");
        setTimeout(() => setWishlistButtonText("Add to Wishlist"), 2000);
      } else {
        setWishlistButtonText("Already in Wishlist");
        setTimeout(() => setWishlistButtonText("Add to Wishlist"), 2000);
      }
    }
  };

  return (
    <div style={styles.card}>
      {/* Only wrap the product details in a Link so clicking them navigates */}
      <Link href={`/products/${id}`} className="no-underline" style={styles.detailsLink}>
        <div>
          <img src={image} alt="A detailed description of the image content" style={styles.image} />
          <h3>{title}</h3>
          <p>${price}</p>
          {stock === 0 && <p style={styles.outOfStock}>Out of Stock</p>}
        </div>
      </Link>
      {/* Place action buttons outside the Link so clicks on them won't trigger navigation */}
      <div style={styles.buttonsContainer}>
        <div onClick={(e) => e.stopPropagation()}>
          <AddToCartButton product={product} />
        </div>
        <div onClick={(e) => e.stopPropagation()}>
          <button onClick={handleAddToWishlist} style={styles.wishlistButton}>
            {wishlistButtonText}
          </button>
        </div>
      </div>
    </div>
  );
}

const styles = {
  card: {
    backgroundColor: "#2b2b2b",
    padding: "16px",
    borderRadius: "8px",
    textAlign: "center",
    display: "flex",
    flexDirection: "column",
    gap: "8px",
  },
  detailsLink: {
    textDecoration: "none",
    cursor: "pointer",
  },
  image: {
    width: "100%",
    height: "auto",
    marginBottom: "8px",
  },
  outOfStock: {
    color: "red",
    fontWeight: "bold",
  },
  buttonsContainer: {
    display: "flex",
    flexDirection: "column",
    gap: "8px",
  },
  wishlistButton: {
    backgroundColor: "#2b2b2b",
    border: "1px solid #ccc",
    padding: "8px 16px",
    borderRadius: "4px",
    cursor: "pointer",
  },
};
