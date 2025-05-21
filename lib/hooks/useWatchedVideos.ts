"use client";

import { useState, useEffect } from "react";


export function useWatchedVideos() {
  const [watchedVideos, setWatchedVideos] = useState<string[]>([]);

  
  useEffect(() => {
    const storedWatchedVideos = localStorage.getItem("watchedVideos");
    if (storedWatchedVideos) {
      try {
        const parsed = JSON.parse(storedWatchedVideos);
        if (Array.isArray(parsed)) {
          setWatchedVideos(parsed);
        }
      } catch (error) {
        console.error("Error parsing watched videos from localStorage:", error);
      }
    }
  }, []);

  
  const saveWatchedVideos = (videoIds: string[]) => {
    try {
      localStorage.setItem("watchedVideos", JSON.stringify(videoIds));
      setWatchedVideos(videoIds);
    } catch (error) {
      console.error("Error saving watched videos to localStorage:", error);
    }
  };

  
  const markAsWatched = (videoId: string) => {
    if (!watchedVideos.includes(videoId)) {
      const updatedWatchedVideos = [...watchedVideos, videoId];
      saveWatchedVideos(updatedWatchedVideos);
    }
  };

  
  const markAsUnwatched = (videoId: string) => {
    const updatedWatchedVideos = watchedVideos.filter((id) => id !== videoId);
    saveWatchedVideos(updatedWatchedVideos);
  };

  
  const isWatched = (videoId: string) => {
    return watchedVideos.includes(videoId);
  };

  
  const toggleWatched = (videoId: string) => {
    if (isWatched(videoId)) {
      markAsUnwatched(videoId);
    } else {
      markAsWatched(videoId);
    }
  };

  return {
    watchedVideos,
    markAsWatched,
    markAsUnwatched,
    isWatched,
    toggleWatched,
  };
}
