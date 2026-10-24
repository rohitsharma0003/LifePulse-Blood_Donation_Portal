import axios from 'axios';

const api = axios.create({
  baseURL: '/api',
  headers: {
    'Content-Type': 'application/json'
  }
});

// Automatically inject JWT token into requests
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor to format errors
api.interceptors.response.use(
  (response) => response,
  (error) => {
    const message =
      error.response?.data?.message ||
      error.message ||
      'An unexpected network error occurred';
    return Promise.reject(new Error(message));
  }
);

/* ---------------- Auth API ---------------- */
export const registerUser = async (userData) => {
  const response = await api.post('/auth/register', userData);
  return response.data;
};

export const loginUser = async (credentials) => {
  const response = await api.post('/auth/login', credentials);
  return response.data;
};

export const getMyProfile = async () => {
  const response = await api.get('/auth/me');
  return response.data;
};

export const toggleDonorAvailability = async () => {
  const response = await api.put('/auth/toggle-donor');
  return response.data;
};

/* ---------------- Request API ---------------- */
export const createBloodRequest = async (requestData) => {
  const response = await api.post('/requests', requestData);
  return response.data;
};

export const getMyRequests = async () => {
  const response = await api.get('/requests/my-requests');
  return response.data;
};

export const getRequestDetails = async (id) => {
  const response = await api.get(`/requests/${id}`);
  return response.data;
};

export const getAcceptedDonors = async (id) => {
  const response = await api.get(`/requests/${id}/accepted-donors`);
  return response.data;
};

export const getNearbyBanks = async (id) => {
  const response = await api.get(`/requests/${id}/nearby-banks`);
  return response.data;
};

/* ---------------- Response API (WhatsApp Flow) ---------------- */
export const respondToRequest = async ({ requestId, donorId, action }) => {
  const response = await api.post('/responses/respond', {
    requestId,
    donorId,
    action
  });
  return response.data;
};

export const getResponseDetails = async (requestId, donorId) => {
  const response = await api.get(`/responses/details?req=${requestId}&donor=${donorId}`);
  return response.data;
};

export default api;
