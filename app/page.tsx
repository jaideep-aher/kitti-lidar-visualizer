import { LidarVisualizer } from "@/components/lidar/LidarVisualizer";

export default function HomePage() {
  return (
    <main className="mx-auto max-w-5xl px-6 pb-24 pt-10 sm:px-8 sm:pt-14">
      <h1 className="text-3xl font-semibold tracking-tight text-foreground sm:text-4xl">
        Velodyne point cloud viewer
      </h1>
      <p className="mt-4 max-w-2xl text-[15px] leading-relaxed text-muted">
        Load a Velodyne <code className="text-foreground">.bin</code> (x, y, z, intensity),
        color by range or return strength, and overlay KITTI{" "}
        <code className="text-foreground">label_2</code> boxes when you provide matching{" "}
        <code className="text-foreground">calib</code> (R0_rect + Tr_velo_to_cam). Built with
        React and Three.js.
      </p>
      <div className="mt-12">
        <LidarVisualizer />
      </div>
    </main>
  );
}
