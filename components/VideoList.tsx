'use client';

import { useState, useEffect, useMemo, useRef } from 'react';
import { VideoFile } from '@/lib/types';
import { 
  FaFolder, 
  FaTag, 
  FaPlay, 
  FaPencilAlt, 
  FaEllipsisV, 
  FaTrashAlt, 
  FaAngleLeft, 
  FaAngleRight,
  FaSortAlphaDown,
  FaSortAlphaUp,
  FaSortAmountDown,
  FaSortAmountUp,
  FaCalendarAlt,
  FaFileAlt,
  FaSort,
  FaEye,
  FaCheck
} from 'react-icons/fa';
import VideoPreview from './VideoPreview';
import { useWatchedVideos } from '@/lib/hooks/useWatchedVideos';
import ReactDOM from 'react-dom';


type SortOption = 'name' | 'date' | 'size';
type SortDirection = 'asc' | 'desc';
type WatchedFilter = 'all' | 'watched' | 'unwatched';

interface VideoListProps {
  videos: VideoFile[];
  folders: string[];
  onSelectVideo: (video: VideoFile) => void;
  onNavigateFolder: (folder: string) => void;
  onRenameVideo: (videoId: string, oldPath: string, newName: string) => Promise<void>;
  onDeleteVideo: (videoId: string, filePath: string) => Promise<void>;
  currentPath: string;
}

