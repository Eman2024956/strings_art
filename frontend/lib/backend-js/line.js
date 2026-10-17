/**
 * Integer Bresenham line algorithm in JavaScript using TypedArrays for maximum performance.
 * Returns { ys: Int32Array, xs: Int32Array }
 */
export function bresenhamLine(p0, p1) {
  const x0 = Math.round(p0[0]);
  const y0 = Math.round(p0[1]);
  const x1 = Math.round(p1[0]);
  const y1 = Math.round(p1[1]);

  const dx = Math.abs(x1 - x0);
  const dy = -Math.abs(y1 - y0);
  const sx = x0 < x1 ? 1 : -1;
  const sy = y0 < y1 ? 1 : -1;
  let err = dx + dy;

  // Pre-estimate length to allocate typed arrays
  const estLen = Math.max(dx, Math.abs(dy)) + 2;
  const xs = new Int32Array(estLen);
  const ys = new Int32Array(estLen);

  let count = 0;
  let currX = x0;
  let currY = y0;

  while (true) {
    xs[count] = currX;
    ys[count] = currY;
    count++;

    if (currX === x1 && currY === y1) {
      break;
    }

    const e2 = 2 * err;
    if (e2 >= dy) {
      err += dy;
      currX += sx;
    }
    if (e2 <= dx) {
      err += dx;
      currY += sy;
    }
  }

  return {
    xs: xs.subarray(0, count),
    ys: ys.subarray(0, count),
  };
}
