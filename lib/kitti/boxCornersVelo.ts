import { Matrix3, Vector3 } from "three";
import type { KittiCalib } from "./parseCalib";
import type { KittiLabel3D } from "./parseLabel";

/** KITTI camera: rotation around +Y (down). Bottom-center convention for (x,y,z). */
function cornersCameraRect(label: KittiLabel3D): Vector3[] {
  const { h, w, l, x, y, z, ry } = label;
  const xl = [
    l / 2,
    l / 2,
    -l / 2,
    -l / 2,
    l / 2,
    l / 2,
    -l / 2,
    -l / 2,
  ];
  const yl = [0, 0, 0, 0, -h, -h, -h, -h];
  const zl = [
    w / 2,
    -w / 2,
    -w / 2,
    w / 2,
    w / 2,
    -w / 2,
    -w / 2,
    w / 2,
  ];
  const c = Math.cos(ry);
  const s = Math.sin(ry);
  const rot = new Matrix3().set(c, 0, s, 0, 1, 0, -s, 0, c);
  const center = new Vector3(x, y, z);
  const out: Vector3[] = [];
  for (let i = 0; i < 8; i++) {
    const v = new Vector3(xl[i], yl[i], zl[i]).applyMatrix3(rot).add(center);
    out.push(v);
  }
  return out;
}

/** 12 edges as pairs of indices into the 8 corners (camera-style ordering). */
export const BOX_EDGE_INDEX_PAIRS: [number, number][] = [
  [0, 1],
  [1, 2],
  [2, 3],
  [3, 0],
  [4, 5],
  [5, 6],
  [6, 7],
  [7, 4],
  [0, 4],
  [1, 5],
  [2, 6],
  [3, 7],
];

export function labelCornersInVelo(
  label: KittiLabel3D,
  calib: KittiCalib
): Vector3[] {
  const camCorners = cornersCameraRect(label);
  return camCorners.map((p) => p.applyMatrix4(calib.rectCamToVelo));
}
