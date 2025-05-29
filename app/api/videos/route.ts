import { NextRequest, NextResponse } from "next/server";
import dbConnect from "@/lib/db";
import Video from "@/lib/models/Video";
import { getFolderContents } from "@/lib/services/fileService";
import NodeCache from "node-cache";

const videoCache = new NodeCache({ stdTTL: 3600 });

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const folderPath = searchParams.get("path");

    if (!folderPath) {
      return NextResponse.json(
        { error: "Path parameter is required" },
        { status: 400 }
      );
    }

    const cacheKey = `videos_${folderPath}`;
    const cachedData = videoCache.get(cacheKey);
    if (cachedData) {
      return NextResponse.json(cachedData);
    }

    await dbConnect();

    const folderContent = await getFolderContents(folderPath);

    const savedVideos = await Video.find({
      path: { $in: folderContent.videos.map((v) => v.path) },
    });

    const updatedVideos = folderContent.videos.map((video) => {
      const savedVideo = savedVideos.find((sv) => sv.path === video.path);

      if (savedVideo) {
        return {
          ...video,
          tags: savedVideo.tags || [],
          thumbnail: savedVideo.thumbnail || video.thumbnail,
          duration: savedVideo.duration || video.duration,
        };
      }

      return video;
    });

    const response = {
      videos: updatedVideos,
      folders: folderContent.folders,
      currentPath: folderContent.currentPath,
    };

    videoCache.set(cacheKey, response);

    return NextResponse.json(response);
  } catch (error) {
    console.error("Error fetching videos:", error);
    return NextResponse.json(
      { error: "Failed to fetch videos" },
      { status: 500 }
    );
  }
}
