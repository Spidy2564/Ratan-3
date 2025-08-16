import axios from 'axios';

const API_BASE_URL = 'http://localhost:5000/api';

// Create axios instance
const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add token to requests if available
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('adminToken');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Admin API functions
export const adminAPI = {
  login: (credentials) => api.post('/admin/login', credentials),
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
