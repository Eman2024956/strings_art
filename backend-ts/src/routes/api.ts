import { Router, Request, Response } from "express";
import multer from "multer";
import { v4 as uuidv4 } from "uuid";
import path from "node:path";
import fs from "node:fs";
import sharp from "sharp";

import {
  UPLOADS_DIR,
  MAX_UPLOAD_BYTES,
  MAX_PIXELS,
  ALLOWED_IMAGE_TYPES,
  DEFAULT_NAILS,
  DEFAULT_STEPS,
  DEFAULT_DIAMETER_MM,
  DEFAULT_STRENGTH,
  DEFAULT_MIN_GAP,
  DEFAULT_SIZE,
  DEFAULT_ALLOWANCE_PCT,
  ALLOWED_ARTIFACTS,
} from "../config.js";
import { Store } from "../store/store.js";
import { dispatchJob } from "../services/jobRunner.js";
import type { JobConfig } from "../types.js";

export const apiRouter = Router();

// Session helper
function getSessionId(req: Request, res: Response): string {
  let sessionId = req.cookies?.session_id;
  if (!sessionId) {
    sessionId = uuidv4();
    res.cookie("session_id", sessionId, {
      maxAge: 30 * 24 * 60 * 60 * 1000,
      httpOnly: true,
      sameSite: "lax",
    });
  }
  return sessionId;
}

// Multer memory storage for security inspection
const upload = multer({
  limits: { fileSize: MAX_UPLOAD_BYTES },
  storage: multer.memoryStorage(),
});

// Health check
apiRouter.get("/health", (_req: Request, res: Response) => {
  res.json({ status: "ok", timestamp: Date.now() / 1000, engine: "typescript-node" });
});

// Upload image
apiRouter.post("/api/uploads", upload.single("file"), async (req: Request, res: Response) => {
  try {
    const sessionId = getSessionId(req, res);
    const file = req.file;

    if (!file) {
      res.status(400).json({ detail: "No image file provided." });
      return;
    }

    const filename = (file.originalname || "").toLowerCase();
    const ext = path.extname(filename).toLowerCase();
    const mimeType = (file.mimetype || "").toLowerCase();

    // 1. Extension & SVG check
    if (mimeType.includes("svg") || ext === ".svg") {
      res.status(400).json({ detail: "SVG uploads are prohibited for security reasons." });
      return;
    }

    const isValidFormat =
      ALLOWED_IMAGE_TYPES.includes(mimeType) ||
      [".jpg", ".jpeg", ".png", ".webp"].includes(ext);

    if (!isValidFormat) {
      res.status(400).json({
        detail: `Unsupported format '${mimeType || ext}'. Please upload JPG, PNG, or WebP images.`,
      });
      return;
    }

    // 2. Decode & verify dimensions (prevent zip bombs / giant buffers)
    let width = 0;
    let height = 0;
    try {
      const meta = await sharp(file.buffer).metadata();
      width = meta.width || 0;
      height = meta.height || 0;
      if (width * height > MAX_PIXELS) {
        res.status(400).json({
          detail: `Image resolution ${width}x${height} exceeds maximum security limit.`,
        });
        return;
      }
    } catch (e: unknown) {
      res.status(400).json({ detail: `Invalid or corrupted image: ${(e as Error).message}` });
      return;
    }

    // 3. Save to disk
    const uploadId = uuidv4();
    const safeExt = [".jpg", ".jpeg", ".png", ".webp"].includes(ext)
      ? ext
      : mimeType === "image/png"
      ? ".png"
      : ".jpg";
    const safePath = path.join(UPLOADS_DIR, `${uploadId}${safeExt}`);

    fs.writeFileSync(safePath, file.buffer);

    Store.saveUpload({
      upload_id: uploadId,
      session_id: sessionId,
      original_filename: file.originalname || `upload${safeExt}`,
      file_path: safePath,
      file_size: file.buffer.length,
      width,
      height,
      created_at: Date.now(),
    });

    res.json({
      upload_id: uploadId,
      filename: file.originalname,
      width,
      height,
      size_bytes: file.buffer.length,
    });
  } catch (err: unknown) {
    res.status(500).json({ detail: (err as Error).message });
  }
});

// Upload preview
apiRouter.get("/api/uploads/:upload_id/preview", (req: Request, res: Response) => {
  const uploadId = req.params.upload_id;
  const sessionId = getSessionId(req, res);

  if (!Store.verifyUploadAccess(uploadId, sessionId)) {
    res.status(403).json({ detail: "Unauthorized access to this upload." });
    return;
  }

  const record = Store.getUpload(uploadId);
  if (!record || !fs.existsSync(record.file_path)) {
    res.status(404).json({ detail: "Upload file not found." });
    return;
  }

  const ext = path.extname(record.file_path).toLowerCase();
  const contentType = ext === ".png" ? "image/png" : ext === ".webp" ? "image/webp" : "image/jpeg";

  res.setHeader("Content-Type", contentType);
  fs.createReadStream(record.file_path).pipe(res);
});

