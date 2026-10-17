// Global singleton store for uploads and jobs across Next.js requests
if (!globalThis.__stringArtStore) {
  globalThis.__stringArtStore = {
    uploads: new Map(),
    jobs: new Map(),
  };
}

export const Store = {
  saveUpload(uploadId, data) {
    globalThis.__stringArtStore.uploads.set(uploadId, data);
  },
  getUpload(uploadId) {
    return globalThis.__stringArtStore.uploads.get(uploadId) || null;
  },
  createJob(jobId, jobData) {
    globalThis.__stringArtStore.jobs.set(jobId, {
      jobId,
      status: "queued",
      progressStep: 0,
      totalSteps: jobData.config.steps || 3000,
      currentNail: 1,
      createdAt: Date.now(),
      updatedAt: Date.now(),
      ...jobData,
    });
  },
  getJob(jobId) {
    return globalThis.__stringArtStore.jobs.get(jobId) || null;
  },
  updateJobProgress(jobId, step, total, currNail) {
    const job = globalThis.__stringArtStore.jobs.get(jobId);
    if (job && (job.status === "queued" || job.status === "running")) {
      job.status = "running";
      job.progressStep = step;
      job.totalSteps = total;
      job.currentNail = currNail;
      job.updatedAt = Date.now();
    }
  },
  requestCancel(jobId) {
    const job = globalThis.__stringArtStore.jobs.get(jobId);
    if (job && (job.status === "queued" || job.status === "running")) {
      job.status = "cancelling";
      job.updatedAt = Date.now();
      return true;
    }
    return false;
  },
  completeJob(jobId, result, artifacts) {
    const job = globalThis.__stringArtStore.jobs.get(jobId);
    if (job && job.status !== "cancelled") {
      job.status = job.status === "cancelling" ? "cancelled" : "completed";
      job.stoppingReason = result.stoppingReason;
      job.result = result;
      job.artifacts = artifacts;
      job.progressStep = result.totalLines;
      job.updatedAt = Date.now();
    }
  },
  failJob(jobId, errorMsg) {
    const job = globalThis.__stringArtStore.jobs.get(jobId);
    if (job && job.status !== "cancelled") {
      job.status = "failed";
      job.errorMessage = errorMsg;
      job.updatedAt = Date.now();
    }
  },
};
