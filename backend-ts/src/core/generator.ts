import { calculateNailPositions, precomputeLineLookup, getLineFromLookup } from "./line.js";
import type { GeneratorOutput } from "../types.js";

export interface GeneratorOptions {
  targetPixels: Uint8Array; // Grayscale 0..255 (0 = dark, 255 = white)
  size: number;
  nails: number;
  steps: number;
  strength: number; // Line opacity weight (0.02 to 0.3)
  minGap: number;
  startNail: number; // 1-indexed
  importance?: Float32Array; // Soft facial importance map
  onProgress?: (step: number, totalSteps: number, currentNail: number) => void;
  isCancelled?: () => boolean;
}

export function runStringArtGenerator(options: GeneratorOptions): GeneratorOutput {
  const {
    targetPixels,
    size,
    nails,
    steps,
    strength,
    minGap,
    startNail,
    importance,
    onProgress,
    isCancelled,
  } = options;

  const totalPixels = size * size;

  // Error/Darkness to draw:
  // We want to recreate dark lines, so target darkness = 255 - targetPixels[i]
  // Invert image so dark areas have HIGH positive values (up to 255)
  const darknessTarget = new Float32Array(totalPixels);
  for (let i = 0; i < totalPixels; i++) {
    darknessTarget[i] = 255.0 - targetPixels[i];
  }

  // Current canvas darkness (starts at 0 = pure white background)
  const currentDarkness = new Float32Array(totalPixels);

  // Working error map (starts with required darkness target)
  const errorMap = new Float32Array(darknessTarget);

  // Precompute pin positions & line lookup
  const nailsPx = calculateNailPositions(nails, size);
  const lineLookup = precomputeLineLookup(nails, size, nailsPx);

  // Sequence of pins (1-indexed)
  let currentPin = (startNail - 1 + nails) % nails;
  const sequence: number[] = [currentPin + 1];
  let previous = -1;

  // Track chord usage frequency to prevent repeated parallel bands
  const chordUsage = new Uint8Array(nails * nails);

  // Weight added per line stroke in darkness (0..255 scale)
  const lineWeight = Math.max(1.0, Math.min(255.0, strength * 255.0));

  let stoppingReason = "completed";

  // Cache recent pins to avoid retracing
  const recentPins: number[] = [];
  const MAX_RECENT = Math.max(15, Math.floor(nails * 0.08));

  for (let step = 0; step < steps; step++) {
    if (isCancelled && isCancelled()) {
      stoppingReason = "cancelled";
      break;
    }

    let bestPin = -1;
    let maxScore = -1e9;
    let bestLine: Int32Array | null = null;

    for (let candidate = 0; candidate < nails; candidate++) {
      if (candidate === currentPin || candidate === previous || recentPins.includes(candidate)) continue;

      // Check min gap condition
      const dist = Math.min(
        Math.abs(candidate - currentPin),
        nails - Math.abs(candidate - currentPin)
      );
      if (dist < minGap) continue;

      const line = getLineFromLookup(lineLookup, nails, currentPin, candidate);
      if (!line || line.length === 0) continue;

      // Importance-weighted residual scoring (prioritizes eyes, nose, mouth)
      let sumScore = 0;
      const len = line.length;
      for (let k = 0; k < len; k++) {
        const idx = line[k];
        const res = darknessTarget[idx] - currentDarkness[idx];
        const imp = importance ? importance[idx] : 1.0;
        if (res > 0) {
          sumScore += res * imp;
        } else {
          // Strong penalty for crossing bright areas to prevent ghost lines
          sumScore += res * 0.85 * imp;
        }
      }

      let avgScore = sumScore / Math.pow(len, 0.75);

      // Chord connection frequency penalty (prevents repeated parallel line bands)
      const chordKey = currentPin < candidate ? currentPin * nails + candidate : candidate * nails + currentPin;
      const usage = chordUsage[chordKey];
      if (usage > 0) {
        avgScore *= Math.pow(0.50, usage);
      }

      if (avgScore > maxScore) {
        maxScore = avgScore;
        bestPin = candidate;
        bestLine = line;
      }
    }

    // Stop if no candidate line found, or if error is fully satisfied
    if (bestPin === -1 || !bestLine || (maxScore < -0.10 * 255.0 && step >= Math.min(2000, Math.floor(steps * 0.85)))) {
      stoppingReason = bestPin === -1 ? "no_valid_line" : "converged";
      break;
    }

    // Apply the line to canvas & error map
    for (let k = 0; k < bestLine.length; k++) {
      const idx = bestLine[k];
      errorMap[idx] = Math.max(0.0, errorMap[idx] - lineWeight);
      currentDarkness[idx] = Math.min(255.0, currentDarkness[idx] + lineWeight);
    }

    // Record chord usage
    const usedKey = currentPin < bestPin ? currentPin * nails + bestPin : bestPin * nails + currentPin;
    chordUsage[usedKey]++;

    previous = currentPin;
    currentPin = bestPin;
    sequence.push(currentPin + 1);

    recentPins.push(previous);
    if (recentPins.length > MAX_RECENT) {
      recentPins.shift();
    }


    if (onProgress && (step % 50 === 0 || step === steps - 1)) {
      onProgress(step + 1, steps, currentPin + 1);
    }
  }

  // Convert currentDarkness to grayscale pixel buffer (0 = black, 255 = white)
  const canvasBytes = new Uint8Array(totalPixels);
  for (let i = 0; i < totalPixels; i++) {
    const val = 255 - Math.min(255, Math.max(0, currentDarkness[i]));
    canvasBytes[i] = Math.round(val);
  }

  return {
    sequence,
    nailsPx,
    canvasBytes,
    stoppingReason,
  };
}
