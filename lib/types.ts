export interface VideoFile {
  id: string;
  title: string;
  path: string;
  thumbnail?: string;
  duration?: number;
  size?: number;
  tags: string[];
  createdAt: string;
  updatedAt: string;
}

export interface FolderContent {
  videos: VideoFile[];
  folders: string[];
  currentPath: string;
}

export interface Tag {
  id: string;
  name: string;
}
