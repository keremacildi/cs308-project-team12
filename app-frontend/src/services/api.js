const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:8000/api';

export const fetchProducts = async (filters = {}) => {
    try {
        const queryParams = new URLSearchParams();
        if (filters.category) queryParams.append('category', filters.category);
        if (filters.search) queryParams.append('q', filters.search);
        if (filters.sort) queryParams.append('sort', filters.sort);

        const response = await fetch(`${API_URL}/products/?${queryParams}`);
        if (!response.ok) throw new Error('Network response was not ok');
        return await response.json();
    } catch (error) {
        console.error('Error fetching products:', error);
        throw error;
    }
};

export const fetchCategories = async () => {
    try {
        const response = await fetch(`${API_URL}/categories/`);
        if (!response.ok) throw new Error('Network response was not ok');
        return await response.json();
    } catch (error) {
        console.error('Error fetching categories:', error);
        throw error;
    }
};

export const fetchProductsByCategory = async (categoryId) => {
    try {
        const response = await fetch(`${API_URL}/products/category/${categoryId}/`);
        if (!response.ok) throw new Error('Network response was not ok');
        return await response.json();
    } catch (error) {
        console.error('Error fetching products by category:', error);
        throw error;
    }
}; 