import { NextResponse } from "next/server";
import crypto from "crypto";
import sharp from "sharp";
import { Store } from "@/lib/backend-js/memoryStore";

export async function POST(request) {
  try {
    const formData = await request.formData();
    const file = formData.get("file");

    if (!file) {
      return NextResponse.json({ detail: "No file uploaded." }, { status: 400 });
    }

    const filename = file.name || "upload.jpg";
    if (filename.toLowerCase().endsWith(".svg") || (file.type && file.type.includes("svg"))) {
      return NextResponse.json(
        { detail: "SVG uploads are prohibited for security reasons." },
        { status: 400 }
      );
    }

    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    if (buffer.length > 15 * 1024 * 1024) {
      return NextResponse.json(
        { detail: "File exceeds maximum allowed size of 15 MB." },
        { status: 400 }
      );
    }

    if (buffer.length < 50) {
      return NextResponse.json(
        { detail: "Uploaded file is empty or corrupted." },
        { status: 400 }
      );
    }

    // Verify image with sharp
    const metadata = await sharp(buffer).metadata();
    if (!metadata.width || !metadata.height) {
      return NextResponse.json(
        { detail: "Invalid image format." },
        { status: 400 }
      );
    }

    const uploadId = crypto.randomUUID();
    Store.saveUpload(uploadId, {
      uploadId,
      filename,
      buffer,
      width: metadata.width,
      height: metadata.height,
      format: metadata.format,
      mimeType: file.type || "image/jpeg",
    });

    return NextResponse.json({
      upload_id: uploadId,
      filename,
      width: metadata.width,
      height: metadata.height,
      size_bytes: buffer.length,
    });
  } catch (err) {
    return NextResponse.json(
      { detail: `Failed to process image: ${err.message}` },
      { status: 400 }
    );
  }
}
