/**
 * Generates an SVG vector graphic of the string art board and thread paths.
 */
export function generateSvgExport(
  sequence: number[],
  nailsCount: number,
  diameterMm: number,
  options?: {
    lineColor?: string;
    lineOpacity?: number;
    lineWidthMm?: number;
    showPins?: boolean;
    showPinNumbers?: boolean;
  }
): string {
  const {
    lineColor = "#111111",
    lineOpacity = 0.25,
    lineWidthMm = 0.2,
    showPins = true,
    showPinNumbers = true,
  } = options || {};

  const marginMm = 20;
  const totalSizeMm = diameterMm + marginMm * 2;
  const centerMm = totalSizeMm / 2;
  const radiusMm = diameterMm / 2;

  // Calculate pin coordinates in mm
  const pinCoords: Array<[number, number]> = [];
  for (let i = 0; i < nailsCount; i++) {
    const angle = (2.0 * Math.PI * i) / nailsCount - Math.PI / 2.0;
    const x = centerMm + radiusMm * Math.cos(angle);
    const y = centerMm + radiusMm * Math.sin(angle);
    pinCoords.push([x, y]);
  }

  let svg = `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" 
     width="${totalSizeMm}mm" 
     height="${totalSizeMm}mm" 
     viewBox="0 0 ${totalSizeMm} ${totalSizeMm}">
  <defs>
    <style>
      .board-circle { fill: #ffffff; stroke: #888888; stroke-width: 0.5; }
      .center-cross { stroke: #cccccc; stroke-width: 0.3; }
      .string-line { stroke: ${lineColor}; stroke-width: ${lineWidthMm}; stroke-opacity: ${lineOpacity}; fill: none; stroke-linecap: round; }
      .pin-point { fill: #d32f2f; }
      .pin-label { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; font-size: 2.2px; text-anchor: middle; dominant-baseline: middle; fill: #444444; }
    </style>
  </defs>

  <!-- Circular Board -->
  <circle cx="${centerMm}" cy="${centerMm}" r="${radiusMm}" class="board-circle" />
  
  <!-- Center Alignment Cross -->
  <line x1="${centerMm - 10}" y1="${centerMm}" x2="${centerMm + 10}" y2="${centerMm}" class="center-cross" />
  <line x1="${centerMm}" y1="${centerMm - 10}" x2="${centerMm}" y2="${centerMm + 10}" class="center-cross" />

  <!-- String Thread Path -->
  <g class="threads">
`;

  // Draw lines
  for (let k = 0; k < sequence.length - 1; k++) {
    const p0 = sequence[k] - 1;
    const p1 = sequence[k + 1] - 1;
    if (p0 >= 0 && p0 < pinCoords.length && p1 >= 0 && p1 < pinCoords.length) {
      const [x0, y0] = pinCoords[p0];
      const [x1, y1] = pinCoords[p1];
      svg += `    <line x1="${x0.toFixed(2)}" y1="${y0.toFixed(2)}" x2="${x1.toFixed(2)}" y2="${y1.toFixed(2)}" class="string-line" />\n`;
    }
  }

  svg += `  </g>\n`;

  // Draw pins and labels
  if (showPins) {
    svg += `  <g class="pins">\n`;
    for (let i = 0; i < nailsCount; i++) {
      const [px, py] = pinCoords[i];
      svg += `    <circle cx="${px.toFixed(2)}" cy="${py.toFixed(2)}" r="0.6" class="pin-point" />\n`;

      if (showPinNumbers && (nailsCount <= 200 || (i + 1) % 5 === 0 || i === 0)) {
        const angle = (2.0 * Math.PI * i) / nailsCount - Math.PI / 2.0;
        const lx = centerMm + (radiusMm + 6.0) * Math.cos(angle);
        const ly = centerMm + (radiusMm + 6.0) * Math.sin(angle);
        svg += `    <text x="${lx.toFixed(2)}" y="${ly.toFixed(2)}" class="pin-label">${i + 1}</text>\n`;
      }
    }
    svg += `  </g>\n`;
  }

  svg += `</svg>`;
  return svg;
}
