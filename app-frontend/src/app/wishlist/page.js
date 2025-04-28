"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import WishlistItem from "../../components/WishlistItem";

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
                    title: item.title,
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
        return <div className="p-8 bg-[#f0f8ff] min-h-screen flex flex-col items-center gap-6">Loading...</div>;
    }

    return (
        <div className="p-8 bg-[#f0f8ff] min-h-screen flex flex-col items-center gap-6">
            <h1 className="text-4xl font-extrabold text-[#1e90ff] mb-4 uppercase tracking-tight border-b-[3px] border-[#4169e1] pb-2">My Wishlist</h1>

            {discountNotification && (
                <div className="bg-[#e6f0ff] border border-[#1e90ff] rounded-xl p-4 mb-4 text-[#4169e1] font-semibold text-center">
                    <p>
                        🎉 <strong>{discountNotification.title}</strong> is now on a {discountNotification.discount}% discount!
                    </p>
                </div>
            )}

            {wishlist.length === 0 ? (
                <div className="text-center mt-8">
                    <p className="text-xl text-gray-600 italic mb-4">Your wishlist is empty.</p>
                    <Link href="/products" className="text-[#1e90ff] no-underline font-semibold hover:underline">
                        Continue Shopping
                    </Link>
                </div>
            ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6 w-full max-w-[1400px]">
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
