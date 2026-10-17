/**
 * Calculates pin positions around a circle and precomputes Bresenham lines between pairs.
 */
export function calculateNailPositions(nails: number, size: number): Array<[number, number]> {
  const radius = (size - 1) / 2.0;
  const center = (size - 1) / 2.0;
  const coords: Array<[number, number]> = [];

  for (let i = 0; i < nails; i++) {
    // 0 is top (-pi/2) and clockwise
    const angle = (2.0 * Math.PI * i) / nails - Math.PI / 2.0;
    const x = Math.round(center + radius * Math.cos(angle));
    const y = Math.round(center + radius * Math.sin(angle));
    coords.push([x, y]);
  }
  return coords;
}

/**
 * Bresenham's line algorithm returning 1D indices for width = size
 */
export function bresenhamLineIndices(
  x0: number,
  y0: number,
  x1: number,
  y1: number,
  size: number
): Int32Array {
  const indices: number[] = [];
  const dx = Math.abs(x1 - x0);
  const dy = Math.abs(y1 - y0);
  const sx = x0 < x1 ? 1 : -1;
  const sy = y0 < y1 ? 1 : -1;
  let err = dx - dy;

  let currX = x0;
  let currY = y0;

  while (true) {
    if (currX >= 0 && currX < size && currY >= 0 && currY < size) {
      indices.push(currY * size + currX);
    }
    if (currX === x1 && currY === y1) break;
    const e2 = 2 * err;
    if (e2 > -dy) {
      err -= dy;
      currX += sx;
    }
    if (e2 < dx) {
      err += dx;
      currY += sy;
    }
  }

  return new Int32Array(indices);
}

/**
 * Precomputes lookup table of lines between all pin pairs.
 * Stored as a flat Map or jagged array indexed by (min(i,j) * nails + max(i,j)).
 */
export function precomputeLineLookup(
  nails: number,
  size: number,
  nailCoords: Array<[number, number]>
): Map<number, Int32Array> {
  const lookup = new Map<number, Int32Array>();

  for (let i = 0; i < nails; i++) {
    const [x0, y0] = nailCoords[i];
    for (let j = i + 1; j < nails; j++) {
      const [x1, y1] = nailCoords[j];
      const line = bresenhamLineIndices(x0, y0, x1, y1, size);
      const key = i * nails + j;
      lookup.set(key, line);
    }
  }

  return lookup;
}

export function getLineFromLookup(
  lookup: Map<number, Int32Array>,
  nails: number,
  i: number,
  j: number
): Int32Array | undefined {
  if (i === j) return undefined;
  const a = Math.min(i, j);
  const b = Math.max(i, j);
  return lookup.get(a * nails + b);
}
