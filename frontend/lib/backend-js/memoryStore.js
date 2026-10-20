import fs from "node:fs";
import path from "node:path";
import os from "node:os";

// Persistent directory in serverless /tmp
const BASE_TMP = path.join(os.tmpdir(), "string_art_store");
const UPLOADS_DIR = path.join(BASE_TMP, "uploads");
const JOBS_DIR = path.join(BASE_TMP, "jobs");

try {
  fs.mkdirSync(UPLOADS_DIR, { recursive: true });
  fs.mkdirSync(JOBS_DIR, { recursive: true });
} catch {
  // Ignore if already exists
}

// Global singleton in memory for warm lambdas
if (!globalThis.__stringArtStore) {
  globalThis.__stringArtStore = {
    uploads: new Map(),
    jobs: new Map(),
  };
}

export const Store = {
  saveUpload(uploadId, data) {
    globalThis.__stringArtStore.uploads.set(uploadId, data);
    try {
      const uploadPath = path.join(UPLOADS_DIR, `${uploadId}.json`);
      const meta = {
        uploadId: data.uploadId,
        filename: data.filename,
        width: data.width,
        height: data.height,
        format: data.format,
        mimeType: data.mimeType,
        base64: data.buffer ? data.buffer.toString("base64") : null,
      };
      fs.writeFileSync(uploadPath, JSON.stringify(meta), "utf-8");
    } catch (e) {
      console.warn("Could not write upload to /tmp:", e);
    }
  },

  getUpload(uploadId) {
    let upload = globalThis.__stringArtStore.uploads.get(uploadId);
    if (upload) return upload;

    try {
      const uploadPath = path.join(UPLOADS_DIR, `${uploadId}.json`);
      if (fs.existsSync(uploadPath)) {
        const parsed = JSON.parse(fs.readFileSync(uploadPath, "utf-8"));
        upload = {
          ...parsed,
          buffer: parsed.base64 ? Buffer.from(parsed.base64, "base64") : null,
        };
        globalThis.__stringArtStore.uploads.set(uploadId, upload);
        return upload;
      }
    } catch (e) {
      console.warn("Could not read upload from /tmp:", e);
    }
    return null;
  },

  createJob(jobId, jobData) {
    const job = {
      jobId,
      status: "queued",
      progressStep: 0,
      totalSteps: jobData.config.steps || 3000,
      currentNail: 1,
      createdAt: Date.now(),
      updatedAt: Date.now(),
      ...jobData,
    };
    globalThis.__stringArtStore.jobs.set(jobId, job);
    this._persistJob(jobId, job);
  },

  getJob(jobId) {
    let job = globalThis.__stringArtStore.jobs.get(jobId);
    if (job) return job;

    try {
      const jobPath = path.join(JOBS_DIR, `${jobId}.json`);
      if (fs.existsSync(jobPath)) {
        job = JSON.parse(fs.readFileSync(jobPath, "utf-8"));
        globalThis.__stringArtStore.jobs.set(jobId, job);
        return job;
      }
    } catch (e) {
      console.warn("Could not read job from /tmp:", e);
    }
    return null;
  },

  updateJobProgress(jobId, step, total, currNail) {
    const job = this.getJob(jobId);
    if (job && (job.status === "queued" || job.status === "running")) {
      job.status = "running";
      job.progressStep = step;
      job.totalSteps = total;
      job.currentNail = currNail;
      job.updatedAt = Date.now();
      globalThis.__stringArtStore.jobs.set(jobId, job);
    }
  },

  requestCancel(jobId) {
    const job = this.getJob(jobId);
    if (job && (job.status === "queued" || job.status === "running")) {
      job.status = "cancelling";
      job.updatedAt = Date.now();
      globalThis.__stringArtStore.jobs.set(jobId, job);
      this._persistJob(jobId, job);
      return true;
    }
    return false;
  },

  completeJob(jobId, result, artifacts) {
    const job = this.getJob(jobId);
    if (job && job.status !== "cancelled") {
      job.status = job.status === "cancelling" ? "cancelled" : "completed";
      job.stoppingReason = result.stoppingReason;
      job.result = result;
      job.artifacts = artifacts;
      job.progressStep = result.totalLines;
      job.updatedAt = Date.now();
      globalThis.__stringArtStore.jobs.set(jobId, job);
      this._persistJob(jobId, job);
    }
  },

  failJob(jobId, errorMsg) {
    const job = this.getJob(jobId);
    if (job && job.status !== "cancelled") {
      job.status = "failed";
      job.errorMessage = errorMsg;
      job.updatedAt = Date.now();
      globalThis.__stringArtStore.jobs.set(jobId, job);
      this._persistJob(jobId, job);
    }
  },

  _persistJob(jobId, job) {
    try {
      const jobPath = path.join(JOBS_DIR, `${jobId}.json`);
      // Strip large buffers from the JSON summary
      const copy = { ...job };
      if (copy.artifacts) {
        const artMeta = {};
        for (const [key, val] of Object.entries(copy.artifacts)) {
          artMeta[key] = {
            mime: val.mime,
            base64: val.buffer ? Buffer.from(val.buffer).toString("base64") : null,
          };
        }
        copy.artifacts = artMeta;
      }
      fs.writeFileSync(jobPath, JSON.stringify(copy), "utf-8");
    } catch (e) {
      console.warn("Could not persist job to /tmp:", e);
    }
  },

  clearJob(jobId) {
    if (globalThis.__stringArtStore && jobId) {
      globalThis.__stringArtStore.jobs.delete(jobId);
    }
    try {
      if (jobId) {
        const jobPath = path.join(JOBS_DIR, `${jobId}.json`);
        if (fs.existsSync(jobPath)) fs.unlinkSync(jobPath);
      }
    } catch (e) {
      console.warn("Could not delete job file:", e);
    }
  },

  clearUpload(uploadId) {
    if (globalThis.__stringArtStore && uploadId) {
      globalThis.__stringArtStore.uploads.delete(uploadId);
    }
    try {
      if (uploadId) {
        const uploadPath = path.join(UPLOADS_DIR, `${uploadId}.json`);
        if (fs.existsSync(uploadPath)) fs.unlinkSync(uploadPath);
      }
    } catch (e) {
      console.warn("Could not delete upload file:", e);
    }
  },

  clearAll() {
    if (globalThis.__stringArtStore) {
      globalThis.__stringArtStore.uploads.clear();
      globalThis.__stringArtStore.jobs.clear();
    }
    try {
      if (fs.existsSync(UPLOADS_DIR)) {
        for (const f of fs.readdirSync(UPLOADS_DIR)) {
          try { fs.unlinkSync(path.join(UPLOADS_DIR, f)); } catch {}
        }
      }
      if (fs.existsSync(JOBS_DIR)) {
        for (const f of fs.readdirSync(JOBS_DIR)) {
          try { fs.unlinkSync(path.join(JOBS_DIR, f)); } catch {}
        }
      }
    } catch (e) {
      console.warn("Could not clear cache files:", e);
    }
  },
};
