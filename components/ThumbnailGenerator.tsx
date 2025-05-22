'use client';

import { useState, useEffect, useRef, memo } from 'react';
import { VideoFile } from '@/lib/types';

interface ThumbnailGeneratorProps {
  video: VideoFile;
  onThumbnailGenerated: (thumbnailUrl: string) => void;
  quality?: number;
  position?: number; 
}

const ThumbnailGenerator = memo(({ 
  video, 
  onThumbnailGenerated,
  quality = 0.7,
  position = 0.25
}: ThumbnailGeneratorProps) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [loaded, setLoaded] = useState(false);
  const [error, setError] = useState(false);
  const attemptCount = useRef(0);
  const maxAttempts = 2;

  const getVideoUrl = (path: string) => {
    try {
      if (path.startsWith('http://') || path.startsWith('https://')) {
        return path;
      }
      const normalizedPath = path.replace(/\\/g, '/');
      const encodedPath = encodeURIComponent(normalizedPath);
      return `/api/videos/stream/${encodedPath}`;
    } catch (e) {
      console.error('Error formatting video path:', e);
      setError(true);
      generateFallbackThumbnail();
      return '';
    }
  };

  const getThumbnailUrl = (path: string) => {
    try {
      if (path.startsWith('http://') || path.startsWith('https://')) {
        return path;
      }
      const normalizedPath = path.replace(/\\/g, '/');
      const encodedPath = encodeURIComponent(normalizedPath);
      return `/api/videos/thumbnail/${encodedPath}`;
    } catch (e) {
      console.error('Error formatting thumbnail path:', e);
      return null;
    }
  };

  const generateFallbackThumbnail = () => {
    const canvas = document.createElement('canvas');
    canvas.width = 640;
    canvas.height = 360;
    const ctx = canvas.getContext('2d');
    
    if (ctx) {
      const gradient = ctx.createLinearGradient(0, 0, canvas.width, canvas.height);
      gradient.addColorStop(0, '#1e293b');
      gradient.addColorStop(1, '#0f172a');
      ctx.fillStyle = gradient;
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      
      ctx.fillStyle = '#f8fafc';
      ctx.font = 'bold 24px Arial';
      ctx.textAlign = 'center';
      const title = video.title.length > 28 ? video.title.substring(0, 25) + '...' : video.title;
      ctx.fillText(title, canvas.width / 2, canvas.height / 2);
      
      const ext = video.path.split('.').pop() || 'unknown';
      ctx.font = '18px Arial';
      ctx.fillStyle = '#94a3b8';
      ctx.fillText(`${ext.toUpperCase()} video`, canvas.width / 2, canvas.height / 2 + 40);
      
      const thumbnailUrl = canvas.toDataURL('image/jpeg', quality);
      onThumbnailGenerated(thumbnailUrl);
      setLoaded(true);
    }
  };

  const tryGetPosterThumbnail = () => {
    const videoElement = videoRef.current;
    if (!videoElement) return;

    if (videoElement.poster) {
      onThumbnailGenerated(videoElement.poster);
      setLoaded(true);
      return true;
    }
    return false;
  };

  const tryGenerateThumbnail = () => {
    const videoElement = videoRef.current;
    if (!videoElement) return;
    
    if (tryGetPosterThumbnail()) return;
    
    try {
      if (videoElement.videoWidth <= 0 || videoElement.videoHeight <= 0) {
        throw new Error('Invalid video dimensions');
      }
      
      const canvas = document.createElement('canvas');
      canvas.width = videoElement.videoWidth;
      canvas.height = videoElement.videoHeight;
      const ctx = canvas.getContext('2d');
      
      if (ctx) {
        ctx.drawImage(videoElement, 0, 0, canvas.width, canvas.height);
        const thumbnailUrl = canvas.toDataURL('image/jpeg', quality);
        onThumbnailGenerated(thumbnailUrl);
        setLoaded(true);
      } else {
        throw new Error('Could not get canvas context');
      }
    } catch (e) {
      console.error('Error generating thumbnail:', e);
      attemptCount.current++;
      
      if (attemptCount.current >= maxAttempts) {
        setError(true);
        generateFallbackThumbnail();
      }
    }
  };

  useEffect(() => {
    const directThumbUrl = getThumbnailUrl(video.path);
    if (directThumbUrl) {
      const img = new Image();
      img.crossOrigin = "anonymous";
      img.onload = () => {
        onThumbnailGenerated(directThumbUrl);
        setLoaded(true);
      };
      img.onerror = () => {
        console.log("Direct thumbnail failed, falling back to video element");
      };
      img.src = directThumbUrl;
    }
  }, [video.path]);

  useEffect(() => {
    if (loaded) return; 
    const videoElement = videoRef.current;
    if (!videoElement) return;

    if (tryGetPosterThumbnail()) return;

    if (videoElement.readyState >= 1) {
      try {
        videoElement.currentTime = videoElement.duration > 0 ? 
          videoElement.duration * position : 0.1;
      } catch (e) {
        console.warn('Could not set time directly, waiting for metadata', e);
      }
    }

    const handleLoadedMetadata = () => {
      try {
        videoElement.currentTime = videoElement.duration * position;
      } catch (e) {
        console.error('Error setting video time:', e);
        setError(true);
        generateFallbackThumbnail();
      }
    };

    const handleTimeUpdate = () => {
      if (loaded) return;
      tryGenerateThumbnail();
    };

    const handleLoadError = () => {
      console.error('Video load error for:', video.title);
      setError(true);
      generateFallbackThumbnail();
    };
    
    const handleAbort = () => {
      console.warn('Video load aborted for:', video.title);
      setError(true);
      generateFallbackThumbnail();
    };

    videoElement.addEventListener('loadedmetadata', handleLoadedMetadata);
    videoElement.addEventListener('timeupdate', handleTimeUpdate);
    videoElement.addEventListener('error', handleLoadError);
    videoElement.addEventListener('abort', handleAbort);

    return () => {
      videoElement.removeEventListener('loadedmetadata', handleLoadedMetadata);
      videoElement.removeEventListener('timeupdate', handleTimeUpdate);
      videoElement.removeEventListener('error', handleLoadError);
      videoElement.removeEventListener('abort', handleAbort);
    };
  }, [loaded, onThumbnailGenerated, position, quality, video.title]);

  useEffect(() => {
    const timeoutId = setTimeout(() => {
      if (!loaded && !error) {
        console.warn('Thumbnail generation timed out for:', video.title);
        setError(true);
        generateFallbackThumbnail();
      }
    }, 10000); 
    
    return () => clearTimeout(timeoutId);
  }, [loaded, error, video.title]);

  return (
    <video
      ref={videoRef}
      src={!error && !loaded ? getVideoUrl(video.path) : undefined}
      crossOrigin="anonymous"
      muted
      preload="metadata"
      style={{ display: 'none' }}
    />
  );
});

ThumbnailGenerator.displayName = 'ThumbnailGenerator';

export default ThumbnailGenerator; 