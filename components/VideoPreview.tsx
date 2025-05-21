'use client';

import { useState, useRef, useEffect, memo } from 'react';
import { VideoFile } from '@/lib/types';
import { FaPlay, FaPause, FaVolumeMute, FaVolumeUp } from 'react-icons/fa';
import { getVideoUrl } from '@/lib/utils/videoUtils';

interface VideoPreviewProps {
  video: VideoFile;
  showPreview: boolean;
}

type PreviewPosition = 'start' | 'middle' | 'end';

const VideoPreview = memo(({ video, showPreview }: VideoPreviewProps) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [isMuted, setIsMuted] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [previewPosition, setPreviewPosition] = useState<PreviewPosition>('start');
  const [isLoading, setIsLoading] = useState(true);
  const videoRef = useRef<HTMLVideoElement>(null);
  
  const getPlaybackPosition = (position: PreviewPosition, duration: number): number => {
    switch (position) {
      case 'start':
        return 0;
      case 'middle':
        return duration * 0.5; 
      case 'end': 
        return Math.max(0, duration * 0.85); 
      default:
        return 0;
    }
  };

  const changePreviewPosition = (position: PreviewPosition) => {
    setPreviewPosition(position);
    
    if (videoRef.current && !isLoading) {
      try {
        const newTime = getPlaybackPosition(position, videoRef.current.duration);
        videoRef.current.currentTime = newTime;
      } catch (err) {
        console.error('Error seeking to position:', err);
      }
    }
  };

  const handleVideoLoaded = () => {
    setIsLoading(false);
    
    if (videoRef.current) {
      try {
        const position = getPlaybackPosition(previewPosition, videoRef.current.duration);
        videoRef.current.currentTime = position;
        
        if (isPlaying) {
          videoRef.current.play().catch(e => {
            console.error('Error playing video:', e);
          });
        }
      } catch (err) {
        console.error('Error during video loaded handler:', err);
      }
    }
  };

  const handleVideoError = () => {
    setError('Could not load video preview');
    setIsLoading(false);
  };

  const togglePlay = () => {
    setIsPlaying(!isPlaying);
  };

  const toggleMute = () => {
    setIsMuted(!isMuted);
  };

  useEffect(() => {
    if (!videoRef.current || isLoading) return;
    
    try {
      if (isPlaying) {
        videoRef.current.play().catch(err => {
          console.error('Error playing video:', err);
          setIsPlaying(false);
        });
      } else {
        videoRef.current.pause();
      }
    } catch (err) {
      console.error('Error toggling play state:', err);
    }
  }, [isPlaying, isLoading]);

  useEffect(() => {
    if (showPreview) {
      const timer = setTimeout(() => {
        setIsPlaying(true);
      }, 500);
      
      return () => {
        clearTimeout(timer);
        setIsPlaying(false);
        setIsLoading(true); 
      };
    }
  }, [showPreview]);
  
  // Reset error and loading states when video changes
  useEffect(() => {
    setError(null);
    setIsLoading(true);
  }, [video.id]);

  if (!showPreview) return null;

  const videoUrl = (() => {
    try {
      return getVideoUrl(video.path);
    } catch (e) {
      console.error('Error formatting video path:', e);
      setError('Could not format video path');
      return '';
    }
  })();

  return (
    <div 
      className="absolute z-20 top-0 left-0 w-full h-full bg-black rounded-lg shadow-xl overflow-hidden video-fade-in video-preview-container"
    >
      {error ? (
        <div className="w-full h-full flex items-center justify-center text-red-500">
          <p className="text-sm">{error}</p>
        </div>
      ) : (
        <div className="w-full h-full relative">
          <video
            ref={videoRef}
            src={videoUrl}
            muted={isMuted}
            loop
            playsInline
            className="w-full h-full object-contain"
            onLoadedData={handleVideoLoaded}
            onError={handleVideoError}
          />
          
          {isLoading && (
            <div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-50">
              <div className="animate-spin rounded-full h-8 w-8 border-2 border-white border-t-transparent"></div>
            </div>
          )}
          
          <div className="absolute bottom-0 left-0 right-0 p-2 flex justify-between items-center bg-gradient-to-t from-black/70 to-transparent">
            <div className="flex items-center gap-2">
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  togglePlay();
                }}
                className="text-white p-1 rounded-full bg-blue-500/50 hover:bg-blue-500/80 transition-colors"
                disabled={isLoading}
              >
                {isPlaying ? <FaPause size={16} /> : <FaPlay size={16} />}
              </button>
              
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  toggleMute();
                }}
                className="text-white p-1 rounded-full bg-blue-500/50 hover:bg-blue-500/80 transition-colors"
                disabled={isLoading}
              >
                {isMuted ? <FaVolumeMute size={16} /> : <FaVolumeUp size={16} />}
              </button>
            </div>
            
            <div className="flex items-center gap-2">
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  changePreviewPosition('start');
                }}
                className={`text-white p-1 rounded-full transition-colors ${
                  previewPosition === 'start' 
                    ? 'bg-blue-500' 
                    : 'bg-blue-500/50 hover:bg-blue-500/80'
                }`}
                title="Start of video"
                disabled={isLoading}
              >
                <span className="text-xs font-bold">1</span>
              </button>
              
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  changePreviewPosition('middle');
                }}
                className={`text-white p-1 rounded-full transition-colors ${
                  previewPosition === 'middle' 
                    ? 'bg-blue-500' 
                    : 'bg-blue-500/50 hover:bg-blue-500/80'
                }`}
                title="Middle of video"
                disabled={isLoading}
              >
                <span className="text-xs font-bold">2</span>
              </button>
              
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  changePreviewPosition('end');
                }}
                className={`text-white p-1 rounded-full transition-colors ${
                  previewPosition === 'end' 
                    ? 'bg-blue-500' 
                    : 'bg-blue-500/50 hover:bg-blue-500/80'
                }`}
                title="End of video"
                disabled={isLoading}
              >
                <span className="text-xs font-bold">3</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
});

VideoPreview.displayName = 'VideoPreview';

export default VideoPreview; 