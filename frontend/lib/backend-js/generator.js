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

    this.lineCache = new Map();
  }

  getLinePixels(i, j) {
    const key = i < j ? `${i}_${j}` : `${j}_${i}`;
    let cached = this.lineCache.get(key);
    if (cached) return cached;

    const { xs, ys } = bresenhamLine(this.nails[i], this.nails[j]);
    const len = xs.length;

    // Exclude endpoints so nails do not falsely over-saturate
    if (len <= 2) {
      cached = new Int32Array(0);
      this.lineCache.set(key, cached);
      return cached;
    }

    const indices = [];
    for (let k = 1; k < len - 1; k++) {
      const idx = ys[k] * this.size + xs[k];
      if (this.mask[idx] === 1) {
        indices.push(idx);
      }
    }

    cached = new Int32Array(indices);
    this.lineCache.set(key, cached);
    return cached;
  }

  async run({ onProgress, isCancelled } = {}) {
    const pixelCount = this.size * this.size;
    const canvas = new Float32Array(pixelCount);

    let current = this.startNail - 1;
    const sequence = [current];
    let previous = -1;
    let lengthPx = 0.0;
    let stoppingReason = "max_steps_reached";

    for (let step = 0; step < this.steps; step++) {
      if (isCancelled && isCancelled()) {
        stoppingReason = "cancelled";
        break;
      }

      let bestGain = 0.0;
      let bestChoice = -1;
      let bestIndices = null;

      for (let j = 0; j < this.nailsCount; j++) {
        if (j === current || j === previous) continue;

        const diff = Math.abs(j - current);
        const gap = Math.min(diff, this.nailsCount - diff);
        if (gap < this.minGap) continue;

        const indices = this.getLinePixels(current, j);
        const lineLen = indices.length;
        if (lineLen === 0) continue;

        let gain = 0.0;
        for (let k = 0; k < lineLen; k++) {
          const idx = indices[k];
          const oldVal = canvas[idx];
          const delta = Math.min(this.strength, 1.0 - oldVal);
          const residual = this.target[idx] - oldVal;
          gain += 2.0 * residual * delta - delta * delta;
        }

        if (gain > bestGain) {
          bestGain = gain;
          bestChoice = j;
          bestIndices = indices;
        }
      }

      if (bestChoice === -1 || bestGain <= 0.0) {
        stoppingReason = "no_improvement";
        break;
      }

      // Commit best line
      for (let k = 0; k < bestIndices.length; k++) {
        const idx = bestIndices[k];
        const oldVal = canvas[idx];
        const delta = Math.min(this.strength, 1.0 - oldVal);
        canvas[idx] = oldVal + delta;
      }

      const p1 = this.nails[current];
      const p2 = this.nails[bestChoice];
      lengthPx += Math.hypot(p2[0] - p1[0], p2[1] - p1[1]);

      previous = current;
      current = bestChoice;
      sequence.push(current);

      if (onProgress && ((step + 1) % 50 === 0 || step + 1 === this.steps)) {
        onProgress(step + 1, this.steps, current + 1);
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
      previewPngBuffer,
    };
  }
}
