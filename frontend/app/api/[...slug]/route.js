import { NextResponse } from "next/server";
import crypto from "crypto";
import sharp from "sharp";
import { Store } from "@/lib/backend-js/memoryStore.js";
import { executeJob } from "@/lib/backend-js/jobRunner.js";
import { generateSvgTemplate, renderStringArtPreviewPng } from "@/lib/backend-js/svgExport.js";
import { generateActualSizePdf, generateTiledA4Pdf } from "@/lib/backend-js/pdfExport.js";
import { exportSequenceCsv, exportSequenceTxt, exportInstructionsJson, buildZipBundle } from "@/lib/backend-js/dataExport.js";

export const maxDuration = 30;

export async function POST(request, context) {
  const { params } = context;
  const slug = (await params)?.slug || [];
  const pathname = slug.join("/");

  // 1. POST /api/uploads
  if (pathname === "uploads") {
    try {
      const formData = await request.formData();
      const file = formData.get("file");

      if (!file) {
        return NextResponse.json({ detail: "No file uploaded." }, { status: 400 });
      }

      const filename = file.name || "upload.jpg";
      if (filename.toLowerCase().endsWith(".svg") || (file.type && file.type.includes("svg"))) {
        return NextResponse.json({ detail: "SVG uploads are prohibited for security reasons." }, { status: 400 });
      }

      const arrayBuffer = await file.arrayBuffer();
      const buffer = Buffer.from(arrayBuffer);

      if (buffer.length > 25 * 1024 * 1024) {
        return NextResponse.json({ detail: "File exceeds maximum allowed size of 25 MB." }, { status: 400 });
      }

      const metadata = await sharp(buffer).metadata();
      if (!metadata.width || !metadata.height) {
        return NextResponse.json({ detail: "Invalid image format." }, { status: 400 });
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
        image_base64: buffer.toString("base64"),
      });
    } catch (err) {
      return NextResponse.json({ detail: `Upload failed: ${err.message}` }, { status: 400 });
    }
  }

  // 2. POST /api/jobs
  if (pathname === "jobs") {
    try {
      const body = await request.json();
      const { upload_id, image_base64 } = body;

      if (!upload_id) {
        return NextResponse.json({ detail: "upload_id is required." }, { status: 400 });
      }

      let upload = Store.getUpload(upload_id);
      if (!upload && image_base64) {
        const buffer = Buffer.from(image_base64, "base64");
        upload = {
          uploadId: upload_id,
          filename: "upload.png",
          buffer,
          format: "png",
        };
        Store.saveUpload(upload_id, upload);
      }

      if (!upload) {
        return NextResponse.json({ detail: "Upload not found." }, { status: 404 });
      }

      const jobId = crypto.randomUUID();
      Store.createJob(jobId, {
        uploadId: upload_id,
        config: body,
      });

      // Synchronously execute job
      await executeJob(jobId);

      const completedJob = Store.getJob(jobId);

      return NextResponse.json({
        job_id: jobId,
        status: completedJob ? completedJob.status : "completed",
        config: body,
        result: completedJob?.result || null,
        error: completedJob?.errorMessage || null,
      });
    } catch (err) {
      return NextResponse.json({ detail: err.message }, { status: 400 });
    }
  }

  // 2b. POST /api/auto-tuner/log (Save Auto-Tuner test run records)
  if (pathname === "auto-tuner/log") {
    try {
      const body = await request.json();
      const { filename, record, timestamp } = body;
      return NextResponse.json({
        success: true,
        logged_at: timestamp || new Date().toISOString(),
        filename: filename || "auto_tuner.csv",
        record: record || null,
      });
    } catch (err) {
      return NextResponse.json({ detail: err.message }, { status: 400 });
    }
  }

  // 2b. POST /api/jobs/import (Text sequence import)
  if (pathname === "jobs/import") {
    try {
      const body = await request.json();
      const { sequence, nails_count, diameter_mm, allowance_pct } = body;

      if (!sequence || !Array.isArray(sequence) || sequence.length < 2) {
        return NextResponse.json({ detail: "A valid sequence with at least 2 nail numbers is required." }, { status: 400 });
      }

      const maxNail = Math.max(...sequence);
      const nailsCount = nails_count || (maxNail <= 200 ? 200 : Math.max(maxNail, Math.ceil(maxNail / 10) * 10));
      const diameterMm = diameter_mm || 400.0;
      const allowancePct = allowance_pct !== undefined ? allowance_pct : 15.0;
      const size = 300;

      // Calculate thread distance
      const rMeters = diameterMm / 2000.0;
      let totalThreadM = 0;
      for (let i = 1; i < sequence.length; i++) {
        const diff = Math.abs(sequence[i - 1] - sequence[i]);
        const chord = 2.0 * rMeters * Math.sin((diff * Math.PI) / nailsCount);
        totalThreadM += chord;
      }
      totalThreadM = parseFloat(totalThreadM.toFixed(1));
      const estimatedWithAllowanceM = parseFloat((totalThreadM * (1 + allowancePct / 100)).toFixed(1));

      // Calculate nails_px
      const resCenter = (size - 1) / 2.0;
      const resRadius = resCenter - 2.0;
      const nailsPx = [];
      const angleStep = (2.0 * Math.PI) / nailsCount;
      for (let i = 0; i < nailsCount; i++) {
        const a = -Math.PI / 2.0 + i * angleStep;
        nailsPx.push([
          parseFloat((resCenter + resRadius * Math.cos(a)).toFixed(2)),
          parseFloat((resCenter + resRadius * Math.sin(a)).toFixed(2)),
        ]);
      }

      const jobId = crypto.randomUUID();

      // Render high-res preview PNG
      const previewPngBuffer = await renderStringArtPreviewPng({
        sequence,
        nailsCount,
        size: 1200,
        strength: 0.10,
      });

      const svgString = generateSvgTemplate(nailsCount, diameterMm);
      const actualPdfBuffer = await generateActualSizePdf(nailsCount, diameterMm);
      const tiledPdfBuffer = await generateTiledA4Pdf(nailsCount, diameterMm);
      const csvString = exportSequenceCsv(sequence);
      const txtString = exportSequenceTxt(sequence);

      const artifactsMap = {
        preview_png: `/api/jobs/${jobId}/downloads/preview.png`,
        svg_template: `/api/jobs/${jobId}/downloads/nails_template.svg`,
        pdf_actual_size: `/api/jobs/${jobId}/downloads/nails_template_actual_size.pdf`,
        pdf_tiled_a4: `/api/jobs/${jobId}/downloads/nails_template_tiled_a4.pdf`,
        sequence_csv: `/api/jobs/${jobId}/downloads/sequence.csv`,
        sequence_txt: `/api/jobs/${jobId}/downloads/sequence.txt`,
        instructions_json: `/api/jobs/${jobId}/downloads/instructions.json`,
        zip_bundle: `/api/jobs/${jobId}/downloads/string_art_bundle.zip`,
      };

      const formattedResult = {
        job_id: jobId,
        nails_px: nailsPx,
        size,
        total_lines: sequence.length - 1,
        total_thread_m: totalThreadM,
        estimated_with_allowance_m: estimatedWithAllowanceM,
        allowance_pct: allowancePct,
        nails_count: nailsCount,
        diameter_mm: diameterMm,
        min_gap: 0,
        start_nail: sequence[0],
        sequence,
        stopping_reason: "uploaded_sequence",
        is_imported: true,
        artifacts: artifactsMap,
      };

      const jsonString = exportInstructionsJson(
        {
          nailsCount,
          totalLines: sequence.length - 1,
          diameterMm,
          strength: 0.10,
          minGap: 0,
          startNail: sequence[0],
          size,
          totalThreadM,
          allowancePct,
          estimatedWithAllowanceM,
          stoppingReason: "uploaded_sequence",
          nailsPx,
          sequence,
        },
        { steps: sequence.length - 1 }
      );

      const zipBuffer = await buildZipBundle({
        "preview.png": previewPngBuffer,
        "nails_template.svg": svgString,
        "nails_template_actual_size.pdf": actualPdfBuffer,
        "nails_template_tiled_a4.pdf": tiledPdfBuffer,
        "sequence.csv": csvString,
        "sequence.txt": txtString,
        "instructions.json": jsonString,
      });

      const artifacts = {
        "preview.png": { buffer: previewPngBuffer, mime: "image/png" },
        "nails_template.svg": { buffer: Buffer.from(svgString, "utf-8"), mime: "image/svg+xml" },
        "nails_template_actual_size.pdf": { buffer: actualPdfBuffer, mime: "application/pdf" },
        "nails_template_tiled_a4.pdf": { buffer: tiledPdfBuffer, mime: "application/pdf" },
        "sequence.csv": { buffer: Buffer.from(csvString, "utf-8"), mime: "text/csv" },
        "sequence.txt": { buffer: Buffer.from(txtString, "utf-8"), mime: "text/plain; charset=utf-8" },
        "instructions.json": { buffer: Buffer.from(jsonString, "utf-8"), mime: "application/json" },
        "string_art_bundle.zip": { buffer: zipBuffer, mime: "application/zip" },
      };

      Store.createJob(jobId, { config: { nails: nailsCount, steps: sequence.length - 1, diameter_mm: diameterMm } });
      Store.completeJob(jobId, formattedResult, artifacts);

      return NextResponse.json({
        job_id: jobId,
        status: "completed",
        result: formattedResult,
      });
    } catch (err) {
      return NextResponse.json({ detail: `Sequence import failed: ${err.message}` }, { status: 400 });
    }
  }

  // 3. POST /api/jobs/:id/cancel
  if (slug[0] === "jobs" && slug[2] === "cancel") {
    const jobId = slug[1];
    const success = Store.requestCancel(jobId);
    if (!success) {
      return NextResponse.json({ detail: "Job not found or already terminated." }, { status: 404 });
    }
    return NextResponse.json({ job_id: jobId, status: "cancelling" });
  }

  // 4. POST /api/clear
  if (pathname === "clear") {
    try {
      const body = await request.json().catch(() => ({}));
      if (body.job_id) Store.clearJob(body.job_id);
      if (body.upload_id) Store.clearUpload(body.upload_id);
      if (body.all) Store.clearAll();
      return NextResponse.json({ ok: true, message: "Cleared successfully" });
    } catch (e) {
      return NextResponse.json({ ok: false, detail: e.message }, { status: 400 });
    }
  }

  return NextResponse.json({ detail: "Not found" }, { status: 404 });
}

