import { NextRequest, NextResponse } from "next/server";
import { stat, createReadStream } from "fs";
import { promisify } from "util";
import path from "path";

const statPromise = promisify(stat);

const mimeTypes: Record<string, string> = {
  ".mp4": "video/mp4",
  ".webm": "video/webm",
  ".ogg": "video/ogg",
  ".mov": "video/quicktime",
  ".avi": "video/x-msvideo",
  ".mkv": "video/x-matroska",
  ".flv": "video/x-flv",
  ".wmv": "video/x-ms-wmv",
  ".m4v": "video/mp4",
  ".mpg": "video/mpeg",
  ".mpeg": "video/mpeg",
  ".3gp": "video/3gpp",
};

function getMimeType(filePath: string): string {
  const ext = path.extname(filePath).toLowerCase();
  return mimeTypes[ext] || "application/octet-stream";
}

export async function GET(request: NextRequest) {
  try {
    const url = new URL(request.url);
    const pathSegments = url.pathname.split("/api/videos/stream/")[1];

    if (!pathSegments) {
      return NextResponse.json({ error: "Invalid file path" }, { status: 400 });
    }

    const decodedPath = decodeURIComponent(pathSegments);

    let stats;
    try {
      stats = await statPromise(decodedPath);
    } catch (error) {
      console.error(
        `File access error: ${
          error instanceof Error ? error.message : String(error)
        }`
      );
      return NextResponse.json(
        { error: "File not found", details: `Could not access ${decodedPath}` },
        { status: 404 }
      );
    }

    if (!stats.isFile()) {
      return NextResponse.json(
        { error: "Not a file", details: `${decodedPath} is not a file` },
        { status: 400 }
      );
    }

    const contentType = getMimeType(decodedPath);
    const range = request.headers.get("range");

    if (range) {
      const parts = range.replace(/bytes=/, "").split("-");
      const start = parseInt(parts[0], 10);
      const end = parts[1] ? parseInt(parts[1], 10) : stats.size - 1;

      if (
        isNaN(start) ||
        isNaN(end) ||
        start < 0 ||
        end >= stats.size ||
        start > end
      ) {
        return NextResponse.json(
          {
            error: "Invalid range",
            details: "Requested range not satisfiable",
          },
          { status: 416 }
        );
      }

      const chunkSize = end - start + 1;
      const fileStream = createReadStream(decodedPath, { start, end });

      const headers = {
        "Content-Range": `bytes ${start}-${end}/${stats.size}`,
        "Accept-Ranges": "bytes",
        "Content-Length": chunkSize.toString(),
        "Content-Type": contentType,
        "Cache-Control": "public, max-age=31536000, immutable",
        ETag: `"${stats.size}-${stats.mtimeMs}"`,
      };

      return new NextResponse(fileStream as unknown as ReadableStream, {
        status: 206,
        headers,
      });
    } else {
      const fileStream = createReadStream(decodedPath);

      const headers = {
        "Content-Length": stats.size.toString(),
        "Content-Type": contentType,
        "Cache-Control": "public, max-age=31536000, immutable",
        ETag: `"${stats.size}-${stats.mtimeMs}"`,
      };

      return new NextResponse(fileStream as unknown as ReadableStream, {
        status: 200,
        headers,
      });
    }
  } catch (error) {
    console.error("Error streaming video:", error);
    return NextResponse.json(
      { error: "Failed to stream video", details: String(error) },
      { status: 500 }
    );
  }
}
