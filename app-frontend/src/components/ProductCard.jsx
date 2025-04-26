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
      <Link href={`/product/${product.id}`}>
        <div className="relative h-48 w-full">
          <Image
            src={imageUrl}
            alt={product.title || 'Product'}
            fill
            style={{ objectFit: 'cover' }}
            sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
            className="transition-transform duration-300 hover:scale-105"
          />
        </div>
        <div className="p-4">
          <h3 className="text-lg font-semibold text-gray-800 mb-2 line-clamp-2">{product.title}</h3>
          <p className="text-gray-600 text-sm mb-2 line-clamp-2">{product.description}</p>
          <div className="flex justify-between items-center">
            <span className="text-xl font-bold text-blue-600">${product.price?.toFixed(2) || '0.00'}</span>
            <span className="text-sm text-gray-500">
              {product.quantity_in_stock > 0 ? `${product.quantity_in_stock} in stock` : 'Out of stock'}
            </span>
          </div>
        </div>
      </Link>
    </div>
  );
};

export default ProductCard; 