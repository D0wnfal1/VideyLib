'use client';

import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { FolderContent } from '@/lib/types';

interface NavigationContextProps {
  currentPath: string;
  pathHistory: string[];
  savedPaths: string[];
  loadFolder: (folderPath: string) => Promise<FolderContent>;
  goBack: () => void;
  goHome: () => void;
  showFolderDialog: boolean;
  setShowFolderDialog: (show: boolean) => void;
  showSavedPathsDialog: boolean;
  setShowSavedPathsDialog: (show: boolean) => void;
  saveCurrentPath: () => void;
  removeSavedPath: (path: string) => void;
}

const NavigationContext = createContext<NavigationContextProps | undefined>(undefined);

export function NavigationProvider({ children }: { children: ReactNode }) {
  const [folderPath, setFolderPath] = useState<string>('');
  const [pathHistory, setPathHistory] = useState<string[]>([]);
  const [savedPaths, setSavedPaths] = useState<string[]>([]);
  const [showFolderDialog, setShowFolderDialog] = useState(false);
  const [showSavedPathsDialog, setShowSavedPathsDialog] = useState(false);

  useEffect(() => {
    const savedPathsFromStorage = localStorage.getItem('savedPaths');
    if (savedPathsFromStorage) {
      const paths = JSON.parse(savedPathsFromStorage);
      setSavedPaths(paths);
      
      if (paths.length > 0) {
        setShowSavedPathsDialog(true);
      } else {
        setShowFolderDialog(true);
      }
    } else {
      setShowFolderDialog(true);
    }
  }, []);

  const savePaths = (paths: string[]) => {
    localStorage.setItem('savedPaths', JSON.stringify(paths));
    setSavedPaths(paths);
  };

  const loadFolder = async (folderPath: string): Promise<FolderContent> => {
    try {
      const response = await fetch(`/api/videos?path=${encodeURIComponent(folderPath)}`);
      
      if (!response.ok) {
        throw new Error('Failed to load folder content');
      }
      
      const data = await response.json() as FolderContent;
      setFolderPath(data.currentPath);
      
      if (pathHistory.length === 0 || pathHistory[pathHistory.length - 1] !== folderPath) {
        setPathHistory((prev) => [...prev, folderPath]);
      }
      
      return data;
    } catch (error) {
      console.error('Error loading folder:', error);
      throw error;
    }
  };

  const goBack = () => {
    if (pathHistory.length > 1) {
      const newHistory = [...pathHistory];
      newHistory.pop();
      const previousPath = newHistory[newHistory.length - 1];
      setPathHistory(newHistory);
      loadFolder(previousPath);
    }
  };

  const goHome = () => {
    if (pathHistory.length > 0) {
      loadFolder(pathHistory[0]);
      setPathHistory([pathHistory[0]]);
    }
  };

  const saveCurrentPath = () => {
    if (folderPath && !savedPaths.includes(folderPath)) {
      const newSavedPaths = [...savedPaths, folderPath];
      savePaths(newSavedPaths);
    }
  };

  const removeSavedPath = (pathToRemove: string) => {
    const newSavedPaths = savedPaths.filter(p => p !== pathToRemove);
    savePaths(newSavedPaths);
  };

  return (
    <NavigationContext.Provider
      value={{
        currentPath: folderPath,
        pathHistory,
        savedPaths,
        loadFolder,
        goBack,
        goHome,
        showFolderDialog,
        setShowFolderDialog,
        showSavedPathsDialog,
        setShowSavedPathsDialog,
        saveCurrentPath,
        removeSavedPath
      }}
    >
      {children}
    </NavigationContext.Provider>
  );
}

export function useNavigation() {
  const context = useContext(NavigationContext);
  if (context === undefined) {
    throw new Error('useNavigation must be used within a NavigationProvider');
  }
  return context;
} 