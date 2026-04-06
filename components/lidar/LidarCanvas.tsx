"use client";

import { Canvas } from "@react-three/fiber";
import { LidarScene } from "./LidarScene";
import type { VelodyneCloud } from "@/lib/kitti/parseVelodyneBin";
import type { KittiCalib } from "@/lib/kitti/parseCalib";
import type { KittiLabel3D } from "@/lib/kitti/parseLabel";
import type { ColorMode } from "@/lib/kitti/pointColors";

type Props = {
  cloud: VelodyneCloud;
  calib: KittiCalib | null;
  labels: KittiLabel3D[];
  colorMode: ColorMode;
};

export function LidarCanvas({ cloud, calib, labels, colorMode }: Props) {
  return (
    <Canvas
      className="h-full w-full min-h-[420px] rounded-xl bg-[#0c0c0e]"
      style={{ display: "block" }}
      camera={{ position: [30, 20, 30], fov: 50, near: 0.05, far: 800 }}
      gl={{ antialias: true, alpha: false, powerPreference: "high-performance" }}
      dpr={[1, 2]}
    >
      <LidarScene
        cloud={cloud}
        calib={calib}
        labels={labels}
        colorMode={colorMode}
      />
    </Canvas>
  );
}
