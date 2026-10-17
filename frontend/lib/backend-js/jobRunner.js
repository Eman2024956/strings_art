import { Store } from "./memoryStore.js";
import { processImageBuffer } from "./imageOps.js";
import { JSStringArtGenerator } from "./generator.js";
import { generateSvgTemplate } from "./svgExport.js";
import { generateActualSizePdf, generateTiledA4Pdf } from "./pdfExport.js";
import { exportSequenceCsv, exportInstructionsJson, buildZipBundle } from "./dataExport.js";

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
  const steps = config.steps || 3000;
  const strength = config.strength !== undefined ? config.strength : 0.12;
  const minGap = config.min_gap || 10;
  const startNail = config.start_nail || 1;
  const diameterMm = config.diameter_mm || 400.0;
  const allowancePct = config.allowance_pct !== undefined ? config.allowance_pct : 15.0;

  try {
    // 1. Process image
    const { target, mask, targetPngBuffer } = await processImageBuffer(upload.buffer, {
      size,
      rotation: config.rotation || 0,
      brightness: config.brightness !== undefined ? config.brightness : 1.0,
      contrast: config.contrast !== undefined ? config.contrast : 1.0,
    });

    // 2. Setup Generator
    const generator = new JSStringArtGenerator({
      target,
      mask,
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

    const previewPngBuffer = genResult.previewPngBuffer;
    delete genResult.previewPngBuffer; // Don't keep raw buffer in result object

    // 4. Generate all export files
    const svgString = generateSvgTemplate(nailsCount, diameterMm);
    const actualPdfBuffer = await generateActualSizePdf(nailsCount, diameterMm);
    const tiledPdfBuffer = await generateTiledA4Pdf(nailsCount, diameterMm);
    const csvString = exportSequenceCsv(genResult.sequence);
    const jsonString = exportInstructionsJson(genResult, config);

    const zipBuffer = await buildZipBundle({
      "preview.png": previewPngBuffer,
      "target.png": targetPngBuffer,
      "nails_template.svg": svgString,
      "nails_template_actual_size.pdf": actualPdfBuffer,
      "nails_template_tiled_a4.pdf": tiledPdfBuffer,
      "sequence.csv": csvString,
      "instructions.json": jsonString,
    });

    const artifacts = {
      "preview.png": { buffer: previewPngBuffer, mime: "image/png" },
      "target.png": { buffer: targetPngBuffer, mime: "image/png" },
      "nails_template.svg": { buffer: Buffer.from(svgString, "utf-8"), mime: "image/svg+xml" },
      "nails_template_actual_size.pdf": { buffer: actualPdfBuffer, mime: "application/pdf" },
      "nails_template_tiled_a4.pdf": { buffer: tiledPdfBuffer, mime: "application/pdf" },
      "sequence.csv": { buffer: Buffer.from(csvString, "utf-8"), mime: "text/csv" },
      "instructions.json": { buffer: Buffer.from(jsonString, "utf-8"), mime: "application/json" },
      "string_art_bundle.zip": { buffer: zipBuffer, mime: "application/zip" },
    };

    Store.completeJob(jobId, genResult, artifacts);
  } catch (err) {
    console.error(`Error running job ${jobId}:`, err);
    Store.failJob(jobId, err.message);
  }
}
