"use client";
import React, { useEffect, useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { debounce } from "lodash"; // Install lodash: npm install lodash
import ProductCard from "../../components/ProductCard";
import "../../styles/globals.css";
import { mockFilters } from "../data/mock_data/filters";
import { mockProducts } from "../data/mock_data/products";

const ITEMS_PER_PAGE = 30;

const FilterSidebar = ({ onFilterChange = () => {} }) => {
  const [categories, setCategories] = useState([]);
  const [brands, setBrands] = useState([]);
  const [sellers, setSellers] = useState([]);
  const [allProducts, setAllProducts] = useState([]);
  const [filteredProducts, setFilteredProducts] = useState([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [filters, setFilters] = useState({ category: [], brand: [], seller: [] });
  const [sortBy, setSortBy] = useState("");

  const searchParams = useSearchParams();
  const router = useRouter();

  // On mount, load your initial data
  useEffect(() => {
    setCategories(mockFilters.categories);
    setBrands(mockFilters.brands);
    setSellers(mockFilters.sellers);
    setAllProducts(mockProducts.product);
    setFilteredProducts(mockProducts.product);
  }, []);

  // On mount, check for a category query parameter and apply it
  useEffect(() => {
    const categoryQuery = searchParams.get("category");
    if (categoryQuery) {
      setFilters((prev) => ({
        ...prev,
        category: [categoryQuery],
      }));
    }
  }, [searchParams]);

  useEffect(() => {
    let filtered = allProducts.filter((product) => {
      return (
        (filters.category.length === 0 || filters.category.includes(product.category)) &&
        (filters.brand.length === 0 || filters.brand.includes(product.brand)) &&
        (filters.seller.length === 0 || filters.seller.includes(product.seller))
      );
    });

    if (sortBy === "price-lh") {
      filtered = filtered.sort((a, b) => a.price - b.price);
    } else if (sortBy === "rating-lh") {
      filtered = filtered.sort((a, b) => a.rating - b.rating);
    } else if (sortBy === "price-hl") {
      filtered = filtered.sort((a, b) => b.price - a.price);
    } else if (sortBy === "rating-hl") {  
      filtered = filtered.sort((a, b) => b.rating - a.rating);
    }
    setFilteredProducts(filtered);
    setCurrentPage(1);
  }, [filters, allProducts, sortBy]);

  const totalPages = Math.ceil(filteredProducts.length / ITEMS_PER_PAGE);

  const updateURL = debounce((updatedFilters) => {
    if (!updatedFilters || !searchParams) return;
    const params = new URLSearchParams(searchParams.toString());

    if (updatedFilters.category.length > 0) {
      params.set("category", updatedFilters.category[0]);
    } else {
      params.delete("category");
    }

    if (updatedFilters.brand.length > 0) {
      params.set("brand", updatedFilters.brand.join(","));
    } else {
      params.delete("brand");
    }

    if (updatedFilters.seller.length > 0) {
      params.set("seller", updatedFilters.seller.join(","));
    } else {
      params.delete("seller");
    }

    router.push(`?${params.toString()}`);
    onFilterChange(updatedFilters);
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
      }
      updateURL(newFilters);
      return newFilters;
    });
  };

  const handlePageChange = (page) => {
    if (page < 1 || page > totalPages) return;
    setCurrentPage(page);
  };

  const displayedProducts = filteredProducts.slice(
    (currentPage - 1) * ITEMS_PER_PAGE,
    currentPage * ITEMS_PER_PAGE
  );

  return (
    <div className="flex">  
      <div className="w-64 sticky top-0 h-screen overflow-y-auto p-4 border-r bg-blue-600 border-blue-600">
        <h2 className="text-lg font-semibold">Filters</h2>
        <div className="mt-4">
          <h3 className="text-md font-semibold">Sort By</h3>
          <select className="w-full p-2 mt-2" value={sortBy} onChange={(e) => setSortBy(e.target.value)}>
            <option value="">None</option>
            <option value="price-lh">Price (Low to High)</option>
            <option value="price-hl">Price (High to Low)</option>
            <option value="rating-lh">Rating (Low to High)</option>
            <option value="rating-hl">Rating (High to Low)</option>
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
          {displayedProducts.map((product, index) => (
            <ProductCard
              key={`${product.id}-${index}`}  // Use both id and index for a unique key
              id={product.id}
              title={product.title}
              price={product.price}
              image={product.image}
              stock={product.stock}  // Pass the stock property here
            />
          ))}
        </div>
        {totalPages > 1 && (
          <div className="mt-4 flex justify-center items-center gap-2">
            <button
              onClick={() => handlePageChange(currentPage - 1)}
              disabled={currentPage === 1}
              className="px-4 py-2 bg-blue-600 rounded disabled:opacity-50"
            >
              Previous
            </button>
            {Array.from({ length: totalPages }).map((_, i) => (
              <button
                key={i}
                onClick={() => handlePageChange(i + 1)}
                className={`px-4 py-2 rounded ${
                  currentPage === i + 1 ? "bg-blue-600 text-white" : "bg-gray-600"
                }`}
              >
                {i + 1}
              </button>
            ))}
            <button
              onClick={() => handlePageChange(currentPage + 1)}
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
