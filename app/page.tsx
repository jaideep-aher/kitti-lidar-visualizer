import { LidarVisualizer } from "@/components/lidar/LidarVisualizer";

export default function HomePage() {
  return (
    <main className="mx-auto max-w-5xl px-6 pb-24 pt-10 sm:px-8 sm:pt-14">
      <h1 className="text-3xl font-semibold tracking-tight text-foreground sm:text-4xl">
        KITTI & Velodyne viewer
      </h1>
      <p className="mt-4 max-w-2xl text-[15px] leading-relaxed text-muted">
        Inspect LiDAR scans and labels in 3D in your browser—no install. Use it to sanity-check
        data, teach how KITTI-style folders fit together, or step through a short driving sequence
        with optional camera images next to the point cloud.
      </p>

      <section
        className="mt-8 max-w-2xl rounded-xl border border-border bg-surface/80 px-4 py-4 sm:px-5"
        aria-labelledby="how-heading"
      >
        <h2
          id="how-heading"
          className="text-sm font-semibold tracking-tight text-foreground"
        >
          What you can do here
        </h2>
        <ul className="mt-3 list-inside list-disc space-y-2 text-[14px] leading-relaxed text-muted marker:text-foreground/40">
          <li>
            <span className="font-medium text-foreground">One frame</span> — Load a single{" "}
            <code className="text-foreground">.bin</code> (x, y, z, intensity). Add{" "}
            <code className="text-foreground">calib</code> and <code className="text-foreground">label_2</code>{" "}
            to draw 3D boxes in the LiDAR frame.
          </li>
          <li>
            <span className="font-medium text-foreground">Whole sequence</span> —{" "}
            <strong className="font-medium text-foreground">Load KITTI training folder</strong> picks a
            directory like KITTI&apos;s <code className="text-foreground">training</code> tree. You get
            sorted frames, a scrubber, and play/pause so you can see how the scene changes over time and
            optionally see matching <code className="text-foreground">image_2</code> photos.
          </li>
          <li>
            <span className="font-medium text-foreground">Try instantly</span> —{" "}
            <strong className="font-medium text-foreground">Load bundled demo</strong> loads sample points
            and labels with no files of your own.
          </li>
        </ul>
        <p className="mt-3 border-t border-border pt-3 text-[13px] leading-relaxed text-muted">
          Coloring: <span className="text-foreground">Distance</span> highlights structure by range;{" "}
          <span className="text-foreground">Intensity</span> shows return strength. Built with React and
          Three.js.
        </p>
      </section>

      <div className="mt-10">
        <LidarVisualizer />
      </div>
    </main>
  );
}
