'use client';

import { useTheme } from '@/context/ThemeContext';
import { FaSun, FaMoon } from 'react-icons/fa';

export default function ThemeSwitcher() {
  
  const { theme, toggleTheme, mounted } = useTheme();
  
  
  if (!mounted) {
    return <div className="w-10 h-10"></div>;
  }
  
  return (
    <button
      onClick={toggleTheme}
      className="p-2 rounded-full bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors focus:outline-none focus:ring-2 focus:ring-primary-500 dark:focus:ring-primary-400"
      aria-label={`Switch to ${theme === 'light' ? 'dark' : 'light'} mode`}
    >
      {theme === 'light' ? (
        <FaMoon className="text-primary-700 dark:text-primary-300" size={20} />
      ) : (
        <FaSun className="text-yellow-500" size={20} />
      )}
    </button>
  );
} 