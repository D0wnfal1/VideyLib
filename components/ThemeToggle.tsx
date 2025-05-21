'use client';

import { useTheme } from '@/context/ThemeContext';
import { FaSun, FaMoon } from 'react-icons/fa';

export default function ThemeToggle() {
  const { theme, toggleTheme } = useTheme();

  return (
    <button
      onClick={toggleTheme}
      className="relative p-2 rounded-lg bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-200 hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors focus:outline-none focus:ring-2 focus:ring-primary-500"
      aria-label="Toggle theme"
    >
      <div className="flex items-center justify-center">
        {theme === 'dark' ? (
          <FaSun className="text-yellow-400" size={18} />
        ) : (
          <FaMoon className="text-blue-700" size={18} />
        )}
      </div>
    </button>
  );
} 