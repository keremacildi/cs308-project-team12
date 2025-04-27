/**
 * API Client for CS308 Store
 * Handles all API requests to the backend server
 */

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

// Helper function to handle fetch responses
const handleResponse = async (response) => {
  if (!response.ok) {
    // Try to get error message from response
    try {
      const errorData = await response.json();
      throw new Error(errorData.message || `API error: ${response.status}`);
    } catch (error) {
      throw new Error(`API error: ${response.status}`);
    }
  }
  
  // Check if response is empty
  const text = await response.text();
  return text ? JSON.parse(text) : {};
};

// Helper to get auth headers with CSRF token
const getAuthHeaders = () => {
  const headers = {
    'Content-Type': 'application/json',
  };
  
  // Add CSRF token if available
  const csrfToken = document.cookie
    .split('; ')
    .find(row => row.startsWith('csrftoken='))
    ?.split('=')[1];
    
  if (csrfToken) {
    headers['X-CSRFToken'] = csrfToken;
  }
  
  return headers;
};

const getAuthHeadersWithoutContentType = () => {
  const headers = {};
  if (typeof window !== 'undefined') {
    const csrfToken = getCookie('csrftoken');
    if (csrfToken) {
      headers['X-CSRFToken'] = csrfToken;
    }
    
    const token = localStorage.getItem('token');
    if (token) {
      headers['Authorization'] = `Token ${token}`;
    }
  }
  return headers;
};

