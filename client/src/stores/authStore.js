import { create } from 'zustand';
import { api } from '../services/api';
import { connectSocket, disconnectSocket } from '../services/socket';

export const useAuthStore = create((set, get) => ({
  user: null,
  token: null,
  loading: true,
  otpSent: false,
  error: null,

  initialize: async () => {
    const token = localStorage.getItem('portal_token');
    if (!token) {
      set({ loading: false });
      return;
    }
    try {
      const { user } = await api.getMe();
      set({ user, token, loading: false });
      connectSocket(token);
    } catch {
      localStorage.removeItem('portal_token');
      set({ loading: false });
    }
  },

  sendOtp: async (email) => {
    set({ error: null });
    try {
      await api.sendOtp(email);
      set({ otpSent: true });
    } catch (err) {
      set({ error: err.message });
    }
  },

  verifyOtp: async (email, otp) => {
    set({ error: null });
    try {
      const { user, token } = await api.verifyOtp(email, otp);
      localStorage.setItem('portal_token', token);
      set({ user, token, otpSent: false });
      connectSocket(token);
      return user;
    } catch (err) {
      set({ error: err.message });
      return null;
    }
  },

  logout: () => {
    localStorage.removeItem('portal_token');
    disconnectSocket();
    set({ user: null, token: null, otpSent: false });
  },

  clearError: () => set({ error: null }),
}));
