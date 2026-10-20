export function generateSvgTemplate(nailsCount, diameterMm, marginMm = 20.0) {
  const pageSize = diameterMm + 2 * marginMm;
  const c = pageSize / 2.0;
  const r = diameterMm / 2.0;

  const angleStep = (2.0 * Math.PI) / nailsCount;
  const fontSize = nailsCount <= 200 ? 2.4 : nailsCount <= 300 ? 1.8 : 1.4;

  const svg = [
    `<?xml version="1.0" encoding="UTF-8"?>`,
    `<svg xmlns="http://www.w3.org/2000/svg" width="${pageSize.toFixed(1)}mm" height="${pageSize.toFixed(1)}mm" viewBox="0 0 ${pageSize.toFixed(2)} ${pageSize.toFixed(2)}">`,
    `  <rect width="100%" height="100%" fill="white"/>`,
    `  <!-- Title & Calibration Note -->`,
    `  <text x="${marginMm}" y="${(marginMm * 0.7).toFixed(1)}" font-family="Arial, sans-serif" font-size="4" font-weight="bold" fill="#333">String Art Template | Diameter: ${diameterMm.toFixed(0)} mm | Nails: ${nailsCount}</text>`,
    `  <text x="${marginMm}" y="${(marginMm * 0.7 + 5).toFixed(1)}" font-family="Arial, sans-serif" font-size="2.5" fill="#666">IMPORTANT: Print at 100% / Actual Size | Nail 1 at Top (12 o'clock)</text>`,
    `  <!-- Center mark -->`,
    `  <line x1="${c - 5}" y1="${c}" x2="${c + 5}" y2="${c}" stroke="#999" stroke-width="0.3"/>`,
    `  <line x1="${c}" y1="${c - 5}" x2="${c}" y2="${c + 5}" stroke="#999" stroke-width="0.3"/>`,
    `  <!-- Outer circle perimeter -->`,
    `  <circle cx="${c.toFixed(2)}" cy="${c.toFixed(2)}" r="${r.toFixed(2)}" fill="none" stroke="#666" stroke-width="0.3" stroke-dasharray="1,1"/>`,
  ];

  for (let i = 0; i < nailsCount; i++) {
    const a = -Math.PI / 2.0 + i * angleStep;
    const nx = c + r * Math.cos(a);
    const ny = c + r * Math.sin(a);
    const tx = c + (r + 5.5) * Math.cos(a);
    const ty = c + (r + 5.5) * Math.sin(a);

    svg.push(`  <circle cx="${nx.toFixed(3)}" cy="${ny.toFixed(3)}" r="0.5" fill="#000"/>`);
    svg.push(
      `  <text x="${tx.toFixed(3)}" y="${ty.toFixed(3)}" font-family="Arial, sans-serif" font-size="${fontSize}" text-anchor="middle" dominant-baseline="central" fill="#111">${i + 1}</text>`
    );
  }

  svg.push(`</svg>`);
  return svg.join("\n");
}

export async function renderStringArtPreviewPng({ sequence, nailsCount, size = 1200, strength = 0.10 }) {
  const sharp = (await import("sharp")).default;
  const c = size / 2.0;
  const r = c - 45.0;
  const nails = [];
  const angleStep = (2.0 * Math.PI) / nailsCount;
  for (let i = 0; i < nailsCount; i++) {
    const a = -Math.PI / 2.0 + i * angleStep;
    nails.push([
      (c + r * Math.cos(a)).toFixed(1),
      (c + r * Math.sin(a)).toFixed(1),
    ]);
  }

  const strokeAlpha = 0.22;

  let svg = `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 ${size} ${size}">
  <rect width="100%" height="100%" fill="#ffffff" />
  <circle cx="${c}" cy="${c}" r="${r}" fill="#ffffff" stroke="#cbd5e1" stroke-width="1.5" />
  <g stroke="rgba(15,15,15,${strokeAlpha.toFixed(3)})" stroke-width="0.75" stroke-linecap="round">
`;

  if (sequence && sequence.length > 1) {
    for (let i = 1; i < sequence.length; i++) {
      const p1 = nails[sequence[i - 1] - 1];
      const p2 = nails[sequence[i] - 1];
      if (p1 && p2) {
        svg += `<line x1="${p1[0]}" y1="${p1[1]}" x2="${p2[0]}" y2="${p2[1]}"/>\n`;
      }
    }
  }

  svg += `  </g>\n`;
  svg += `  <g fill="#09090b">\n`;
  for (let i = 0; i < nailsCount; i++) {
    svg += `<circle cx="${nails[i][0]}" cy="${nails[i][1]}" r="2" />\n`;
  }
  svg += `  </g>\n</svg>`;

  return await sharp(Buffer.from(svg)).png().toBuffer();
}
