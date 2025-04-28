"use client";
import { useState, useEffect } from "react";
import { toast } from "react-hot-toast";
import Image from "next/image";
import { getImageUrl } from "../../../../utils/imageUtils";

// API URL for media
const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

export default function ProductListPage() {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState({
    title: "",
    model: "",
    serial_number: "",
    description: "",
    quantity_in_stock: 0,
    price: 0,
    brand: "",
    category: "",
    seller: "",
    distributor: "",
    image: null
  });
  const [brands, setBrands] = useState([]);
  const [categories, setCategories] = useState([]);
  const [sellers, setSellers] = useState([]);
  const [distributors, setDistributors] = useState([]);
  const [imagePreview, setImagePreview] = useState(null);
  const [editMode, setEditMode] = useState(false);
  const [editId, setEditId] = useState(null);
  
  useEffect(() => {
    fetchProducts();
    fetchFilters();
  }, []);

  const fetchProducts = async () => {
    try {
      setLoading(true);
      
      // Get CSRF token from cookies
      const getCsrfToken = () => {
        return document.cookie
          .split('; ')
          .find(row => row.startsWith('csrftoken='))
          ?.split('=')[1];
      };
      
      const csrfToken = getCsrfToken();
      const headers = {};
      
      if (csrfToken) {
        headers['X-CSRFToken'] = csrfToken;
      }
      
      const response = await fetch(`${API_URL}/api/admin/products/`, {
        headers,
        credentials: 'include',
      });
      
      if (response.ok) {
        const data = await response.json();
        setProducts(data);
      } else {
        toast.error("Failed to fetch products");
      }
    } catch (error) {
      console.error("Error fetching products:", error);
      toast.error("Error connecting to server");
    } finally {
      setLoading(false);
    }
  };

  const fetchFilters = async () => {
    try {
      const [brandsRes, categoriesRes, sellersRes] = await Promise.all([
        fetch(`${API_URL}/api/brands/`),
        fetch(`${API_URL}/api/categories/`),
        fetch(`${API_URL}/api/sellers/`)
      ]);
      
      if (brandsRes.ok) setBrands(await brandsRes.json());
      if (categoriesRes.ok) setCategories(await categoriesRes.json());
      if (sellersRes.ok) setSellers(await sellersRes.json());
      
      // Distributors would come from a similar endpoint if available
      setDistributors([
        { id: 1, name: "Main Distributor" },
        { id: 2, name: "Secondary Distributor" }
      ]);
    } catch (error) {
      console.error("Error fetching filters:", error);
    }
  };

  const handleInputChange = (e) => {
    const { name, value, type, files } = e.target;
    
    if (type === "file") {
      const file = files[0];
      setForm({ ...form, [name]: file });
      
      // Create a preview URL for the selected image
      if (file) {
        const reader = new FileReader();
        reader.onloadend = () => {
          setImagePreview(reader.result);
        };
        reader.readAsDataURL(file);
      } else {
        setImagePreview(null);
      }
    } else {
      setForm({ ...form, [name]: value });
    }
  };

  const handleAddProduct = async (e) => {
    e.preventDefault();
    
    try {
      const formData = new FormData();
      
      Object.keys(form).forEach(key => {
        if (form[key] !== null) {
          formData.append(key, form[key]);
        }
      });
      
      const url = editMode 
        ? `${API_URL}/api/admin/products/${editId}/`
        : `${API_URL}/api/admin/products/`;
        
      const method = editMode ? 'PUT' : 'POST';
      
      // Get CSRF token from cookies
      const getCsrfToken = () => {
        return document.cookie
          .split('; ')
          .find(row => row.startsWith('csrftoken='))
          ?.split('=')[1];
      };
      
      const csrfToken = getCsrfToken();
      const headers = {};
      
      if (csrfToken) {
        headers['X-CSRFToken'] = csrfToken;
      }
      
      const response = await fetch(url, {
        method,
        headers,
        body: formData,
        credentials: 'include',
      });
      
      if (response.ok) {
        toast.success(editMode ? "Product updated successfully" : "Product added successfully");
        resetForm();
        fetchProducts();
      } else {
        const errorData = await response.json();
        toast.error(errorData.error || "Failed to save product");
      }
    } catch (error) {
      console.error("Error saving product:", error);
      toast.error("Error connecting to server");
    }
  };

  const handleEdit = (product) => {
    setForm({
      title: product.title,
      model: product.model,
      serial_number: product.serial_number,
      description: product.description,
      quantity_in_stock: product.quantity_in_stock,
      price: product.price,
      brand: product.brand?.id || "",
      category: product.category?.id || "",
      seller: product.seller?.id || "",
      distributor: product.distributor?.id || "",
      image: null // Keep existing image unless changed
    });
    
    setImagePreview(product.image || null);
    setEditMode(true);
    setEditId(product.id);
  };

  const handleDelete = async (id) => {
    if (!confirm("Are you sure you want to delete this product?")) return;
    
    try {
      // Get CSRF token from cookies
      const getCsrfToken = () => {
        return document.cookie
          .split('; ')
          .find(row => row.startsWith('csrftoken='))
          ?.split('=')[1];
      };
      
      const csrfToken = getCsrfToken();
      const headers = {};
      
      if (csrfToken) {
        headers['X-CSRFToken'] = csrfToken;
      }
      
      const response = await fetch(`${API_URL}/api/admin/products/${id}/`, {
        method: 'DELETE',
        headers,
        credentials: 'include',
      });
      
      if (response.ok) {
        toast.success("Product deleted successfully");
        fetchProducts();
      } else {
        toast.error("Failed to delete product");
      }
    } catch (error) {
      console.error("Error deleting product:", error);
      toast.error("Error connecting to server");
    }
  };

  const resetForm = () => {
    setForm({
      title: "",
      model: "",
      serial_number: "",
      description: "",
      quantity_in_stock: 0,
      price: 0,
      brand: "",
      category: "",
      seller: "",
      distributor: "",
      image: null
    });
    setImagePreview(null);
    setEditMode(false);
    setEditId(null);
  };

  return (
    <div className="container mx-auto px-4 py-8 text-white">
      <h1 className="text-3xl font-bold mb-8 text-white">Product Management</h1>
      
      <div className="bg-zinc-800 rounded-lg p-6 mb-8 shadow-lg">
        <h2 className="text-xl font-semibold mb-4 text-white">
          {editMode ? "Edit Product" : "Add New Product"}
        </h2>
        
        <form onSubmit={handleAddProduct} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1 text-gray-200">Product Title</label>
              <input
                type="text"
                name="title"
                value={form.title}
                onChange={handleInputChange}
                className="w-full p-2 border border-gray-600 rounded bg-zinc-700 text-white placeholder-gray-400"
                required
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium mb-1 text-gray-200">Model</label>
              <input
                type="text"
                name="model"
                value={form.model}
                onChange={handleInputChange}
                className="w-full p-2 border border-gray-600 rounded bg-zinc-700 text-white placeholder-gray-400"
                required
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium mb-1 text-gray-200">Serial Number</label>
              <input
                type="text"
                name="serial_number"
                value={form.serial_number}
                onChange={handleInputChange}
                className="w-full p-2 border border-gray-600 rounded bg-zinc-700 text-white placeholder-gray-400"
                required
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium mb-1 text-gray-200">Price</label>
              <input
                type="number"
                name="price"
                value={form.price}
                onChange={handleInputChange}
                step="0.01"
                min="0"
                className="w-full p-2 border border-gray-600 rounded bg-zinc-700 text-white placeholder-gray-400"
                required
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium mb-1 text-gray-200">Stock Quantity</label>
              <input
                type="number"
                name="quantity_in_stock"
                value={form.quantity_in_stock}
                onChange={handleInputChange}
                min="0"
                className="w-full p-2 border border-gray-600 rounded bg-zinc-700 text-white placeholder-gray-400"
                required
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium mb-1 text-gray-200">Category</label>
              <select
                name="category"
                value={form.category}
                onChange={handleInputChange}
                className="w-full p-2 border border-gray-600 rounded bg-zinc-700 text-white"
              >
                <option value="">Select Category</option>
                {categories.map(category => (
                  <option key={category.id} value={category.id}>
                    {category.name}
                  </option>
                ))}
              </select>
            </div>
            
            <div>
              <label className="block text-sm font-medium mb-1 text-gray-200">Brand</label>
              <select
                name="brand"
                value={form.brand}
                onChange={handleInputChange}
                className="w-full p-2 border border-gray-600 rounded bg-zinc-700 text-white"
              >
                <option value="">Select Brand</option>
                {brands.map(brand => (
                  <option key={brand.id} value={brand.id}>
                    {brand.name}
                  </option>
                ))}
              </select>
            </div>
            
            <div>
              <label className="block text-sm font-medium mb-1 text-gray-200">Seller</label>
              <select
                name="seller"
                value={form.seller}
                onChange={handleInputChange}
                className="w-full p-2 border border-gray-600 rounded bg-zinc-700 text-white"
              >
                <option value="">Select Seller</option>
                {sellers.map(seller => (
                  <option key={seller.id} value={seller.id}>
                    {seller.name}
                  </option>
                ))}
              </select>
            </div>
            
            <div>
              <label className="block text-sm font-medium mb-1 text-gray-200">Distributor</label>
              <select
                name="distributor"
                value={form.distributor}
                onChange={handleInputChange}
                className="w-full p-2 border border-gray-600 rounded bg-zinc-700 text-white"
                required
              >
                <option value="">Select Distributor</option>
                {distributors.map(distributor => (
                  <option key={distributor.id} value={distributor.id}>
                    {distributor.name}
                  </option>
                ))}
              </select>
            </div>
          </div>
          
          <div>
            <label className="block text-sm font-medium mb-1 text-gray-200">Description</label>
            <textarea
              name="description"
              value={form.description}
              onChange={handleInputChange}
              rows="3"
              className="w-full p-2 border border-gray-600 rounded bg-zinc-700 text-white placeholder-gray-400"
              required
            ></textarea>
          </div>
          
          <div>
            <label className="block text-sm font-medium mb-1 text-gray-200">Product Image</label>
            <input
              type="file"
              name="image"
              onChange={handleInputChange}
              accept="image/*"
              className="w-full p-2 border border-gray-600 rounded bg-zinc-700 text-white"
            />
            {imagePreview && (
              <div className="mt-2">
                <p className="text-sm text-gray-300 mb-1">Preview:</p>
                <img
                  src={imagePreview}
                  alt="Preview"
                  className="w-32 h-32 object-cover rounded border border-gray-600"
                />
              </div>
            )}
          </div>
          
          <div className="flex justify-end space-x-2">
            {editMode && (
              <button
                type="button"
                onClick={resetForm}
                className="px-4 py-2 bg-gray-600 text-white rounded hover:bg-gray-700"
              >
                Cancel
              </button>
            )}
            <button
              type="submit"
              className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
            >
              {editMode ? "Update Product" : "Add Product"}
            </button>
          </div>
        </form>
      </div>
      
      <div className="bg-zinc-800 rounded-lg p-6 shadow-lg">
        <h2 className="text-xl font-semibold mb-4 text-white">Product List</h2>
        
        {loading ? (
          <p className="text-center py-4 text-gray-300">Loading products...</p>
        ) : products.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="min-w-full bg-zinc-900 rounded-lg">
              <thead>
                <tr className="bg-zinc-700">
                  <th className="px-4 py-2 text-left text-gray-200">Image</th>
                  <th className="px-4 py-2 text-left text-gray-200">Title</th>
                  <th className="px-4 py-2 text-left text-gray-200">Price</th>
                  <th className="px-4 py-2 text-left text-gray-200">Stock</th>
                  <th className="px-4 py-2 text-left text-gray-200">Category</th>
                  <th className="px-4 py-2 text-left text-gray-200">Brand</th>
                  <th className="px-4 py-2 text-left text-gray-200">Actions</th>
                </tr>
              </thead>
              <tbody>
                {products.map((product) => (
                  <tr key={product.id} className="border-t border-gray-700">
                    <td className="px-4 py-2">
                      {product.image ? (
                        <img
                          src={getImageUrl(product.image)}
                          alt={product.title}
                          className="w-12 h-12 object-cover rounded"
                        />
                      ) : (
                        <div className="w-12 h-12 bg-gray-600 rounded flex items-center justify-center">
                          <span className="text-gray-300 text-xs">No image</span>
                        </div>
                      )}
                    </td>
                    <td className="px-4 py-2 text-gray-200">{product.title}</td>
                    <td className="px-4 py-2 text-gray-200">${parseFloat(product.price).toFixed(2)}</td>
                    <td className="px-4 py-2 text-gray-200">{product.quantity_in_stock}</td>
                    <td className="px-4 py-2 text-gray-200">{product.category?.name || "N/A"}</td>
                    <td className="px-4 py-2 text-gray-200">{product.brand?.name || "N/A"}</td>
                    <td className="px-4 py-2">
                      <div className="flex space-x-2">
                        <button
                          onClick={() => handleEdit(product)}
                          className="px-3 py-1 bg-blue-600 text-white rounded text-sm hover:bg-blue-700"
                        >
                          Edit
                        </button>
                        <button
                          onClick={() => handleDelete(product.id)}
                          className="px-3 py-1 bg-red-600 text-white rounded text-sm hover:bg-red-700"
                        >
                          Delete
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <p className="text-center py-4 text-gray-300">No products found.</p>
        )}
      </div>
    </div>
  );
}
