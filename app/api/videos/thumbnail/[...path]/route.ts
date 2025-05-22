import { NextRequest, NextResponse } from "next/server";
import { existsSync } from "fs";
import { stat } from "fs/promises";

export async function GET(request: NextRequest) {
  try {
    const url = new URL(request.url);
    const pathSegments = url.pathname.split("/api/videos/thumbnail/")[1];

    if (!pathSegments) {
      return NextResponse.json({ error: "Invalid file path" }, { status: 400 });
    }

    const decodedPath = decodeURIComponent(pathSegments);

    if (!existsSync(decodedPath)) {
      return NextResponse.json(
        { error: "File not found", details: `Could not access ${decodedPath}` },
        { status: 404 }
      );
    }

    const stats = await stat(decodedPath);
    if (!stats.isFile()) {
      return NextResponse.json(
        { error: "Not a file", details: `${decodedPath} is not a file` },
        { status: 400 }
      );
    }

    const normalizedPath = decodedPath.replace(/\\/g, "/");
    const encodedPath = encodeURIComponent(normalizedPath);
    const videoUrl = `/api/videos/stream/${encodedPath}`;

    const headers = {
      Location: videoUrl,
      "Content-Type": "video/mp4",
      "X-Content-Type-Options": "nosniff",
      "Cache-Control": "public, max-age=86400",
    };

    return NextResponse.redirect(new URL(videoUrl, request.url), {
      status: 302,
      headers,
    });
  } catch (error) {
    console.error("Error generating thumbnail:", error);
    return NextResponse.json(
      { error: "Failed to generate thumbnail", details: String(error) },
      { status: 500 }
    );
  }
}
