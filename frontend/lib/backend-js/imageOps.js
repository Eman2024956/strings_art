import sharp from "sharp";

export async function processImageBuffer(
  inputBuffer,
  {
    size = 300,
    cropBox = null,
    rotation = 0,
    brightness = 1.0,
    contrast = 1.0,
    zoom = 1.0,
    panX = 0,
    panY = 0,
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

  // Apply zoom and pan crop matching the ImageEditor circular viewport (288px)
  const metadata = await pipeline.metadata();
  const imgW = metadata.width || size;
  const imgH = metadata.height || size;

  const editorSize = 288.0;
  const effectiveZoom = Math.max(0.4, Math.min(6.0, zoom || 1.0));
  const baseScale = Math.max(editorSize / imgW, editorSize / imgH);
  const cropDim = Math.round(editorSize / (baseScale * effectiveZoom));
  const cropSize = Math.max(10, Math.min(Math.min(imgW, imgH), cropDim));

  const offsetX = (panX || 0) / (baseScale * effectiveZoom);
  const offsetY = (panY || 0) / (baseScale * effectiveZoom);

  let left = Math.round(imgW / 2.0 - cropSize / 2.0 - offsetX);
  let top = Math.round(imgH / 2.0 - cropSize / 2.0 - offsetY);

  left = Math.max(0, Math.min(imgW - cropSize, left));
  top = Math.max(0, Math.min(imgH - cropSize, top));

  pipeline = pipeline.extract({
    left,
    top,
    width: cropSize,
    height: cropSize,
  });

  // Tonal adjustments: brightness & contrast via linear transform
  // y = a * x + b
  if (brightness !== 1.0 || contrast !== 1.0) {
    const a = contrast;
    const b = (brightness - 1.0) * 128 + 128 * (1.0 - contrast);
    pipeline = pipeline.linear(a, b);
  }

  // Convert to grayscale and fit into square (size, size) using lanczos3, with unsharp sharpening for facial detail
  pipeline = pipeline
    .grayscale()
    .resize(size, size, {
      fit: "cover",
      position: "center",
      kernel: "lanczos3",
    })
    .sharpen({ sigma: 1.2 });

  const { data, info } = await pipeline.raw().toBuffer({ resolveWithObject: true });
  const pixelCount = size * size;

  const target = new Float32Array(pixelCount);
  const mask = new Uint8Array(pixelCount);

  const center = (size - 1) / 2.0;
  const radius = center - 2.0;
  const radiusSq = radius * radius;

  // 1. Identify circular mask & find min/max values inside the circle
  let minVal = 255;
  let maxVal = 0;

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
        const v = data[idx];
        if (v < minVal) minVal = v;
        if (v > maxVal) maxVal = v;
      } else {
        mask[idx] = 0;
      }
    }
  }

  // 2. Auto-stretch contrast (Normalize):
  // Darkest features (hair, eyes, beard) map down to pure black rgb(0,0,0) -> target = 1.0
  // Brightest background/highlights map to pure white rgb(255,255,255) -> target = 0.0
  const range = maxVal - minVal;

  for (let i = 0; i < pixelCount; i++) {
    if (mask[i] === 1) {
      const normalized = range > 0 ? (data[i] - minVal) / range : data[i] / 255.0;
      // Invert grayscale: 0.0 (pure black) -> 1.0; 1.0 (pure white) -> 0.0
      target[i] = Math.max(0.0, Math.min(1.0, 1.0 - normalized));
    } else {
      target[i] = 0.0;
    }
  }

  // 3. Compute Soft Facial Importance Map (خريطة أهمية ناعمة للعينين والأنف والفم)
  const importance = new Float32Array(pixelCount);
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
      if (mask[idx] === 0) {
        importance[idx] = 0.5;
        continue;
      }
      const dx = x - faceCoreX;
      const normDistSq = (dx * dx) / rxSq + dySq / rySq;
      const faceWeight = Math.exp(-normDistSq * 1.5);
      const featureBoost = target[idx] * 1.4;
      importance[idx] = 1.0 + faceWeight * (0.4 + featureBoost);
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
    importance,
    size,
    targetPngBuffer,
  };
}
