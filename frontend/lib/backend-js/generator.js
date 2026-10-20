import sharp from "sharp";
import { bresenhamLine } from "./line.js";

export function getNailPositions(nailsCount, center, radius) {
  const nails = [];
  const angleStep = (2.0 * Math.PI) / nailsCount;

  for (let i = 0; i < nailsCount; i++) {
    // Nail 1 at top (-pi/2), clockwise
    const a = -Math.PI / 2.0 + i * angleStep;
    const x = Math.round(center + radius * Math.cos(a));
    const y = Math.round(center + radius * Math.sin(a));
    nails.push([x, y]);
  }

  return nails;
}

export class JSStringArtGenerator {
  constructor({
    target,
    mask,
    importance = null,
    size = 300,
    nailsCount = 200,
    steps = 3000,
    strength = 0.12,
    minGap = 10,
    startNail = 1,
    diameterMm = 400.0,
    allowancePct = 15.0,
  }) {
    this.target = target;
    this.mask = mask;
    this.importance = importance;
    this.size = size;
    this.nailsCount = nailsCount;
    this.steps = steps;
    this.strength = strength;
    this.minGap = minGap;
    this.startNail = Math.max(1, Math.min(nailsCount, startNail));
    this.diameterMm = diameterMm;
    this.allowancePct = allowancePct;

    this.center = (this.size - 1) / 2.0;
    this.radius = this.center - 2.0;
    this.nails = getNailPositions(this.nailsCount, this.center, this.radius);

    // High performance flat array cache without string allocations
    this.lineCache = new Array(this.nailsCount * this.nailsCount);
  }

  getLinePixels(i, j) {
    const key = i < j ? i * this.nailsCount + j : j * this.nailsCount + i;
    const cached = this.lineCache[key];
    if (cached !== undefined) return cached;

    const { xs, ys } = bresenhamLine(this.nails[i], this.nails[j]);
    const len = xs.length;

    // Exclude endpoints so nails do not falsely over-saturate
    if (len <= 2) {
      const empty = new Int32Array(0);
      this.lineCache[key] = empty;
      return empty;
    }

    const indices = [];
    for (let k = 1; k < len - 1; k++) {
      const idx = ys[k] * this.size + xs[k];
      if (this.mask[idx] === 1) {
        indices.push(idx);
      }
    }

    const res = new Int32Array(indices);
    this.lineCache[key] = res;
    return res;
  }

