import { NextRequest, NextResponse } from "next/server";
import { existsSync, mkdirSync } from "fs";
import { stat } from "fs/promises";
import path from "path";
import { spawn } from "child_process";

const THUMBNAIL_DIR = path.resolve(process.cwd(), "thumbnails");

export async function GET(request: NextRequest) {
  try {
    const url = new URL(request.url);
    const pathSegments = url.pathname.split("/api/videos/thumbnail/")[1];
    const timeParam = url.searchParams.get("time");
    const time = timeParam ? Math.max(0, parseFloat(timeParam)) : 3;

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

    if (!existsSync(THUMBNAIL_DIR)) {
      mkdirSync(THUMBNAIL_DIR);
    }

    const safeName =
      Buffer.from(decodedPath).toString("base64").replace(/[/+=]/g, "_") +
      `_${time}.jpg`;
    const thumbnailPath = path.join(THUMBNAIL_DIR, safeName);

    if (existsSync(thumbnailPath)) {
      const imageBuffer = await import("fs").then((fs) =>
        fs.readFileSync(thumbnailPath)
      );
      return new NextResponse(imageBuffer, {
        status: 200,
        headers: {
          "Content-Type": "image/jpeg",
          "Cache-Control": "public, max-age=604800",
        },
      });
    }

    await new Promise((resolve, reject) => {
      const ffmpeg = spawn("ffmpeg", [
        "-i",
        decodedPath,
        "-ss",
        String(time),
        "-frames:v",
        "1",
        "-q:v",
        "2",
        "-y",
        thumbnailPath,
      ]);
      ffmpeg.on("close", (code) => {
        if (code === 0) resolve(true);
        else reject(new Error("ffmpeg exited with code " + code));
      });
      ffmpeg.on("error", reject);
    });

    const imageBuffer = await import("fs").then((fs) =>
      fs.readFileSync(thumbnailPath)
    );
    return new NextResponse(imageBuffer, {
      status: 200,
      headers: {
        "Content-Type": "image/jpeg",
        "Cache-Control": "public, max-age=604800",
      },
    });
  } catch (error) {
    console.error("Error generating thumbnail:", error);
    return NextResponse.json(
      { error: "Failed to generate thumbnail", details: String(error) },
      { status: 500 }
    );
  }
}
