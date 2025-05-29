'use client';

import { useState, useRef, useEffect, useMemo } from 'react';
import ReactPlayer from 'react-player';
import { VideoFile } from '@/lib/types';
import { FaTimes, FaSpinner, FaExpand, FaCompress, FaStepBackward, FaStepForward, FaPlay, FaEye, FaCheck, FaTag } from 'react-icons/fa';
import ThumbnailGenerator from './ThumbnailGenerator';
import { useWatchedVideos } from '@/lib/hooks/useWatchedVideos';
import { getVideoUrl } from '@/lib/utils/videoUtils';

interface VideoPlayerProps {
  video: VideoFile;
  onClose: () => void;
  allVideos: VideoFile[]; 
  onSelectVideo: (video: VideoFile) => void; 
}

export default function VideoPlayer({ video, onClose, allVideos, onSelectVideo }: VideoPlayerProps) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [thumbnail, setThumbnail] = useState<string | null>(null);
  const [loadingThumbnail, setLoadingThumbnail] = useState(true);
  const [isExpanded, setIsExpanded] = useState(false);
  const [visibleVideosList, setVisibleVideosList] = useState(4); 
  const [showSimilarVideos, setShowSimilarVideos] = useState(false);
  const [realDuration, setRealDuration] = useState<number | null>(null);
  
  const { isWatched, toggleWatched } = useWatchedVideos();
  const watched = isWatched(video.id);
  
  const volume = 0.8;
  const playerRef = useRef<ReactPlayer>(null);
  
  const currentIndex = allVideos.findIndex(v => v.id === video.id);
  
  useEffect(() => {
    setThumbnail(null);
    setLoadingThumbnail(true);
  }, [video.id]);
  
  useEffect(() => {
    return () => {
      document.body.style.overflow = '';
    };
  }, []);
  
  const videoUrl = useMemo(() => {
    try {
      return getVideoUrl(video.path);
    } catch (e) {
      console.error('Error formatting video path:', e);
      setError('Could not format video path');
      return '';
    }
  }, [video.path]);
  
  useEffect(() => {
    if (currentIndex < allVideos.length - 1) {
      const nextVideo = allVideos[currentIndex + 1];
      const nextVideoUrl = getVideoUrl(nextVideo.path);
      const preloadLink = document.createElement('link');
      preloadLink.rel = 'preload';
      preloadLink.as = 'video';
      preloadLink.href = nextVideoUrl;
      document.head.appendChild(preloadLink);
      
      return () => {
        document.head.removeChild(preloadLink);
      };
    }
  }, [currentIndex, allVideos]);

  useEffect(() => {
    if (playerRef.current) {
      const player = playerRef.current;
      const handleProgress = () => {
        const buffered = player.getInternalPlayer()?.buffered;
        if (buffered && buffered.length > 0) {
          const bufferedEnd = buffered.end(buffered.length - 1);
          const duration = player.getDuration();
          if (duration && bufferedEnd / duration > 0.8) {
            if (currentIndex < allVideos.length - 1) {
              const nextVideo = allVideos[currentIndex + 1];
              const nextVideoUrl = getVideoUrl(nextVideo.path);
              const preloadLink = document.createElement('link');
              preloadLink.rel = 'preload';
              preloadLink.as = 'video';
              preloadLink.href = nextVideoUrl;
              document.head.appendChild(preloadLink);
            }
          }
        }
      };

      player.getInternalPlayer()?.addEventListener('progress', handleProgress);
      return () => {
        player.getInternalPlayer()?.removeEventListener('progress', handleProgress);
      };
    }
  }, [currentIndex, allVideos]);
  
  const handleThumbnailGenerated = (thumbnailUrl: string) => {
    setThumbnail(thumbnailUrl);
    setLoadingThumbnail(false);
  };
  
  const handleVideoError = (e: Error | string) => {
    console.error('Error playing video:', e);
    setError('Could not play video. Make sure the file exists and is in a supported format.');
    setLoadingThumbnail(false);
  };
  
  const toggleExpandedView = () => {
    const newExpanded = !isExpanded;
    setIsExpanded(newExpanded);
    
    if (newExpanded) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
  };
  
  const goToPreviousVideo = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (currentIndex > 0) {
      onSelectVideo(allVideos[currentIndex - 1]);
    }
  };
  
  const goToNextVideo = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (currentIndex < allVideos.length - 1) {
      onSelectVideo(allVideos[currentIndex + 1]);
    }
  };
  
  const seekToPosition = (position: number) => {
    if (playerRef.current) {
      if (!isPlaying) {
        setIsPlaying(true);
      }
      
      const playerInstance = playerRef.current;
      const duration = playerInstance.getDuration();
      
      if (duration && duration > 0) {
        const seekToSeconds = position * duration;
        playerInstance.seekTo(seekToSeconds, 'seconds');
      }
    }
  };
  
  const loadMoreVideos = () => {
    setVisibleVideosList(prev => Math.min(prev + 4, allVideos.length));
  };
  
  const getSimilarVideos = useMemo(() => {
    if (!video.tags || video.tags.length === 0) return [];
    
    return allVideos
      .filter(v => {
        if (v.id === video.id) return false; 
        if (!v.tags || v.tags.length === 0) return false;
        
        return v.tags.some(tag => video.tags.includes(tag));
      })
      .sort((a, b) => {
        const aMatches = a.tags.filter(tag => video.tags.includes(tag)).length;
        const bMatches = b.tags.filter(tag => video.tags.includes(tag)).length;
        return bMatches - aMatches;
      })
      .slice(0, visibleVideosList);
  }, [allVideos, video.id, video.tags, visibleVideosList]);
  
  const otherVideos = useMemo(() => {
    if (showSimilarVideos && getSimilarVideos.length > 0) {
      return getSimilarVideos;
    } else {
      return allVideos.filter(v => v.id !== video.id).slice(0, visibleVideosList);
    }
  }, [allVideos, video.id, visibleVideosList, showSimilarVideos, getSimilarVideos]);
  
  useEffect(() => {
    setRealDuration(null); 
  }, [video.path]);

  useEffect(() => {
    if (realDuration !== null) return;
    const vid = document.createElement('video');
    vid.src = getVideoUrl(video.path);
    vid.preload = 'metadata';
    vid.autoplay = false;
    vid.muted = true;
    vid.onloadedmetadata = () => {
      setRealDuration(vid.duration);
      vid.src = '';
    };
    vid.onerror = () => {
      setRealDuration(60); 
      vid.src = '';
    };
    return () => {
      vid.onloadedmetadata = null;
      vid.onerror = null;
      vid.src = '';
    };
  }, [video.path, realDuration]);

  return (
    <div className={`${isExpanded ? 'fixed inset-0 z-50 bg-black p-4 overflow-y-auto' : 'w-full'} h-auto bg-gray-900 dark:bg-black rounded-lg overflow-hidden shadow-lg transition-colors`}>
      <div className={`relative ${isExpanded ? 'h-full max-h-full' : ''}`}>
        <div className="absolute top-2 right-2 z-50 flex gap-2">
          <button
            onClick={(e) => {
              e.stopPropagation();
              toggleWatched(video.id);
            }}
            className={`${watched ? 'bg-green-600 hover:bg-green-700' : 'bg-gray-700 hover:bg-gray-600'} text-white rounded-full w-8 h-8 flex items-center justify-center transition-colors`}
            title={watched ? "Mark as unwatched" : "Mark as watched"}
          >
            {watched ? <FaCheck /> : <FaEye />}
          </button>
          
          <button 
            onClick={toggleExpandedView}
            className="bg-gray-700 hover:bg-gray-600 text-white rounded-full w-8 h-8 flex items-center justify-center transition-colors"
            title={isExpanded ? "Exit fullscreen" : "Fullscreen"}
          >
            {isExpanded ? <FaCompress /> : <FaExpand />}
          </button>
          <button 
            onClick={onClose}
            className="bg-red-500 hover:bg-red-600 text-white rounded-full w-8 h-8 flex items-center justify-center transition-colors"
            title="Close video"
          >
            <FaTimes />
          </button>
        </div>
        
        <div className={isExpanded ? "max-w-5xl mx-auto" : ""}>
          <div className="absolute top-1/2 left-2 right-2 z-40 flex justify-between transform -translate-y-1/2 pointer-events-none">
            <button 
              onClick={goToPreviousVideo}
              className={`bg-black/50 hover:bg-black/70 text-white rounded-full w-10 h-10 flex items-center justify-center transition-colors ${currentIndex <= 0 ? 'opacity-50 cursor-not-allowed' : 'opacity-100'} pointer-events-auto`}
              disabled={currentIndex <= 0}
              title="Previous video"
              style={{ marginTop: '-70px' }}
            >
              <FaStepBackward />
            </button>
            <button 
              onClick={goToNextVideo}
              className={`bg-black/50 hover:bg-black/70 text-white rounded-full w-10 h-10 flex items-center justify-center transition-colors ${currentIndex >= allVideos.length - 1 ? 'opacity-50 cursor-not-allowed' : 'opacity-100'} pointer-events-auto`}
              disabled={currentIndex >= allVideos.length - 1}
              title="Next video"
              style={{ marginTop: '-70px' }}
            >
              <FaStepForward />
            </button>
          </div>
          
          {!thumbnail && (
            <ThumbnailGenerator 
              video={video} 
              onThumbnailGenerated={handleThumbnailGenerated}
              position={0.25}
              quality={0.8}
            />
          )}
          
          {loadingThumbnail && !error && (
            <div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-60 z-20">
              <FaSpinner className="text-white animate-spin" size={48} />
            </div>
          )}
          
          {!error && realDuration && (
            <div className="mb-2 relative overflow-hidden">
              <h3 className="text-sm text-gray-300 mb-2 px-2">Video Moments</h3>
              <div className="flex justify-center gap-1">
                {[0.1, 0.3, 0.5, 0.7, 0.9].map((fraction, index) => {
                  const momentTime = Math.floor(realDuration * fraction);
                  const formatTime = (sec: number) => {
                    const h = Math.floor(sec / 3600);
                    const m = Math.floor((sec % 3600) / 60);
                    const s = Math.floor(sec % 60);
                    return [h, m, s]
                      .map((v, i) => (i === 0 && v === 0 ? null : v.toString().padStart(2, '0')))
                      .filter(Boolean)
                      .join(':');
                  };
                  return (
                    <div
                      key={index}
                      className="flex-1 cursor-pointer relative group max-w-[130px] h-16 bg-gray-800 rounded border border-gray-700 group-hover:border-primary-500 transition-all flex items-center justify-center"
                      onClick={() => seekToPosition(fraction)}
                    >
                      <span className="absolute bottom-1 right-1 text-white text-xs bg-black bg-opacity-70 px-1 rounded">
                        {Math.floor(fraction * 100)}%
                      </span>
                      <span className="absolute bottom-1 left-1 text-white text-xs bg-black bg-opacity-70 px-1 rounded">
                        {formatTime(momentTime)}
                      </span>
                      <div className="text-white text-lg font-bold select-none pointer-events-none">
                        {formatTime(momentTime)}
                      </div>
                      <div className="absolute inset-0 bg-primary-500 opacity-0 group-hover:opacity-20 transition-opacity rounded"></div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
          
          {error ? (
            <div className="aspect-video flex items-center justify-center text-red-500 bg-black p-4 text-center">
              <div>
                <p className="font-bold mb-2">Error Loading Video</p>
                <p className="text-sm">{error}</p>
              </div>
            </div>
          ) : (
            <div className="aspect-video relative">
              <ReactPlayer
                ref={playerRef}
                url={videoUrl}
                width="100%"
                height="100%"
                playing={isPlaying}
                volume={volume}
                controls
                light={`/api/videos/thumbnail/${encodeURIComponent(video.path)}`}
                onPlay={() => setIsPlaying(true)}
                onPause={() => setIsPlaying(false)}
                onError={handleVideoError}
                onDuration={d => setRealDuration(d)}
                config={{
                  file: {
                    attributes: {
                      controlsList: 'nodownload',
                      disablePictureInPicture: true,
                    },
                    forceVideo: true,
                  },
                }}
              />
            </div>
          )}

          <div className="p-4">
            <div className="flex justify-between items-start">
              <h2 className="text-xl font-bold text-white">{video.title}</h2>
              {watched && (
                <span className="bg-green-600 text-white text-xs px-2 py-1 rounded-full flex items-center gap-1">
                  <FaEye size={12} /> Watched
                </span>
              )}
            </div>
            
            <div className="mt-2 flex flex-wrap gap-2">
              {video.tags.map((tag, index) => (
                <span
                  key={index}
                  className="bg-primary-600 dark:bg-primary-700 text-white text-xs px-2 py-1 rounded-full"
                >
                  {tag}
                </span>
              ))}
            </div>
          </div>
          
          {isExpanded && (
            <div className="mt-6">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-bold text-white">Other Videos</h3>
                
                {video.tags && video.tags.length > 0 && (
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-gray-300">Show videos with similar tags</span>
                    <button
                      onClick={() => setShowSimilarVideos(!showSimilarVideos)}
                      className={`px-3 py-1 rounded-full text-sm flex items-center gap-1 transition-colors ${
                        showSimilarVideos
                          ? 'bg-primary-600 text-white'
                          : 'bg-gray-700 text-gray-300'
                      }`}
                    >
                      <FaTag size={12} /> 
                      {showSimilarVideos ? 'On' : 'Off'}
                    </button>
                  </div>
                )}
              </div>
              
              {showSimilarVideos && getSimilarVideos.length === 0 && (
                <div className="text-center text-gray-400 py-4">
                  No videos with similar tags found
                </div>
              )}
              
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                {otherVideos.map((otherVideo) => {
                  const otherVideoWatched = isWatched(otherVideo.id);
                  
                  return (
                    <div 
                      key={otherVideo.id}
                      className="bg-gray-800 rounded-lg overflow-hidden cursor-pointer hover:bg-gray-700 transition-colors relative"
                      onClick={() => onSelectVideo(otherVideo)}
                    >
                      <div className="relative aspect-video bg-gray-900">
                        <img
                          src={`/api/videos/thumbnail/${encodeURIComponent(otherVideo.path)}`}
                          alt={otherVideo.title}
                          className="w-full h-full object-cover"
                          onError={(e) => {
                            (e.target as HTMLImageElement).src = `data:image/svg+xml;charset=utf-8,${encodeURIComponent(generateVideoThumbnail(otherVideo))}`;
                          }}
                        />
                        {otherVideoWatched && (
                          <div className="absolute top-2 right-2 bg-green-600 text-white rounded-full w-6 h-6 flex items-center justify-center">
                            <FaCheck size={12} />
                          </div>
                        )}
                        {showSimilarVideos && otherVideo.tags && video.tags && (
                          <div className="absolute top-2 left-2 bg-primary-600 text-white px-1.5 py-0.5 rounded text-xs">
                            {otherVideo.tags.filter(tag => video.tags.includes(tag)).length} matching tags
                          </div>
                        )}
                        <div className="absolute inset-0 flex items-center justify-center">
                          <div className="bg-blue-500/70 rounded-full p-2">
                            <FaPlay className="text-white" size={16} />
                          </div>
                        </div>
                      </div>
                      <div className="p-2">
                        <h4 className="text-sm font-medium text-white truncate">{otherVideo.title}</h4>
                        
                        {showSimilarVideos && otherVideo.tags && otherVideo.tags.length > 0 && (
                          <div className="mt-1 flex flex-wrap gap-1">
                            {otherVideo.tags
                              .filter(tag => video.tags.includes(tag))
                              .slice(0, 2)
                              .map((tag, i) => (
                                <span key={i} className="text-xs bg-primary-700/50 text-primary-300 px-1 py-0.5 rounded">
                                  {tag}
                                </span>
                              ))}
                            {otherVideo.tags.filter(tag => video.tags.includes(tag)).length > 2 && (
                              <span className="text-xs text-gray-400">+{otherVideo.tags.filter(tag => video.tags.includes(tag)).length - 2} more</span>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
              
              {allVideos.length > visibleVideosList + 1 && (
                <div className="mt-4 flex justify-center">
                  <button
                    onClick={loadMoreVideos}
                    className="px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded transition-colors"
                  >
                    Load More Videos
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );

  function generateVideoThumbnail(video: VideoFile): string {
    const fileName = video.title;
    const extension = video.path.split('.').pop() || '';
    
    const getColorForExtension = (ext: string): string => {
      const colors: Record<string, string> = {
        'mp4': '#3b82f6', 'webm': '#10b981', 'mov': '#8b5cf6',
        'avi': '#ef4444', 'mkv': '#f59e0b', 'flv': '#6366f1',
        'wmv': '#ec4899', 'm4v': '#06b6d4', '3gp': '#a855f7',
        'mpg': '#14b8a6', 'mpeg': '#14b8a6',
      };
      return colors[ext.toLowerCase()] || '#1e293b';
    };
    
    const displayName = fileName.length > 15 ? fileName.substring(0, 12) + '...' : fileName;
    const bgColor = getColorForExtension(extension);
    const textColor = ['#10b981', '#f59e0b', '#06b6d4', '#14b8a6'].includes(bgColor) ? '#000000' : '#ffffff';
    
    return `
      <svg xmlns="http://www.w3.org/2000/svg" width="320" height="180" viewBox="0 0 320 180">
        <defs>
          <linearGradient id="grad_${video.id}" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stop-color="${bgColor}" stop-opacity="1" />
            <stop offset="100%" stop-color="${bgColor}" stop-opacity="0.8" />
          </linearGradient>
        </defs>
        <rect width="320" height="180" fill="url(#grad_${video.id})" />
        <circle cx="160" cy="80" r="24" fill="#ffffff33" />
        <polygon points="150,70 175,80 150,90" fill="white" />
        <text x="160" y="130" font-family="Arial" font-size="14" fill="${textColor}" text-anchor="middle" font-weight="bold">
          ${displayName}
        </text>
        <text x="160" y="150" font-family="Arial" font-size="12" fill="${textColor}99" text-anchor="middle">
          ${extension.toUpperCase()}
        </text>
      </svg>
    `;
  }
} 