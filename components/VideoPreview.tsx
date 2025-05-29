'use client';

import React, { useEffect, useRef, useState } from 'react';
import { Video } from '@/types/video';
import { getVideoUrl } from '@/lib/utils/videoUtils';

interface VideoPreviewProps {
  video: Video;
  showPreview: boolean;
}

type PreviewPosition = 'start' | 'middle' | 'end';

const VideoPreview: React.FC<VideoPreviewProps> = ({ video, showPreview }) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [position, setPosition] = useState<PreviewPosition>('start');

  useEffect(() => {
    const el = videoRef.current;
    if (!el || !showPreview) return;

    const seekToPosition = () => {
      if (!el.duration || isNaN(el.duration)) return;
      let time = 0;
      if (position === 'start') time = 1;
      else if (position === 'middle') time = el.duration * 0.5;
      else if (position === 'end') time = el.duration * 0.9;
      el.currentTime = Math.min(time, el.duration - 0.5);
    };

    el.addEventListener('loadedmetadata', seekToPosition);
    seekToPosition();

    if (showPreview) {
      el.play().catch(() => {});
    } else {
      el.pause();
    }

    return () => {
      el.removeEventListener('loadedmetadata', seekToPosition);
    };
  }, [showPreview, position]);

  return (
    <div className="absolute inset-0 z-10">
      <div className="absolute top-2 left-2 z-20 flex gap-1">
        <button
          onClick={e => { e.stopPropagation(); setPosition('start'); }}
          className={`px-2 py-1 rounded text-xs ${position === 'start' ? 'bg-blue-500 text-white' : 'bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-gray-200'}`}
        >1</button>
        <button
          onClick={e => { e.stopPropagation(); setPosition('middle'); }}
          className={`px-2 py-1 rounded text-xs ${position === 'middle' ? 'bg-blue-500 text-white' : 'bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-gray-200'}`}
        >2</button>
        <button
          onClick={e => { e.stopPropagation(); setPosition('end'); }}
          className={`px-2 py-1 rounded text-xs ${position === 'end' ? 'bg-blue-500 text-white' : 'bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-gray-200'}`}
        >3</button>
      </div>
      <video
        ref={videoRef}
        src={getVideoUrl(video.path)}
        className="w-full h-full object-cover"
        muted
        playsInline
        preload="metadata"
      />
    </div>
  );
};

export default VideoPreview; 