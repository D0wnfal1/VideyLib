/**
 * Common utility functions for video handling
 */

/**
 * Converts a file path to a streamable URL
 * @param path The file path to convert
 * @returns The streamable URL
 */
export function getVideoUrl(path: string): string {
  if (path.startsWith("http://") || path.startsWith("https://")) {
    return path;
  }

  const normalizedPath = path.replace(/\\/g, "/");
  const encodedPath = encodeURIComponent(normalizedPath);

  return `/api/videos/stream/${encodedPath}`;
}

/**
 * Formats file size in bytes to a human-readable format
 * @param bytes File size in bytes
 * @returns Formatted file size string
 */
export function formatFileSize(bytes: number | undefined): string {
  if (!bytes) return "Unknown size";

  const units = ["B", "KB", "MB", "GB"];
  let size = bytes;
  let unitIndex = 0;

  while (size >= 1024 && unitIndex < units.length - 1) {
    size /= 1024;
    unitIndex++;
  }

  return `${size.toFixed(1)} ${units[unitIndex]}`;
}

/**
 * Formats duration in seconds to a human-readable format
 * @param seconds Duration in seconds
 * @returns Formatted duration string
 */
export function formatDuration(seconds: number | undefined): string {
  if (!seconds) return "Unknown duration";

  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const secs = Math.floor(seconds % 60);

  if (hours > 0) {
    return `${hours}:${minutes.toString().padStart(2, "0")}:${secs
      .toString()
      .padStart(2, "0")}`;
  }

  return `${minutes}:${secs.toString().padStart(2, "0")}`;
}
