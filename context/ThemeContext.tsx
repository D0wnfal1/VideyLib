'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';

type Theme = 'light' | 'dark';

interface ThemeContextType {
  theme: Theme;
  toggleTheme: () => void;
  mounted: boolean;
}


const ThemeContext = createContext<ThemeContextType>({
  theme: 'light',
  toggleTheme: () => {},
  mounted: false
});

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [theme, setTheme] = useState<Theme>('light');
  const [mounted, setMounted] = useState(false);

  
  useEffect(() => {
    
    const isClient = typeof window !== 'undefined';
    if (!isClient) return;

    
    const savedTheme = localStorage.getItem('theme') as Theme | null;
    
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    
    let initialTheme: Theme;
    
    if (savedTheme && (savedTheme === 'light' || savedTheme === 'dark')) {
      initialTheme = savedTheme;
    } else if (prefersDark) {
      initialTheme = 'dark';
    } else {
      initialTheme = 'light';
    }
    
    setTheme(initialTheme);
    
    
    if (initialTheme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
    
    
    setMounted(true);
  }, []);

  const toggleTheme = () => {
    
    if (typeof window === 'undefined') return;
    
    setTheme((prevTheme) => {
      const newTheme = prevTheme === 'light' ? 'dark' : 'light';
      
      localStorage.setItem('theme', newTheme);
      
      
      if (newTheme === 'dark') {
        document.documentElement.classList.add('dark');
      } else {
        document.documentElement.classList.remove('dark');
      }
      
      return newTheme;
    });
  };

  
  return (
    <ThemeContext.Provider value={{ theme, toggleTheme, mounted }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  return useContext(ThemeContext);
} 