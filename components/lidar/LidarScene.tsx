"use client";

import { useEffect, useLayoutEffect, useMemo, useRef } from "react";
import { useThree } from "@react-three/fiber";
import { OrbitControls, Grid } from "@react-three/drei";
import type { OrbitControls as OrbitControlsImpl } from "three-stdlib";
import * as THREE from "three";
import { PointCloud } from "./PointCloud";
import { LabelBoxes } from "./LabelBoxes";
import { boundingSphereFromCloud } from "@/lib/kitti/boundingFromCloud";
import type { VelodyneCloud } from "@/lib/kitti/parseVelodyneBin";
import type { KittiCalib } from "@/lib/kitti/parseCalib";
import type { KittiLabel3D } from "@/lib/kitti/parseLabel";
import type { ColorMode } from "@/lib/kitti/pointColors";

type Props = {
  cloud: VelodyneCloud;
  calib: KittiCalib | null;
  labels: KittiLabel3D[];
  colorMode: ColorMode;
  refitKey: number;
};

export function LidarScene({ cloud, calib, labels, colorMode, refitKey }: Props) {
  const { center, radius } = useMemo(
    () => boundingSphereFromCloud(cloud),
    [cloud]
  );
  const { camera } = useThree();
  const ctrl = useRef<OrbitControlsImpl>(null);

  useLayoutEffect(() => {
    const dist = Math.max(radius * 3.2, 14);
    if (camera instanceof THREE.PerspectiveCamera) {
      camera.position.set(
        center.x + dist * 0.72,
        center.y + dist * 0.42,
        center.z + dist * 0.72
      );
      camera.near = Math.max(0.05, dist / 400);
      camera.far = Math.max(600, dist * 30);
      camera.updateProjectionMatrix();
    }
  }, [camera, center, radius, refitKey]);

  /** OrbitControls ref is set after the first layout pass; sync target on the next frame. */
  useEffect(() => {
    const id = requestAnimationFrame(() => {
      const o = ctrl.current;
      if (!o) return;
      o.target.copy(center);
      o.update();
    });
    return () => cancelAnimationFrame(id);
  }, [center, radius, refitKey]);

  return (
    <>
      <color attach="background" args={["#0c0c0e"]} />
      <ambientLight intensity={0.45} />
      <directionalLight position={[40, 24, 20]} intensity={0.85} />
      <PointCloud cloud={cloud} colorMode={colorMode} />
      {calib && labels.length > 0 ? (
        <LabelBoxes labels={labels} calib={calib} />
      ) : null}
      <Grid
        args={[140, 140]}
        position={[center.x, -0.02, center.z]}
        cellSize={2}
        cellThickness={0.55}
        cellColor="#334155"
        sectionSize={10}
        sectionThickness={1}
        sectionColor="#475569"
        fadeDistance={120}
        fadeStrength={1}
        infiniteGrid
      />
      <OrbitControls
        ref={ctrl}
        makeDefault
        enableDamping
        dampingFactor={0.08}
        minDistance={1}
        maxDistance={220}
      />
    </>
  );
}
