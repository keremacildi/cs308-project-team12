"use client";
import Link from "next/link";
import styles from '../../styles/cart.module.css';

export default function CartItem({ item, updateQuantity, removeItem }) {
    return (
        <div className={styles.cartItem}>
            {/* Clickable area: image and product details */}
            <Link href={`/products/${item.id}`} className={styles.clickableSection}>
                <img src={item.image} alt={item.title} className={styles.image} />
                <div className={styles.details}>
                    <h3>{item.title}</h3>
                    <p>${item.price.toFixed(2)}</p>
                </div>
            </Link>
            {/* Non-clickable controls */}
            <div className={styles.controls}>
                <input
                    type="number"
                    min="1"
                    max={item.stock}
                    value={item.quantity}
                    onChange={(e) =>
                        updateQuantity(item.id, parseInt(e.target.value))
                    }
                    className={styles.quantityInput}
                />
                <button
                    onClick={() => removeItem(item.id)}
                    className={styles.removeButton}
                >
                    Remove
                </button>
            </div>
        </div>
    );
}