  async run({ onProgress, isCancelled } = {}) {
    const pixelCount = this.size * this.size;
    const canvas = new Float32Array(pixelCount);
    const chordUsage = new Uint8Array(this.nailsCount * this.nailsCount);

    let current = this.startNail - 1;
    const sequence = [current];
    let previous = -1;
    let lengthPx = 0.0;
    let stoppingReason = "max_steps_reached";

    // O(1) Recent nail mask to avoid parallel search scans
    const recentMask = new Uint8Array(this.nailsCount);
    const recentQueue = [];
    const MAX_RECENT = Math.max(15, Math.floor(this.nailsCount * 0.08));

    for (let step = 0; step < this.steps; step++) {
      if (isCancelled && isCancelled()) {
        stoppingReason = "cancelled";
        break;
      }

      let bestScore = -1e9;
      let bestChoice = -1;
      let bestIndices = null;

      for (let j = 0; j < this.nailsCount; j++) {
        if (j === current || j === previous) continue;
        if (recentMask[j] === 1) continue;

        const diff = Math.abs(j - current);
        const gap = Math.min(diff, this.nailsCount - diff);
        if (gap < this.minGap) continue;

        const indices = this.getLinePixels(current, j);
        const lineLen = indices.length;
        if (lineLen === 0) continue;

        // Importance-weighted residual scoring (prioritizes eyes, nose, mouth)
        let score = 0.0;
        for (let k = 0; k < lineLen; k++) {
          const idx = indices[k];
          const res = this.target[idx] - canvas[idx];
          const imp = this.importance ? this.importance[idx] : 1.0;
          if (res > 0) {
            score += res * imp;
          } else {
            // Proportional penalty for crossing bright areas
            score += res * 0.12 * imp;
          }
        }

        let avgScore = score / lineLen;

        // Chord connection frequency penalty (prevents repeated parallel line bands)
        const chordKey = current < j ? current * this.nailsCount + j : j * this.nailsCount + current;
        const usage = chordUsage[chordKey];
        if (usage > 0) {
          avgScore *= Math.pow(0.50, usage);
        }

        if (avgScore > bestScore) {
          bestScore = avgScore;
          bestChoice = j;
          bestIndices = indices;
        }
      }

      // Stop only if no valid line or if target is completely satisfied
      if (bestChoice === -1 || (bestScore < -0.10 && step >= Math.min(2000, Math.floor(this.steps * 0.85)))) {
        stoppingReason = bestChoice === -1 ? "no_valid_line" : "converged";
        break;
      }

      // Commit best line
      for (let k = 0; k < bestIndices.length; k++) {
        const idx = bestIndices[k];
        canvas[idx] = Math.min(1.0, canvas[idx] + this.strength);
      }

      // Record chord usage
      const usedKey = current < bestChoice ? current * this.nailsCount + bestChoice : bestChoice * this.nailsCount + current;
      chordUsage[usedKey]++;

      const p1 = this.nails[current];
      const p2 = this.nails[bestChoice];
      lengthPx += Math.hypot(p2[0] - p1[0], p2[1] - p1[1]);

      previous = current;
      current = bestChoice;
      sequence.push(current);

      if (previous >= 0) {
        recentQueue.push(previous);
        recentMask[previous] = 1;
        if (recentQueue.length > MAX_RECENT) {
          const removed = recentQueue.shift();
          recentMask[removed] = 0;
        }
      }

      if (onProgress && ((step + 1) % 100 === 0 || step + 1 === this.steps)) {
        onProgress(step + 1, this.steps, current + 1);
        await new Promise((r) => setImmediate(r));
      }
    }

    // Physical calculations
    const scaleMmPerPx = this.diameterMm / (2.0 * this.radius);
    const totalThreadM = (lengthPx * scaleMmPerPx) / 1000.0;
    const estimatedWithAllowanceM = totalThreadM * (1.0 + this.allowancePct / 100.0);

    // 1-based sequence
    const sequence1Based = sequence.map((idx) => idx + 1);

    // Render preview PNG buffer from canvas
    const previewRaw = new Uint8Array(pixelCount);
    for (let i = 0; i < pixelCount; i++) {
      previewRaw[i] = Math.round(Math.max(0, Math.min(1, 1.0 - canvas[i])) * 255);
    }

    const previewPngBuffer = await sharp(previewRaw, {
      raw: { width: this.size, height: this.size, channels: 1 },
    })
      .png()
      .toBuffer();

    // Calculate Resolution Fidelity Score (Comparing canvas coverage with target)
    let sumSqDiff = 0.0;
    let maskPixels = 0;
    for (let i = 0; i < pixelCount; i++) {
      if (this.mask[i] === 1) {
        const diff = canvas[i] - this.target[i];
        sumSqDiff += diff * diff;
        maskPixels++;
      }
    }
    const rmse = maskPixels > 0 ? Math.sqrt(sumSqDiff / maskPixels) : 0;
    const resolutionScore = Number(Math.max(0, Math.min(100, (1.0 - rmse * 1.6) * 100)).toFixed(1));

    return {
      sequence: sequence1Based,
      totalLines: sequence1Based.length - 1,
      totalThreadM: Number(totalThreadM.toFixed(2)),
      estimatedWithAllowanceM: Number(estimatedWithAllowanceM.toFixed(2)),
      allowancePct: this.allowancePct,
      stoppingReason,
      nailsCount: this.nailsCount,
      diameterMm: this.diameterMm,
      strength: this.strength,
      minGap: this.minGap,
      startNail: this.startNail,
      size: this.size,
      nailsPx: this.nails,
      resolutionScore,
      rmse: Number(rmse.toFixed(4)),
      previewPngBuffer,
    };
  }
}