export async function GET(request, context) {
  const { params } = context;
  const slug = (await params)?.slug || [];
  const pathname = slug.join("/");

  // 1. GET /api/uploads/:id/preview
  if (slug[0] === "uploads" && slug[2] === "preview") {
    const uploadId = slug[1];
    const upload = Store.getUpload(uploadId);
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

  // 2. GET /api/jobs/:id/downloads/:artifact
  if (slug[0] === "jobs" && slug[2] === "downloads") {
    const jobId = slug[1];
    const artifact = slug[3];
    const job = Store.getJob(jobId);

    // If job has artifacts ready in memory/disk
    if (job && job.artifacts && job.artifacts[artifact]) {
      const artObj = job.artifacts[artifact];
      let buf = artObj.buffer;
      if (!buf && artObj.base64) {
        buf = Buffer.from(artObj.base64, "base64");
      }
      if (buf) {
        let downloadName = artifact;
        if (artifact === "sequence.txt" || artifact.endsWith(".txt")) {
          const now = new Date();
          const dateStamp = now.toISOString().slice(0, 10);
          const timeStamp = now.toTimeString().slice(0, 8).replace(/:/g, "-");
          downloadName = `husam_art_${dateStamp}_${timeStamp}.txt`;
        }
        return new Response(buf, {
          headers: {
            "Content-Type": artObj.mime || "application/octet-stream",
            "Content-Disposition": `attachment; filename="${downloadName}"`,
            "Cache-Control": "public, max-age=3600",
          },
        });
      }
    }

    // On-the-fly regeneration fallback if serverless cold started
    if (job && job.result && job.result.sequence) {
      const nailsCount = job.result.nails_count || job.result.nailsCount || 200;
      const diameterMm = job.result.diameter_mm || job.result.diameterMm || 400.0;
      const sequence = job.result.sequence;

      if (artifact === "nails_template.svg") {
        const svg = generateSvgTemplate(nailsCount, diameterMm);
        return new Response(svg, {
          headers: {
            "Content-Type": "image/svg+xml",
            "Content-Disposition": `attachment; filename="nails_template.svg"`,
          },
        });
      }

      if (artifact === "nails_template_actual_size.pdf") {
        const pdf = await generateActualSizePdf(nailsCount, diameterMm);
        return new Response(pdf, {
          headers: {
            "Content-Type": "application/pdf",
            "Content-Disposition": `attachment; filename="nails_template_actual_size.pdf"`,
          },
        });
      }

      if (artifact === "nails_template_tiled_a4.pdf") {
        const pdf = await generateTiledA4Pdf(nailsCount, diameterMm);
        return new Response(pdf, {
          headers: {
            "Content-Type": "application/pdf",
            "Content-Disposition": `attachment; filename="nails_template_tiled_a4.pdf"`,
          },
        });
      }

      if (artifact === "sequence.csv") {
        const csv = exportSequenceCsv(sequence);
        return new Response(csv, {
          headers: {
            "Content-Type": "text/csv",
            "Content-Disposition": `attachment; filename="sequence.csv"`,
          },
        });
      }

      if (artifact === "sequence.txt" || artifact.endsWith(".txt")) {
        const now = new Date();
        const dateStamp = now.toISOString().slice(0, 10);
        const timeStamp = now.toTimeString().slice(0, 8).replace(/:/g, "-");
        const filename = `husam_art_${dateStamp}_${timeStamp}.txt`;
        const txt = exportSequenceTxt(sequence, job.result);
        return new Response(txt, {
          headers: {
            "Content-Type": "text/plain; charset=utf-8",
            "Content-Disposition": `attachment; filename="${filename}"`,
          },
        });
      }

      if (artifact === "instructions.json") {
        const json = exportInstructionsJson(job.result, job.config || {});
        return new Response(json, {
          headers: {
            "Content-Type": "application/json",
            "Content-Disposition": `attachment; filename="instructions.json"`,
          },
        });
      }

      if (artifact === "string_art_bundle.zip") {
        const svg = generateSvgTemplate(nailsCount, diameterMm);
        const actualPdf = await generateActualSizePdf(nailsCount, diameterMm);
        const tiledPdf = await generateTiledA4Pdf(nailsCount, diameterMm);
        const csv = exportSequenceCsv(sequence);
        const json = exportInstructionsJson(job.result, job.config || {});

        const zip = await buildZipBundle({
          "nails_template.svg": svg,
          "nails_template_actual_size.pdf": actualPdf,
          "nails_template_tiled_a4.pdf": tiledPdf,
          "sequence.csv": csv,
          "instructions.json": json,
        });

        return new Response(zip, {
          headers: {
            "Content-Type": "application/zip",
            "Content-Disposition": `attachment; filename="string_art_bundle.zip"`,
          },
        });
      }
    }

    return NextResponse.json({ detail: `Artifact '${artifact}' not found.` }, { status: 404 });
  }

  // 3. GET /api/jobs/:id/result
  if (slug[0] === "jobs" && slug[2] === "result") {
    const jobId = slug[1];
    const job = Store.getJob(jobId);
    if (!job || !job.result) {
      return NextResponse.json({ detail: "Job result not ready." }, { status: 404 });
    }
    return NextResponse.json(job.result);
  }

  // 4. GET /api/jobs/:id
  if (slug[0] === "jobs" && slug.length === 2) {
    const jobId = slug[1];
    const job = Store.getJob(jobId);
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

  return NextResponse.json({ detail: "Not found" }, { status: 404 });
}
