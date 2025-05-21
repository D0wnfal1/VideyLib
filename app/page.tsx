'use client';

import { useState, useEffect } from 'react';
import { VideoFile, FolderContent } from '@/lib/types';
import VideoList from '@/components/VideoList';
import VideoPlayer from '@/components/VideoPlayer';
import TagManager from '@/components/TagManager';
import { FaTrash } from 'react-icons/fa';
import path from 'path';
import { useNavigation } from '@/context/NavigationContext';

export default function Home() {
  const [folderContent, setFolderContent] = useState<FolderContent>({
    videos: [],
    folders: [],
    currentPath: '',
  });
  const [selectedVideo, setSelectedVideo] = useState<VideoFile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  const {
    currentPath,
    showFolderDialog,
    showSavedPathsDialog,
    loadFolder,
    savedPaths,
    setShowFolderDialog,
    setShowSavedPathsDialog,
    removeSavedPath,
  } = useNavigation();

  const [newFolderPath, setNewFolderPath] = useState('');
  
  useEffect(() => {
    const loadInitialData = async () => {
      try {
        if (currentPath) {
          setLoading(true);
          setError(null);
          
          try {
            const data = await loadFolder(currentPath);
            // Используем приведение типа для данных
            setFolderContent(data as unknown as FolderContent);
          } catch (loadError) {
            console.error('Error in loadFolder:', loadError);
          }
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : 'An unknown error occurred');
        console.error('Error loading folder:', err);
      } finally {
        setLoading(false);
      }
    };
    
    loadInitialData();
  }, [currentPath, loadFolder]);

  const navigateToFolder = (folder: string) => {
    const newPath = path.join(folderContent.currentPath, folder);
    loadFolder(newPath);
  };

  const handleSelectVideo = (video: VideoFile) => {
    setSelectedVideo(video);
  };

  const handleCloseVideo = () => {
    setSelectedVideo(null);
  };

  const handleUpdateTags = async (videoId: string, tags: string[]) => {
    try {
      const response = await fetch(`/api/videos/${videoId}/tags`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ tags }),
      });

      if (!response.ok) {
        throw new Error('Failed to update tags');
      }

      if (selectedVideo && selectedVideo.id === videoId) {
        setSelectedVideo({
          ...selectedVideo,
          tags,
        });
      }

      setFolderContent((prev) => ({
        ...prev,
        videos: prev.videos.map((video: VideoFile) =>
          video.id === videoId ? { ...video, tags } : video
        ),
      }));
    } catch (err) {
      console.error('Error updating tags:', err);
    }
  };

  const handleRenameVideo = async (videoId: string, oldPath: string, newName: string) => {
    try {
      const response = await fetch('/api/videos/rename', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ oldPath, newName }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to rename video');
      }

      const data = await response.json();

      setFolderContent((prev) => ({
        ...prev,
        videos: prev.videos.map((video) =>
          video.id === videoId
            ? {
                ...video,
                id: data.newId,
                path: data.newPath,
                title: data.newTitle,
              }
            : video
        ),
      }));

      if (selectedVideo && selectedVideo.id === videoId) {
        setSelectedVideo({
          ...selectedVideo,
          id: data.newId,
          path: data.newPath,
          title: data.newTitle,
        });
      }
    } catch (error) {
      console.error('Error renaming video:', error);
      throw error;
    }
  };
  
  const handleDeleteVideo = async (videoId: string, filePath: string) => {
    try {
      const response = await fetch('/api/videos/delete', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ filePath }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to delete video');
      }

      setFolderContent((prev) => ({
        ...prev,
        videos: prev.videos.filter((video) => video.id !== videoId),
      }));

      if (selectedVideo && selectedVideo.id === videoId) {
        setSelectedVideo(null);
      }
    } catch (error) {
      console.error('Error deleting video:', error);
      throw error;
    }
  };

  const handleSubmitNewPath = (e: React.FormEvent) => {
    e.preventDefault();
    if (newFolderPath) {
      loadFolder(newFolderPath);
      setShowFolderDialog(false);
      setNewFolderPath('');
    }
  };

  return (
    <main className="min-h-screen bg-app-light dark:bg-app-dark transition-colors duration-200">
      {showFolderDialog && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-lg max-w-md w-full">
            <h2 className="text-xl font-bold mb-4 dark:text-white">Select Folder</h2>
            <form onSubmit={handleSubmitNewPath}>
              <div className="mb-4">
                <label htmlFor="folderPath" className="block mb-2 text-sm font-medium dark:text-gray-300">
                  Folder Path:
                </label>
                <input
                  type="text"
                  id="folderPath"
                  className="w-full p-2 border rounded bg-gray-50 dark:bg-gray-700 dark:text-white dark:border-gray-600"
                  value={newFolderPath}
                  onChange={(e) => setNewFolderPath(e.target.value)}
                  placeholder="e.g. D:/Videos"
                />
              </div>
              <div className="flex justify-end gap-2">
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
                >
                  Open
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {showSavedPathsDialog && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-lg max-w-md w-full">
            <h2 className="text-xl font-bold mb-4 dark:text-white">Saved Paths</h2>
            {savedPaths.length > 0 ? (
              <div className="max-h-60 overflow-y-auto mb-4">
                {savedPaths.map((savedPath, index) => (
                  <div key={index} className="flex items-center justify-between p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded">
                    <button
                      className="text-left flex-1 truncate"
                      onClick={() => {
                        loadFolder(savedPath);
                        setShowSavedPathsDialog(false);
                      }}
                    >
                      {savedPath}
                    </button>
                    <button
                      onClick={() => removeSavedPath(savedPath)}
                      className="text-red-500 hover:text-red-700 p-1"
                    >
                      <FaTrash size={14} />
                    </button>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-gray-500 dark:text-gray-400 mb-4">No saved paths yet.</p>
            )}
            <div className="flex justify-between">
              <button
                onClick={() => {
                  setShowSavedPathsDialog(false);
                  setShowFolderDialog(true);
                }}
                className="px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600"
              >
                Add New Path
              </button>
              <button
                onClick={() => setShowSavedPathsDialog(false)}
                className="px-4 py-2 bg-gray-300 text-gray-800 rounded hover:bg-gray-400"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="container mx-auto px-4 py-8">
        {error && (
          <div className="mb-6 p-4 bg-red-100 dark:bg-red-900/30 border border-red-400 dark:border-red-800 text-red-700 dark:text-red-400 rounded-lg">
            Error: {error}. Please try again or check if the folder exists.
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className={`${selectedVideo ? 'lg:col-span-2' : 'lg:col-span-3'}`}>
            {loading ? (
              <div className="w-full p-12 flex justify-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 dark:border-primary-500"></div>
              </div>
            ) : (
              <VideoList
                videos={folderContent.videos}
                folders={folderContent.folders}
                onSelectVideo={handleSelectVideo}
                onNavigateFolder={navigateToFolder}
                onRenameVideo={handleRenameVideo}
                onDeleteVideo={handleDeleteVideo}
                currentPath={folderContent.currentPath}
              />
            )}
          </div>

          {selectedVideo && (
            <div className="space-y-4">
              <VideoPlayer 
                video={selectedVideo} 
                onClose={handleCloseVideo} 
                allVideos={folderContent.videos}
                onSelectVideo={handleSelectVideo}
              />
              <TagManager video={selectedVideo} onUpdateTags={handleUpdateTags} />
            </div>
          )}
        </div>
      </div>
    </main>
  );
}
