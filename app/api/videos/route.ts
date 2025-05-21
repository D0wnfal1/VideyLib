import { NextRequest, NextResponse } from "next/server";
import dbConnect from "@/lib/db";
import Video from "@/lib/models/Video";
import { getFolderContents } from "@/lib/services/fileService";


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

    return NextResponse.json({
      videos: updatedVideos,
      folders: folderContent.folders,
      currentPath: folderContent.currentPath,
    });
  } catch (error) {
    console.error("Error fetching videos:", error);
    return NextResponse.json(
      { error: "Failed to fetch videos" },
      { status: 500 }
    );
  }
}