// Create Job
apiRouter.post("/api/jobs", (req: Request, res: Response) => {
  const sessionId = getSessionId(req, res);
  const body = req.body;

  if (!body.upload_id) {
    res.status(400).json({ detail: "Field 'upload_id' is required." });
    return;
  }

  if (!Store.verifyUploadAccess(body.upload_id, sessionId)) {
    res.status(403).json({ detail: "Unauthorized access to specified upload." });
    return;
  }

  const nails = Number(body.nails ?? DEFAULT_NAILS);
  const steps = Number(body.steps ?? DEFAULT_STEPS);
  const size = Number(body.size ?? DEFAULT_SIZE);
  const diameter_mm = Number(body.diameter_mm ?? DEFAULT_DIAMETER_MM);
  const strength = Number(body.strength ?? DEFAULT_STRENGTH);
  const min_gap = Number(body.min_gap ?? DEFAULT_MIN_GAP);
  const start_nail = Number(body.start_nail ?? 1);
  const allowance_pct = Number(body.allowance_pct ?? DEFAULT_ALLOWANCE_PCT);

  if (![200, 300, 400].includes(size)) {
    res.status(400).json({ detail: "Processing resolution must be 200, 300, or 400 pixels." });
    return;
  }

  if (min_gap > Math.floor(nails / 2)) {
    res.status(400).json({
      detail: `min_gap cannot exceed half the nails (${Math.floor(nails / 2)}).`,
    });
    return;
  }

  if (start_nail > nails) {
    res.status(400).json({
      detail: `start_nail (${start_nail}) cannot exceed nails count (${nails}).`,
    });
    return;
  }

  const config: JobConfig = {
    upload_id: body.upload_id,
    nails,
    steps,
    size,
    diameter_mm,
    strength,
    min_gap,
    start_nail,
    allowance_pct,
    crop_box: body.crop_box ?? null,
    rotation: Number(body.rotation ?? 0),
    brightness: Number(body.brightness ?? 1.0),
    contrast: Number(body.contrast ?? 1.0),
  };

  const jobId = uuidv4();
  Store.createJob(jobId, sessionId, body.upload_id, config);

  // Dispatch background execution
  dispatchJob(jobId);

  res.json({
    job_id: jobId,
    status: "queued",
    config,
  });
});

// Import sequence text directly
apiRouter.post("/api/jobs/import", (req: Request, res: Response) => {
  try {
    const sessionId = getSessionId(req, res);
    const body = req.body;
    const { sequence, nails_count, diameter_mm, allowance_pct } = body;

    if (!sequence || !Array.isArray(sequence) || sequence.length < 2) {
      res.status(400).json({ detail: "A valid sequence with at least 2 nail numbers is required." });
      return;
    }

    const maxNail = Math.max(...sequence);
    const nailsCount = nails_count || (maxNail <= 200 ? 200 : Math.max(maxNail, Math.ceil(maxNail / 10) * 10));
    const diameterMm = diameter_mm || 400.0;
    const allowancePct = allowance_pct !== undefined ? allowance_pct : 15.0;
    const size = 300;

    const rMeters = diameterMm / 2000.0;
    let totalThreadM = 0;
    for (let i = 1; i < sequence.length; i++) {
      const diff = Math.abs(sequence[i - 1] - sequence[i]);
      const chord = 2.0 * rMeters * Math.sin((diff * Math.PI) / nailsCount);
      totalThreadM += chord;
    }
    totalThreadM = parseFloat(totalThreadM.toFixed(1));
    const estimatedWithAllowanceM = parseFloat((totalThreadM * (1 + allowancePct / 100)).toFixed(1));

    const resCenter = (size - 1) / 2.0;
    const resRadius = resCenter - 2.0;
    const nailsPx: [number, number][] = [];
    const angleStep = (2.0 * Math.PI) / nailsCount;
    for (let i = 0; i < nailsCount; i++) {
      const a = -Math.PI / 2.0 + i * angleStep;
      nailsPx.push([
        parseFloat((resCenter + resRadius * Math.cos(a)).toFixed(2)),
        parseFloat((resCenter + resRadius * Math.sin(a)).toFixed(2)),
      ]);
    }

    const jobId = uuidv4();
    const formattedResult: any = {
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
      artifacts: {
        sequence_csv: `/api/jobs/${jobId}/downloads/sequence.csv`,
        sequence_txt: `/api/jobs/${jobId}/downloads/sequence.txt`,
      },
    };

    Store.createJob(jobId, sessionId, "imported", {
      upload_id: "imported",
      nails: nailsCount,
      steps: sequence.length - 1,
      size,
      diameter_mm: diameterMm,
      strength: 0.1,
      min_gap: 0,
      start_nail: sequence[0],
      allowance_pct: allowancePct,
      crop_box: null,
      rotation: 0,
      brightness: 1,
      contrast: 1,
    });
    Store.completeJob(jobId, formattedResult, "uploaded_sequence");

    res.json({
      job_id: jobId,
      status: "completed",
      result: formattedResult,
    });
  } catch (err: unknown) {
    res.status(500).json({ detail: (err as Error).message });
  }
});

