import { create } from 'zustand';

interface User {
  id: string;
  email: string;
  name: string | null;
  language: string;
}

interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  isInitialized: boolean;
  initialize: () => void;
  setUser: (user: User | null) => void;
  setLanguage: (lang: string) => void;
  login: (user: User) => void;
  logout: () => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  isAuthenticated: false,
  isLoading: false,
  isInitialized: false,
  initialize: () => set({ isInitialized: true }),
  setUser: (user) => set({ user, isAuthenticated: !!user }),
  setLanguage: (lang) => set((state) => ({ user: state.user ? { ...state.user, language: lang } : null })),
  login: (user) => set({ user, isAuthenticated: true }),
  logout: () => set({ user: null, isAuthenticated: false }),
}));
