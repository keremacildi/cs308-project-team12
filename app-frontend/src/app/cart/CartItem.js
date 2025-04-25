"use client";
import Link from "next/link";
import Image from "next/image";

export default function CartItem({ item, updateQuantity, removeItem }) {
    return (
        <div className="bg-white rounded-lg shadow-sm p-6 hover:shadow-md transition-shadow duration-200">
            <div className="flex items-start space-x-4">
                {/* Product Image */}
                <div className="flex-shrink-0 w-20 h-20 sm:w-32 sm:h-32 bg-gray-200 rounded-md overflow-hidden">
                    <Link href={`/products/${item.id}`}>
                        <div className="relative w-full h-full">
                            <img
                                src={item.image}
                                alt={item.title}
                                className="object-cover w-full h-full"
                            />
                        </div>
                    </Link>
                </div>

                {/* Product Details */}
                <div className="flex-1 min-w-0">
                    <Link href={`/products/${item.id}`} className="hover:underline">
                        <h3 className="text-lg font-medium text-gray-900 truncate mb-1">{item.title}</h3>
                    </Link>
                    <p className="text-gray-500 text-sm mb-2">
                        ${item.price.toFixed(2)} each
                    </p>
                    
                    {/* Stock Information */}
                    <p className={`text-sm ${item.stock > 5 ? 'text-green-600' : (item.stock > 0 ? 'text-yellow-600' : 'text-red-600')}`}>
                        {item.stock > 5 ? 'In Stock' : (item.stock > 0 ? `Only ${item.stock} left` : 'Out of Stock')}
                    </p>
                    
                    {/* Quantity Controls */}
                    <div className="flex items-center mt-4">
                        <label htmlFor={`quantity-${item.id}`} className="mr-3 text-sm font-medium text-gray-700">
                            Qty:
                        </label>
                        <div className="flex rounded-md shadow-sm">
                            <button
                                type="button"
                                onClick={() => updateQuantity(item.id, item.quantity - 1)}
                                disabled={item.quantity <= 1}
                                className="relative inline-flex items-center px-2 py-1 rounded-l-md border border-gray-300 bg-gray-50 text-gray-500 
                                          hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                <span className="sr-only">Decrease</span>
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                                    <path fillRule="evenodd" d="M3 10a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1z" clipRule="evenodd" />
                                </svg>
                            </button>
                            <input
                                type="number"
                                id={`quantity-${item.id}`}
                                min="1"
                                max={item.stock}
                                value={item.quantity}
                                onChange={(e) => updateQuantity(item.id, parseInt(e.target.value))}
                                className="block w-16 min-w-0 border-gray-300 border-y text-center focus:ring-blue-500 focus:border-blue-500 text-sm"
                            />
                            <button
                                type="button"
                                onClick={() => updateQuantity(item.id, item.quantity + 1)}
                                disabled={item.quantity >= item.stock}
                                className="relative inline-flex items-center px-2 py-1 rounded-r-md border border-gray-300 bg-gray-50 text-gray-500 
                                          hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                <span className="sr-only">Increase</span>
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                                    <path fillRule="evenodd" d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z" clipRule="evenodd" />
                                </svg>
                            </button>
                        </div>
                    </div>
                </div>

                {/* Price and Actions */}
                <div className="flex flex-col items-end space-y-3">
                    <span className="text-lg font-medium text-gray-900">
                        ${(item.price * item.quantity).toFixed(2)}
                    </span>
                    
                    <button
                        onClick={() => removeItem(item.id)}
                        className="text-sm text-red-600 hover:text-red-800 transition-colors flex items-center"
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" viewBox="0 0 20 20" fill="currentColor">
                            <path fillRule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z" clipRule="evenodd" />
                        </svg>
                        Remove
                    </button>
                </div>
            </div>
        </div>
    );
}
