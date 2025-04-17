"use client";
import { useState } from "react"; // useState'i içe aktar
import Image from "next/image";
import styles from "../styles/wishlist.module.css";

export default function WishlistItem({ item, onRemove, onAddToCart }) {
    const [addedToCart, setAddedToCart] = useState(false);

    const handleAddToCartClick = () => {
        if (item.stock > 0) {
            onAddToCart(item);
            setAddedToCart(true);
            setTimeout(() => setAddedToCart(false), 2000); // 2 saniye sonra "Added!" mesajı kaybolur
        }
    };

    return (
        <div className={styles.wishlistItem}>
            <Image
                src={item.image}
                alt={"A detailed description of the image content"}
                width={80}
                height={80}
                className={styles.image}
            />
            <div className={styles.details}>
                <h3>{item.name}</h3>
                <p>${item.price.toFixed(2)}</p>
                <p>Stock: {item.stock > 0 ? item.stock : "Out of Stock"}</p>
            </div>
            <button
                className={styles.addToCartBtn}
                onClick={handleAddToCartClick}
                disabled={item.stock === 0 || addedToCart}
            >
                {addedToCart ? "Added!" : "Add to Cart"}
            </button>
            <button
                className={styles.removeBtn}
                onClick={() => onRemove(item.id)}
            >
                Remove
            </button>
        </div>
    );
}