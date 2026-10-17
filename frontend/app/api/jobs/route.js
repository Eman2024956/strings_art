import { NextResponse } from "next/server";
import crypto from "crypto";
import { Store } from "@/lib/backend-js/memoryStore";
import { executeJob } from "@/lib/backend-js/jobRunner";

export async function POST(request) {
  try {
    const body = await request.json();
    const { upload_id, nails = 200, steps = 3000, size = 300 } = body;

    if (!upload_id) {
      return NextResponse.json({ detail: "upload_id is required." }, { status: 400 });
    }

    const upload = Store.getUpload(upload_id);
    if (!upload) {
      return NextResponse.json({ detail: "Upload not found." }, { status: 404 });
    }

    const jobId = crypto.randomUUID();
    Store.createJob(jobId, {
      uploadId: upload_id,
      config: body,
    });

    // Execute job asynchronously in Node.js event loop
    setTimeout(() => {
      executeJob(jobId).catch((err) => console.error("Job execution error:", err));
    }, 0);

    return NextResponse.json({
      job_id: jobId,
      status: "queued",
      config: body,
    });
  } catch (err) {
    return NextResponse.json({ detail: err.message }, { status: 400 });
  }
}
