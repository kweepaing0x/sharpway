// Theme utility constants and functions
export const THEME_STORAGE_KEY = 'theme';

export type Theme = 'light' | 'dark';

export const DEFAULT_THEME: Theme = 'dark';

export const applyThemeToDocument = (theme: Theme) => {
  const root = document.documentElement;
  if (theme === 'dark') {
    root.classList.add('dark');
  } else {
    root.classList.remove('dark');
  }
};

export const getSystemTheme = (): Theme => {
  if (typeof window !== 'undefined') {
    return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
  }
  return DEFAULT_THEME;
};

export const getSavedTheme = (): Theme | null => {
  if (typeof window !== 'undefined') {
    return localStorage.getItem(THEME_STORAGE_KEY) as Theme | null;
  }
  return null;
};

export const saveTheme = (theme: Theme) => {
  if (typeof window !== 'undefined') {
    localStorage.setItem(THEME_STORAGE_KEY, theme);
  }
};