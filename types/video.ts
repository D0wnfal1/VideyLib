export interface Video {
  id: string;
  title: string;
  path: string;
  duration?: number;
  size?: number;
  createdAt?: string;
  updatedAt?: string;
  watched?: boolean;
  lastWatchedPosition?: number;
  lastWatchedAt?: string;
  tags?: string[];
}
