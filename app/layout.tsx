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
    "Inspect KITTI-style Velodyne .bin scans in the browser: single-frame or full training-folder sequences, optional camera (image_2), distance/intensity coloring, and 3D label boxes with calib.",
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
        <footer className="border-t border-border py-8 text-center">
          <p className="text-sm text-muted">
            Built by{" "}
            <a
              href="https://aher.dev"
              className="font-medium text-foreground underline decoration-border underline-offset-4 transition-colors hover:decoration-foreground"
              target="_blank"
              rel="noopener noreferrer"
            >
              aher.dev
            </a>
          </p>
        </footer>
      </body>
    </html>
  );
}
