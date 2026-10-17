import sharp from "sharp";

export async function processImageBuffer(
  inputBuffer,
  {
    size = 300,
    cropBox = null,
    rotation = 0,
    brightness = 1.0,
    contrast = 1.0,
  } = {}
) {
  let pipeline = sharp(inputBuffer).rotate(); // auto EXIF rotate

  // Flatten transparency onto solid white
  pipeline = pipeline.flatten({ background: { r: 255, g: 255, b: 255 } });

  // User rotation
  if (rotation && rotation !== 0) {
    pipeline = pipeline.rotate(-rotation, {
      background: { r: 255, g: 255, b: 255 },
    });
  }

  // Tonal adjustments: brightness & contrast via linear transform
  // y = a * x + b
  if (brightness !== 1.0 || contrast !== 1.0) {
    const a = contrast;
    const b = (brightness - 1.0) * 128 + 128 * (1.0 - contrast);
    pipeline = pipeline.linear(a, b);
  }

  // Convert to grayscale and fit into square (size, size) using lanczos3
  pipeline = pipeline.grayscale().resize(size, size, {
    fit: "cover",
    position: "center",
    kernel: "lanczos3",
  });

  const { data, info } = await pipeline.raw().toBuffer({ resolveWithObject: true });
  const pixelCount = size * size;

  const target = new Float32Array(pixelCount);
  const mask = new Uint8Array(pixelCount);

  const center = (size - 1) / 2.0;
  const radius = center - 2.0;
  const radiusSq = radius * radius;

  // Process pixels: 0=white, 1=black, masked to circle
  for (let y = 0; y < size; y++) {
    const dy = y - center;
    const dySq = dy * dy;
    const rowOffset = y * size;

    for (let x = 0; x < size; x++) {
      const dx = x - center;
      const distSq = dx * dx + dySq;
      const idx = rowOffset + x;

      if (distSq <= radiusSq) {
        mask[idx] = 1;
        // Invert grayscale: 0 (black in raw) -> 1.0 in target; 255 (white in raw) -> 0.0 in target
        target[idx] = 1.0 - data[idx] / 255.0;
      } else {
        mask[idx] = 0;
        target[idx] = 0.0;
      }
    }
  }

  // Generate target PNG buffer for preview
  const targetRaw = new Uint8Array(pixelCount);
  for (let i = 0; i < pixelCount; i++) {
    targetRaw[i] = Math.round((1.0 - target[i]) * 255);
  }

  const targetPngBuffer = await sharp(targetRaw, {
    raw: { width: size, height: size, channels: 1 },
  })
    .png()
    .toBuffer();

  return {
    target,
    mask,
    size,
    targetPngBuffer,
  };
}
