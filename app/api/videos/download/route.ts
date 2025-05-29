import { NextRequest, NextResponse } from "next/server";
import { createWriteStream } from "fs";
import { mkdir } from "fs/promises";
import path from "path";
import { v4 as uuidv4 } from "uuid";

export async function POST(request: NextRequest) {
  try {
    const { url, destPath, filename } = await request.json();

    if (!url || !destPath) {
      return NextResponse.json(
        {
          success: false,
          error: "URL and destination path are required",
        },
        { status: 400 }
      );
    }

    const finalFilename =
      filename || `downloaded-${uuidv4()}${getFileExtension(url)}`;

    try {
      await mkdir(destPath, { recursive: true });
    } catch (error) {
      console.error("Error creating directory:", error);
      return NextResponse.json(
        {
          success: false,
          error: "Could not create destination directory",
        },
        { status: 500 }
      );
    }

    const filePath = path.join(destPath, finalFilename);

    const response = await fetch(url);

    if (!response.ok) {
      return NextResponse.json(
        {
          success: false,
          error: `Failed to download file: ${response.status} ${response.statusText}`,
        },
        { status: 500 }
      );
    }

    const fileStream = createWriteStream(filePath);

    if (response.body) {
      const buffer = await response.arrayBuffer();
      const nodeBuffer = Buffer.from(buffer);

      fileStream.write(nodeBuffer);
      fileStream.end();
    } else {
      return NextResponse.json(
        {
          success: false,
          error: "Response body is null",
        },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      filePath,
      filename: finalFilename,
    });
  } catch (error) {
    console.error("Download error:", error);
    return NextResponse.json(
      {
        success: false,
        error: `Download failed: ${
          error instanceof Error ? error.message : String(error)
        }`,
      },
      { status: 500 }
    );
  }
}

function getFileExtension(url: string): string {
  try {
    const urlObj = new URL(url);
    const pathname = urlObj.pathname;
    const ext = path.extname(pathname);

    if (ext && /\.(mp4|webm|mkv|avi|mov|wmv|flv|mpeg|m4v)$/i.test(ext)) {
      return ext;
    }

    return ".mp4";
  } catch {
    return ".mp4";
  }
}
