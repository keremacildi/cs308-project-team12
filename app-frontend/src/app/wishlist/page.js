"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import WishlistItem from "../../components/WishlistItem";
import styles from "../../styles/wishlist.module.css";

export default function WishlistPage() {
    const [wishlist, setWishlist] = useState([]);
    const [loading, setLoading] = useState(true);
    const [discountNotification, setDiscountNotification] = useState(null);

    // Load wishlist from localStorage and simulate discount check
    useEffect(() => {
        const storedWishlist = JSON.parse(localStorage.getItem("wishlist")) || [];
        setWishlist(storedWishlist);
        setLoading(false);

        // Simulated discount check (example: 10% discount on an item)
        storedWishlist.forEach((item) => {
            if (item.price > 50 && Math.random() > 0.7) { // Random discount simulation
                setDiscountNotification({
                    id: item.id,
                    title: item.name,
                    discount: 10, // 10% discount
                });
            }
        });
    }, []);

    // Remove an item from the wishlist
    const handleRemoveFromWishlist = (id) => {
        const updatedWishlist = wishlist.filter((item) => item.id !== id);
        setWishlist(updatedWishlist);
        localStorage.setItem("wishlist", JSON.stringify(updatedWishlist));
        if (discountNotification?.id === id) setDiscountNotification(null);
    };

    // Add the item to the cart and remove it from the wishlist
    const handleAddToCart = (item) => {
        let cart = JSON.parse(localStorage.getItem("cart")) || [];
        const exists = cart.find((p) => p.id === item.id);
        if (exists) {
            exists.quantity += 1;
        } else {
            cart.push({ ...item, quantity: 1 });
        }
        localStorage.setItem("cart", JSON.stringify(cart));
        // Remove the item from wishlist after adding to cart
        handleRemoveFromWishlist(item.id);
    };

    if (loading) {
        return <div className={styles.wishlistContainer}>Loading...</div>;
    }

    return (
        <div className={styles.wishlistContainer}>
            <h1 className={styles.title}>My Wishlist</h1>

            {discountNotification && (
                <div className={styles.discountNotification}>
                    <p>
                        🎉 <strong>{discountNotification.title}</strong> is now on a {discountNotification.discount}% discount!
                    </p>
                </div>
            )}

            {wishlist.length === 0 ? (
                <div className={styles.emptyContainer}>
                    <p className={styles.emptyMessage}>Your wishlist is empty.</p>
                    <Link href="/products" className={styles.backLink}>
                        Continue Shopping
                    </Link>
                </div>
            ) : (
                <div className={styles.wishlistGrid}>
                    {wishlist.map((item) => (
                        <WishlistItem
                            key={item.id}
                            item={item}
                            onRemove={handleRemoveFromWishlist}
                            onAddToCart={handleAddToCart}
                        />
                    ))}
                </div>
            )}
        </div>
    );
}
