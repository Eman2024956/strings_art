import { NextResponse } from "next/server";
import { Store } from "@/lib/backend-js/memoryStore";

export async function GET(request, { params }) {
  const { id } = await params;
  const job = Store.getJob(id);

  if (!job) {
    return NextResponse.json({ detail: "Job not found." }, { status: 404 });
  }

  if (job.status !== "completed") {
    return NextResponse.json(
      { detail: `Job is not completed yet (status: ${job.status}).` },
      { status: 400 }
    );
  }

  const result = job.result;
  return NextResponse.json({
    job_id: job.jobId,
    status: job.status,
    stopping_reason: job.stoppingReason,
    total_lines: result.totalLines,
    total_thread_m: result.totalThreadM,
    estimated_with_allowance_m: result.estimatedWithAllowanceM,
    allowance_pct: result.allowancePct,
    nails_count: result.nailsCount,
    diameter_mm: result.diameterMm,
    strength: result.strength,
    min_gap: result.minGap,
    start_nail: result.startNail,
    size: result.size,
    sequence: result.sequence,
    nails_px: result.nailsPx,
    artifacts: {
      preview_png: "preview.png",
      target_png: "target.png",
      nails_template_svg: "nails_template.svg",
      nails_template_actual_size_pdf: "nails_template_actual_size.pdf",
      nails_template_tiled_a4_pdf: "nails_template_tiled_a4.pdf",
      sequence_csv: "sequence.csv",
      instructions_json: "instructions.json",
      bundle_zip: "string_art_bundle.zip",
    },
  });
}
