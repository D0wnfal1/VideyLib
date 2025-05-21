import { NextRequest, NextResponse } from "next/server";
import dbConnect from "@/lib/db";
import Video from "@/lib/models/Video";


async function waitUntilParams<T>(params: T): Promise<T> {
  return params;
}


export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    await dbConnect();

    
    const safeParams = await waitUntilParams(params);
    const id = safeParams.id;

    if (!id) {
      return NextResponse.json(
        { error: "Video ID is required" },
        { status: 400 }
      );
    }

    const path = Buffer.from(id, "base64").toString();
    const body = await request.json();

    if (!Array.isArray(body.tags)) {
      return NextResponse.json(
        { error: "Tags must be an array" },
        { status: 400 }
      );
    }

    
    let video = await Video.findOne({ path });

    if (!video) {
      
      video = new Video({
        title: path.split("/").pop()?.split(".")[0] || "Unknown",
        path,
        tags: body.tags,
      });
    } else {
      
      video.tags = body.tags;
    }

    await video.save();

    return NextResponse.json({
      id,
      tags: video.tags,
      success: true,
    });
  } catch (error) {
    console.error("Error updating tags:", error);
    return NextResponse.json(
      { error: "Failed to update tags" },
      { status: 500 }
    );
  }
}