const apiClient = {
  // Auth endpoints
  auth: {
    login: async (credentials) => {
      const response = await fetch(`${API_BASE_URL}/api/auth/login/`, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify(credentials),
        credentials: 'include',
      });
      return handleResponse(response);
    },
    
    logout: async () => {
      const response = await fetch(`${API_BASE_URL}/api/auth/logout/`, {
        method: 'POST',
        headers: getAuthHeaders(),
        credentials: 'include',
      });
      return handleResponse(response);
    },
    
    register: async (userData) => {
      const response = await fetch(`${API_BASE_URL}/api/auth/register/`, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify(userData),
        credentials: 'include',
      });
      return handleResponse(response);
    },
    
    forgotPassword: async (email) => {
      const response = await fetch(`${API_BASE_URL}/api/auth/forgot-password/`, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify({ email }),
      });
      return handleResponse(response);
    },
    
    resetPassword: async (token, password) => {
      const response = await fetch(`${API_BASE_URL}/api/auth/reset-password/`, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify({ token, password }),
      });
      return handleResponse(response);
    },
    
    getUserProfile: async () => {
      const response = await fetch(`${API_BASE_URL}/api/auth/profile/`, {
        headers: getAuthHeaders(),
        credentials: 'include',
      });
      return handleResponse(response);
    },
    
    changePassword: async (passwords) => {
      const response = await fetch(`${API_BASE_URL}/api/auth/change-password/`, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify(passwords),
        credentials: 'include',
      });
      return handleResponse(response);
    },
    
    checkAuth: async () => {
      const response = await fetch(`${API_BASE_URL}/api/auth/check/`, {
        headers: getAuthHeaders(),
        credentials: 'include',
      });
      return handleResponse(response);
    },
  },
  
  // Products endpoints
  products: {
    getAll: async () => {
      const response = await fetch(`${API_BASE_URL}/api/products/all/`);
      return handleResponse(response);
    },
    
    getList: async (params = {}) => {
      const queryParams = new URLSearchParams(params).toString();
      const url = `${API_BASE_URL}/api/products/${queryParams ? `?${queryParams}` : ''}`;
      const response = await fetch(url);
      return handleResponse(response);
    },
    
    getDetail: async (productId) => {
      const response = await fetch(`${API_BASE_URL}/api/products/${productId}/`);
      return handleResponse(response);
    },
    
    getByCategory: async (categoryId) => {
      const response = await fetch(`${API_BASE_URL}/api/products/category/${categoryId}/`);
      return handleResponse(response);
    },
    
    getReviews: async (productId) => {
      const response = await fetch(`${API_BASE_URL}/api/products/${productId}/reviews/`);
      return handleResponse(response);
    },
    
    submitReview: async (productId, reviewData) => {
      const response = await fetch(`${API_BASE_URL}/api/products/${productId}/reviews/create/`, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify(reviewData),
        credentials: 'include',
      });
      return handleResponse(response);
    },
  },
  
  // Filters endpoints
  filters: {
    getCategories: async () => {
      const response = await fetch(`${API_BASE_URL}/api/categories/`);
      return handleResponse(response);
    },
    
    getBrands: async () => {
      const response = await fetch(`${API_BASE_URL}/api/brands/`);
      return handleResponse(response);
    },
    
    getSellers: async () => {
      const response = await fetch(`${API_BASE_URL}/api/sellers/`);
      return handleResponse(response);
    },
  },
  
  // Cart endpoints
  cart: {
    get: async () => {
      const response = await fetch(`${API_BASE_URL}/api/cart/`, {
        headers: getAuthHeaders(),
        credentials: 'include',
      });
      return handleResponse(response);
    },
    
    addItem: async (productId, quantity = 1) => {
      const response = await fetch(`${API_BASE_URL}/api/cart/add/${productId}/`, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify({ quantity }),
        credentials: 'include',
      });
      return handleResponse(response);
    },
    
    removeItem: async (itemId) => {
      const response = await fetch(`${API_BASE_URL}/api/cart/remove/${itemId}/`, {
        method: 'DELETE',
        headers: getAuthHeaders(),
        credentials: 'include',
      });
      return handleResponse(response);
    },
    
    updateItem: async (itemId, quantity) => {
      const response = await fetch(`${API_BASE_URL}/api/cart/update/${itemId}/`, {
        method: 'PUT',
        headers: getAuthHeaders(),
        body: JSON.stringify({ quantity }),
        credentials: 'include',
      });
      return handleResponse(response);
    },
  },
  
  // Orders endpoints
  orders: {
    create: async (orderData) => {
      const response = await fetch(`${API_BASE_URL}/api/orders/`, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify(orderData),
        credentials: 'include',
      });
      return handleResponse(response);
    },
    
    getHistory: async () => {
      const response = await fetch(`${API_BASE_URL}/api/orders/history/`, {
        headers: getAuthHeaders(),
        credentials: 'include',
      });
      return handleResponse(response);
    },
    
    cancel: async (orderId) => {
      const response = await fetch(`${API_BASE_URL}/api/orders/${orderId}/cancel/`, {
        method: 'POST',
        headers: getAuthHeaders(),
        credentials: 'include',
      });
      return handleResponse(response);
    },
    
    downloadInvoice: async (orderId) => {
      const token = localStorage.getItem('token');
      const headers = token ? { 'Authorization': `Bearer ${token}` } : {};
      
      // Simple URL construction - the backend will handle different order ID formats
      const url = `${API_BASE_URL}/api/orders/${orderId}/invoice/`;
      console.log(`Opening invoice URL: ${url}`);
      
      // Direct window.open for downloading the file
      window.open(url, '_blank');
      return true;
    },
    
    requestRefund: async (orderId, reason) => {
      const response = await fetch(`${API_BASE_URL}/api/orders/${orderId}/refund/`, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify({ reason }),
        credentials: 'include',
      });
      return handleResponse(response);
    },
  },
  
  // Search endpoint
  search: {
    products: async (params) => {
      const queryParams = new URLSearchParams(params).toString();
      const response = await fetch(`${API_BASE_URL}/api/search/?${queryParams}`);
      return handleResponse(response);
    },
  },
  
  // Admin endpoints
  admin: {
    getDashboard: async () => {
      const response = await fetch(`${API_BASE_URL}/api/admin/dashboard/`, {
        headers: getAuthHeaders(),
        credentials: 'include',
      });
      return handleResponse(response);
    },
    
    getOrders: async () => {
      const response = await fetch(`${API_BASE_URL}/api/admin/orders/`, {
        headers: getAuthHeaders(),
        credentials: 'include',
      });
      return handleResponse(response);
    },
    
    getProducts: async () => {
      const response = await fetch(`${API_BASE_URL}/api/admin/products/`, {
        headers: getAuthHeaders(),
        credentials: 'include',
      });
      return handleResponse(response);
    },
    
    getProductDetail: async (productId) => {
      const response = await fetch(`${API_BASE_URL}/api/admin/products/${productId}/`, {
        headers: getAuthHeaders(),
        credentials: 'include',
      });
      return handleResponse(response);
    },
    
    updateProduct: async (productId, productData) => {
      // Check if productData is FormData
      const isFormData = productData instanceof FormData;
      
      const response = await fetch(`${API_BASE_URL}/api/admin/products/${productId}/`, {
        method: 'PUT',
        headers: isFormData ? { 
          ...getAuthHeadersWithoutContentType() 
        } : {
          ...getAuthHeaders()
        },
        body: isFormData ? productData : JSON.stringify(productData),
        credentials: 'include',
      });
      return handleResponse(response);
    },
    
    createProduct: async (productData) => {
      // Check if productData is FormData
      const isFormData = productData instanceof FormData;
      
      const response = await fetch(`${API_BASE_URL}/api/admin/products/`, {
        method: 'POST',
        headers: isFormData ? { 
          ...getAuthHeadersWithoutContentType() 
        } : {
          ...getAuthHeaders()
        },
        body: isFormData ? productData : JSON.stringify(productData),
        credentials: 'include',
      });
      return handleResponse(response);
    },
  },
  
  // Wishlist endpoints
  wishlist: {
    get: async () => {
      const response = await fetch(`${API_BASE_URL}/api/wishlist/`, {
        headers: getAuthHeaders(),
        credentials: 'include',
      });
      return handleResponse(response);
    },
    
    addItem: async (productId) => {
      const response = await fetch(`${API_BASE_URL}/api/wishlist/add/${productId}/`, {
        method: 'POST',
        headers: getAuthHeaders(),
        credentials: 'include',
      });
      return handleResponse(response);
    },
    
    removeItem: async (productId) => {
      const response = await fetch(`${API_BASE_URL}/api/wishlist/remove/${productId}/`, {
        method: 'DELETE',
        headers: getAuthHeaders(),
        credentials: 'include',
      });
      return handleResponse(response);
    },
  },
};

export default apiClient;
