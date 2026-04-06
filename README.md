# KITTI LiDAR visualizer

Interactive **Velodyne** point cloud viewer for the browser: load KITTI-style `.bin` scans, color by **distance** or **intensity**, and draw **3D bounding boxes** from `label_2` text plus `R0_rect` / `Tr_velo_to_cam` calibration.

## Quick start

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000). The bundled demo loads automatically; you can also use **Load bundled demo** or your own files.

## Regenerate demo assets

```bash
npm run gen:kitti-demo
```

Writes `public/kitti-demo/` (synthetic points aligned with sample labels).

## Stack

Next.js, React, Three.js, `@react-three/fiber`, `@react-three/drei`.

## Deploy

Compatible with Railway via `railway.toml` (Nixpacks, `npm run start`). Set `NEXT_PUBLIC_SITE_URL` to your public URL if you add canonical links later.
