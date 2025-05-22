'use client';

import { FaHome, FaArrowLeft, FaFolder, FaFolderPlus, FaBookmark, FaSave } from 'react-icons/fa';
import ThemeSwitcher from './ThemeSwitcher';
import { useNavigation } from '@/context/NavigationContext';

export default function NavBar() {
  const { 
    currentPath, 
    pathHistory, 
    goBack, 
    goHome, 
    setShowFolderDialog, 
    setShowSavedPathsDialog,
    saveCurrentPath
  } = useNavigation();
  
  return (
    <nav className="bg-gray-800 shadow-md">
      <div className="container mx-auto px-4 py-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <div className="flex gap-2 items-center">
              <button
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  goHome();
                }}
                className="p-2 bg-blue-500 hover:bg-blue-600 text-white rounded-full transition-colors"
                title="Go to home folder"
              >
                <FaHome />
              </button>
              
              <button
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  if (pathHistory.length > 1) {
                    goBack();
                  }
                }}
                disabled={pathHistory.length <= 1}
                className={`p-2 rounded-full transition-colors ${
                  pathHistory.length <= 1
                    ? 'bg-gray-300 text-gray-600 cursor-not-allowed'
                    : 'bg-blue-500 hover:bg-blue-600 text-white'
                }`}
                title="Go back"
              >
                <FaArrowLeft />
              </button>

              <button
                onClick={(e) => {
                  e.preventDefault(); 
                  e.stopPropagation();
                  setShowFolderDialog(true);
                }}
                className="p-2 bg-blue-500 hover:bg-blue-600 text-white rounded-full transition-colors"
                title="Select folder"
              >
                <FaFolderPlus />
              </button>

              <button
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  setShowSavedPathsDialog(true);
                }}
                className="p-2 bg-blue-500 hover:bg-blue-600 text-white rounded-full transition-colors"
                title="Saved paths"
              >
                <FaBookmark />
              </button>
            </div>
            
            <div className="flex-1 p-2 min-w-[200px] max-w-[600px] bg-card-light dark:bg-card-dark rounded-lg border border-app-light dark:border-app-dark flex items-center transition-colors">
              <FaFolder className="text-yellow-500 dark:text-yellow-400 mr-2" />
              <span className="truncate text-app-light dark:text-app-dark">{currentPath}</span>
              {currentPath && (
                <button
                  onClick={saveCurrentPath}
                  className="ml-2 text-blue-500 hover:text-blue-700"
                  title="Save this path"
                >
                  <FaSave size={16} />
                </button>
              )}
            </div>
          </div>
          
          <div>
            <ThemeSwitcher />
          </div>
        </div>
      </div>
    </nav>
  );
} 