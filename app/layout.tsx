import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});

export const metadata: Metadata = {
  title: {
    default: "KITTI LiDAR visualizer",
    template: "%s · KITTI LiDAR visualizer",
  },
  description:
    "Velodyne point cloud viewer in the browser: KITTI .bin, intensity and distance coloring, 3D boxes from labels with calib.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={inter.variable}>
      <body className="min-h-screen antialiased">
        <header className="border-b border-border bg-background/90 backdrop-blur-md">
          <div className="mx-auto flex h-14 max-w-5xl items-center px-6 sm:px-8">
            <span className="text-sm font-semibold tracking-tight text-foreground">
              KITTI LiDAR visualizer
            </span>
          </div>
        </header>
        {children}
      </body>
    </html>
  );
}
