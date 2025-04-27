import React from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { getImageUrl } from '../utils/imageUtils';

const ProductCard = ({ product }) => {
  if (!product) return null;
  
  // Default placeholder image if no image is provided
  const imageUrl = getImageUrl(product.image, '/iphone.jpg');
  
  return (
    <div className="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-lg transition-shadow duration-300">
      <Link href={`/products/${product.id}`}>
        <div className="relative h-48 w-full">
          <Image
            src={imageUrl}
            alt={product.title || 'Product'}
            fill
            style={{ objectFit: 'cover' }}
            sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
            className="transition-transform duration-300 hover:scale-105"
          />
          <div className="absolute top-2 right-2 bg-gray-800 text-white text-xs px-2 py-1 rounded-md opacity-80">
            ID: {product.id}
          </div>
        </div>
        <div className="p-4">
          <h3 className="text-lg font-semibold text-gray-800 mb-2 line-clamp-2">{product.title}</h3>
          <p className="text-gray-600 text-sm mb-2 line-clamp-2">{product.description}</p>
          <div className="flex justify-between items-center">
            <span className="text-xl font-bold text-blue-600">${product.price?.toFixed(2) || '0.00'}</span>
            {product.quantity_in_stock > 0 ? (
              <span className="px-2 py-1 bg-green-100 text-green-800 rounded-md text-sm font-medium">
                {product.quantity_in_stock} in stock
              </span>
            ) : (
              <span className="px-2 py-1 bg-red-100 text-red-800 rounded-md text-sm font-medium">
                Out of stock
              </span>
            )}
          </div>
        </div>
      </Link>
    </div>
  );
};

export default ProductCard; 