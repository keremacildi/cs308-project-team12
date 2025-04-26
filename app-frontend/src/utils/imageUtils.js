/**
 * Utility functions for handling images
 */

// API URL for media
const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

/**
 * Get the proper image URL for a product image
 * Handles both relative and absolute URLs
 * 
 * @param {string} imagePath - The image path from the API
 * @param {string} fallbackImage - Optional fallback image if path is null/undefined
 * @returns {string} Full image URL or fallback
 */
export const getImageUrl = (imagePath, fallbackImage = "/iphone.jpg") => {
  // If no image, return fallback
  if (!imagePath) return fallbackImage;
  
  // If already a full URL, use it directly
  if (imagePath.startsWith('http')) return imagePath;
  
  // Extract just the filename for products
  if (imagePath.includes('/')) {
    // If it has a path, extract just the filename
    const parts = imagePath.split('/');
    const filename = parts[parts.length - 1];
    
    if (parts.includes('products')) {
      return `${API_URL}/media/products/${filename}`;
    }
  }
  
  // If it's just a filename for a product
  if (!imagePath.includes('/')) {
    return `${API_URL}/media/products/${imagePath}`;
  }
  
  // Default case
  return `${API_URL}${imagePath.startsWith('/') ? '' : '/'}${imagePath}`;
}; 