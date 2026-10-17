import { NextResponse } from "next/server";
import { Store } from "@/lib/backend-js/memoryStore";

export async function GET(request, { params }) {
  const { id } = await params;
  const job = Store.getJob(id);

  if (!job) {
    return NextResponse.json({ detail: "Job not found." }, { status: 404 });
  }

  return NextResponse.json({
    job_id: job.jobId,
    status: job.status,
    progress_step: job.progressStep,
    total_steps: job.totalSteps,
    current_nail: job.currentNail,
    stopping_reason: job.stoppingReason || null,
    error_message: job.errorMessage || null,
    created_at: job.createdAt,
    updated_at: job.updatedAt,
  });
}
