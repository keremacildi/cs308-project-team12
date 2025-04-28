"use client"
import { useState, useEffect } from 'react';
import ProductCard from '../components/ProductCard';
import Link from 'next/link';
import { ChevronLeft, ChevronRight, ShoppingBag, Smartphone, Home as HomeIcon, Shirt } from 'lucide-react';
import { api } from '../lib/api';
// Category icon mapping
const categoryIcons = {
  "default": <ShoppingBag className="w-5 h-5" />
};

export default function HomePage() {
 
  // Categories state
  const [categories, setCategories] = useState([]);
  const [loadingCategories, setLoadingCategories] = useState(true);
  
  // Products state
  const [featuredProducts, setFeaturedProducts] = useState([]);
  const [loadingProducts, setLoadingProducts] = useState(true);
  
  // Auto-slide state
  const [currentSlide, setCurrentSlide] = useState(0);
  const [autoSlide, setAutoSlide] = useState(true);
  
  // Define how many products per slide (responsive)
  const [itemsPerSlide, setItemsPerSlide] = useState(3);
  
  // Fetch categories and products
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoadingCategories(true);
        setLoadingProducts(true);
        
        // Fetch both categories and products in parallel
        const [categoriesData, productsData] = await Promise.all([
          api.categories.list(),
          api.products.list()
        ]);
        
        setCategories(categoriesData || []);
        
        // Add sample warranty data to products (since backend might not have it yet)
        const productsWithWarranty = productsData ? productsData.map(product => {
          // Randomly assign different warranties to showcase the feature
          const warranties = ["1 Year Warranty", "2 Year Warranty", "No Warranty", "6 Month Warranty"];
          return {
            ...product,
            warranty: warranties[Math.floor(Math.random() * warranties.length)]
          };
        }) : [];
        
        // Use the first 3 products for the featured section
        setFeaturedProducts(productsWithWarranty.slice(0, 3));
          
      } catch (error) {
        console.error('Error fetching data:', error);
        setCategories([]);
        setFeaturedProducts([]);
      } finally {
        setLoadingCategories(false);
        setLoadingProducts(false);
      }
    };
    
    fetchData();
  }, []);
  
  // Update items per slide based on window width
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth < 640) {
        setItemsPerSlide(1);
      } else if (window.innerWidth < 1024) {
        setItemsPerSlide(2);
      } else {
        setItemsPerSlide(3);
      }
    };
    
    handleResize(); // Call on initial load
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);
  
  // Auto-slide effect
  useEffect(() => {
    let interval;
    if (autoSlide) {
      interval = setInterval(() => {
        nextSlide();
      }, 5000);
    }
    return () => clearInterval(interval);
  }, [autoSlide, currentSlide]);
  
  // Move to next slide (wrap-around)
  const nextSlide = () => {
    setCurrentSlide((prev) => (prev + 1) % Math.max(1, Math.ceil(featuredProducts.length / itemsPerSlide)));
  };

  // Move to previous slide (wrap-around)
  const prevSlide = () => {
    setCurrentSlide((prev) => 
      (prev - 1 + Math.ceil(featuredProducts.length / itemsPerSlide)) % 
      Math.max(1, Math.ceil(featuredProducts.length / itemsPerSlide))
    );
  };

  // Pause auto-slide on user interaction
  const handleManualNavigation = (callback) => {
    setAutoSlide(false);
    callback();
    setTimeout(() => setAutoSlide(true), 10000); // Resume auto-slide after 10 seconds
  };

  // Calculate number of slides needed based on number of products and items per slide
  const numSlides = Math.max(1, Math.ceil(featuredProducts.length / itemsPerSlide));

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Hero Section */}
      <section className="mb-12 relative rounded-2xl overflow-hidden">
        <div className="relative h-[300px] sm:h-[400px] bg-gradient-to-r from-blue-600 to-indigo-700 rounded-2xl">
          <div className="absolute inset-0 bg-opacity-30 flex flex-col justify-center px-8 sm:px-16">
            <h1 className="text-4xl sm:text-5xl font-bold text-white mb-4">Summer Sale</h1>
            <p className="text-xl sm:text-2xl text-white mb-8 max-w-md">
              Discover amazing deals on our most popular products with up to 50% off!
            </p>
            <Link 
              href="/products" 
              className="inline-block bg-white text-primary font-bold px-6 py-3 rounded-lg hover:bg-blue-50 transition w-fit"
            >
              Shop Now
            </Link>
          </div>
          <div className="absolute right-0 bottom-0 max-w-sm h-full hidden lg:flex items-end">
            {/* You can add a hero image here if available */}
          </div>
        </div>
      </section>
      
      {/* Categories Section */}
      <section className="mb-12">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold text-gray-800">Shop by Category</h2>
          <Link href="/products" className="text-primary hover:underline font-medium">
            View All
          </Link>
        </div>
        
        {loadingCategories ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {[1, 2, 3].map((index) => (
              <div key={index} className="bg-gray-100 animate-pulse rounded-xl h-32"></div>
            ))}
          </div>
        ) : categories.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {categories.map((category, index) => (
              <Link
                key={index}
                href={`/products?category=${encodeURIComponent(category.name || category)}`}
                className="group"
              >
                <div className="bg-white rounded-xl shadow-sm p-6 h-full flex flex-col justify-center items-center transition-transform hover:shadow-md hover:-translate-y-1 border border-gray-100">
                  <div className="bg-blue-50 rounded-full p-4 mb-4 text-primary">
                    {categoryIcons[category.name || category] || categoryIcons.default}
                  </div>
                  <h3 className="text-lg font-medium text-gray-800 group-hover:text-primary transition">
                    {category.name || category}
                  </h3>
                </div>
              </Link>
            ))}
          </div>
        ) : (
          <div className="text-center py-12 text-gray-500">
            No categories available at the moment.
          </div>
        )}
      </section>

      {/* Featured Products Section */}
      <section className="mb-12">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold text-gray-800">Featured Products</h2>
          <Link href="/products" className="text-primary hover:underline font-medium">
            View All
          </Link>
        </div>
        
        {loadingProducts ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3].map((index) => (
              <div key={index} className="bg-white animate-pulse rounded-xl h-80 shadow-sm">
                <div className="bg-gray-200 h-48 rounded-t-xl"></div>
                <div className="p-4">
                  <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
                  <div className="h-4 bg-gray-200 rounded w-1/2"></div>
                </div>
              </div>
            ))}
          </div>
        ) : featuredProducts.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {featuredProducts.map((product) => (
              <ProductCard
                key={product.id}
                id={product.id}
                title={product.title}
                price={product.price}
                image={product.image}
                image_url={product.image_url}
                stock={product.stock || product.quantity_in_stock}
                rating={product.rating}
                totalRating={product.total_ratings}
                warranty={product.warranty}
              />
            ))}
          </div>
        ) : (
          <div className="text-center py-12 text-gray-500">
            No featured products available at the moment.
          </div>
        )}
      </section>
      
      {/* Promotional Banner */}
      <section className="mb-12">
        <div className="bg-gradient-to-r from-teal-500 to-emerald-500 rounded-xl overflow-hidden">
          <div className="container mx-auto px-6 py-12">
            <div className="md:flex md:items-center md:justify-between">
              <div className="md:w-2/3">
                <h2 className="text-3xl font-bold text-white mb-2">Free Shipping on Orders Over $50</h2>
                <p className="text-teal-100 mb-6">Shop now and enjoy our fast and reliable shipping service!</p>
                <Link 
                  href="/products" 
                  className="inline-block bg-white text-teal-600 font-medium px-6 py-3 rounded-lg shadow hover:bg-teal-50 transition"
                >
                  Explore Products
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
