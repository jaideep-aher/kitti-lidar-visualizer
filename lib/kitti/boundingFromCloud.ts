import * as THREE from "three";
import type { VelodyneCloud } from "./parseVelodyneBin";

export function boundingSphereFromCloud(cloud: VelodyneCloud): {
  center: THREE.Vector3;
  radius: number;
} {
  const box = new THREE.Box3();
  const p = new THREE.Vector3();
  const pos = cloud.positions;
  for (let i = 0; i < cloud.count; i++) {
    p.set(pos[i * 3], pos[i * 3 + 1], pos[i * 3 + 2]);
    box.expandByPoint(p);
  }
  if (box.isEmpty()) {
    return { center: new THREE.Vector3(0, 0, 0), radius: 10 };
  }
  const sphere = new THREE.Sphere();
  box.getBoundingSphere(sphere);
  return { center: sphere.center, radius: Math.max(sphere.radius, 1) };
}
