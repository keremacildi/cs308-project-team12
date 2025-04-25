const API_URL = process.env.NEXT_PUBLIC_API_URL;

const handleResponse = async (response) => {
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || 'Something went wrong');
  }
  return response.json();
};

export const api = {
  products: {
    list: async (query = '', sort = '') => {
      const url = new URL(`${API_URL}/api/products/`);
      if (query) url.searchParams.append('q', query);
      if (sort) url.searchParams.append('sort', sort);
      const response = await fetch(url);
      return handleResponse(response);
    },
    
    detail: async (id) => {
      const response = await fetch(`${API_URL}/api/products/${id}/`);
      return handleResponse(response);
    },
    
    reviews: {
      get: async (id) => {
        const response = await fetch(`${API_URL}/api/products/${id}/reviews/`);
        return handleResponse(response);
      },
      
      create: async (id, data, token) => {
        const response = await fetch(`${API_URL}/api/products/${id}/reviews/`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`,
          },
          body: JSON.stringify(data),
        });
        return handleResponse(response);
      },
    },
  },

  cart: {
    get: async (token) => {
      const response = await fetch(`${API_URL}/api/cart/`, {
        headers: token ? { 'Authorization': `Bearer ${token}` } : {},
      });
      return handleResponse(response);
    },
    
    add: async (productId, quantity = 1, token) => {
      const response = await fetch(`${API_URL}/api/cart/add/${productId}/`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token && { 'Authorization': `Bearer ${token}` }),
        },
        body: JSON.stringify({ quantity }),
      });
      return handleResponse(response);
    },
    
    remove: async (itemId, token) => {
      const response = await fetch(`${API_URL}/api/cart/remove/${itemId}/`, {
        method: 'DELETE',
        headers: token ? { 'Authorization': `Bearer ${token}` } : {},
      });
      return handleResponse(response);
    },
    
    update: async (itemId, quantity, token) => {
      const response = await fetch(`${API_URL}/api/cart/update/${itemId}/`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          ...(token && { 'Authorization': `Bearer ${token}` }),
        },
        body: JSON.stringify({ quantity }),
      });
      return handleResponse(response);
    },
  },

  orders: {
    history: async (token) => {
      const response = await fetch(`${API_URL}/api/orders/history/`, {
        headers: { 'Authorization': `Bearer ${token}` },
      });
      return handleResponse(response);
    },
    
    create: async (data, token) => {
      const response = await fetch(`${API_URL}/api/orders/`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify(data),
      });
      return handleResponse(response);
    },
    
    cancel: async (orderId, token) => {
      const response = await fetch(`${API_URL}/api/orders/${orderId}/cancel/`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` },
      });
      return handleResponse(response);
    },
  },

  auth: {
    login: async (credentials) => {
      const response = await fetch(`${API_URL}/api/auth/login/`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(credentials),
      });
      return handleResponse(response);
    },
    
    register: async (userData) => {
      const response = await fetch(`${API_URL}/api/auth/register/`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(userData),
      });
      return handleResponse(response);
    },
  },
}; 