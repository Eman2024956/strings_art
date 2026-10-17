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
): Promise<{ rawGrayscale: Uint8Array; targetPngBuffer: Buffer }> {
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

  // 3. Resize to square size x size
  pipeline = pipeline.resize(size, size, { fit: "cover" });

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

  return { rawGrayscale, targetPngBuffer };
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
