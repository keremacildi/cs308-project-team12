"use client"
import { useState, useEffect } from 'react';
import { mockProducts } from './data/mock_data/products';
import ProductCard from '../components/ProductCard';
import Link from 'next/link';
import { ChevronLeft, ChevronRight, ShoppingBag, Smartphone, Home as HomeIcon, Shirt } from 'lucide-react';

// Category icon mapping
const categoryIcons = {
  "Electronics": <Smartphone className="w-5 h-5" />,
  "Home Appliances": <HomeIcon className="w-5 h-5" />,
  "Clothing": <Shirt className="w-5 h-5" />,
  "default": <ShoppingBag className="w-5 h-5" />
};

export default function HomePage() {
  // Extract and sort products by rating (popularity) in descending order
  const productsArray = mockProducts.product;
  const sortedProducts = [...productsArray].sort((a, b) => b.rating - a.rating);
  
  // Auto-slide state
  const [currentSlide, setCurrentSlide] = useState(0);
  const [autoSlide, setAutoSlide] = useState(true);
  
  // Define how many products per slide (responsive)
  const [itemsPerSlide, setItemsPerSlide] = useState(3);
  
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
  
  // Create slides based on items per slide
  const totalProducts = sortedProducts.length;
  const slides = [];
  
  for (let i = 0; i < totalProducts; i += itemsPerSlide) {
    let slideItems = sortedProducts.slice(i, i + itemsPerSlide);
    if (slideItems.length < itemsPerSlide) {
      slideItems = [...slideItems];
      while (slideItems.length < itemsPerSlide) {
        slideItems.push(null);
      }
    }
    slides.push(slideItems);
  }

  // Move to next slide (wrap-around)
  const nextSlide = () => {
    setCurrentSlide((prev) => (prev + 1) % slides.length);
  };

  // Move to previous slide (wrap-around)
  const prevSlide = () => {
    setCurrentSlide((prev) => (prev - 1 + slides.length) % slides.length);
  };

  // Pause auto-slide on user interaction
  const handleManualNavigation = (callback) => {
    setAutoSlide(false);
    callback();
    setTimeout(() => setAutoSlide(true), 10000); // Resume auto-slide after 10 seconds
  };

  // For the categories section: get unique categories
  const categories = [...new Set(productsArray.map(product => product.category))].slice(0, 3);

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
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {categories.map((category, index) => (
            <Link
              key={index}
              href={`/products?category=${encodeURIComponent(category)}`}
              className="group"
            >
              <div className="bg-white rounded-xl shadow-sm p-6 h-full flex flex-col justify-center items-center transition-transform hover:shadow-md hover:-translate-y-1 border border-gray-100">
                <div className="bg-blue-50 rounded-full p-4 mb-4 text-primary">
                  {categoryIcons[category] || categoryIcons.default}
                </div>
                <h3 className="text-lg font-medium text-gray-800 group-hover:text-primary transition">
                  {category}
                </h3>
              </div>
            </Link>
          ))}
        </div>
      </section>

      {/* Featured Products Slider Section */}
      <section className="mb-12">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold text-gray-800">Featured Products</h2>
          <div className="flex items-center space-x-2">
            {slides.length > 1 && (
              <div className="flex space-x-1">
                {slides.map((_, index) => (
                  <button 
                    key={index}
                    onClick={() => setCurrentSlide(index)}
                    className={`w-2.5 h-2.5 rounded-full transition-all ${
                      currentSlide === index 
                        ? 'bg-primary w-5' 
                        : 'bg-gray-300 hover:bg-gray-400'
                    }`}
                    aria-label={`Go to slide ${index + 1}`}
                  />
                ))}
              </div>
            )}
          </div>
        </div>
        
        <div className="relative">
          {slides.length > 1 && (
            <>
              <button 
                onClick={() => handleManualNavigation(prevSlide)} 
                className="absolute left-0 top-1/2 -translate-y-1/2 z-10 bg-white rounded-full p-2 shadow-md hover:bg-gray-100 transition"
                aria-label="Previous slide"
              >
                <ChevronLeft className="w-6 h-6 text-gray-700" />
              </button>
              
              <button 
                onClick={() => handleManualNavigation(nextSlide)} 
                className="absolute right-0 top-1/2 -translate-y-1/2 z-10 bg-white rounded-full p-2 shadow-md hover:bg-gray-100 transition"
                aria-label="Next slide"
              >
                <ChevronRight className="w-6 h-6 text-gray-700" />
              </button>
            </>
          )}
          
          <div className="overflow-hidden">
            <div 
              className="flex transition-transform duration-500 ease-in-out"
              style={{ transform: `translateX(-${currentSlide * 100}%)` }}
            >
              {slides.map((slide, slideIndex) => (
                <div 
                  key={slideIndex} 
                  className="flex-none w-full grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6"
                >
                  {slide.map((product, productIndex) => 
                    product ? (
                      <ProductCard
                        key={`${slideIndex}-${productIndex}`}
                        id={product.id}
                        title={product.title}
                        price={product.price}
                        image={product.image}
                        stock={product.stock}
                      />
                    ) : (
                      <div key={`empty-${slideIndex}-${productIndex}`} className="hidden lg:block" />
                    )
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
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
