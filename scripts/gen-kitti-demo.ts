/**
 * Generates synthetic KITTI-style Velodyne .bin + matching calib/labels under public/kitti-demo/.
 * Points are sampled inside the 3D label boxes (camera frame) and on a ground plane in Velodyne coords.
 */
import { mkdirSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { Matrix4, Vector3 } from "three";
import { parseKittiCalib } from "../lib/kitti/parseCalib";
import type { KittiLabel3D } from "../lib/kitti/parseLabel";

const __dir = dirname(fileURLToPath(import.meta.url));
const outDir = join(__dir, "../public/kitti-demo");

const CALIB_TEXT = `P2: 7.215377e+02 0.000000e+00 6.095593e+02 4.485728e+01 0.000000e+00 7.215377e+02 1.728540e+02 2.163791e-01 0.000000e+00 0.000000e+00 1.000000e+00 2.745884e-03
R0_rect: 9.999454e-01 7.259129e-03 -7.519551e-03 -7.292292e-03 9.999638e-01 -4.381729e-03 7.523471e-03 4.436324e-03 9.999631e-01
Tr_velo_to_cam: 7.533745e-03 -9.999714e-01 -6.166020e-04 -4.069766e-03 1.480249e-02 7.280733e-04 -9.998902e-01 -7.631618e-02 9.998621e-01 7.523790e-03 1.480755e-02 -2.717806e-01
`;

/** Plausible KITTI label rows (rectified camera); points will be sampled to match. */
const LABELS: KittiLabel3D[] = [
  {
    type: "Car",
    truncated: 0,
    occluded: 0,
    alpha: -1.55,
    h: 1.52,
    w: 1.72,
    l: 4.02,
    x: 7.35,
    y: 1.64,
    z: 34.8,
    ry: -1.58,
  },
  {
    type: "Pedestrian",
    truncated: 0,
    occluded: 0,
    alpha: 0.12,
    h: 1.72,
    w: 0.62,
    l: 0.88,
    x: -2.85,
    y: 1.58,
    z: 22.5,
    ry: 3.1,
  },
];

function formatLabelRow(l: KittiLabel3D): string {
  const bb = "0.00 0.00 0.00 0.00";
  return `${l.type} ${l.truncated.toFixed(2)} ${l.occluded} ${l.alpha.toFixed(2)} ${bb} ${l.h.toFixed(2)} ${l.w.toFixed(2)} ${l.l.toFixed(2)} ${l.x.toFixed(2)} ${l.y.toFixed(2)} ${l.z.toFixed(2)} ${l.ry.toFixed(2)}`;
}

function sampleVeloFromLabel(label: KittiLabel3D, rectCamToVelo: Matrix4): Vector3 {
  const { h, w, l, x, y, z, ry } = label;
  const xl = (Math.random() - 0.5) * l;
  const yl = -Math.random() * h;
  const zl = (Math.random() - 0.5) * w;
  const c = Math.cos(ry);
  const s = Math.sin(ry);
  const xr = c * xl + s * zl;
  const zr = -s * xl + c * zl;
  const cam = new Vector3(xr + x, yl + y, zr + z);
  return cam.applyMatrix4(rectCamToVelo);
}

function main() {
  mkdirSync(outDir, { recursive: true });
  writeFileSync(join(outDir, "calib.txt"), CALIB_TEXT.trim() + "\n");

  const { rectCamToVelo } = parseKittiCalib(CALIB_TEXT);
  const labelText = LABELS.map(formatLabelRow).join("\n") + "\n";
  writeFileSync(join(outDir, "labels.txt"), labelText);

  const pts: number[] = [];
  const push = (x: number, y: number, z: number, intensity: number) => {
    pts.push(x, y, z, intensity);
  };

  for (const label of LABELS) {
    const n = label.type === "Car" ? 9000 : 2800;
    for (let i = 0; i < n; i++) {
      const v = sampleVeloFromLabel(label, rectCamToVelo);
      const jitter = 0.04;
      push(
        v.x + (Math.random() - 0.5) * jitter,
        v.y + (Math.random() - 0.5) * jitter,
        v.z + (Math.random() - 0.5) * jitter,
        Math.random() * 0.35 + 0.15
      );
    }
  }

  for (let i = 0; i < 55_000; i++) {
    const x = 3 + Math.random() * 48;
    const y = -14 + Math.random() * 28;
    const z = (Math.random() - 0.5) * 0.06;
    push(x, y, z, Math.random() * 0.25 + 0.05);
  }

  const f32 = new Float32Array(pts);
  writeFileSync(join(outDir, "demo.bin"), Buffer.from(f32.buffer));

  console.log(
    `Wrote ${outDir} (${(f32.length / 4).toFixed(0)} points, ${LABELS.length} labels)`
  );
}

main();
