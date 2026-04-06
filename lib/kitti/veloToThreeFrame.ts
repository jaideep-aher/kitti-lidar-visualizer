import { Vector3 } from "three";
import type { VelodyneCloud } from "./parseVelodyneBin";

/** Velodyne: x forward, y left, z up → Three.js: y up. */
export function veloPointToThree(x: number, y: number, z: number): [number, number, number] {
  return [x, z, -y];
}

export function remapCloudToThreeFrame(cloud: VelodyneCloud): VelodyneCloud {
  const { positions, intensities, count } = cloud;
  const next = new Float32Array(positions.length);
  for (let i = 0; i < count; i++) {
    const x = positions[i * 3];
    const y = positions[i * 3 + 1];
    const z = positions[i * 3 + 2];
    const [tx, ty, tz] = veloPointToThree(x, y, z);
    next[i * 3] = tx;
    next[i * 3 + 1] = ty;
    next[i * 3 + 2] = tz;
  }
  return { positions: next, intensities, count };
}

export function remapVectorToThree(v: Vector3): Vector3 {
  return new Vector3(v.x, v.z, -v.y);
}
