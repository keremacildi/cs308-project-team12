"use client";
import { useState } from "react"; // useState'i içe aktar
import Image from "next/image";

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
        <div className="bg-white p-6 rounded-3xl border border-[#b0c4de] flex flex-col items-center gap-4 transition-all duration-300 ease-in-out hover:transform hover:-translate-y-2.5 hover:shadow-lg hover:border-[#1e90ff]">
            <Image
                src={item.image}
                alt={"A detailed description of the image content"}
                width={80}
                height={80}
                className="rounded-xl object-cover"
            />
            <div className="text-center w-full">
                <h3 className="text-xl font-bold text-[#4169e1] mb-2">{item.name}</h3>
                <p className="text-base text-gray-800 m-0">${item.price.toFixed(2)}</p>
                <p className="text-base text-gray-800 m-0">Stock: {item.stock > 0 ? item.stock : "Out of Stock"}</p>
            </div>
            <button
                className={`bg-[#1e90ff] text-white border-none cursor-pointer py-3 px-5 rounded-xl transition-all duration-300 ease-in-out font-bold w-full ${
                    item.stock === 0 || addedToCart ? "bg-[#b0c4de] cursor-not-allowed" : "hover:bg-[#4169e1] hover:-translate-y-0.5"
                }`}
                onClick={handleAddToCartClick}
                disabled={item.stock === 0 || addedToCart}
            >
                {addedToCart ? "Added!" : "Add to Cart"}
            </button>
            <button
                className="bg-[#ff4040] text-white border-none cursor-pointer py-3 px-5 rounded-xl transition-all duration-300 ease-in-out font-bold w-full hover:bg-[#cc3333] hover:-translate-y-0.5"
                onClick={() => onRemove(item.id)}
            >
                Remove
            </button>
        </div>
    );
}