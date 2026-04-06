/** KITTI Velodyne binary: little-endian float32, 4 values per point (x, y, z, intensity). */

export type VelodyneCloud = {
  positions: Float32Array;
  intensities: Float32Array;
  count: number;
};

export function parseVelodyneBin(buffer: ArrayBuffer): VelodyneCloud {
  const f32 = new Float32Array(buffer);
  if (f32.length % 4 !== 0) {
    throw new Error(
      `Invalid Velodyne .bin: byte length must be a multiple of 16 (got ${buffer.byteLength})`
    );
  }
  const count = f32.length / 4;
  const positions = new Float32Array(count * 3);
  const intensities = new Float32Array(count);
  for (let i = 0; i < count; i++) {
    const o = i * 4;
    positions[i * 3] = f32[o];
    positions[i * 3 + 1] = f32[o + 1];
    positions[i * 3 + 2] = f32[o + 2];
    intensities[i] = f32[o + 3];
  }
  return { positions, intensities, count };
}
