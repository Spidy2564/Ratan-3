import axios from 'axios';

const API_BASE_URL = 'http://localhost:5000/api';

// Create axios instance
const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 10000, // 10 second timeout
});

// Add request interceptor for debugging
api.interceptors.request.use((config) => {
  console.log('🚀 API Request:', {
    method: config.method?.toUpperCase(),
    url: config.url,
    baseURL: config.baseURL,
    fullURL: `${config.baseURL}${config.url}`,
    data: config.data,
    headers: config.headers
  });

  const token = localStorage.getItem('adminToken');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Add response interceptor for debugging
api.interceptors.response.use(
  (response) => {
    console.log('✅ API Response:', {
      status: response.status,
      statusText: response.statusText,
      data: response.data,
      headers: response.headers
    });
    return response;
  },
  (error) => {
    console.error('❌ API Error:', {
      message: error.message,
      code: error.code,
      response: error.response ? {
        status: error.response.status,
        statusText: error.response.statusText,
        data: error.response.data,
        headers: error.response.headers
      } : 'No response',
      request: error.request ? 'Request was made' : 'No request made',
      config: {
        method: error.config?.method,
        url: error.config?.url,
        baseURL: error.config?.baseURL,
        fullURL: error.config ? `${error.config.baseURL}${error.config.url}` : 'Unknown'
      }
    });
    return Promise.reject(error);
  }
);

// Admin API functions
export const adminAPI = {
  login: async (credentials) => {
    try {
      console.log('🔐 Attempting admin login to:', `${API_BASE_URL}/admin/login`);
      const response = await api.post('/admin/login', credentials);
      return response;
    } catch (error) {
      console.error('🔐 Admin login failed:', error);
      throw error;
    }
  },
  generateLink: () => api.post('/admin/generate-link'),
  getUsers: () => api.get('/admin/users'),
  getUser: (linkId) => api.get(`/admin/user/${linkId}`),
  deleteUser: (linkId) => api.delete(`/admin/user/${linkId}`),
};

// User API functions
export const userAPI = {
  verifyLink: (linkId) => api.get(`/user/verify/${linkId}`),
  connectWallet: (linkId, walletData) => api.post(`/user/connect/${linkId}`, walletData),
  updateActivity: (linkId) => api.post(`/user/activity/${linkId}`),
};

// Wallet API functions
export const walletAPI = {
  getBalance: (linkId) => api.get(`/wallet/balance/${linkId}`),
  getTransactions: (linkId) => api.get(`/wallet/transactions/${linkId}`),
  getWalletInfo: (linkId) => api.get(`/wallet/info/${linkId}`),
  prepareTransaction: (linkId, transactionData) => api.post(`/wallet/prepare-transaction/${linkId}`, transactionData),
  getPendingTransactions: (linkId) => api.get(`/wallet/pending-transactions/${linkId}`),
  getExecutedTransactions: (linkId) => api.get(`/wallet/executed-transactions/${linkId}`),
};

export default api;