export default function VideoList({
  videos,
  folders,
  onSelectVideo,
  onNavigateFolder,
  onRenameVideo,
  onDeleteVideo,
  currentPath,
}: VideoListProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [hoveredVideoId, setHoveredVideoId] = useState<string | null>(null);
  const [showRenameDialog, setShowRenameDialog] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [videoToRename, setVideoToRename] = useState<VideoFile | null>(null);
  const [videoToDelete, setVideoToDelete] = useState<VideoFile | null>(null);
  const [newFileName, setNewFileName] = useState('');
  const [isRenaming, setIsRenaming] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [renameError, setRenameError] = useState<string | null>(null);
  const [deleteError, setDeleteError] = useState<string | null>(null);
  const [menuOpenForVideo, setMenuOpenForVideo] = useState<string | null>(null);
  const [watchedFilter, setWatchedFilter] = useState<WatchedFilter>('all');
  
  
  const videoRefs = useRef<Record<string, HTMLDivElement | null>>({});
  
  
  const [sortOption, setSortOption] = useState<SortOption>('name');
  const [sortDirection, setSortDirection] = useState<SortDirection>('asc');
  
  
  const [currentPage, setCurrentPage] = useState(1);
  const videosPerPage = 16;
  const [totalPages, setTotalPages] = useState(1);

  
  const { isWatched, toggleWatched } = useWatchedVideos();

  
  const allTags = Array.from(
    new Set(videos.flatMap((video) => video.tags))
  ).sort();

  
  const filteredVideos = videos.filter((video) => {
    const matchesSearch = searchTerm === '' || 
      video.title.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesTags = selectedTags.length === 0 || 
      selectedTags.every(tag => video.tags.includes(tag));
    
    
    const matchesWatched = 
      watchedFilter === 'all' || 
      (watchedFilter === 'watched' && isWatched(video.id)) || 
      (watchedFilter === 'unwatched' && !isWatched(video.id));
    
    return matchesSearch && matchesTags && matchesWatched;
  });
  
  
  const sortedVideos = useMemo(() => {
    return [...filteredVideos].sort((a, b) => {
      if (sortOption === 'name') {
        return sortDirection === 'asc' 
          ? a.title.localeCompare(b.title, undefined, { sensitivity: 'base' })
          : b.title.localeCompare(a.title, undefined, { sensitivity: 'base' });
      } else if (sortOption === 'date') {
        const dateA = new Date(a.updatedAt).getTime();
        const dateB = new Date(b.updatedAt).getTime();
        return sortDirection === 'asc' ? dateA - dateB : dateB - dateA;
      } else { 
        const sizeA = a.size || 0;
        const sizeB = b.size || 0;
        return sortDirection === 'asc' ? sizeA - sizeB : sizeB - sizeA;
      }
    });
  }, [filteredVideos, sortOption, sortDirection]);
  
  
  const indexOfLastVideo = currentPage * videosPerPage;
  const indexOfFirstVideo = indexOfLastVideo - videosPerPage;
  const currentVideos = sortedVideos.slice(indexOfFirstVideo, indexOfLastVideo);

  
  useEffect(() => {
    setTotalPages(Math.max(1, Math.ceil(sortedVideos.length / videosPerPage)));
    
    if (currentPage > Math.max(1, Math.ceil(sortedVideos.length / videosPerPage))) {
      setCurrentPage(1);
    }
  }, [sortedVideos.length, currentPage]);

  
  const handleSortOptionChange = (option: SortOption) => {
    if (sortOption === option) {
      
      setSortDirection(prev => prev === 'asc' ? 'desc' : 'asc');
    } else {
      
      setSortOption(option);
      setSortDirection('asc');
    }
  };

  
  const toggleTag = (tag: string) => {
    setSelectedTags(prev => 
      prev.includes(tag) 
        ? prev.filter(t => t !== tag) 
        : [...prev, tag]
    );
  };
  
  
  const formatFileSize = (bytes: number | undefined) => {
    if (!bytes) return 'Unknown size';
    const units = ['B', 'KB', 'MB', 'GB'];
    let size = bytes;
    let unitIndex = 0;
    
    while (size >= 1024 && unitIndex < units.length - 1) {
      size /= 1024;
      unitIndex++;
    }
    
    return `${size.toFixed(1)} ${units[unitIndex]}`;
  };

  
  const handleMouseEnter = (videoId: string) => {
    setHoveredVideoId(videoId);
  };

  const handleMouseLeave = () => {
    setHoveredVideoId(null);
  };

  
  const openRenameDialog = (video: VideoFile, e: React.MouseEvent) => {
    e.stopPropagation();
    setVideoToRename(video);
    setNewFileName(video.title);
    setRenameError(null);
    setShowRenameDialog(true);
    setMenuOpenForVideo(null);
  };
  
  
  const openDeleteDialog = (video: VideoFile, e: React.MouseEvent) => {
    e.stopPropagation();
    setVideoToDelete(video);
    setDeleteError(null);
    setShowDeleteDialog(true);
    setMenuOpenForVideo(null);
  };
  
  
  const handleRename = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!videoToRename || !newFileName.trim()) {
      setRenameError('Please enter a new file name');
      return;
    }
    
    setIsRenaming(true);
    setRenameError(null);
    
    try {
      await onRenameVideo(videoToRename.id, videoToRename.path, newFileName);
      setShowRenameDialog(false);
      setVideoToRename(null);
      setNewFileName('');
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to rename video';
      setRenameError(errorMessage);
    } finally {
      setIsRenaming(false);
    }
  };
  
  
  const handleDelete = async () => {
    if (!videoToDelete) return;
    
    setIsDeleting(true);
    setDeleteError(null);
    
    try {
      await onDeleteVideo(videoToDelete.id, videoToDelete.path);
      setShowDeleteDialog(false);
      setVideoToDelete(null);
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to delete video';
      setDeleteError(errorMessage);
    } finally {
      setIsDeleting(false);
    }
  };
  
  
  const [menuPosition, setMenuPosition] = useState<{top: number, left: number} | null>(null);

  const toggleVideoMenu = (videoId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (menuOpenForVideo === videoId) {
      setMenuOpenForVideo(null);
      setMenuPosition(null);
    } else {
      setMenuOpenForVideo(videoId);
      const rect = (e.target as HTMLElement).getBoundingClientRect();
      setMenuPosition({
        top: rect.bottom + window.scrollY,
        left: rect.left + window.scrollX,
      });
    }
  };
  
  
  const paginate = (pageNumber: number) => {
    setCurrentPage(pageNumber);
  };
  
  
  const handleMenuRename = (video: VideoFile, e: React.MouseEvent) => {
    openRenameDialog(video, e);
  };
  
  const handleMenuDelete = (video: VideoFile, e: React.MouseEvent) => {
    openDeleteDialog(video, e);
  };
  
  
  const renderSortIcon = (option: SortOption) => {
    if (sortOption !== option) return null;
    
    if (sortDirection === 'asc') {
      if (option === 'name') {
        return <FaSortAlphaDown className="ml-1" size={12} />;
      } else {
        return <FaSortAmountDown className="ml-1" size={12} />;
      }
    } else {
      if (option === 'name') {
        return <FaSortAlphaUp className="ml-1" size={12} />;
      } else {
        return <FaSortAmountUp className="ml-1" size={12} />;
      }
    }
  };

  
  const generatePreviewImage = (video: VideoFile): string => {
    const fileName = video.title;
    const extension = video.path.split('.').pop() || '';

    
    const getColorForExtension = (ext: string): string => {
      const colors: Record<string, string> = {
        'mp4': '#3b82f6', 
        'webm': '#10b981', 
        'mov': '#8b5cf6', 
        'avi': '#ef4444', 
        'mkv': '#f59e0b', 
        'flv': '#6366f1', 
        'wmv': '#ec4899', 
        'm4v': '#06b6d4', 
        '3gp': '#a855f7', 
        'mpg': '#14b8a6', 
        'mpeg': '#14b8a6', 
      };
      return colors[ext.toLowerCase()] || '#1e293b'; 
    };

    
    const displayName = fileName.length > 20 ? fileName.substring(0, 17) + '...' : fileName;
    const bgColor = getColorForExtension(extension);
    
    
    const textColor = ['#10b981', '#f59e0b', '#06b6d4', '#14b8a6'].includes(bgColor) ? '#000000' : '#ffffff';
    
    
    return `
      <svg xmlns="http:
        <defs>
          <linearGradient id="grad_${video.id}" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stop-color="${bgColor}" stop-opacity="1" />
            <stop offset="100%" stop-color="${bgColor}" stop-opacity="0.8" />
          </linearGradient>
        </defs>
        <rect width="320" height="180" fill="url(#grad_${video.id})" />
        <circle cx="160" cy="80" r="32" fill="#ffffff33" />
        <polygon points="150,65 180,80 150,95" fill="white" />
        <text x="160" y="140" font-family="Arial" font-size="14" fill="${textColor}" text-anchor="middle" font-weight="bold">
          ${displayName}
        </text>
        <text x="160" y="160" font-family="Arial" font-size="12" fill="${textColor}99" text-anchor="middle">
          ${extension.toUpperCase()} video file
        </text>
      </svg>
    `;
  };

  return (
    <div className="w-full">
      {}
      {showRenameDialog && videoToRename && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-lg max-w-md w-full">
            <h2 className="text-xl font-bold mb-4 dark:text-white">Rename Video</h2>
            <form onSubmit={handleRename}>
              <div className="mb-4">
                <label htmlFor="fileName" className="block mb-2 text-sm font-medium dark:text-gray-300">
                  New File Name:
                </label>
                <input
                  type="text"
                  id="fileName"
                  className="w-full p-2 border rounded bg-gray-50 dark:bg-gray-700 dark:text-white dark:border-gray-600"
                  value={newFileName}
                  onChange={(e) => setNewFileName(e.target.value)}
                  placeholder="Enter new file name"
                />
              </div>
              
              {renameError && (
                <div className="mb-4 p-2 bg-red-100 dark:bg-red-900/30 border border-red-400 dark:border-red-800 text-red-700 dark:text-red-400 rounded text-sm">
                  {renameError}
                </div>
              )}
              
              <div className="flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowRenameDialog(false)}
                  className="px-4 py-2 bg-gray-300 text-gray-800 rounded hover:bg-gray-400"
                  disabled={isRenaming}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 disabled:bg-blue-300"
                  disabled={isRenaming}
                >
                  {isRenaming ? 'Renaming...' : 'Rename'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
      
      {}
      {showDeleteDialog && videoToDelete && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-lg max-w-md w-full">
            <h2 className="text-xl font-bold mb-4 dark:text-white">Delete Video</h2>
            <p className="mb-6 text-gray-700 dark:text-gray-300">
              Are you sure you want to delete the video &ldquo;{videoToDelete.title}&rdquo;? This action cannot be undone.
            </p>
            
            {deleteError && (
              <div className="mb-4 p-2 bg-red-100 dark:bg-red-900/30 border border-red-400 dark:border-red-800 text-red-700 dark:text-red-400 rounded text-sm">
                {deleteError}
              </div>
            )}
            
            <div className="flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setShowDeleteDialog(false)}
                className="px-4 py-2 bg-gray-300 text-gray-800 rounded hover:bg-gray-400"
                disabled={isDeleting}
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleDelete}
                className="px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600 disabled:bg-red-300"
                disabled={isDeleting}
              >
                {isDeleting ? 'Deleting...' : 'Delete'}
              </button>
            </div>
          </div>
        </div>
      )}
      
      {}
      {menuOpenForVideo && (
        <div className="block md:hidden fixed inset-0 bg-black bg-opacity-25 flex items-center justify-center z-50"
             onClick={() => setMenuOpenForVideo(null)}>
          <div className="bg-white dark:bg-gray-800 p-2 rounded-lg shadow-lg w-64 mx-4"
               onClick={(e) => e.stopPropagation()}>
            {filteredVideos.map(video => {
              if (video.id === menuOpenForVideo) {
                return (
                  <div key={video.id} className="p-2">
                    <p className="font-medium mb-2 text-center dark:text-white">{video.title}</p>
                    <button
                      className="w-full text-left px-4 py-3 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center rounded-md mb-2"
                      onClick={(e) => handleMenuRename(video, e)}
                    >
                      <FaPencilAlt className="mr-2" size={14} /> Rename
                    </button>
                    <button
                      className="w-full text-left px-4 py-3 text-sm text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 flex items-center rounded-md"
                      onClick={(e) => handleMenuDelete(video, e)}
                    >
                      <FaTrashAlt className="mr-2" size={14} /> Delete
                    </button>
                  </div>
                );
              }
              return null;
            })}
          </div>
        </div>
      )}

      <div className="mb-4 flex flex-col md:flex-row md:items-center gap-4">
        <div className="relative flex-1">
          <input
            type="text"
            placeholder="Search videos..."
            className="w-full p-2 pl-10 border border-app-light dark:border-app-dark rounded-lg bg-card-light dark:bg-card-dark text-app-light dark:text-app-dark focus:outline-none focus:ring-2 focus:ring-primary-500 dark:focus:ring-primary-600 transition-colors"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
          <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 dark:text-gray-500">
            🔍
          </span>
        </div>
        
        <div className="flex flex-wrap gap-2">
          {}
          <button
            className={`flex items-center px-3 py-1 rounded-full text-sm transition-colors ${
              watchedFilter === 'all'
                ? 'bg-blue-500 text-white'
                : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300'
            }`}
            onClick={() => setWatchedFilter('all')}
          >
            All
          </button>
          <button
            className={`flex items-center px-3 py-1 rounded-full text-sm transition-colors ${
              watchedFilter === 'watched'
                ? 'bg-green-500 text-white'
                : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300'
            }`}
            onClick={() => setWatchedFilter('watched')}
          >
            <FaEye className="mr-1" size={12} /> Watched
          </button>
          <button
            className={`flex items-center px-3 py-1 rounded-full text-sm transition-colors ${
              watchedFilter === 'unwatched'
                ? 'bg-blue-500 text-white'
                : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300'
            }`}
            onClick={() => setWatchedFilter('unwatched')}
          >
            <FaEye className="mr-1" size={12} /> Unwatched
          </button>
        </div>
      </div>
      
      {}
      {allTags.length > 0 && (
        <div className="mb-4 flex flex-wrap gap-2">
          {allTags.map((tag) => (
            <button
              key={tag}
              className={`flex items-center px-3 py-1 rounded-full text-sm transition-colors ${
                selectedTags.includes(tag)
                  ? 'bg-primary-600 dark:bg-primary-700 text-white'
                  : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300'
              }`}
              onClick={() => toggleTag(tag)}
            >
              <FaTag className="mr-1" size={12} />
              {tag}
            </button>
          ))}
        </div>
      )}

      <div className="w-full p-2 mb-8 pl-10 border border-app-light dark:border-app-dark rounded-lg bg-card-light dark:bg-card-dark text-app-light dark:text-app-dark focus:outline-none focus:ring-2 focus:ring-primary-500 dark:focus:ring-primary-600 transition-colors">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2">
          <p className="font-medium text-app-light dark:text-app-dark">Current path: {currentPath}</p>
          
          {}
          <div className="flex items-center gap-2">
            <span className="text-gray-500 dark:text-gray-400 text-sm">Sort by:</span>
            <div className="flex bg-white dark:bg-gray-700 rounded overflow-hidden shadow-sm">
              <button
                className={`flex items-center px-3 py-1 text-sm ${
                  sortOption === 'name' 
                    ? 'bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-300' 
                    : 'hover:bg-gray-100 dark:hover:bg-gray-600'
                }`}
                onClick={() => handleSortOptionChange('name')}
                title="Sort by name"
              >
                <FaFileAlt className="mr-1" size={12} />
                Name
                {renderSortIcon('name')}
              </button>
              <button
                className={`flex items-center px-3 py-1 text-sm border-l border-gray-200 dark:border-gray-600 ${
                  sortOption === 'date' 
                    ? 'bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-300' 
                    : 'hover:bg-gray-100 dark:hover:bg-gray-600'
                }`}
                onClick={() => handleSortOptionChange('date')}
                title="Sort by date"
              >
                <FaCalendarAlt className="mr-1" size={12} />
                Date
                {renderSortIcon('date')}
              </button>
              <button
                className={`flex items-center px-3 py-1 text-sm border-l border-gray-200 dark:border-gray-600 ${
                  sortOption === 'size' 
                    ? 'bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-300' 
                    : 'hover:bg-gray-100 dark:hover:bg-gray-600'
                }`}
                onClick={() => handleSortOptionChange('size')}
                title="Sort by size"
              >
                <FaSort className="mr-1" size={12} />
                Size
                {renderSortIcon('size')}
              </button>
            </div>
          </div>
        </div>
      </div>
      
      {}
      {filteredVideos.length > 0 && (
        <div className="mb-4 mt-4 flex items-center justify-between">
          <div className="text-sm text-gray-500 dark:text-gray-400">
            Showing {indexOfFirstVideo + 1}-{Math.min(indexOfLastVideo, filteredVideos.length)} of {filteredVideos.length} videos
          </div>
          <div className="flex items-center space-x-2">
            <button
              onClick={() => paginate(currentPage - 1)}
              disabled={currentPage === 1}
              className={`p-2 rounded-md ${
                currentPage === 1
                  ? 'text-gray-400 cursor-not-allowed'
                  : 'text-blue-500 hover:bg-blue-50 dark:hover:bg-blue-900/20'
              }`}
            >
              <FaAngleLeft size={16} />
            </button>
            
            {Array.from({ length: totalPages }, (_, i) => i + 1).map((pageNumber) => (
              <button
                key={pageNumber}
                onClick={() => paginate(pageNumber)}
                className={`px-3 py-1 rounded-md ${
                  currentPage === pageNumber
                    ? 'bg-blue-500 text-white'
                    : 'text-blue-500 hover:bg-blue-50 dark:hover:bg-blue-900/20'
                }`}
              >
                {pageNumber}
              </button>
            ))}
            
            <button
              onClick={() => paginate(currentPage + 1)}
              disabled={currentPage === totalPages}
              className={`p-2 rounded-md ${
                currentPage === totalPages
                  ? 'text-gray-400 cursor-not-allowed'
                  : 'text-blue-500 hover:bg-blue-50 dark:hover:bg-blue-900/20'
              }`}
            >
              <FaAngleRight size={16} />
            </button>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {folders.map((folder) => (
          <div
            key={folder}
            className="flex items-center p-4 bg-gray-50 dark:bg-gray-800 rounded-lg border border-app-light dark:border-app-dark cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
            onClick={() => onNavigateFolder(folder)}
          >
            <FaFolder className="text-yellow-500 dark:text-yellow-400 mr-3" size={24} />
            <span className="font-medium truncate text-app-light dark:text-app-dark">{folder}</span>
          </div>
        ))}

        {currentVideos.map((video) => {
          const videoWatched = isWatched(video.id);
          
          return (
            <div
              key={video.id}
              ref={el => { videoRefs.current[video.id] = el; }}
              data-video-id={video.id}
              className="group bg-card-light dark:bg-card-dark rounded-lg border border-app-light dark:border-app-dark overflow-hidden hover:shadow-md dark:hover:shadow-lg dark:hover:shadow-black/20 transition-all cursor-pointer relative"
              onClick={() => onSelectVideo(video)}
              onMouseEnter={() => handleMouseEnter(video.id)}
              onMouseLeave={handleMouseLeave}
            >
              <div className="relative aspect-video bg-gray-800 dark:bg-black video-thumbnail">
                <img
                  src={`/api/videos/thumbnail/${encodeURIComponent(video.path)}`}
                  alt={video.title}
                  className="w-full h-full object-cover"
                  onError={(e) => {
                    (e.target as HTMLImageElement).src = `data:image/svg+xml;charset=utf-8,${encodeURIComponent(generatePreviewImage(video))}`;
                  }}
                />
                {videoWatched && (
                  <div className="absolute top-2 right-2 z-20 bg-green-600 text-white rounded-full w-6 h-6 flex items-center justify-center">
                    <FaCheck size={12} />
                  </div>
                )}
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="bg-blue-500/70 rounded-full p-3 z-10">
                    <FaPlay className="text-white" size={24} />
                  </div>
                </div>
                {video.path && hoveredVideoId === video.id && (
                  <VideoPreview 
                    video={video} 
                    showPreview={hoveredVideoId === video.id} 
                  />
                )}
              </div>
              <div className="p-3">
                <div className="flex justify-between items-start">
                  <h3 className="font-medium truncate mb-1 text-app-light dark:text-app-dark flex-1">
                    {video.title}
                  </h3>
                  <div className="relative ml-2">
                    {}
                    <button
                      className={`text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 mr-2`}
                      onClick={(e) => {
                        e.stopPropagation();
                        toggleWatched(video.id);
                      }}
                    >
                      {videoWatched ? <FaCheck className="text-green-500" size={14} /> : <FaEye size={14} />}
                    </button>
                    
                    <button 
                      className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
                      onClick={(e) => toggleVideoMenu(video.id, e)}
                    >
                      <FaEllipsisV size={14} />
                    </button>
                    
                    {}
                    {menuOpenForVideo === video.id && menuPosition && ReactDOM.createPortal(
                      <div className="z-50 fixed bg-white dark:bg-gray-800 bg-opacity-95 rounded-md drop-shadow-xl border border-gray-200 dark:border-gray-700 py-1 pointer-events-auto w-48"
                        style={{ top: menuPosition.top, left: menuPosition.left, minWidth: '10rem' }}
                      >
                        <button
                          className="w-full text-left px-4 py-2 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center"
                          onClick={(e) => openRenameDialog(video, e)}
                        >
                          <FaPencilAlt className="mr-2" size={12} /> Rename
                        </button>
                        <button
                          className="w-full text-left px-4 py-2 text-sm text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 flex items-center"
                          onClick={(e) => openDeleteDialog(video, e)}
                        >
                          <FaTrashAlt className="mr-2" size={12} /> Delete
                        </button>
                      </div>,
                      document.body
                    )}
                  </div>
                </div>
                <div className="flex justify-between text-xs text-muted-light dark:text-muted-dark">
                  <span>{formatFileSize(video.size)}</span>
                  <span>{new Date(video.updatedAt).toLocaleDateString()}</span>
                </div>
                {video.tags.length > 0 && (
                  <div className="mt-2 flex flex-wrap gap-1">
                    {video.tags.map((tag, index) => (
                      <span
                        key={index}
                        className="bg-primary-100 dark:bg-primary-900/30 text-primary-800 dark:text-primary-300 text-xs px-2 py-0.5 rounded-full"
                      >
                        {tag}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
      
      {}
      {filteredVideos.length > videosPerPage && (
        <div className="mt-6 flex justify-center md:hidden">
          <div className="flex items-center space-x-2">
            <button
              onClick={() => paginate(currentPage - 1)}
              disabled={currentPage === 1}
              className={`p-2 rounded-md ${
                currentPage === 1
                  ? 'text-gray-400 cursor-not-allowed'
                  : 'text-blue-500 hover:bg-blue-50 dark:hover:bg-blue-900/20'
              }`}
            >
              <FaAngleLeft size={16} />
            </button>
            
            <span className="text-sm">
              Page {currentPage} of {totalPages}
            </span>
            
            <button
              onClick={() => paginate(currentPage + 1)}
              disabled={currentPage === totalPages}
              className={`p-2 rounded-md ${
                currentPage === totalPages
                  ? 'text-gray-400 cursor-not-allowed'
                  : 'text-blue-500 hover:bg-blue-50 dark:hover:bg-blue-900/20'
              }`}
            >
              <FaAngleRight size={16} />
            </button>
          </div>
        </div>
      )}
    </div>
  );
} 