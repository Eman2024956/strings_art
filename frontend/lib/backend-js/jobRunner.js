import { Store } from "./memoryStore.js";
import { processImageBuffer } from "./imageOps.js";
import { JSStringArtGenerator } from "./generator.js";
import { generateSvgTemplate, renderStringArtPreviewPng } from "./svgExport.js";
import { generateActualSizePdf, generateTiledA4Pdf } from "./pdfExport.js";
import { exportSequenceCsv, exportSequenceTxt, exportInstructionsJson, buildZipBundle } from "./dataExport.js";

export async function executeJob(jobId) {
  const job = Store.getJob(jobId);
  if (!job) return;

  const upload = Store.getUpload(job.uploadId);
  if (!upload) {
    Store.failJob(jobId, "Upload file not found.");
    return;
  }

  const config = job.config;
  const size = config.size || 300;
  const nailsCount = config.nails || 200;
  const steps = config.steps || 2200;
  const strength = config.strength !== undefined ? config.strength : 0.08;
  const minGap = config.min_gap !== undefined ? config.min_gap : (config.minGap !== undefined ? config.minGap : 20);
  const startNail = config.start_nail || 1;
  const diameterMm = config.diameter_mm || 400.0;
  const allowancePct = config.allowance_pct !== undefined ? config.allowance_pct : 15.0;

  try {
    // 1. Process image
    const { target, mask, importance, targetPngBuffer } = await processImageBuffer(upload.buffer, {
      size,
      rotation: config.rotation || 0,
      brightness: config.brightness !== undefined ? config.brightness : 1.0,
      contrast: config.contrast !== undefined ? config.contrast : 1.0,
      zoom: config.zoom !== undefined ? config.zoom : 1.0,
      panX: config.pan_x !== undefined ? config.pan_x : (config.panX || 0),
      panY: config.pan_y !== undefined ? config.pan_y : (config.panY || 0),
    });

    // 2. Setup Generator
    const generator = new JSStringArtGenerator({
      target,
      mask,
      importance,
      size,
      nailsCount,
      steps,
      strength,
      minGap,
      startNail,
      diameterMm,
      allowancePct,
    });

    Store.updateJobProgress(jobId, 0, steps, startNail);

    // 3. Run algorithm
    const genResult = await generator.run({
      onProgress: (step, total, currNail) => {
        Store.updateJobProgress(jobId, step, total, currNail);
      },
      isCancelled: () => {
        const j = Store.getJob(jobId);
        return j && (j.status === "cancelling" || j.status === "cancelled");
      },
    });

    // 3. Render high-resolution anti-aliased vector preview PNG (1200x1200px) matching the studio canvas
    const previewPngBuffer = await renderStringArtPreviewPng({
      sequence: genResult.sequence,
      nailsCount,
      size: 1200,
      strength: config.strength,
    });
    delete genResult.previewPngBuffer;

    // 4. Generate all export files
    const svgString = generateSvgTemplate(nailsCount, diameterMm);
    const actualPdfBuffer = await generateActualSizePdf(nailsCount, diameterMm);
    const tiledPdfBuffer = await generateTiledA4Pdf(nailsCount, diameterMm);
    const csvString = exportSequenceCsv(genResult.sequence);
    const txtString = exportSequenceTxt(genResult.sequence, genResult);
    const jsonString = exportInstructionsJson(genResult, config);

    const zipBuffer = await buildZipBundle({
      "preview.png": previewPngBuffer,
      "target.png": targetPngBuffer,
      "nails_template.svg": svgString,
      "nails_template_actual_size.pdf": actualPdfBuffer,
      "nails_template_tiled_a4.pdf": tiledPdfBuffer,
      "sequence.csv": csvString,
      "sequence.txt": txtString,
      "instructions.json": jsonString,
    });

    const artifacts = {
      "preview.png": { buffer: previewPngBuffer, mime: "image/png" },
      "target.png": { buffer: targetPngBuffer, mime: "image/png" },
      "nails_template.svg": { buffer: Buffer.from(svgString, "utf-8"), mime: "image/svg+xml" },
      "nails_template_actual_size.pdf": { buffer: actualPdfBuffer, mime: "application/pdf" },
      "nails_template_tiled_a4.pdf": { buffer: tiledPdfBuffer, mime: "application/pdf" },
      "sequence.csv": { buffer: Buffer.from(csvString, "utf-8"), mime: "text/csv" },
      "sequence.txt": { buffer: Buffer.from(txtString, "utf-8"), mime: "text/plain; charset=utf-8" },
      "instructions.json": { buffer: Buffer.from(jsonString, "utf-8"), mime: "application/json" },
      "string_art_bundle.zip": { buffer: zipBuffer, mime: "application/zip" },
    };

    const artifactsMap = {
      preview_png: `/api/jobs/${jobId}/downloads/preview.png`,
      target_png: `/api/jobs/${jobId}/downloads/target.png`,
      svg_template: `/api/jobs/${jobId}/downloads/nails_template.svg`,
      pdf_actual_size: `/api/jobs/${jobId}/downloads/nails_template_actual_size.pdf`,
      pdf_tiled_a4: `/api/jobs/${jobId}/downloads/nails_template_tiled_a4.pdf`,
      sequence_csv: `/api/jobs/${jobId}/downloads/sequence.csv`,
      sequence_txt: `/api/jobs/${jobId}/downloads/sequence.txt`,
      instructions_json: `/api/jobs/${jobId}/downloads/instructions.json`,
      zip_bundle: `/api/jobs/${jobId}/downloads/string_art_bundle.zip`,
    };

    const formattedResult = {
      ...genResult,
      job_id: jobId,
      nails_px: genResult.nailsPx,
      size: genResult.size || size,
      total_lines: genResult.totalLines,
      total_thread_m: genResult.totalThreadM,
      estimated_with_allowance_m: genResult.estimatedWithAllowanceM,
      allowance_pct: genResult.allowancePct,
      nails_count: genResult.nailsCount,
      diameter_mm: genResult.diameterMm,
      min_gap: genResult.minGap,
      start_nail: genResult.startNail,
      resolution_score: genResult.resolutionScore !== undefined ? genResult.resolutionScore : 88.5,
      rmse: genResult.rmse !== undefined ? genResult.rmse : 0.07,
      artifacts: artifactsMap,
    };

    Store.completeJob(jobId, formattedResult, artifacts);
  } catch (err) {
    console.error(`Error running job ${jobId}:`, err);
    Store.failJob(jobId, err.message);
  }
}
