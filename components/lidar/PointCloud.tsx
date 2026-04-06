"use client";

import { useMemo } from "react";
import type { VelodyneCloud } from "@/lib/kitti/parseVelodyneBin";
import { buildPointColors, type ColorMode } from "@/lib/kitti/pointColors";

type Props = {
  cloud: VelodyneCloud;
  colorMode: ColorMode;
};

/**
 * Declarative buffer attributes so R3F attaches position/color before the first draw.
 * (Imperative ref + useLayoutEffect often left the first frame with an empty geometry.)
 */
export function PointCloud({ cloud, colorMode }: Props) {
  const colors = useMemo(
    () => buildPointColors(cloud, colorMode),
    [cloud, colorMode]
  );

  return (
    <points frustumCulled={false}>
      <bufferGeometry>
        <bufferAttribute
          attach="attributes-position"
          args={[cloud.positions, 3]}
        />
        <bufferAttribute attach="attributes-color" args={[colors, 3]} />
      </bufferGeometry>
      <pointsMaterial
        size={0.2}
        vertexColors
        sizeAttenuation
        toneMapped={false}
        depthWrite={false}
        transparent
        opacity={0.95}
      />
    </points>
  );
}
