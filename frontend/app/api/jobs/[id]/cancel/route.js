import { NextResponse } from "next/server";
import { Store } from "@/lib/backend-js/memoryStore";

export async function POST(request, { params }) {
  const { id } = await params;
  const job = Store.getJob(id);

  if (!job) {
    return NextResponse.json({ detail: "Job not found." }, { status: 404 });
  }

  if (job.status === "completed" || job.status === "cancelled" || job.status === "failed") {
    return NextResponse.json({
      job_id: id,
      status: job.status,
      message: `Job is already ${job.status}`,
    });
  }

  Store.requestCancel(id);
  return NextResponse.json({
    job_id: id,
    status: "cancelling",
    message: "Cancellation requested.",
  });
}
