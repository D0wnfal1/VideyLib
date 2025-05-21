import fs from "fs";
import path from "path";
import { FolderContent } from "../types";


const VIDEO_EXTENSIONS = [
  ".mp4",
  ".webm",
  ".ogg",
  ".mov",
  ".avi",
  ".wmv",
  ".mkv",
];

export function isVideo(filename: string): boolean {
  const ext = path.extname(filename).toLowerCase();
  return VIDEO_EXTENSIONS.includes(ext);
}

export async function getFolderContents(
  folderPath: string
): Promise<FolderContent> {
  try {
    const items = await fs.promises.readdir(folderPath);
    const result: FolderContent = {
      videos: [],
      folders: [],
      currentPath: folderPath,
    };

    for (const item of items) {
      const itemPath = path.join(folderPath, item);
      const stats = await fs.promises.stat(itemPath);

      if (stats.isDirectory()) {
        result.folders.push(item);
      } else if (stats.isFile() && isVideo(item)) {
        
        result.videos.push({
          id: Buffer.from(itemPath).toString("base64"),
          title: path.basename(item, path.extname(item)),
          path: itemPath,
          size: stats.size,
          tags: [],
          createdAt: stats.birthtime.toISOString(),
          updatedAt: stats.mtime.toISOString(),
        });
      }
    }

    return result;
  } catch (error) {
    console.error("Error reading folder contents:", error);
    throw error;
  }
}

export async function getVideoInfo(videoPath: string) {
  try {
    const stats = await fs.promises.stat(videoPath);
    return {
      id: Buffer.from(videoPath).toString("base64"),
      title: path.basename(videoPath, path.extname(videoPath)),
      path: videoPath,
      size: stats.size,
      tags: [],
      createdAt: stats.birthtime.toISOString(),
      updatedAt: stats.mtime.toISOString(),
    };
  } catch (error) {
    console.error("Error getting video info:", error);
    throw error;
  }
}

export async function renameVideoFile(
  oldPath: string,
  newName: string
): Promise<string> {
  try {
    if (!fs.existsSync(oldPath)) {
      throw new Error("File not found");
    }

    const directory = path.dirname(oldPath);
    const extension = path.extname(oldPath);
    const newFilePath = path.join(directory, `${newName}${extension}`);

    
    if (fs.existsSync(newFilePath)) {
      throw new Error("A file with this name already exists");
    }

    
    await fs.promises.rename(oldPath, newFilePath);

    return newFilePath;
  } catch (error) {
    console.error("Error renaming file:", error);
    throw error;
  }
}

export async function deleteVideoFile(filePath: string): Promise<boolean> {
  try {
    if (!fs.existsSync(filePath)) {
      throw new Error("File not found");
    }

    
    await fs.promises.unlink(filePath);
    return true;
  } catch (error) {
    console.error("Error deleting file:", error);
    throw error;
  }
}
