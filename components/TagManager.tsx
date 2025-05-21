'use client';

import { useState, useEffect, useRef } from 'react';
import { FaTimes, FaPlus, FaTag } from 'react-icons/fa';
import { VideoFile } from '@/lib/types';


function useDebounce<T>(value: T, delay: number): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value);

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => {
      clearTimeout(timer);
    };
  }, [value, delay]);

  return debouncedValue;
}

interface TagManagerProps {
  video: VideoFile;
  onUpdateTags: (videoId: string, tags: string[]) => void;
}

export default function TagManager({ video, onUpdateTags }: TagManagerProps) {
  const [tags, setTags] = useState<string[]>(video.tags || []);
  const [newTag, setNewTag] = useState('');
  const [allTags, setAllTags] = useState<string[]>([]);
  const [showDropdown, setShowDropdown] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const previousTagsRef = useRef<string[]>(tags);

  
  const debouncedTags = useDebounce(tags, 500);

  
  useEffect(() => {
    const fetchAllTags = async () => {
      try {
        const response = await fetch('/api/tags');
        if (response.ok) {
          const data = await response.json();
          setAllTags(data);
        }
      } catch (error) {
        console.error('Error fetching tags:', error);
      }
    };

    fetchAllTags();
  }, []);

  
  useEffect(() => {
    
    const tagsChanged = JSON.stringify(debouncedTags) !== JSON.stringify(previousTagsRef.current);
    
    if (tagsChanged) {
      onUpdateTags(video.id, debouncedTags);
      previousTagsRef.current = debouncedTags;
    }
  }, [debouncedTags, video.id, onUpdateTags]);

  
  useEffect(() => {
    setTags(video.tags || []);
    previousTagsRef.current = video.tags || [];
  }, [video.id, video.tags]);

  
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node) &&
        inputRef.current &&
        !inputRef.current.contains(event.target as Node)
      ) {
        setShowDropdown(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  
  const addTag = () => {
    if (newTag.trim() && !tags.includes(newTag.trim())) {
      const updatedTags = [...tags, newTag.trim()];
      setTags(updatedTags);
      setNewTag('');
      setShowDropdown(false);
    }
  };

  
  const removeTag = (tagToRemove: string) => {
    setTags(tags.filter((tag) => tag !== tagToRemove));
  };

  
  const filteredTags = allTags.filter(
    (tag) =>
      tag.toLowerCase().includes(newTag.toLowerCase()) &&
      !tags.includes(tag)
  );

  return (
    <div className="w-full p-4 bg-card-light dark:bg-card-dark rounded-lg border border-app-light dark:border-app-dark transition-colors">
      <h3 className="text-lg font-medium mb-3 flex items-center text-app-light dark:text-app-dark">
        <FaTag className="mr-2 text-primary-600 dark:text-primary-500" />
        Manage Tags
      </h3>

      <div className="flex flex-wrap gap-2 mb-3">
        {tags.map((tag) => (
          <div
            key={tag}
            className="flex items-center bg-primary-100 dark:bg-primary-900/30 text-primary-800 dark:text-primary-300 px-3 py-1 rounded-full"
          >
            <span className="text-sm">{tag}</span>
            <button
              className="ml-2 text-primary-600 dark:text-primary-500 hover:text-primary-800 dark:hover:text-primary-400"
              onClick={() => removeTag(tag)}
            >
              <FaTimes size={12} />
            </button>
          </div>
        ))}
      </div>

      <div className="flex">
        <input
          ref={inputRef}
          type="text"
          value={newTag}
          onChange={(e) => {
            setNewTag(e.target.value);
            setShowDropdown(true);
          }}
          onFocus={() => setShowDropdown(true)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              e.preventDefault();
              addTag();
            }
          }}
          placeholder="Add a new tag..."
          className="flex-1 p-2 border border-app-light dark:border-app-dark rounded-l-lg bg-card-light dark:bg-card-dark text-app-light dark:text-app-dark focus:outline-none focus:ring-2 focus:ring-primary-500 dark:focus:ring-primary-600 transition-colors"
        />
        <button
          onClick={addTag}
          className="bg-primary-600 dark:bg-primary-700 hover:bg-primary-700 dark:hover:bg-primary-600 text-white px-3 py-2 rounded-r-lg transition-colors"
        >
          <FaPlus />
        </button>
      </div>

      {showDropdown && filteredTags.length > 0 && (
        <div
          ref={dropdownRef}
          className="absolute z-10 left-0 right-0 mt-1 bg-card-light dark:bg-card-dark border border-app-light dark:border-app-dark rounded-lg shadow-lg dark:shadow-black/30 max-h-48 overflow-y-auto transition-colors"
        >
          {filteredTags.map((tag) => (
            <div
              key={tag}
              className="px-3 py-2 hover:bg-gray-100 dark:hover:bg-gray-800 cursor-pointer text-app-light dark:text-app-dark transition-colors"
              onClick={() => {
                setNewTag(tag);
                addTag();
              }}
            >
              {tag}
            </div>
          ))}
        </div>
      )}
    </div>
  );
} 