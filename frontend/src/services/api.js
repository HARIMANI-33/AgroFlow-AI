import axios from 'axios';

// Base API configuration
const API_BASE_URL = '/api/v1';

const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Interceptor to inject JWT token
apiClient.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('agroflow_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Interceptor to handle unauthorized / expired tokens
apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response && error.response.status === 401) {
      localStorage.removeItem('agroflow_token');
      localStorage.removeItem('agroflow_user');
      // If unauthorized and not already on an auth/entry page, notify or redirect
      if (!window.location.pathname.includes('/auth') && window.location.pathname !== '/') {
        window.location.href = '/';
      }
    }
    return Promise.reject(error);
  }
);

// Helper to extract clean error message
export const getErrorMessage = (error, defaultMsg = 'An unexpected error occurred') => {
  if (error.response?.data?.detail) {
    if (typeof error.response.data.detail === 'string') {
      return error.response.data.detail;
    }
    if (Array.isArray(error.response.data.detail)) {
      return error.response.data.detail.map((d) => d.msg || d.message).join(', ');
    }
  }
  return error.message || defaultMsg;
};

// 1. Authentication Service
export const authService = {
  registerFarmer: async (data) => {
    const response = await apiClient.post('/auth/register/farmer', data);
    return response.data;
  },
  registerBuyer: async (data) => {
    const response = await apiClient.post('/auth/register/buyer', data);
    return response.data;
  },
  login: async (credentials) => {
    const response = await apiClient.post('/auth/login', credentials);
    return response.data;
  },
  getCurrentUser: async () => {
    const response = await apiClient.get('/auth/me');
    return response.data;
  },
  checkUsername: async (username) => {
    const response = await apiClient.get(`/auth/check-username/${encodeURIComponent(username)}`);
    return response.data;
  },
};

// 2. Crop Listings Service
export const cropService = {
  createListing: async (formData) => {
    const response = await apiClient.post('/farmer/crops', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return response.data;
  },
  getMyListings: async () => {
    const response = await apiClient.get('/farmer/crops/my');
    return response.data;
  },
  updateListing: async (id, formData) => {
    const response = await apiClient.put(`/farmer/crops/${id}`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return response.data;
  },
  cancelListing: async (id) => {
    const response = await apiClient.delete(`/farmer/crops/${id}`);
    return response.data;
  },
  getActiveCrops: async () => {
    const response = await apiClient.get('/crops');
    return response.data;
  },
  getCropById: async (id) => {
    const response = await apiClient.get(`/crops/${id}`);
    return response.data;
  },
};

// 3. Market Reference Prices Service
export const marketPriceService = {
  getTodayPrices: async () => {
    const response = await apiClient.get('/market-prices/today');
    return response.data;
  },
  getTodayCropPrice: async (cropName) => {
    const response = await apiClient.get(`/market-prices/today/${encodeURIComponent(cropName)}`);
    return response.data;
  },
};

// 4. Buyer Demand / Requirements Service
export const requirementService = {
  createRequirement: async (data) => {
    const response = await apiClient.post('/buyer/requirements', data);
    return response.data;
  },
  getMyRequirements: async () => {
    const response = await apiClient.get('/buyer/requirements/my');
    return response.data;
  },
  getOpenRequirements: async () => {
    const response = await apiClient.get('/requirements');
    return response.data;
  },
  getRequirementById: async (id) => {
    const response = await apiClient.get(`/requirements/${id}`);
    return response.data;
  },
  getRegisteredBuyers: async () => {
    const response = await apiClient.get('/requirements/buyers');
    return response.data;
  },
  cancelRequirement: async (id) => {
    const response = await apiClient.delete(`/buyer/requirements/${id}`);
    return response.data;
  },
};

// 5. Smart Matching & Aggregation Service
export const matchingService = {
  getMatches: async (requirementId) => {
    const response = await apiClient.get(`/matches/requirements/${requirementId}`);
    return response.data;
  },
};

// 6. Orders Service
export const orderService = {
  createOrder: async (data) => {
    const response = await apiClient.post('/buyer/orders', data);
    return response.data;
  },
  getBuyerOrders: async () => {
    const response = await apiClient.get('/buyer/orders/my');
    return response.data;
  },
  getFarmerOrders: async () => {
    const response = await apiClient.get('/farmer/orders/my');
    return response.data;
  },
  getOrderById: async (id) => {
    const response = await apiClient.get(`/orders/${id}`);
    return response.data;
  },
  updateOrderStatus: async (id, status) => {
    const response = await apiClient.put(`/orders/${id}/status`, { status });
    return response.data;
  },
};

export default apiClient;
