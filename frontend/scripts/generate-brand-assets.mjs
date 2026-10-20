import sharp from "sharp";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const inputImagePath = path.join(__dirname, "../public/string-art-sample.png");
const appDir = path.join(__dirname, "../app");
const publicDir = path.join(__dirname, "../public");

async function generateBrandAssets() {
  console.log("🎨 Starting brand assets generation...");

  const inputBuffer = fs.readFileSync(inputImagePath);

  // 1. Prepare circular crop of the string art image
  // The input image is 800x800. Let's create a circular mask
  const circleMask = Buffer.from(
    `<svg width="800" height="800">
      <circle cx="400" cy="400" r="396" fill="#ffffff" />
    </svg>`
  );

  const circularArtBuffer = await sharp(inputBuffer)
    .composite([
      {
        input: circleMask,
        blend: "dest-in",
      },
    ])
    .png()
    .toBuffer();

  // 2. Favicons & App Icons
  // A. icon.png (512x512 with dark circle backdrop and subtle border)
  const iconSvgFrame = Buffer.from(
    `<svg width="512" height="512" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <radialGradient id="bgGlow" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stop-color="#1e1b4b"/>
          <stop offset="100%" stop-color="#090d16"/>
        </radialGradient>
        <linearGradient id="ringGrad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stop-color="#6366f1"/>
          <stop offset="50%" stop-color="#a855f7"/>
          <stop offset="100%" stop-color="#3b82f6"/>
        </linearGradient>
      </defs>
      <rect width="512" height="512" rx="110" fill="url(#bgGlow)"/>
      <circle cx="256" cy="256" r="236" fill="#ffffff" stroke="url(#ringGrad)" stroke-width="8"/>
    </svg>`
  );

  const resizedArtForIcon = await sharp(circularArtBuffer)
    .resize(450, 450, { fit: "contain" })
    .toBuffer();

  const appIconBuffer = await sharp(iconSvgFrame)
    .composite([
      {
        input: resizedArtForIcon,
        top: 31,
        left: 31,
      },
    ])
    .png()
    .toBuffer();

  // Save icon.png (Next.js App Router default app icon)
  fs.writeFileSync(path.join(appDir, "icon.png"), appIconBuffer);
  fs.writeFileSync(path.join(publicDir, "icon.png"), appIconBuffer);
  console.log("✓ Created app/icon.png (512x512)");

  // B. apple-icon.png (180x180)
  const appleIcon = await sharp(appIconBuffer).resize(180, 180).png().toBuffer();
  fs.writeFileSync(path.join(appDir, "apple-icon.png"), appleIcon);
  fs.writeFileSync(path.join(publicDir, "apple-icon.png"), appleIcon);
  console.log("✓ Created app/apple-icon.png (180x180)");

  // C. favicon.ico (converted to 32x32 / 48x48 png-based ico)
  const favicon32 = await sharp(appIconBuffer).resize(48, 48).png().toBuffer();
  fs.writeFileSync(path.join(appDir, "favicon.ico"), favicon32);
  fs.writeFileSync(path.join(publicDir, "favicon.ico"), favicon32);
  console.log("✓ Created app/favicon.ico");

  // 3. Open Graph Image (1200 x 630)
  // Let's create a high-definition luxury preview image
  const artForOg = await sharp(circularArtBuffer)
    .resize(520, 520, { fit: "contain" })
    .toBuffer();

  // Background SVG with rich typography, gradients, badges, and layout
  const ogSvgBackground = Buffer.from(
    `<svg width="1200" height="630" viewBox="0 0 1200 630" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <radialGradient id="ambient1" cx="80%" cy="50%" r="60%">
          <stop offset="0%" stop-color="#4f46e5" stop-opacity="0.35"/>
          <stop offset="60%" stop-color="#1e1b4b" stop-opacity="0.1"/>
          <stop offset="100%" stop-color="#030712" stop-opacity="0"/>
        </radialGradient>
        <radialGradient id="ambient2" cx="20%" cy="20%" r="50%">
          <stop offset="0%" stop-color="#9333ea" stop-opacity="0.25"/>
          <stop offset="100%" stop-color="#030712" stop-opacity="0"/>
        </radialGradient>
        <linearGradient id="bgGrad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stop-color="#0a0e17"/>
          <stop offset="50%" stop-color="#0d111d"/>
          <stop offset="100%" stop-color="#050811"/>
        </linearGradient>
        <linearGradient id="titleGrad" x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%" stop-color="#ffffff"/>
          <stop offset="60%" stop-color="#e0e7ff"/>
          <stop offset="100%" stop-color="#a5b4fc"/>
        </linearGradient>
        <linearGradient id="artRing" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stop-color="#6366f1"/>
          <stop offset="50%" stop-color="#ec4899"/>
          <stop offset="100%" stop-color="#8b5cf6"/>
        </linearGradient>
        <filter id="shadowGlow" x="-20%" y="-20%" width="140%" height="140%">
          <feDropShadow dx="0" dy="8" stdDeviation="24" flood-color="#6366f1" flood-opacity="0.35"/>
        </filter>
        <filter id="cardShadow" x="-10%" y="-10%" width="120%" height="120%">
          <feDropShadow dx="0" dy="4" stdDeviation="12" flood-color="#000000" flood-opacity="0.5"/>
        </filter>
      </defs>

      <!-- Background -->
      <rect width="1200" height="630" fill="url(#bgGrad)"/>
      <rect width="1200" height="630" fill="url(#ambient1)"/>
      <rect width="1200" height="630" fill="url(#ambient2)"/>

      <!-- Subtle Grid Pattern -->
      <g stroke="#ffffff" stroke-opacity="0.03" stroke-width="1">
        <line x1="80" y1="0" x2="80" y2="630"/>
        <line x1="200" y1="0" x2="200" y2="630"/>
        <line x1="400" y1="0" x2="400" y2="630"/>
        <line x1="600" y1="0" x2="600" y2="630"/>
        <line x1="0" y1="120" x2="1200" y2="120"/>
        <line x1="0" y1="280" x2="1200" y2="280"/>
        <line x1="0" y1="480" x2="1200" y2="480"/>
      </g>

      <!-- Right Side: Artwork Pedestal / Halo Ring -->
      <circle cx="900" cy="315" r="275" fill="#ffffff" filter="url(#shadowGlow)"/>
      <circle cx="900" cy="315" r="275" fill="none" stroke="url(#artRing)" stroke-width="6"/>

      <!-- Left Side Branding Content -->
      <g transform="translate(80, 80)">
        
        <!-- Category Badge -->
        <g>
          <rect width="260" height="38" rx="19" fill="#1e1b4b" stroke="#4f46e5" stroke-width="1.5" stroke-opacity="0.6"/>
          <circle cx="22" cy="19" r="5" fill="#22c55e"/>
          <text x="36" y="24" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-size="14" font-weight="600" fill="#c7d2fe">
            خيط واحد مستمر • 100% Client/Cloud
          </text>
        </g>

        <!-- Main Title (Arabic & English) -->
        <text x="0" y="105" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Cairo', sans-serif" font-size="44" font-weight="800" fill="url(#titleGrad)">
          استوديو فن الخيوط والمسامير
        </text>
        <text x="0" y="152" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-size="28" font-weight="700" fill="#818cf8" letter-spacing="1">
          String Art Computational Studio
        </text>

        <!-- Subtitle -->
        <text x="0" y="205" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-size="18" fill="#94a3b8" line-height="28">
          حوّل أي صورة رقمية إلى لوحة خيوط واقعية متكاملة بخوارزمية Bresenham
        </text>
        <text x="0" y="235" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-size="18" fill="#94a3b8">
          مع مخططات طباعة حقيقية بمقياس 1:1 وقوالب مقسمة ومشغل خطوات تفاعلي.
        </text>

        <!-- Feature Pills Grid -->
        <g transform="translate(0, 275)">
          <!-- Pill 1 -->
          <g transform="translate(0, 0)">
            <rect width="180" height="42" rx="10" fill="#111827" stroke="#374151" stroke-width="1"/>
            <text x="18" y="26" font-family="-apple-system, sans-serif" font-size="14" font-weight="600" fill="#e2e8f0">
              🧵 خوارزمية جشعة
            </text>
          </g>
          <!-- Pill 2 -->
          <g transform="translate(195, 0)">
            <rect width="195" height="42" rx="10" fill="#111827" stroke="#374151" stroke-width="1"/>
            <text x="18" y="26" font-family="-apple-system, sans-serif" font-size="14" font-weight="600" fill="#e2e8f0">
              📄 قوالب PDF 1:1 و A4
            </text>
          </g>
          <!-- Pill 3 -->
          <g transform="translate(0, 52)">
            <rect width="180" height="42" rx="10" fill="#111827" stroke="#374151" stroke-width="1"/>
            <text x="18" y="26" font-family="-apple-system, sans-serif" font-size="14" font-weight="600" fill="#e2e8f0">
              📐 تصدير SVG فيكتور
            </text>
          </g>
          <!-- Pill 4 -->
          <g transform="translate(195, 52)">
            <rect width="195" height="42" rx="10" fill="#111827" stroke="#374151" stroke-width="1"/>
            <text x="18" y="26" font-family="-apple-system, sans-serif" font-size="14" font-weight="600" fill="#e2e8f0">
              📦 حزمة ZIP كاملة
            </text>
          </g>
        </g>

        <!-- Host URL Badge Bottom -->
        <g transform="translate(0, 410)">
          <rect width="320" height="44" rx="22" fill="#030712" stroke="#6366f1" stroke-width="1.5"/>
          <!-- Globe / Link Icon -->
          <circle cx="25" cy="22" r="9" fill="none" stroke="#818cf8" stroke-width="2"/>
          <line x1="16" y1="22" x2="34" y2="22" stroke="#818cf8" stroke-width="2"/>
          <text x="44" y="28" font-family="-apple-system, sans-serif" font-size="16" font-weight="700" fill="#ffffff" letter-spacing="0.5">
            strings-art-studio.vercel.app
          </text>
        </g>
      </g>
    </svg>`
  );

  // Composite background with the circular string art image on the right (cx=900, cy=315, r=260)
  // top = 315 - 260 = 55, left = 900 - 260 = 640
  const ogImageBuffer = await sharp(ogSvgBackground)
    .composite([
      {
        input: artForOg,
        top: 55,
        left: 640,
      },
    ])
    .png({ quality: 95, compressionLevel: 8 })
    .toBuffer();

  fs.writeFileSync(path.join(appDir, "opengraph-image.png"), ogImageBuffer);
  fs.writeFileSync(path.join(publicDir, "og-image.png"), ogImageBuffer);
  console.log("✓ Created app/opengraph-image.png & public/og-image.png (1200x630)");

  console.log("🎉 All brand assets generated successfully!");
}

generateBrandAssets().catch((err) => {
  console.error("Error generating brand assets:", err);
  process.exit(1);
});
