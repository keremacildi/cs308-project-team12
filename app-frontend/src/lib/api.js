const API_URL = process.env.NEXT_PUBLIC_API_URL;

// Helper function to log API requests
const logRequest = (method, url, body = null) => {
  const requestInfo = {
    timestamp: new Date().toISOString(),
    method,
    url,
    body: body ? JSON.stringify(body) : null
  };
  console.log('🚀 API Request:', requestInfo);
  return requestInfo;
};

const handleResponse = async (response, requestInfo) => {
  const responseInfo = {
    status: response.status,
    statusText: response.statusText,
    url: response.url
  };
  
  if (!response.ok) {
    const error = await response.json();
    console.error('❌ API Error:', { request: requestInfo, response: responseInfo, error });
    throw new Error(error.error || error.message || 'Something went wrong');
  }
  
  const data = await response.json();
  console.log('✅ API Response:', { request: requestInfo, response: responseInfo, data });
  return data;
};

export const api = {
  products: {
    list: async (query = '', sort = '') => {
      const url = new URL(`${API_URL}/api/products/all/`);
      if (query) url.searchParams.append('q', query);
      if (sort) url.searchParams.append('sort', sort);
      
      const requestInfo = logRequest('GET', url.toString());
      const response = await fetch(url);
      return handleResponse(response, requestInfo);
    },
    
    detail: async (id) => {
      const url = `${API_URL}/api/products/${id}/`;
      const requestInfo = logRequest('GET', url);
      const response = await fetch(url);
      return handleResponse(response, requestInfo);
    },
    
    comments: async (id) => {
      const url = `${API_URL}/api/products/${id}/comments/`;
      const requestInfo = logRequest('GET', url);
      const response = await fetch(url);
      return handleResponse(response, requestInfo);
    },
    
    reviews: {
      get: async (id) => {
        const url = `${API_URL}/api/products/${id}/reviews/`;
        const requestInfo = logRequest('GET', url);
        const response = await fetch(url);
        return handleResponse(response, requestInfo);
      },
      
      create: async (id, data) => {
        const url = `${API_URL}/api/products/${id}/reviews/`;
        const requestInfo = logRequest('POST', url, data);
        const response = await fetch(url, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          credentials: 'include',
          body: JSON.stringify(data),
        });
        return handleResponse(response, requestInfo);
      },
    },
  },

  categories: {
    list: async () => {
      const url = `${API_URL}/api/categories/`;
      const requestInfo = logRequest('GET', url);
      const response = await fetch(url);
      return handleResponse(response, requestInfo);
    },
  },


  orders: {
    history: async () => {
      const url = `${API_URL}/api/orders/history/`;
      const requestInfo = logRequest('GET', url);
      const response = await fetch(url, {
        credentials: 'include',
      });
      return handleResponse(response, requestInfo);
    },
    
    create: async (data) => {
      const url = `${API_URL}/api/orders/`;
      const requestInfo = logRequest('POST', url, data);
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify(data),
      });
      return handleResponse(response, requestInfo);
    },
    
    cancel: async (orderId) => {
      const url = `${API_URL}/api/orders/${orderId}/cancel/`;
      const requestInfo = logRequest('POST', url);
      const response = await fetch(url, {
        method: 'POST',
        credentials: 'include',
      });
      return handleResponse(response, requestInfo);
    },

    refund: async (orderId) => {
      const url = `${API_URL}/api/orders/${orderId}/refund/`;
      const requestInfo = logRequest('POST', url);
      const response = await fetch(url, {
        method: 'POST',
        credentials: 'include',
      });
      return handleResponse(response, requestInfo);
    },

    getInvoice: async (orderId) => {
      const url = `${API_URL}/api/orders/${orderId}/invoice/`;
      const requestInfo = logRequest('GET', url);
      const response = await fetch(url, {
        credentials: 'include',
      });
      if (!response.ok) {
        const error = await response.json();
        console.error('❌ API Error:', { request: requestInfo, response: {
          status: response.status,
          statusText: response.statusText,
          url: response.url
        }, error });
        throw new Error(error.error || error.message || 'Failed to download invoice');
      }
      console.log('✅ API Response:', { request: requestInfo, response: {
        status: response.status,
        statusText: response.statusText,
        url: response.url
      }, type: 'blob' });
      return response.blob();
    },
  },

  auth: {
    register: async (userData) => {
      const url = `${API_URL}/api/auth/register/`;
      const requestInfo = logRequest('POST', url, userData);
      const response = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(userData),
      });
      return handleResponse(response, requestInfo);
    },

    login: async (credentials) => {
      document.cookie = 'sessionid=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT';

      const url = `${API_URL}/api/auth/login/`;
      const requestInfo = logRequest('POST', url, credentials);
      const response = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(credentials),
      });
      
      // Get the response data
      const data = await handleResponse(response, requestInfo);
      
      // Extract cookies from response headers and save them
      // This is needed because the cookies might not be automatically saved in all cases
      const setCookieHeader = response.headers.get('set-cookie');
      if (setCookieHeader) {
        console.log('Set-Cookie header received:', setCookieHeader);
        // The setCookieHeader will be a string containing all cookies
        // We can't directly set them from JavaScript due to browser security,
        // but we can log them to confirm they're being sent by the server
      }
      
      // Save session information
      if (data && data.user) {
        // Store auth info in localStorage to use for future requests
        localStorage.setItem('user', JSON.stringify(data.user));
        localStorage.setItem('isLoggedIn', 'true');
        
        // Additional measure: manually set document cookie if the backend doesn't set httpOnly cookies
        document.cookie = `userSession=${data.user.id}; path=/; max-age=86400`;
        document.cookie = `isAuthenticated=true; path=/; max-age=86400`;
        
        // If there's a CSRF token in the response, save it as a cookie as well
        if (data.csrftoken) {
          document.cookie = `csrftoken=${data.csrftoken}; path=/; max-age=86400`;
        }
      }
      
      return data;
    },
    
    logout: async () => {
      const url = `${API_URL}/api/auth/logout/`;
      const requestInfo = logRequest('POST', url);
      // const response = await fetch(url, {
      //   method: 'POST',
      //   credentials: 'include',
      // });
      
      // Clear all authentication cookies
      document.cookie = 'userSession=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT';
      document.cookie = 'isAuthenticated=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT';
      document.cookie = 'user=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT';
      document.cookie = 'csrftoken=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT';
      document.cookie = 'sessionid=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT';
      // Clear localStorage items
      localStorage.removeItem('user');
      localStorage.removeItem('isLoggedIn');
      
      return handleResponse(response, requestInfo);
    },

    check: async () => {
      const url = `${API_URL}/api/auth/check/`;
      const requestInfo = logRequest('GET', url);
      const response = await fetch(url, {
        credentials: 'include',
      });
      return handleResponse(response, requestInfo);
    },

    getProfile: async () => {
      const url = `${API_URL}/api/auth/profile/`;
      const requestInfo = logRequest('GET', url);
      const response = await fetch(url, {
        credentials: 'include',
      });
      return handleResponse(response, requestInfo);
    },

    updateProfile: async (profileData) => {
      const url = `${API_URL}/api/auth/profile/`;
      const requestInfo = logRequest('PUT', url, profileData);
      const response = await fetch(url, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(profileData),
      });
      return handleResponse(response, requestInfo);
    },

    changePassword: async (passwordData) => {
      const url = `${API_URL}/api/auth/change-password/`;
      const requestInfo = logRequest('POST', url, passwordData);
      const response = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(passwordData),
      });
      return handleResponse(response, requestInfo);
    },

    forgotPassword: async (email) => {
      const url = `${API_URL}/api/auth/forgot-password/`;
      const body = { email };
      const requestInfo = logRequest('POST', url, body);
      const response = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(body),
      });
      return handleResponse(response, requestInfo);
    },

    resetPassword: async (resetData) => {
      const url = `${API_URL}/api/auth/reset-password/`;
      const requestInfo = logRequest('POST', url, resetData);
      const response = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(resetData),
      });
      return handleResponse(response, requestInfo);
    },
  },

  search: {
    products: async (params) => {
      const queryParams = new URLSearchParams();
      for (const [key, value] of Object.entries(params)) {
        if (value) queryParams.append(key, value);
      }
      const url = `${API_URL}/api/search/?${queryParams.toString()}`;
      const requestInfo = logRequest('GET', url);
      const response = await fetch(url);
      return handleResponse(response, requestInfo);
    },
  },

  wishlist: {
    get: async () => {
      const url = `${API_URL}/api/wishlist/`;
      const requestInfo = logRequest('GET', url);
      const response = await fetch(url, {
        credentials: 'include',
      });
      return handleResponse(response, requestInfo);
    },
    
    add: async (productId) => {
      const url = `${API_URL}/api/wishlist/add/${productId}/`;
      const requestInfo = logRequest('POST', url);
      const response = await fetch(url, {
        method: 'POST',
        credentials: 'include',
      });
      return handleResponse(response, requestInfo);
    },
    
    remove: async (productId) => {
      const url = `${API_URL}/api/wishlist/remove/${productId}/`;
      const requestInfo = logRequest('DELETE', url);
      const response = await fetch(url, {
        method: 'DELETE',
        credentials: 'include',
      });
      return handleResponse(response, requestInfo);
    },
  },
}; 