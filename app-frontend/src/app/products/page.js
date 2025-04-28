"use client";
import React, { useEffect, useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { debounce } from "lodash"; // Install lodash: npm install lodash
import ProductCard from "../../components/ProductCard";
import "../../styles/globals.css";
import { api } from "../../lib/api";

const ITEMS_PER_PAGE = 12; // Changed to 12 for better grid layout

const FilterSidebar = ({ onFilterChange = () => {} }) => {
  // State for data
  const [categories, setCategories] = useState([]);
  const [allProducts, setAllProducts] = useState([]);
  const [filteredProducts, setFilteredProducts] = useState([]);
  
  // UI state
  const [currentPage, setCurrentPage] = useState(1);
  const [loadingCategories, setLoadingCategories] = useState(true);
  const [loadingProducts, setLoadingProducts] = useState(true);
  
  // Filter and sort state
  const [filters, setFilters] = useState({ category: [], price: [0, Infinity] });
  const [sortBy, setSortBy] = useState("");
  const [priceRange, setPriceRange] = useState({ min: 0, max: 5000 });
  const [searchQuery, setSearchQuery] = useState("");
  
  const searchParams = useSearchParams();
  const router = useRouter();
  
  // Fetch all data on mount
  useEffect(() => {
    const fetchAllData = async () => {
      try {
        setLoadingCategories(true);
        setLoadingProducts(true);
        
        // Parallel data fetching for better performance
        const [categoriesData, productsData] = await Promise.all([
          api.categories.list(),
          api.products.list()
        ]);
        
        setCategories(categoriesData || []);
        setAllProducts(productsData || []);
        
        // Set initial filtered products 
        setFilteredProducts(productsData || []);
        
        // Calculate price range from products data
        if (productsData && productsData.length > 0) {
          const prices = productsData.map(p => parseFloat(p.price));
          const minPrice = Math.floor(Math.min(...prices));
          const maxPrice = Math.ceil(Math.max(...prices));
          setPriceRange({ min: minPrice, max: maxPrice });
          // Update filter price range
          setFilters(prev => ({ ...prev, price: [minPrice, maxPrice] }));
        }
      } catch (error) {
        console.error('Error fetching data:', error);
        setCategories([]);
        setAllProducts([]);
      } finally {
        setLoadingCategories(false);
        setLoadingProducts(false);
      }
    };
    
    fetchAllData();
  }, []);

  // Apply URL params as filters on mount/URL change
  useEffect(() => {
    const categoryQuery = searchParams.get("category");
    if (categoryQuery) {
      setFilters(prev => ({
        ...prev,
        category: [categoryQuery]
      }));
    }
    
    const sort = searchParams.get("sort");
    if (sort) {
      setSortBy(sort);
    }
    
    const search = searchParams.get("search");
    if (search) {
      setSearchQuery(search);
    }
    
    const minPrice = searchParams.get("minPrice");
    const maxPrice = searchParams.get("maxPrice");
    if (minPrice || maxPrice) {
      setFilters(prev => ({
        ...prev,
        price: [
          minPrice ? parseInt(minPrice) : prev.price[0],
          maxPrice ? parseInt(maxPrice) : prev.price[1]
        ]
      }));
    }
  }, [searchParams]);

  // Apply filtering and sorting on the frontend
  useEffect(() => {
    if (!allProducts || allProducts.length === 0) {
      setFilteredProducts([]);
      return;
    }
    
    console.log('Applying frontend filters:', filters);
    console.log('Sorting by:', sortBy);
    console.log('Searching for:', searchQuery);
    
    // Apply all filters in one pass
    let filtered = allProducts.filter(product => {
      const price = parseFloat(product.price);
      
      // Handle category matching for both category strings and objects
      const categoryMatch = filters.category.length === 0 || 
        filters.category.some(filterCategory => {
          // Check if the product category is an object with id and name
          if (product.category && typeof product.category === 'object' && product.category.name) {
            return product.category.name === filterCategory;
          }
          // Check if product.category is directly a string
          return product.category === filterCategory;
        });
      
      const priceMatch = price >= filters.price[0] && price <= filters.price[1];
      
      // Search match
      const searchMatch = !searchQuery || (
        (product.title && product.title.toLowerCase().includes(searchQuery.toLowerCase())) || 
        (product.description && product.description.toLowerCase().includes(searchQuery.toLowerCase()))
      );
      
      return categoryMatch && priceMatch && searchMatch;
    });

    // Apply sorting
    if (sortBy) {
      console.log('Sorting products on the frontend');
      filtered = [...filtered]; // Create a copy to avoid mutation issues
      
      switch(sortBy) {
        case "price-lh":
          filtered.sort((a, b) => parseFloat(a.price) - parseFloat(b.price));
          break;
        case "price-hl":
          filtered.sort((a, b) => parseFloat(b.price) - parseFloat(a.price));
          break;
        case "rating-lh":
          filtered.sort((a, b) => (a.rating || 0) - (b.rating || 0));
          break;
        case "rating-hl":
          filtered.sort((a, b) => (b.rating || 0) - (a.rating || 0));
          break;
        case "name-az":
          filtered.sort((a, b) => a.title.localeCompare(b.title));
          break;
        case "name-za":
          filtered.sort((a, b) => b.title.localeCompare(a.title));
          break;
        default:
          // No sorting
          break;
      }
    }
    
    setFilteredProducts(filtered);
    setCurrentPage(1); // Reset to first page when filters change
  }, [filters, sortBy, searchQuery, allProducts]);

  // Handle search input
  const handleSearchChange = (e) => {
    const query = e.target.value;
    setSearchQuery(query);
    
    // Update URL with debounced function call
    debouncedUpdateURL(filters, sortBy, query);
  };

  const totalPages = Math.ceil(filteredProducts.length / ITEMS_PER_PAGE);

  // Debounced function for URL updates
  const debouncedUpdateURL = debounce((updatedFilters, updatedSort, updatedSearch) => {
    updateURL(updatedFilters, updatedSort, updatedSearch);
  }, 500);

  // Update URL with filter parameters
  const updateURL = (updatedFilters, updatedSort, updatedSearch = searchQuery) => {
    if (!searchParams) return;
    const params = new URLSearchParams(searchParams.toString());

    // Update category in URL
    if (updatedFilters.category.length > 0) {
      params.set("category", updatedFilters.category[0]);
    } else {
      params.delete("category");
    }
    
    // Update price range in URL
    if (updatedFilters.price[0] > priceRange.min) {
      params.set("minPrice", updatedFilters.price[0]);
    } else {
      params.delete("minPrice");
    }
    
    if (updatedFilters.price[1] < priceRange.max) {
      params.set("maxPrice", updatedFilters.price[1]);
    } else {
      params.delete("maxPrice");
    }
    
    // Update sort in URL
    if (updatedSort) {
      params.set("sort", updatedSort);
    } else {
      params.delete("sort");
    }

    // Update search in URL
    if (updatedSearch) {
      params.set("search", updatedSearch);
    } else {
      params.delete("search");
    }

    router.push(`?${params.toString()}`);
    onFilterChange(updatedFilters);
  };

  // Handle filter changes
  const handleFilterChange = (type, value) => {
    setFilters(prev => {
      let newFilters = { ...prev };
      if (type === "category") {
        // Extract category name if value is an object
        const categoryValue = typeof value === 'object' && value.name ? value.name : value;
        
        newFilters.category = prev.category.includes(categoryValue)
          ? prev.category.filter(c => c !== categoryValue)
          : [...prev.category, categoryValue];
      } else if (type === "price") {
        newFilters.price = value;
      }
      updateURL(newFilters, sortBy, searchQuery);
      return newFilters;
    });
  };

  // Handle sort changes
  const handleSortChange = (value) => {
    setSortBy(value);
    updateURL(filters, value, searchQuery);
  };

  // Handle pagination
  const handlePageChange = (page) => {
    if (page < 1 || page > totalPages) return;
    setCurrentPage(page);
    window.scrollTo(0, 0); // Scroll to top when changing pages
  };

  // Get products for current page
  const displayedProducts = filteredProducts.slice(
    (currentPage - 1) * ITEMS_PER_PAGE,
    currentPage * ITEMS_PER_PAGE
  );

  return (
    <div className="flex flex-col md:flex-row min-h-screen bg-gray-100">  
      {/* Filter sidebar */}
      <div className="w-full md:w-64 md:sticky md:top-16 md:h-screen overflow-y-auto p-4 bg-white shadow-md">
        <h2 className="text-lg font-semibold text-gray-800 border-b pb-2 mb-4">Filters</h2>
        
        {/* Search bar */}
        <div className="mb-6">
          <h3 className="text-md font-semibold text-gray-700 mb-2">Search Products</h3>
          <div className="relative">
            <input
              type="text"
              placeholder="Search products..."
              value={searchQuery}
              onChange={handleSearchChange}
              className="w-full p-2 pl-8 border rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <div className="absolute left-2 top-1/2 transform -translate-y-1/2 text-gray-400">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </div>
          </div>
        </div>
        
        {/* Sort options */}
        <div className="mb-6">
          <h3 className="text-md font-semibold text-gray-700 mb-2">Sort By</h3>
          <select 
            className="w-full p-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
            value={sortBy} 
            onChange={(e) => handleSortChange(e.target.value)}
          >
            <option value="">Recommended</option>
            <option value="price-lh">Price: Low to High</option>
            <option value="price-hl">Price: High to Low</option>
            <option value="rating-hl">Highest Rated</option>
            <option value="name-az">Name: A to Z</option>
            <option value="name-za">Name: Z to A</option>
          </select>
        </div>
        
        {/* Category filters */}
        <div className="mb-6">
          <h3 className="text-md font-semibold text-gray-700 mb-2">Categories</h3>
          {loadingCategories ? (
            <div className="space-y-2">
              {[1, 2, 3, 4].map((index) => (
                <div key={index} className="h-6 bg-gray-200 animate-pulse rounded"></div>
              ))}
            </div>
          ) : categories.length > 0 ? (
            <div className="max-h-60 overflow-y-auto pr-2">
              {categories.map((cat, index) => {
                // Determine category name and value based on the category format
                const categoryName = typeof cat === 'object' && cat.name ? cat.name : cat;
                const categoryId = typeof cat === 'object' && cat.id ? cat.id : null;
                
                return (
                  <label key={categoryId || index} className="flex items-center mb-2 cursor-pointer hover:bg-gray-50 p-1 rounded">
                    <input
                      type="checkbox"
                      value={categoryName}
                      checked={filters.category.includes(categoryName)}
                      onChange={() => handleFilterChange("category", cat)}
                      className="mr-2 form-checkbox h-4 w-4 text-blue-600"
                    />
                    <span className="text-gray-700">{categoryName}</span>
                  </label>
                );
              })}
            </div>
          ) : (
            <p className="text-sm text-gray-500">No categories available</p>
          )}
        </div>
        
        {/* Products count */}
        <div className="mt-4 text-sm text-gray-600">
          Showing {filteredProducts.length} products
        </div>
      </div>
      
      {/* Products grid */}
      <div className="flex-1 p-4">
        <h1 className="text-2xl font-bold text-gray-800 mb-6">All Products</h1>
        
        {/* Loading state */}
        {loadingProducts ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {Array.from({ length: 8 }).map((_, index) => (
              <div key={index} className="bg-white rounded-lg shadow-md h-72 animate-pulse">
                <div className="h-40 bg-gray-200 rounded-t-lg"></div>
                <div className="p-4">
                  <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
                  <div className="h-4 bg-gray-200 rounded w-1/2"></div>
                </div>
              </div>
            ))}
          </div>
        ) : filteredProducts.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {displayedProducts.map((product, index) => (
              <ProductCard
                key={`${product.id || index}-${index}`}
                id={product.id}
                title={product.title}
                price={product.price}
                image={product.image}
                image_url={product.image_url}
                stock={product.stock}
                rating={product.rating}
                totalRating={product.total_ratings}
              />
              
            ))}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-12 text-gray-500">
            <svg className="w-16 h-16 text-gray-400 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
            </svg>
            <p className="text-xl mb-2">No products match your filters</p>
            <p>Try adjusting your search criteria or clearing filters</p>
            <button 
              onClick={() => {
                setFilters({ category: [], price: [priceRange.min, priceRange.max] });
                setSortBy("");
                setSearchQuery("");
                router.push("/products");
              }}
              className="mt-4 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition"
            >
              Clear All Filters
            </button>
          </div>
        )}
        
        {/* Pagination */}
        {!loadingProducts && filteredProducts.length > ITEMS_PER_PAGE && (
          <div className="mt-8 flex justify-center items-center gap-2">
            <button
              onClick={() => handlePageChange(currentPage - 1)}
              disabled={currentPage === 1}
              className="px-4 py-2 bg-gray-200 text-gray-800 rounded disabled:opacity-50 hover:bg-gray-300 transition"
            >
              Previous
            </button>
            
            {/* Show limited page numbers with ellipsis */}
            {Array.from({ length: Math.min(5, totalPages) }).map((_, i) => {
              let pageNum;
              if (totalPages <= 5) {
                pageNum = i + 1;
              } else if (currentPage <= 3) {
                pageNum = i + 1;
              } else if (currentPage >= totalPages - 2) {
                pageNum = totalPages - 4 + i;
              } else {
                pageNum = currentPage - 2 + i;
              }
              
              return (
                <button
                  key={i}
                  onClick={() => handlePageChange(pageNum)}
                  className={`px-4 py-2 rounded ${
                    currentPage === pageNum 
                      ? "bg-blue-600 text-white" 
                      : "bg-gray-200 text-gray-800 hover:bg-gray-300"
                  } transition`}
                >
                  {pageNum}
                </button>
              );
            })}
            
            <button
              onClick={() => handlePageChange(currentPage + 1)}
              disabled={currentPage === totalPages}
              className="px-4 py-2 bg-gray-200 text-gray-800 rounded disabled:opacity-50 hover:bg-gray-300 transition"
            >
              Next
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default FilterSidebar;
