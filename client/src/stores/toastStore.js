import { create } from 'zustand';

export const useToastStore = create((set, get) => ({
  toasts: [],

  addToast: (message, type = 'info', duration = 4000) => {
    const id = Date.now() + Math.random();
    set(s => ({ toasts: [...s.toasts, { id, message, type, duration }] }));
    if (duration > 0) {
      setTimeout(() => {
        set(s => ({ toasts: s.toasts.filter(t => t.id !== id) }));
      }, duration);
    }
    return id;
  },

  removeToast: (id) => {
    set(s => ({ toasts: s.toasts.filter(t => t.id !== id) }));
  },

  success: (msg, dur) => get().addToast(msg, 'success', dur),
  error: (msg, dur) => get().addToast(msg, 'error', dur || 6000),
  warning: (msg, dur) => get().addToast(msg, 'warning', dur),
  info: (msg, dur) => get().addToast(msg, 'info', dur),
}));
