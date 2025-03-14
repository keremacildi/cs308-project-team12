"use client"
import { useState } from 'react';
import styles from '../styles/home.module.css';
import { mockProducts } from './data/mock_data/products'; // Import the mockProducts object
import ProductCard from '../components/ProductCard';
import Link from 'next/link';


export default function HomePage() {
  // Extract and sort products by rating (popularity) in descending order
  const productsArray = mockProducts.product;
  const sortedProducts = [...productsArray].sort((a, b) => b.rating - a.rating);
  
  // Define how many products per slide
  const itemsPerSlide = 3;
  const totalProducts = sortedProducts.length;
  
  // Group products into slides and if needed, wrap around to fill the last slide
  const slides = [];
  for (let i = 0; i < totalProducts; i += itemsPerSlide) {
    let slideItems = sortedProducts.slice(i, i + itemsPerSlide);
    if (slideItems.length < itemsPerSlide) {
      slideItems = slideItems.concat(
        sortedProducts.slice(0, itemsPerSlide - slideItems.length)
      );
    }
    slides.push(slideItems);
  }
  
  // State to track the current slide index
  const [currentSlide, setCurrentSlide] = useState(0);

  // Move to next slide (wrap-around)
  const nextSlide = () => {
    setCurrentSlide((prev) => (prev + 1) % slides.length);
  };

  // Move to previous slide (wrap-around)
  const prevSlide = () => {
    setCurrentSlide((prev) => (prev - 1 + slides.length) % slides.length);
  };

  // For the categories section: derive up to 3 unique categories from the top rated products
  const highestRatedProducts = sortedProducts.slice(0, 20);
  const topCategories = [...new Set(highestRatedProducts.map(product => product.category))].slice(0, 3);

  return (
    <div className={styles.container}>
      {/* Categories Section */}
    <section className={styles.categories}>
        <h2>Kategoriler</h2>
        <div className={styles.categoryList}>
        {topCategories.map((category, index) => (
            <Link
            key={index}
            href={`/products?category=${encodeURIComponent(category)}`}
            >
            <button className={styles.categoryCard}>
                {category}
            </button>
            </Link>
        ))}
        </div>
    </section>

      {/* Featured Products Slider Section */}
      <section className={styles.featuredProducts}>
        <h2>Öne Çıkan Ürünler</h2>
        <div className={styles.slider}>
          <button onClick={prevSlide} className={styles.arrow}>
            &#8592;
          </button>
          <div className={styles.sliderContainer}>
            <div 
              className={styles.sliderWrapper}
              style={{ transform: `translateX(-${currentSlide * 100}%)` }}
            >
              {slides.map((slide, index) => (
                <div key={index} className={styles.slide}>
                  {slide.map(product => (
                    <ProductCard
                      key={product.id}
                      id={product.id}
                      title={product.title}
                      price={product.price}
                      image={product.image}
                      stock={product.stock}
                    />
                  ))}
                </div>
              ))}
            </div>
          </div>
          <button onClick={nextSlide} className={styles.arrow}>
            &#8594;
          </button>
        </div>
      </section>
    </div>
  );
}
