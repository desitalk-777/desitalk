// store/themeStore.js
import { create } from 'zustand';

export const useThemeStore = create((set) => ({
  theme: localStorage.getItem('dt_theme') || 'dark',
  toggleTheme: () => set(state => {
    const newTheme = state.theme === 'dark' ? 'light' : 'dark';
    localStorage.setItem('dt_theme', newTheme);
    return { theme: newTheme };
  })
}));
