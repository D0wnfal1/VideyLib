'use client';

import { useEffect, useRef, memo } from 'react';
import { VideoFile } from '@/lib/types';
import { getVideoUrl } from '@/lib/utils/videoUtils';

interface ThumbnailGeneratorProps {
  video: VideoFile;
  onThumbnailGenerated: (url: string) => void;
  quality?: number;
  position?: number;
}

const ThumbnailGenerator = memo(({ 
  video, 
  onThumbnailGenerated,
}: ThumbnailGeneratorProps) => {
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    const videoElement = videoRef.current;
    if (!videoElement) return;

    const handleLoadedData = () => {
      try {
        const canvas = document.createElement('canvas');
        canvas.width = videoElement.videoWidth;
        canvas.height = videoElement.videoHeight;
        const ctx = canvas.getContext('2d');
        if (ctx) {
          ctx.drawImage(videoElement, 0, 0, canvas.width, canvas.height);
          const thumbnailUrl = canvas.toDataURL('image/jpeg', 0.7);
          onThumbnailGenerated(thumbnailUrl);
        }
      } catch {
        onThumbnailGenerated('');
      }
    };

    videoElement.addEventListener('loadeddata', handleLoadedData);
    return () => {
      videoElement.removeEventListener('loadeddata', handleLoadedData);
    };
  }, [video.path, onThumbnailGenerated]);

  return (
    <video
      ref={videoRef}
      src={getVideoUrl(video.path)}
      preload="metadata"
      style={{
        opacity: 0,
        position: 'absolute',
        pointerEvents: 'none',
        width: 0,
        height: 0,
      }}
    />
  );
});

ThumbnailGenerator.displayName = 'ThumbnailGenerator';

export default ThumbnailGenerator; 