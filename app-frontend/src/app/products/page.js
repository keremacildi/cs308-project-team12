"use client";
import React, { useEffect, useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { debounce } from "lodash";
import ProductCard from "../../components/ProductCard";
import "../../styles/globals.css";
import { fetchProducts, fetchCategories } from "../../services/api";

const ITEMS_PER_PAGE = 30;

const FilterSidebar = ({ onFilterChange = () => {} }) => {
  const [categories, setCategories] = useState([]);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [filters, setFilters] = useState({ category: [], search: "", sort: "" });

  const searchParams = useSearchParams();
  const router = useRouter();

  // Load categories and products on mount
  useEffect(() => {
    const loadInitialData = async () => {
      try {
        setLoading(true);
        const [categoriesData, productsData] = await Promise.all([
          fetchCategories(),
          fetchProducts()
        ]);
        setCategories(categoriesData);
        setProducts(productsData);
      } catch (err) {
        setError(err.message);
        console.error('Error loading initial data:', err);
      } finally {
        setLoading(false);
      }
    };

    loadInitialData();
  }, []);

  // Update products when filters change
  useEffect(() => {
    const updateProducts = async () => {
      try {
        setLoading(true);
        const data = await fetchProducts(filters);
        setProducts(data);
      } catch (err) {
        setError(err.message);
        console.error('Error updating products:', err);
      } finally {
        setLoading(false);
      }
    };

    updateProducts();
  }, [filters]);

  const updateURL = debounce((updatedFilters) => {
    if (!updatedFilters || !searchParams) return;
    const params = new URLSearchParams(searchParams.toString());

    if (updatedFilters.category.length > 0) {
      params.set("category", updatedFilters.category[0]);
    } else {
      params.delete("category");
    }

    if (updatedFilters.search) {
      params.set("search", updatedFilters.search);
    } else {
      params.delete("search");
    }

    if (updatedFilters.sort) {
      params.set("sort", updatedFilters.sort);
    } else {
      params.delete("sort");
    }

    router.push(`?${params.toString()}`);
    onFilterChange(updatedFilters);
  }, 500);

  const handleFilterChange = (type, value) => {
    setFilters((prev) => {
      const newFilters = { ...prev };
      if (type === "category") {
        newFilters.category = prev.category.includes(value)
          ? prev.category.filter((c) => c !== value)
          : [...prev.category, value];
      } else {
        newFilters[type] = value;
      }
      updateURL(newFilters);
      return newFilters;
    });
  };

  if (loading) return <div>Loading...</div>;
  if (error) return <div>Error: {error}</div>;

  const displayedProducts = products.slice(
    (currentPage - 1) * ITEMS_PER_PAGE,
    currentPage * ITEMS_PER_PAGE
  );

  const totalPages = Math.ceil(products.length / ITEMS_PER_PAGE);

  return (
    <div className="flex">
      <div className="w-64 sticky top-0 h-screen overflow-y-auto p-4 border-r bg-blue-600 border-blue-600">
        <h2 className="text-lg font-semibold">Filters</h2>
        <div className="mt-4">
          <h3 className="text-md font-semibold">Sort By</h3>
          <select 
            className="w-full p-2 mt-2" 
            value={filters.sort} 
            onChange={(e) => handleFilterChange("sort", e.target.value)}
          >
            <option value="">None</option>
            <option value="price_low">Price (Low to High)</option>
            <option value="price_high">Price (High to Low)</option>
            <option value="rating_low">Rating (Low to High)</option>
            <option value="rating_high">Rating (High to Low)</option>
          </select>
        </div>
        <div className="mt-4">
          <h3 className="text-md font-semibold">Categories</h3>
          {categories.map((cat) => (
            <label key={cat.id} className="block">
              <input
                type="checkbox"
                value={cat.name}
                checked={filters.category.includes(cat.name)}
                onChange={() => handleFilterChange("category", cat.name)}
                className="mr-2"
              />
              {cat.name}
            </label>
          ))}
        </div>
      </div>
      <div className="p-4 flex-1">
        <h1 className="text-xl font-semibold">Products</h1>
        <div className="grid grid-cols-3 gap-4">
          {displayedProducts.map((product) => (
            <ProductCard
              key={product.id}
              id={product.id}
              title={product.name}
              price={product.price}
              image={product.image}
              stock={product.quantity_in_stock}
            />
          ))}
        </div>
        {totalPages > 1 && (
          <div className="mt-4 flex justify-center items-center gap-2">
            <button
              onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
              disabled={currentPage === 1}
              className="px-4 py-2 bg-blue-600 rounded disabled:opacity-50"
            >
              Previous
            </button>
            {Array.from({ length: totalPages }).map((_, i) => (
              <button
                key={i}
                onClick={() => setCurrentPage(i + 1)}
                className={`px-4 py-2 rounded ${
                  currentPage === i + 1 ? "bg-blue-600 text-white" : "bg-gray-600"
                }`}
              >
                {i + 1}
              </button>
            ))}
            <button
              onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
              disabled={currentPage === totalPages}
              className="px-4 py-2 bg-blue-600 rounded disabled:opacity-50"
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
