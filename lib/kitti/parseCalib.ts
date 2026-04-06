import { Matrix4 } from "three";

export type KittiCalib = {
  /** 4×4: velodyne → rectified camera (multiply homogeneous velo point). */
  veloToRectCam: Matrix4;
  /** Inverse: rectified camera → velodyne. */
  rectCamToVelo: Matrix4;
};

function parseMatrix3x4Line(line: string): Matrix4 {
  const parts = line.trim().split(/\s+/).slice(1).map(Number);
  if (parts.length !== 12 || parts.some((n) => Number.isNaN(n))) {
    throw new Error(`Bad calib line (expected 12 numbers): ${line.slice(0, 80)}`);
  }
  const m = new Matrix4();
  m.set(
    parts[0],
    parts[1],
    parts[2],
    parts[3],
    parts[4],
    parts[5],
    parts[6],
    parts[7],
    parts[8],
    parts[9],
    parts[10],
    parts[11],
    0,
    0,
    0,
    1
  );
  return m;
}

function parseR0Rect(line: string): Matrix4 {
  const parts = line.trim().split(/\s+/).slice(1).map(Number);
  if (parts.length !== 9 || parts.some((n) => Number.isNaN(n))) {
    throw new Error(`Bad R0_rect line: ${line.slice(0, 80)}`);
  }
  const m = new Matrix4();
  m.set(
    parts[0],
    parts[1],
    parts[2],
    0,
    parts[3],
    parts[4],
    parts[5],
    0,
    parts[6],
    parts[7],
    parts[8],
    0,
    0,
    0,
    0,
    1
  );
  return m;
}

/** Parse KITTI `calib_velo_to_cam.txt` style text (R0_rect + Tr_velo_to_cam). */
export function parseKittiCalib(text: string): KittiCalib {
  const lines = text.split(/\n/).map((l) => l.trim()).filter(Boolean);
  let r0 = new Matrix4().identity();
  let tr = new Matrix4().identity();
  for (const line of lines) {
    if (line.startsWith("R0_rect:")) r0 = parseR0Rect(line);
    else if (line.startsWith("Tr_velo_to_cam:")) tr = parseMatrix3x4Line(line);
  }
  const veloToRectCam = new Matrix4().multiplyMatrices(r0, tr);
  const rectCamToVelo = veloToRectCam.clone().invert();
  return { veloToRectCam, rectCamToVelo };
}
