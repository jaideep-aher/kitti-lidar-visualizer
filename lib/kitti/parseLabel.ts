export type KittiLabel3D = {
  type: string;
  truncated: number;
  occluded: number;
  alpha: number;
  /** height, width, length (meters) in KITTI object frame. */
  h: number;
  w: number;
  l: number;
  /** Bottom-center of object in **rectified camera** coordinates (meters). */
  x: number;
  y: number;
  z: number;
  /** Rotation around camera Y (radians). */
  ry: number;
};

const SKIP_TYPES = new Set(["DontCare", "Misc"]);

/**
 * Parse KITTI `label_2` / training label text.
 * Each line: type truncated occluded alpha bbox… h w l x y z ry [score]
 */
export function parseKittiLabelText(text: string): KittiLabel3D[] {
  const out: KittiLabel3D[] = [];
  for (const line of text.split(/\n/)) {
    const t = line.trim();
    if (!t) continue;
    const p = t.split(/\s+/);
    if (p.length < 15) continue;
    const type = p[0];
    if (SKIP_TYPES.has(type)) continue;
    const truncated = Number(p[1]);
    const occluded = Number(p[2]);
    const alpha = Number(p[3]);
    const h = Number(p[8]);
    const w = Number(p[9]);
    const l = Number(p[10]);
    const x = Number(p[11]);
    const y = Number(p[12]);
    const z = Number(p[13]);
    const ry = Number(p[14]);
    if ([h, w, l, x, y, z, ry].some((n) => Number.isNaN(n))) continue;
    out.push({ type, truncated, occluded, alpha, h, w, l, x, y, z, ry });
  }
  return out;
}
