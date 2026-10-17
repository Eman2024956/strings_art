export interface UploadRecord {
  upload_id: string;
  session_id: string;
  original_filename: string;
  file_path: string;
  file_size: number;
  width: number;
  height: number;
  created_at: number;
}

export interface JobConfig {
  upload_id: string;
  nails: number;
  steps: number;
  size: number;
  diameter_mm: number;
  strength: number;
  min_gap: number;
  start_nail: number;
  allowance_pct: number;
  crop_box?: [number, number, number, number] | null;
  rotation?: number;
  brightness?: number;
  contrast?: number;
}

export type JobStatus = "queued" | "processing" | "completed" | "failed" | "cancelling" | "cancelled";

export interface JobResult {
  job_id: string;
  status: JobStatus;
  stopping_reason?: string;
  total_lines: number;
  total_thread_m: number;
  estimated_with_allowance_m: number;
  allowance_pct: number;
  nails_count: number;
  diameter_mm: number;
  strength: number;
  min_gap: number;
  start_nail: number;
  sequence: number[];
  nails_px: Array<[number, number]>;
  artifacts: Record<string, string>;
}

export interface JobRecord {
  job_id: string;
  session_id: string;
  upload_id: string;
  config: JobConfig;
  status: JobStatus;
  progress_step: number;
  total_steps: number;
  current_nail: number;
  stopping_reason: string;
  error_message: string;
  result?: JobResult;
  created_at: number;
  updated_at: number;
}

export interface GeneratorOutput {
  sequence: number[];
  nailsPx: Array<[number, number]>;
  canvasBytes: Uint8Array;
  stoppingReason: string;
}
