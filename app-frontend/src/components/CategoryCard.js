'use client';
import React from 'react';
import { ShoppingBag, Smartphone, Laptop, Tv, Headphones, Camera, Watch, Home as HomeIcon, Shirt, Briefcase } from 'lucide-react';
import Link from 'next/link';

// Category icon mapping
const categoryIcons = {
  "Electronics": <Smartphone className="w-6 h-6" />,
  "Laptops": <Laptop className="w-6 h-6" />,
  "Mobile Phones": <Smartphone className="w-6 h-6" />,
  "TVs": <Tv className="w-6 h-6" />,
  "Cameras": <Camera className="w-6 h-6" />,
  "Headphones": <Headphones className="w-6 h-6" />,
  "Wearables": <Watch className="w-6 h-6" />,
  "Home Appliances": <HomeIcon className="w-6 h-6" />,
  "Clothing": <Shirt className="w-6 h-6" />,
  "Office": <Briefcase className="w-6 h-6" />,
  // Add more mappings as needed
  "default": <ShoppingBag className="w-6 h-6" />
};

export default function CategoryCard({ category, isSelected, onClick }) {
  // Get the appropriate icon or use default
  const icon = categoryIcons[category.name] || categoryIcons.default;
  
  return (
    <div 
      onClick={() => onClick(category.name)}
      className={`
        cursor-pointer bg-white rounded-xl shadow-sm p-4 
        flex flex-col justify-center items-center transition-all
        hover:shadow-md hover:-translate-y-1 border 
        ${isSelected 
          ? 'border-blue-500 bg-blue-50' 
          : 'border-gray-100 hover:border-gray-200'
        }
      `}
    >
      <div className={`
        rounded-full p-3 mb-2
        ${isSelected ? 'bg-blue-100 text-blue-600' : 'bg-gray-100 text-gray-600'}
      `}>
        {icon}
      </div>
      <h3 className={`
        text-sm font-medium text-center
        ${isSelected ? 'text-blue-600' : 'text-gray-800'}
      `}>
        {category.name}
      </h3>
    </div>
  );
} 