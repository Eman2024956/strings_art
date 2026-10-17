import { NextResponse } from "next/server";
import { Store } from "@/lib/backend-js/memoryStore";

export async function GET(request, { params }) {
  const { id } = await params;
  const upload = Store.getUpload(id);

  if (!upload || !upload.buffer) {
    return NextResponse.json({ detail: "Upload not found." }, { status: 404 });
  }

  return new Response(upload.buffer, {
    headers: {
      "Content-Type": upload.mimeType || "image/jpeg",
      "Cache-Control": "public, max-age=3600",
    },
  });
}
