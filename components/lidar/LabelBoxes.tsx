"use client";

import { useMemo } from "react";
import * as THREE from "three";
import type { KittiCalib } from "@/lib/kitti/parseCalib";
import type { KittiLabel3D } from "@/lib/kitti/parseLabel";
import {
  BOX_EDGE_INDEX_PAIRS,
  labelCornersInVelo,
} from "@/lib/kitti/boxCornersVelo";
import { remapVectorToThree } from "@/lib/kitti/veloToThreeFrame";

const TYPE_COLORS: Record<string, string> = {
  Car: "#22d3ee",
  Van: "#38bdf8",
  Truck: "#0ea5e9",
  Pedestrian: "#f472b6",
  Person_sitting: "#e879f9",
  Cyclist: "#a3e635",
  Tram: "#94a3b8",
  Misc: "#94a3b8",
};

function defaultColor(type: string): string {
  return TYPE_COLORS[type] ?? "#fbbf24";
}

function edgesFromCorners(corners: THREE.Vector3[]): Float32Array {
  const arr = new Float32Array(BOX_EDGE_INDEX_PAIRS.length * 2 * 3);
  let k = 0;
  for (const [a, b] of BOX_EDGE_INDEX_PAIRS) {
    const ca = corners[a];
    const cb = corners[b];
    arr[k++] = ca.x;
    arr[k++] = ca.y;
    arr[k++] = ca.z;
    arr[k++] = cb.x;
    arr[k++] = cb.y;
    arr[k++] = cb.z;
  }
  return arr;
}

type Props = {
  labels: KittiLabel3D[];
  calib: KittiCalib;
};

export function LabelBoxes({ labels, calib }: Props) {
  const segments = useMemo(() => {
    return labels.map((label) => {
      const corners = labelCornersInVelo(label, calib).map((c) =>
        remapVectorToThree(c)
      );
      const positions = edgesFromCorners(corners);
      const geom = new THREE.BufferGeometry();
      geom.setAttribute("position", new THREE.BufferAttribute(positions, 3));
      const color = defaultColor(label.type);
      return { geom, color, key: `${label.type}-${label.x}-${label.z}-${label.ry}` };
    });
  }, [labels, calib]);

  return (
    <group>
      {segments.map(({ geom, color, key }) => (
        <lineSegments key={key} geometry={geom} frustumCulled={false}>
          <lineBasicMaterial color={color} depthTest opacity={0.95} transparent />
        </lineSegments>
      ))}
    </group>
  );
}
