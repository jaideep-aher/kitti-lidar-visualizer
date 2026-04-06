# KITTI LiDAR visualizer

Browser tool to **inspect KITTI-style Velodyne scans** without installing desktop viewers or heavy pipelines. Useful for **checking that `.bin` files look right**, **comparing labels to points in 3D**, and **stepping through a multi-frame sequence** next to optional camera images.

## What it’s for (and not for)

**Good for**

- Quick **visual QA** on KITTI object-detection style data (`velodyne/`, `calib/`, `label_2/`, optional `image_2/`).
- **Teaching and demos**: show how LiDAR points, calibration, and `label_2` boxes relate.
- **Single-frame experiments**: drop one `.bin` (plus optional `calib` / `labels`) and toggle distance vs intensity coloring.

**Not a replacement for**

- Full dataset tooling, SLAM, or production annotation workflows—this is a **lightweight viewer**.

## Features — what they do and why

| Feature | What it does | Why it’s useful |
|--------|----------------|-----------------|
| **Bundled demo** | Loads a small synthetic scene from `public/kitti-demo/`. | Try the app **with zero data**; see coloring and boxes immediately. |
| **Single-file load** | Pick one `velodyne` `.bin`, optional `calib.txt`, optional `label_2` `.txt`. | Fast path for **one frame** or files that aren’t in a full KITTI tree. |
| **Sequence (folder) load** | Upload a folder whose paths match KITTI layout; frames sort by numeric id. | Inspect **motion over time**, spot bad frames, or **playback** like a short clip. |
| **Scrubber + play** | Slider, prev/next, play/pause, Slow/Normal/Fast. | Navigate long sequences without re-uploading; **space / arrows** when a sequence is active. |
| **Stable 3D camera while scrubbing** | View recenters when the sequence **first** loads; scrubbing does not reset the camera. | Easier to **compare** consecutive frames from a consistent viewpoint; use **Recenter camera** if you want a fresh fit. |
| **Optional `image_2` panel** | If the folder includes left camera images, shows the **same frame id** beside the point cloud. | **Align** what the car saw in 2D with LiDAR in 3D for that timestep. |
| **Distance / intensity coloring** | Color points by range from the sensor or by return intensity. | Different views for **structure** vs **reflectivity** / sensor behavior. |
| **3D box overlays** | With matching `calib`, draws `label_2` boxes in the LiDAR frame. | **Validate** annotations or explain ground-truth format. |

## Quick start

```bash
npm install
npm run dev
```

Open the URL printed in the terminal (often [http://localhost:3000](http://localhost:3000); use another port if that one is busy).

## Sequence folder layout

Use **Load KITTI training folder** and select a directory whose relative paths look like the KITTI object detection layout:

| Subfolder   | Files                         | Role                                      |
|------------|-------------------------------|-------------------------------------------|
| `velodyne` | `000000.bin`, …               | Required — drives frame list and ordering |
| `calib`    | `000000.txt`, …               | Optional — per-frame or sparse (see below)|
| `label_2`  | `000000.txt`, …               | Optional — 3D box overlays                |
| `image_2`  | `000000.png` / `.jpg`, …      | Optional — synced 2D preview panel      |

Frame IDs are the numeric stems (e.g. `000123`). You can select the `training` folder, or any parent that still exposes paths ending in `velodyne/…`, `calib/…`, etc.

**Calibration:** If a frame has no `calib` file, the app uses the **nearest earlier** calib in the sequence, then the nearest **later** one — so you can omit redundant calib files when they repeat.

While a sequence is active, the single-file calib/labels inputs are disabled; use **Exit sequence** to return to manual file picks. **Load bundled demo** clears sequence mode.

## Keyboard shortcuts (sequence mode)

| Key        | Action        |
|-----------|----------------|
| ← / →     | Previous / next frame |
| Space     | Play / pause   |

Ignored when focus is in a text input or textarea.

Playback **step** (interval between frames) is configurable in the UI: Slow / Normal / Fast.

## Regenerate demo assets

```bash
npm run gen:kitti-demo
```

Writes `public/kitti-demo/`. Run this if **Load bundled demo** fails with a missing `demo.bin` (for example after an incomplete clone).

## Scripts

| Command              | Description        |
|---------------------|--------------------|
| `npm run dev`       | Development server |
| `npm run build`     | Production build   |
| `npm run start`     | Start production   |
| `npm run lint`      | ESLint             |
| `npm run gen:kitti-demo` | Regenerate demo |

## Stack

Next.js, React, Three.js, `@react-three/fiber`, `@react-three/drei`.

## Deploy

Compatible with Railway via `railway.toml` (Nixpacks, `npm run start`). Set `NEXT_PUBLIC_SITE_URL` to your public URL if you add canonical links later.

Live demo: [kitti-lidar-visualizer.vercel.app](https://kitti-lidar-visualizer.vercel.app/).

Built by [aher.dev](https://aher.dev).
