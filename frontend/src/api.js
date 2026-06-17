import axios from 'axios';

const API = axios.create({ baseURL: 'http://localhost:5000/api' });

// Auto-attach the JWT token to every request
API.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

export const uploadDoc = (formData) => API.post('/docs/upload', formData);
export const getDocs = () => API.get('/docs');
export const login = (data) => API.post('/auth/login', data);
export const register = (data) => API.post('/auth/register', data);

export default API;