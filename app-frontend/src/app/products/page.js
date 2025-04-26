"use client";
import React, { useEffect, useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { debounce } from "lodash"; // Install lodash: npm install lodash
import ProductCard from "../../components/ProductCard";
import CategoryCard from "../../components/CategoryCard";
import apiClient from "../../utils/apiClient";
import { Search, Filter, X, ChevronDown, ChevronUp } from "lucide-react";

const ITEMS_PER_PAGE = 30;

export default function ProductsPage() {
  const [categories, setCategories] = useState([]);
  const [brands, setBrands] = useState([]);
  const [sellers, setSellers] = useState([]);
  const [allProducts, setAllProducts] = useState([]);
  const [filteredProducts, setFilteredProducts] = useState([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [filters, setFilters] = useState({ 
    category: [], 
    brand: [], 
    seller: [],
    query: "",
    min_price: "",
    max_price: ""
  });
  const [sortBy, setSortBy] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [expandedFilters, setExpandedFilters] = useState({
    brand: false,
    seller: false
  });

  const searchParams = useSearchParams();
  const router = useRouter();

  // Fetch data from API
  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        // Fetch filter options
        const [categoriesData, brandsData, sellersData] = await Promise.all([
          apiClient.filters.getCategories(),
          apiClient.filters.getBrands(),
          apiClient.filters.getSellers()
        ]);

        setCategories(categoriesData);
        setBrands(brandsData);
        setSellers(sellersData);

        // Get search parameters
        const query = searchParams.get('q') || '';
        const minPrice = searchParams.get('min_price') || '';
        const maxPrice = searchParams.get('max_price') || '';
        const categoryParam = searchParams.get('category') || '';

        // Update filters with URL parameters
        setFilters(prev => ({
          ...prev,
          query,
          min_price: minPrice,
          max_price: maxPrice,
          category: categoryParam ? [categoryParam] : []
        }));

        // Fetch products based on search or all products
        let productsData;
        if (query) {
          productsData = await apiClient.search.products({ 
            query,
            min_price: minPrice,
            max_price: maxPrice,
            category: categoryParam
          });
          setAllProducts(productsData.products || []);
          setFilteredProducts(productsData.products || []);
        } else {
          productsData = await apiClient.products.getAll();
          setAllProducts(productsData);
          setFilteredProducts(productsData);
        }
      } catch (err) {
        setError("Failed to load products. Please try again later.");
        console.error("Error fetching data:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [searchParams]);

  useEffect(() => {
    if (loading || error) return;

    let filtered = allProducts.filter((product) => {
      const matchesQuery = !filters.query || 
        product.title?.toLowerCase().includes(filters.query.toLowerCase()) ||
        product.description?.toLowerCase().includes(filters.query.toLowerCase());
        
      const matchesCategory = filters.category.length === 0 || 
        filters.category.includes(product.category?.name);
        
      const matchesBrand = filters.brand.length === 0 || 
        filters.brand.includes(product.brand?.name);
        
      const matchesSeller = filters.seller.length === 0 || 
        filters.seller.includes(product.seller?.name);
        
      const matchesMinPrice = !filters.min_price || 
        parseFloat(product.price) >= parseFloat(filters.min_price);
        
      const matchesMaxPrice = !filters.max_price || 
        parseFloat(product.price) <= parseFloat(filters.max_price);

      return matchesQuery && matchesCategory && matchesBrand && matchesSeller && 
             matchesMinPrice && matchesMaxPrice;
    });

    if (sortBy === "price-lh") {
      filtered = filtered.sort((a, b) => parseFloat(a.price) - parseFloat(b.price));
    } else if (sortBy === "rating-lh") {
      filtered = filtered.sort((a, b) => (a.rating || 0) - (b.rating || 0));
    } else if (sortBy === "price-hl") {
      filtered = filtered.sort((a, b) => parseFloat(b.price) - parseFloat(a.price));
    } else if (sortBy === "rating-hl") {  
      filtered = filtered.sort((a, b) => (b.rating || 0) - (a.rating || 0));
    }
    
    setFilteredProducts(filtered);
    setCurrentPage(1);
  }, [filters, allProducts, sortBy, loading, error]);

  const totalPages = Math.ceil(filteredProducts.length / ITEMS_PER_PAGE);

  const updateURL = debounce((updatedFilters) => {
    if (!updatedFilters) return;
    const params = new URLSearchParams();

    if (updatedFilters.query) {
      params.set("q", updatedFilters.query);
    }
    
    if (updatedFilters.min_price) {
      params.set("min_price", updatedFilters.min_price);
    }
    
    if (updatedFilters.max_price) {
      params.set("max_price", updatedFilters.max_price);
    }

    if (updatedFilters.category.length > 0) {
      params.set("category", updatedFilters.category[0]);
    }

    if (updatedFilters.brand.length > 0) {
      params.set("brand", updatedFilters.brand.join(","));
    }

    if (updatedFilters.seller.length > 0) {
      params.set("seller", updatedFilters.seller.join(","));
    }

    router.push(`/products?${params.toString()}`);
  }, 500);

  const handleFilterChange = (type, value) => {
    setFilters((prev) => {
      let newFilters = { ...prev };
      if (type === "category") {
        newFilters.category = prev.category.includes(value)
          ? prev.category.filter((c) => c !== value)
          : [...prev.category, value];
      } else if (type === "brand") {
        newFilters.brand = prev.brand.includes(value)
          ? prev.brand.filter((b) => b !== value)
          : [...prev.brand, value];
      } else if (type === "seller") {
        newFilters.seller = prev.seller.includes(value)
          ? prev.seller.filter((s) => s !== value)
          : [...prev.seller, value];
      } else {
        newFilters[type] = value;
      }
      updateURL(newFilters);
      return newFilters;
    });
  };

  const handleCategorySelect = (categoryName) => {
    handleFilterChange("category", categoryName);
  };

  const handlePageChange = (page) => {
    if (page < 1 || page > totalPages) return;
    setCurrentPage(page);
  };

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    updateURL(filters);
  };

  const toggleFilterSection = (section) => {
    setExpandedFilters(prev => ({
      ...prev,
      [section]: !prev[section]
    }));
  };

  const clearFilters = () => {
    setFilters({ 
      category: [], 
      brand: [], 
      seller: [],
      query: "",
      min_price: "",
      max_price: ""
    });
    setSortBy("");
    updateURL({ 
      category: [], 
      brand: [], 
      seller: [],
      query: "",
      min_price: "",
      max_price: ""
    });
  };

  const displayedProducts = filteredProducts.slice(
    (currentPage - 1) * ITEMS_PER_PAGE,
    currentPage * ITEMS_PER_PAGE
  );

  if (loading) {
    return (
      <div className="flex justify-center items-center h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex justify-center items-center h-screen">
        <div className="text-red-600 text-xl">{error}</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Search Bar */}
      <div className="bg-gradient-to-r from-blue-600 to-indigo-700 py-6 px-4">
        <div className="max-w-7xl mx-auto">
          <form onSubmit={handleSearchSubmit} className="flex gap-2 max-w-2xl mx-auto">
            <div className="relative flex-grow">
              <input
                type="text"
                name="query"
                placeholder="Search products..."
                value={filters.query}
                onChange={(e) => handleFilterChange('query', e.target.value)}
                className="w-full py-3 pl-4 pr-10 rounded-lg border-none shadow-md focus:ring-2 focus:ring-blue-400"
              />
              <button type="submit" className="absolute right-2 top-1/2 transform -translate-y-1/2 text-gray-500">
                <Search className="h-5 w-5" />
              </button>
            </div>
            <div className="flex space-x-2">
              <input 
                type="number" 
                placeholder="Min $" 
                value={filters.min_price}
                onChange={(e) => handleFilterChange('min_price', e.target.value)}
                className="w-24 py-3 px-3 rounded-lg border-none shadow-md focus:ring-2 focus:ring-blue-400"
              />
              <input 
                type="number" 
                placeholder="Max $" 
                value={filters.max_price}
                onChange={(e) => handleFilterChange('max_price', e.target.value)}
                className="w-24 py-3 px-3 rounded-lg border-none shadow-md focus:ring-2 focus:ring-blue-400"
              />
            </div>
          </form>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-6">
        {/* Filter and Results Summary */}
        <div className="flex justify-between items-center mb-4">
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-bold">Products</h1>
            <span className="text-gray-500 text-sm">{filteredProducts.length} results</span>
          </div>
          
          <div className="flex items-center gap-4">
            {/* Clear Filters Button - Only show if filters are applied */}
            {(filters.category.length > 0 || filters.brand.length > 0 || filters.seller.length > 0 || 
              filters.min_price || filters.max_price || filters.query) && (
              <button 
                onClick={clearFilters}
                className="flex items-center gap-1 text-sm text-gray-600 hover:text-red-600 transition-colors"
              >
                <X className="h-4 w-4" />
                Clear Filters
              </button>
            )}
            
            {/* Sort Options */}
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="bg-white border border-gray-300 text-gray-700 py-2 px-4 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="">Sort By</option>
              <option value="price-lh">Price: Low to High</option>
              <option value="price-hl">Price: High to Low</option>
              <option value="rating-hl">Rating: High to Low</option>
            </select>
          </div>
        </div>

        {/* Category Cards Section */}
        <div className="mb-6">
          <h2 className="text-lg font-semibold mb-4">Categories</h2>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3">
            {categories.map(category => (
              <CategoryCard 
                key={category.id} 
                category={category} 
                isSelected={filters.category.includes(category.name)}
                onClick={handleCategorySelect}
              />
            ))}
          </div>
        </div>

        <div className="flex flex-col md:flex-row gap-6">
          {/* Additional Filters on Sidebar */}
          <div className="w-full md:w-1/4 lg:w-1/5">
            <div className="bg-white rounded-lg shadow-sm p-4 mb-4">
              <div className="mb-4">
                <div 
                  className="flex justify-between items-center cursor-pointer"
                  onClick={() => toggleFilterSection('brand')}
                >
                  <h3 className="font-semibold">Brands</h3>
                  {expandedFilters.brand ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
                </div>
                
                {expandedFilters.brand && (
                  <div className="mt-2 space-y-1 max-h-60 overflow-y-auto">
                    {brands.map((brand) => (
                      <div key={brand.id} className="flex items-start">
                        <input
                          type="checkbox"
                          id={`brand-${brand.id}`}
                          checked={filters.brand.includes(brand.name)}
                          onChange={() => handleFilterChange("brand", brand.name)}
                          className="mt-1 h-4 w-4 text-blue-600 rounded border-gray-300 focus:ring-blue-500"
                        />
                        <label htmlFor={`brand-${brand.id}`} className="ml-2 text-sm text-gray-700 cursor-pointer">
                          {brand.name}
                        </label>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div>
                <div 
                  className="flex justify-between items-center cursor-pointer"
                  onClick={() => toggleFilterSection('seller')}
                >
                  <h3 className="font-semibold">Sellers</h3>
                  {expandedFilters.seller ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
                </div>
                
                {expandedFilters.seller && (
                  <div className="mt-2 space-y-1 max-h-60 overflow-y-auto">
                    {sellers.map((seller) => (
                      <div key={seller.id} className="flex items-start">
                        <input
                          type="checkbox"
                          id={`seller-${seller.id}`}
                          checked={filters.seller.includes(seller.name)}
                          onChange={() => handleFilterChange("seller", seller.name)}
                          className="mt-1 h-4 w-4 text-blue-600 rounded border-gray-300 focus:ring-blue-500"
                        />
                        <label htmlFor={`seller-${seller.id}`} className="ml-2 text-sm text-gray-700 cursor-pointer">
                          {seller.name}
                        </label>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Products Grid */}
          <div className="flex-1">
            {filteredProducts.length === 0 ? (
              <div className="bg-white rounded-lg shadow-sm p-8 text-center">
                <h3 className="text-xl font-semibold text-gray-700 mb-2">No products found</h3>
                <p className="text-gray-500">Try adjusting your search or filter criteria</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {displayedProducts.map((product) => (
                  <ProductCard
                    key={product.id}
                    id={product.id}
                    title={product.title}
                    price={product.price}
                    image={product.image}
                    stock={product.quantity_in_stock}
                    rating={product.rating}
                  />
                ))}
              </div>
            )}

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex justify-center mt-8">
                <nav className="flex items-center space-x-1">
                  <button
                    onClick={() => handlePageChange(currentPage - 1)}
                    disabled={currentPage === 1}
                    className="px-3 py-2 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Previous
                  </button>
                  
                  {[...Array(totalPages)].map((_, i) => (
                    <button
                      key={i}
                      onClick={() => handlePageChange(i + 1)}
                      className={`px-3 py-2 rounded-md text-sm font-medium ${
                        currentPage === i + 1
                          ? "bg-blue-600 text-white"
                          : "text-gray-700 hover:bg-gray-100"
                      }`}
                    >
                      {i + 1}
                    </button>
                  ))}
                  
                  <button
                    onClick={() => handlePageChange(currentPage + 1)}
                    disabled={currentPage === totalPages}
                    className="px-3 py-2 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Next
                  </button>
                </nav>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