// Job Status
apiRouter.get("/api/jobs/:job_id", (req: Request, res: Response) => {
  const jobId = req.params.job_id;
  const sessionId = getSessionId(req, res);

  if (!Store.verifyJobAccess(jobId, sessionId)) {
    res.status(403).json({ detail: "Unauthorized access to job." });
    return;
  }

  const job = Store.getJob(jobId);
  if (!job) {
    res.status(404).json({ detail: "Job not found." });
    return;
  }

  res.json({
    job_id: job.job_id,
    status: job.status,
    progress_step: job.progress_step,
    total_steps: job.total_steps,
    current_nail: job.current_nail,
    stopping_reason: job.stopping_reason,
    error_message: job.error_message,
    created_at: job.created_at,
    updated_at: job.updated_at,
  });
});

// Cancel Job
apiRouter.post("/api/jobs/:job_id/cancel", (req: Request, res: Response) => {
  const jobId = req.params.job_id;
  const sessionId = getSessionId(req, res);

  if (!Store.verifyJobAccess(jobId, sessionId)) {
    res.status(403).json({ detail: "Unauthorized access to job." });
    return;
  }

  const job = Store.getJob(jobId);
  if (!job) {
    res.status(404).json({ detail: "Job not found." });
    return;
  }

  if (["completed", "failed", "cancelled"].includes(job.status)) {
    res.json({
      job_id: jobId,
      status: job.status,
      message: `Job is already in ${job.status} state.`,
    });
    return;
  }

  Store.requestJobCancellation(jobId);
  res.json({
    job_id: jobId,
    status: "cancelling",
    message: "Cancellation requested.",
  });
});

// Job Result
apiRouter.get("/api/jobs/:job_id/result", (req: Request, res: Response) => {
  const jobId = req.params.job_id;
  const sessionId = getSessionId(req, res);

  if (!Store.verifyJobAccess(jobId, sessionId)) {
    res.status(403).json({ detail: "Unauthorized access to job." });
    return;
  }

  const job = Store.getJob(jobId);
  if (!job) {
    res.status(404).json({ detail: "Job not found." });
    return;
  }

  if (job.status !== "completed" || !job.result) {
    res.status(400).json({
      detail: `Job is not completed yet (current status: ${job.status}).`,
    });
    return;
  }

  res.json(job.result);
});

// Download Artifact
apiRouter.get("/api/jobs/:job_id/downloads/:artifact", (req: Request, res: Response) => {
  const jobId = req.params.job_id;
  const artifact = req.params.artifact;
  const sessionId = getSessionId(req, res);

  if (!Store.verifyJobAccess(jobId, sessionId)) {
    res.status(403).json({ detail: "Unauthorized access to job." });
    return;
  }

  if (!ALLOWED_ARTIFACTS[artifact]) {
    res.status(404).json({ detail: `Artifact '${artifact}' is not allowed or does not exist.` });
    return;
  }

  const jobDir = Store.getJobDir(jobId);
  const filePath = path.join(jobDir, artifact);

  if (!fs.existsSync(filePath)) {
    res.status(404).json({ detail: `Artifact file '${artifact}' not found on server.` });
    return;
  }

  const contentType = ALLOWED_ARTIFACTS[artifact];
  let downloadFilename = artifact;
  if (artifact === "sequence.txt" || artifact.endsWith(".txt")) {
    const now = new Date();
    const dateStamp = now.toISOString().slice(0, 10);
    const timeStamp = now.toTimeString().slice(0, 8).replace(/:/g, "-");
    downloadFilename = `husam_art_${dateStamp}_${timeStamp}.txt`;
  }
  res.setHeader("Content-Type", contentType);
  res.setHeader("Content-Disposition", `attachment; filename="${downloadFilename}"`);
  fs.createReadStream(filePath).pipe(res);
});

// Clear Cache & Records
apiRouter.post("/api/clear", (req: Request, res: Response) => {
  try {
    const { job_id, upload_id, all } = req.body || {};
    if (job_id) Store.clearJob(job_id);
    if (upload_id) Store.clearUpload(upload_id);
    if (all) Store.clearAll();
    res.json({ ok: true, message: "Cleared successfully" });
  } catch (err: unknown) {
    res.status(500).json({ ok: false, detail: (err as Error).message });
  }
});
