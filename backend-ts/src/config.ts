import path from "node:path";
import fs from "node:fs";

export const PORT = Number(process.env.PORT || 8000);
export const HOST = process.env.HOST || "0.0.0.0";
export const CORS_ORIGINS = process.env.CORS_ORIGINS 
  ? process.env.CORS_ORIGINS.split(",").map(o => o.trim()) 
  : ["http://localhost:3000", "http://127.0.0.1:3000"];

export const MAX_UPLOAD_BYTES = 25 * 1024 * 1024; // 25 MB
export const MAX_PIXELS = 100_000_000; // 100 Megapixels
export const ALLOWED_IMAGE_TYPES = ["image/jpeg", "image/png", "image/webp", "image/pjpeg", "image/x-png"];

export const DEFAULT_NAILS = 200;
export const DEFAULT_STEPS = 2500;
export const DEFAULT_DIAMETER_MM = 400.0;
export const DEFAULT_STRENGTH = 0.12;
export const DEFAULT_MIN_GAP = 10;
export const DEFAULT_SIZE = 300;
export const DEFAULT_ALLOWANCE_PCT = 15.0;

export const DATA_DIR = path.resolve(process.env.DATA_DIR || path.join(process.cwd(), "data"));
export const UPLOADS_DIR = path.join(DATA_DIR, "uploads");
export const JOBS_DIR = path.join(DATA_DIR, "jobs");

// Ensure directories exist
fs.mkdirSync(UPLOADS_DIR, { recursive: true });
fs.mkdirSync(JOBS_DIR, { recursive: true });

export const ALLOWED_ARTIFACTS: Record<string, string> = {
  "preview.png": "image/png",
  "target.png": "image/png",
  "nails_template.svg": "image/svg+xml",
  "nails_template_actual_size.pdf": "application/pdf",
  "nails_template_tiled_a4.pdf": "application/pdf",
  "sequence.csv": "text/csv",
  "instructions.json": "application/json",
  "string_art_bundle.zip": "application/zip",
};
