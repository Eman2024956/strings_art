import fs from "node:fs/promises";
import path from "node:path";
import { Store } from "../store/store.js";
import { processInputImage, rawGrayscaleToPng } from "../core/imageOps.js";
import { runStringArtGenerator } from "../core/generator.js";
import { generateSvgExport } from "../exports/svgExport.js";
import { generateActualSizePdf, generateTiledA4Pdf } from "../exports/pdfExport.js";
import { generateCsv, generateInstructionsJson, generateZipBundle } from "../exports/dataExport.js";
import type { JobResult } from "../types.js";

export function dispatchJob(jobId: string): void {
  // Run asynchronously without blocking HTTP response
  setImmediate(async () => {
    await executeJob(jobId);
  });
}

async function executeJob(jobId: string): Promise<void> {
  const job = Store.getJob(jobId);
  if (!job) return;

  const upload = Store.getUpload(job.upload_id);
  if (!upload) {
    Store.failJob(jobId, "Upload source file not found.");
    return;
  }

  try {
    const jobDir = Store.getJobDir(jobId);
    const config = job.config;

    // 1. Process image
    const { rawGrayscale, targetPngBuffer } = await processInputImage(upload.file_path, {
      size: config.size,
      cropBox: config.crop_box,
      rotation: config.rotation,
      brightness: config.brightness,
      contrast: config.contrast,
    });

    await fs.writeFile(path.join(jobDir, "target.png"), targetPngBuffer);

    // 2. Run String Art Generator
    const genResult = runStringArtGenerator({
      targetPixels: rawGrayscale,
      size: config.size,
      nails: config.nails,
      steps: config.steps,
      strength: config.strength,
      minGap: config.min_gap,
      startNail: config.start_nail,
      onProgress: (step, total, nail) => {
        Store.updateJobProgress(jobId, step, total, nail);
      },
      isCancelled: () => Store.isJobCancelled(jobId),
    });

    if (Store.isJobCancelled(jobId)) {
      Store.setJobCancelled(jobId);
      return;
    }

    const { sequence, nailsPx, canvasBytes, stoppingReason } = genResult;

    // 3. Render preview PNG
    const previewPngBuffer = await rawGrayscaleToPng(canvasBytes, config.size);
    await fs.writeFile(path.join(jobDir, "preview.png"), previewPngBuffer);

    // 4. Calculate thread physical length
    let totalThreadMm = 0;
    const radiusMm = config.diameter_mm / 2.0;

    for (let i = 0; i < sequence.length - 1; i++) {
      const p1 = sequence[i] - 1;
      const p2 = sequence[i + 1] - 1;
      const angle1 = (2.0 * Math.PI * p1) / config.nails;
      const angle2 = (2.0 * Math.PI * p2) / config.nails;
      const deltaAngle = Math.abs(angle1 - angle2);
      // Chord length formula: 2 * R * sin(delta / 2)
      const chordMm = 2.0 * radiusMm * Math.sin(deltaAngle / 2.0);
      totalThreadMm += chordMm;
    }

    const totalThreadM = Number((totalThreadMm / 1000.0).toFixed(2));
    const allowancePct = config.allowance_pct || 15.0;
    const estimatedWithAllowanceM = Number((totalThreadM * (1.0 + allowancePct / 100.0)).toFixed(2));

    // 5. Build Exports
    const svgContent = generateSvgExport(sequence, config.nails, config.diameter_mm);
    await fs.writeFile(path.join(jobDir, "nails_template.svg"), svgContent, "utf8");

    const pdfActual = await generateActualSizePdf(config.nails, config.diameter_mm);
    await fs.writeFile(path.join(jobDir, "nails_template_actual_size.pdf"), pdfActual);

    const pdfTiled = await generateTiledA4Pdf(config.nails, config.diameter_mm);
    await fs.writeFile(path.join(jobDir, "nails_template_tiled_a4.pdf"), pdfTiled);

    const csvContent = generateCsv(sequence);
    await fs.writeFile(path.join(jobDir, "sequence.csv"), csvContent, "utf8");

    const artifactsMap: Record<string, string> = {
      preview_png: `/api/jobs/${jobId}/downloads/preview.png`,
      target_png: `/api/jobs/${jobId}/downloads/target.png`,
      svg_template: `/api/jobs/${jobId}/downloads/nails_template.svg`,
      pdf_actual_size: `/api/jobs/${jobId}/downloads/nails_template_actual_size.pdf`,
      pdf_tiled_a4: `/api/jobs/${jobId}/downloads/nails_template_tiled_a4.pdf`,
      sequence_csv: `/api/jobs/${jobId}/downloads/sequence.csv`,
      instructions_json: `/api/jobs/${jobId}/downloads/instructions.json`,
      zip_bundle: `/api/jobs/${jobId}/downloads/string_art_bundle.zip`,
    };

    const finalResult: JobResult = {
      job_id: jobId,
      status: "completed",
      stopping_reason: stoppingReason,
      total_lines: sequence.length > 0 ? sequence.length - 1 : 0,
      total_thread_m: totalThreadM,
      estimated_with_allowance_m: estimatedWithAllowanceM,
      allowance_pct: allowancePct,
      nails_count: config.nails,
      diameter_mm: config.diameter_mm,
      strength: config.strength,
      min_gap: config.min_gap,
      start_nail: config.start_nail,
      sequence,
      nails_px: nailsPx,
      artifacts: artifactsMap,
    };

    const jsonContent = generateInstructionsJson(finalResult);
    await fs.writeFile(path.join(jobDir, "instructions.json"), jsonContent, "utf8");

    // 6. Build ZIP bundle
    const zipBuffer = await generateZipBundle({
      "target.png": targetPngBuffer,
      "preview.png": previewPngBuffer,
      "nails_template.svg": svgContent,
      "nails_template_actual_size.pdf": pdfActual,
      "nails_template_tiled_a4.pdf": pdfTiled,
      "sequence.csv": csvContent,
      "instructions.json": jsonContent,
    });

    await fs.writeFile(path.join(jobDir, "string_art_bundle.zip"), zipBuffer);

    // 7. Mark Job Completed
    Store.completeJob(jobId, finalResult, stoppingReason);
  } catch (err: unknown) {
    const error = err as Error;
    console.error(`[JobRunner] Job ${jobId} failed:`, error);
    Store.failJob(jobId, error?.message || "Internal generation error occurred.");
  }
}
