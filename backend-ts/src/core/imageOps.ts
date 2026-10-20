import sharp from "sharp";

export interface ImageProcessOptions {
  size: number;
  cropBox?: [number, number, number, number] | null;
  rotation?: number;
  brightness?: number;
  contrast?: number;
}

/**
 * Creates an SVG circular mask buffer for sharp
 */
function createCircleMask(size: number): Buffer {
  const r = (size - 1) / 2;
  const cx = size / 2;
  const cy = size / 2;
  const svg = `<svg width="${size}" height="${size}"><circle cx="${cx}" cy="${cy}" r="${r}" fill="white"/></svg>`;
  return Buffer.from(svg);
}

export async function processInputImage(
  inputPath: string,
  options: ImageProcessOptions
): Promise<{ rawGrayscale: Uint8Array; targetPngBuffer: Buffer; importance: Float32Array }> {
  const { size, cropBox, rotation = 0, brightness = 1.0, contrast = 1.0 } = options;

  let pipeline = sharp(inputPath);
  const metadata = await pipeline.metadata();
  const imgW = metadata.width || size;
  const imgH = metadata.height || size;

  // 1. Rotation
  if (rotation !== 0) {
    pipeline = pipeline.rotate(rotation, { background: { r: 255, g: 255, b: 255, alpha: 1 } });
  }

  // 2. Crop
  if (cropBox && cropBox.length === 4) {
    let [left, top, width, height] = cropBox;
    // Handle normalized coordinates (0..1)
    if (left <= 1.0 && top <= 1.0 && width <= 1.0 && height <= 1.0) {
      left = Math.round(left * imgW);
      top = Math.round(top * imgH);
      width = Math.round(width * imgW);
      height = Math.round(height * imgH);
    }
    // Clamp
    left = Math.max(0, Math.min(imgW - 1, Math.round(left)));
    top = Math.max(0, Math.min(imgH - 1, Math.round(top)));
    width = Math.max(1, Math.min(imgW - left, Math.round(width)));
    height = Math.max(1, Math.min(imgH - top, Math.round(height)));

    pipeline = pipeline.extract({ left, top, width, height });
  }

  // 3. Resize to square size x size and sharpen high-frequency features
  pipeline = pipeline.resize(size, size, { fit: "cover" }).sharpen({ sigma: 1.2 });

  // 4. Circular mask (make outside pure white)
  const circleMask = createCircleMask(size);
  pipeline = pipeline.composite([
    {
      input: circleMask,
      blend: "dest-in",
    },
  ]);

  // Flatten over white background
  pipeline = pipeline.flatten({ background: { r: 255, g: 255, b: 255 } });

  // 5. Brightness / Contrast adjustments & Grayscale
  pipeline = pipeline.grayscale();

  if (contrast !== 1.0 || brightness !== 1.0) {
    pipeline = pipeline.linear(contrast, -(128 * contrast) + 128 + (brightness - 1.0) * 128);
  }

  // 6. Output target PNG
  const targetPngBuffer = await pipeline.clone().png().toBuffer();

  // 7. Output raw 8-bit 1-channel pixel buffer
  const rawData = await pipeline.raw().toBuffer();
  const rawGrayscale = new Uint8Array(rawData.buffer, rawData.byteOffset, rawData.length);
  const totalPixels = size * size;

  // Auto-stretch contrast (Normalize) within circular mask so dark areas hit pure black rgb(0,0,0)
  const center = (size - 1) / 2.0;
  const radius = center - 2.0;
  const radiusSq = radius * radius;
  let minVal = 255;
  let maxVal = 0;

  for (let y = 0; y < size; y++) {
    const dy = y - center;
    const dySq = dy * dy;
    const rowOffset = y * size;
    for (let x = 0; x < size; x++) {
      const dx = x - center;
      if (dx * dx + dySq <= radiusSq) {
        const val = rawGrayscale[rowOffset + x];
        if (val < minVal) minVal = val;
        if (val > maxVal) maxVal = val;
      }
    }
  }

  const range = maxVal - minVal;
  if (range > 0 && (minVal > 0 || maxVal < 255)) {
    for (let y = 0; y < size; y++) {
      const dy = y - center;
      const dySq = dy * dy;
      const rowOffset = y * size;
      for (let x = 0; x < size; x++) {
        const idx = rowOffset + x;
        const dx = x - center;
        if (dx * dx + dySq <= radiusSq) {
          const normalized = Math.round(((rawGrayscale[idx] - minVal) / range) * 255);
          rawGrayscale[idx] = Math.max(0, Math.min(255, normalized));
        } else {
          rawGrayscale[idx] = 255;
        }
      }
    }
  }

  // 3. Compute Soft Facial Importance Map (eyes, nose, mouth)
  const importance = new Float32Array(totalPixels);
  const faceCoreY = 0.48 * size;
  const faceCoreX = center;
  const rxSq = Math.pow(0.35 * size, 2);
  const rySq = Math.pow(0.40 * size, 2);

  for (let y = 0; y < size; y++) {
    const dy = y - faceCoreY;
    const dySq = dy * dy;
    const rowOffset = y * size;
    for (let x = 0; x < size; x++) {
      const idx = rowOffset + x;
      const dx = x - faceCoreX;
      if (dx * dx + (y - center) * (y - center) > radiusSq) {
        importance[idx] = 0.5;
        continue;
      }
      const normDistSq = (dx * dx) / rxSq + dySq / rySq;
      const faceWeight = Math.exp(-normDistSq * 1.5);
      const darkness = (255.0 - rawGrayscale[idx]) / 255.0;
      const featureBoost = darkness * 1.4;
      importance[idx] = 1.0 + faceWeight * (0.4 + featureBoost);
    }
  }

  // Generate target PNG from normalized pixels
  const normalizedPngBuffer = await rawGrayscaleToPng(rawGrayscale, size);

  return { rawGrayscale, targetPngBuffer: normalizedPngBuffer, importance };
}

export async function rawGrayscaleToPng(
  rawPixels: Uint8Array,
  size: number
): Promise<Buffer> {
  return sharp(Buffer.from(rawPixels.buffer, rawPixels.byteOffset, rawPixels.length), {
    raw: {
      width: size,
      height: size,
      channels: 1,
    },
  })
    .png()
    .toBuffer();
}
