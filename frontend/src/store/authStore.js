import { create } from 'zustand';
import api from '../services/api';

export const useAuthStore = create((set, get) => ({
  user: null,
  token: localStorage.getItem('dt_token') || null,
  isLoading: true,
  isAuthenticated: false,

  initialize: async () => {
    const token = localStorage.getItem('dt_token');
    if (!token) {
      set({ isLoading: false });
      return;
    }
    try {
      const res = await api.get('/auth/me');
      set({ user: res.data.data, token, isAuthenticated: true, isLoading: false });
    } catch {
      localStorage.removeItem('dt_token');
      set({ user: null, token: null, isAuthenticated: false, isLoading: false });
    }
  },

  login: async (credentials) => {
    const res = await api.post('/auth/login', credentials);
    const { token, user } = res.data;
    localStorage.setItem('dt_token', token);
    set({ user, token, isAuthenticated: true });
    return user;
  },

  register: async (data) => {
    const res = await api.post('/auth/register', data);
    const { token, user } = res.data;
    localStorage.setItem('dt_token', token);
    set({ user, token, isAuthenticated: true });
    return user;
  },

  loginWithToken: (token) => {
    localStorage.setItem('dt_token', token);
    set({ token });
    get().initialize();
  },

  logout: async () => {
    try { await api.post('/auth/logout'); } catch {}
    localStorage.removeItem('dt_token');
    set({ user: null, token: null, isAuthenticated: false });
    window.location.href = '/';
  },

  updateUser: (updates) => {
    set(state => ({ user: { ...state.user, ...updates } }));
  }
}));
