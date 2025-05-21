import { NextResponse } from "next/server";
import dbConnect from "@/lib/db";
import Video from "@/lib/models/Video";

export async function GET() {
  try {
    await dbConnect();

    
    const videos = await Video.find({});

    
    const allTags = Array.from(
      new Set(videos.flatMap((video) => video.tags))
    ).sort();

    return NextResponse.json(allTags);
  } catch (error) {
    console.error("Error fetching tags:", error);
    return NextResponse.json(
      { error: "Failed to fetch tags" },
      { status: 500 }
    );
  }
}
