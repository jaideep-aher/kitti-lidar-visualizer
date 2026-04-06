import type { VelodyneCloud } from "./parseVelodyneBin";

export type ColorMode = "intensity" | "distance";

/** Turbo-like colormap (approximation) for scalar t in [0,1]. */
function turbo(t: number): [number, number, number] {
  const x = Math.min(1, Math.max(0, t));
  const r = Math.min(1, Math.max(0, 1.14 * x - 0.07));
  const g = Math.min(1, Math.max(0, 1.8 * x * (1 - x)));
  const b = Math.min(1, Math.max(0, 1 - 1.2 * (x - 0.2)));
  return [r, g, b];
}

export function buildPointColors(
  cloud: VelodyneCloud,
  mode: ColorMode
): Float32Array {
  const { positions, intensities, count } = cloud;
  const colors = new Float32Array(count * 3);
  let iLo = Infinity;
  let iHi = -Infinity;
  if (mode === "intensity") {
    for (let j = 0; j < count; j++) {
      const v = intensities[j];
      if (v < iLo) iLo = v;
      if (v > iHi) iHi = v;
    }
    if (iHi <= iLo) {
      iLo = 0;
      iHi = 1;
    }
  }
  let dMin = Infinity;
  let dMax = -Infinity;
  if (mode === "distance") {
    for (let i = 0; i < count; i++) {
      const x = positions[i * 3];
      const y = positions[i * 3 + 1];
      const z = positions[i * 3 + 2];
      const d = Math.hypot(x, y, z);
      if (d < dMin) dMin = d;
      if (d > dMax) dMax = d;
    }
    if (dMax <= dMin) {
      dMin = 0;
      dMax = 1;
    }
  }
  for (let i = 0; i < count; i++) {
    let t: number;
    if (mode === "intensity") {
      t = (intensities[i] - iLo) / (iHi - iLo);
    } else {
      const x = positions[i * 3];
      const y = positions[i * 3 + 1];
      const z = positions[i * 3 + 2];
      const d = Math.hypot(x, y, z);
      t = (d - dMin) / (dMax - dMin);
    }
    const [r, g, b] = turbo(t);
    colors[i * 3] = r;
    colors[i * 3 + 1] = g;
    colors[i * 3 + 2] = b;
  }
  return colors;
}
