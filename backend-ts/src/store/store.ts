import fs from "node:fs";
import path from "node:path";
import { UPLOADS_DIR, JOBS_DIR } from "../config.js";
import type { UploadRecord, JobRecord, JobConfig, JobResult } from "../types.js";

// In-memory records
const uploadsMap = new Map<string, UploadRecord>();
const jobsMap = new Map<string, JobRecord>();
const cancelSet = new Set<string>();

export class Store {
  // Session checks
  static verifyUploadAccess(uploadId: string, sessionId: string): boolean {
    const upload = uploadsMap.get(uploadId);
    if (!upload) return false;
    // Permissive for demo / dev environments if session matches or session is empty
    return !upload.session_id || upload.session_id === sessionId;
  }

  static verifyJobAccess(jobId: string, sessionId: string): boolean {
    const job = jobsMap.get(jobId);
    if (!job) return false;
    return !job.session_id || job.session_id === sessionId;
  }

  // Uploads
  static saveUpload(record: UploadRecord): void {
    uploadsMap.set(record.upload_id, record);
  }

  static getUpload(uploadId: string): UploadRecord | undefined {
    return uploadsMap.get(uploadId);
  }

  // Jobs
  static createJob(jobId: string, sessionId: string, uploadId: string, config: JobConfig): JobRecord {
    const jobDir = path.join(JOBS_DIR, jobId);
    fs.mkdirSync(jobDir, { recursive: true });

    const record: JobRecord = {
      job_id: jobId,
      session_id: sessionId,
      upload_id: uploadId,
      config,
      status: "queued",
      progress_step: 0,
      total_steps: config.steps,
      current_nail: config.start_nail,
      stopping_reason: "",
      error_message: "",
      created_at: Date.now(),
      updated_at: Date.now(),
    };

    jobsMap.set(jobId, record);
    return record;
  }

  static getJob(jobId: string): JobRecord | undefined {
    return jobsMap.get(jobId);
  }

  static updateJobProgress(jobId: string, step: number, totalSteps: number, currentNail: number): void {
    const job = jobsMap.get(jobId);
    if (job) {
      job.status = "processing";
      job.progress_step = step;
      job.total_steps = totalSteps;
      job.current_nail = currentNail;
      job.updated_at = Date.now();
    }
  }

  static completeJob(jobId: string, result: JobResult, stoppingReason: string): void {
    const job = jobsMap.get(jobId);
    if (job) {
      job.status = "completed";
      job.result = result;
      job.stopping_reason = stoppingReason;
      job.updated_at = Date.now();
    }
  }

  static failJob(jobId: string, errorMessage: string): void {
    const job = jobsMap.get(jobId);
    if (job) {
      job.status = "failed";
      job.error_message = errorMessage;
      job.updated_at = Date.now();
    }
  }

  static requestJobCancellation(jobId: string): void {
    cancelSet.add(jobId);
    const job = jobsMap.get(jobId);
    if (job && job.status === "processing") {
      job.status = "cancelling";
      job.updated_at = Date.now();
    }
  }

  static isJobCancelled(jobId: string): boolean {
    return cancelSet.has(jobId);
  }

  static setJobCancelled(jobId: string): void {
    const job = jobsMap.get(jobId);
    if (job) {
      job.status = "cancelled";
      job.stopping_reason = "cancelled_by_user";
      job.updated_at = Date.now();
    }
  }

  static getJobDir(jobId: string): string {
    const dir = path.join(JOBS_DIR, jobId);
    fs.mkdirSync(dir, { recursive: true });
    return dir;
  }
}
