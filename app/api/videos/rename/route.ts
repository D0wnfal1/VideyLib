import { NextRequest, NextResponse } from "next/server";
import dbConnect from "@/lib/db";
import Video from "@/lib/models/Video";
import { renameVideoFile } from "@/lib/services/fileService";

export async function POST(request: NextRequest) {
  try {
    const { oldPath, newName } = await request.json();

    if (!oldPath || !newName) {
      return NextResponse.json(
        { error: "Old path and new name are required" },
        { status: 400 }
      );
    }

    
    const newPath = await renameVideoFile(oldPath, newName);

    
    await dbConnect();
    const videoId = Buffer.from(oldPath).toString("base64");
    const video = await Video.findOne({ id: videoId });

    if (video) {
      
      const newVideoId = Buffer.from(newPath).toString("base64");
      video.id = newVideoId;
      video.path = newPath;
      video.title = newName;
      await video.save();
    }

    return NextResponse.json({
      success: true,
      newPath,
      newId: Buffer.from(newPath).toString("base64"),
      newTitle: newName,
    });
  } catch (error) {
    console.error("Error renaming video:", error);
    const errorMessage =
      error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
}
