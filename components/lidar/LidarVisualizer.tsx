"use client";

import dynamic from "next/dynamic";
import { useCallback, useEffect, useId, useState } from "react";
import { parseVelodyneBin } from "@/lib/kitti/parseVelodyneBin";
import { parseKittiCalib } from "@/lib/kitti/parseCalib";
import { parseKittiLabelText } from "@/lib/kitti/parseLabel";
import { remapCloudToThreeFrame } from "@/lib/kitti/veloToThreeFrame";
import type { VelodyneCloud } from "@/lib/kitti/parseVelodyneBin";
import type { KittiCalib } from "@/lib/kitti/parseCalib";
import type { KittiLabel3D } from "@/lib/kitti/parseLabel";
import type { ColorMode } from "@/lib/kitti/pointColors";

const LidarCanvas = dynamic(
  () => import("./LidarCanvas").then((m) => m.LidarCanvas),
  { ssr: false, loading: () => <CanvasSkeleton /> }
);

function CanvasSkeleton() {
  return (
    <div className="flex h-[min(72vh,640px)] min-h-[420px] w-full items-center justify-center rounded-xl bg-[#0c0c0e] text-sm text-slate-400">
      Loading 3D view…
    </div>
  );
}

const DEMO_BIN = "/kitti-demo/demo.bin";
const DEMO_CALIB = "/kitti-demo/calib.txt";
const DEMO_LABELS = "/kitti-demo/labels.txt";

function readFileAsArrayBuffer(file: File): Promise<ArrayBuffer> {
  return new Promise((resolve, reject) => {
    const r = new FileReader();
    r.onload = () => resolve(r.result as ArrayBuffer);
    r.onerror = () => reject(r.error);
    r.readAsArrayBuffer(file);
  });
}

function readFileAsText(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const r = new FileReader();
    r.onload = () => resolve(r.result as string);
    r.onerror = () => reject(r.error);
    r.readAsText(file);
  });
}

export function LidarVisualizer() {
  const id = useId();
  const binId = `${id}-bin`;
  const calibId = `${id}-calib`;
  const labelsId = `${id}-labels`;

  const [error, setError] = useState<string | null>(null);
  const [colorMode, setColorMode] = useState<ColorMode>("distance");
  const [cloud, setCloud] = useState<VelodyneCloud | null>(null);
  const [calib, setCalib] = useState<KittiCalib | null>(null);
  const [labels, setLabels] = useState<KittiLabel3D[]>([]);

  const loadDemo = useCallback(async () => {
    setError(null);
    try {
      const fetchAsset = (path: string) =>
        fetch(path, { cache: "no-store" }).then((r) => {
          if (!r.ok) {
            throw new Error(
              `Failed to load ${path} (${r.status}). If demo.bin is missing, run: npm run gen:kitti-demo`
            );
          }
          return r;
        });

      const [binBuf, calibText, labelText] = await Promise.all([
        fetchAsset(DEMO_BIN).then((r) => r.arrayBuffer()),
        fetchAsset(DEMO_CALIB).then((r) => r.text()),
        fetchAsset(DEMO_LABELS).then((r) => r.text()),
      ]);
      const raw = parseVelodyneBin(binBuf);
      setCloud(remapCloudToThreeFrame(raw));
      setCalib(parseKittiCalib(calibText));
      setLabels(parseKittiLabelText(labelText));
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load demo");
      setCloud(null);
      setCalib(null);
      setLabels([]);
    }
  }, []);

  useEffect(() => {
    void loadDemo();
  }, [loadDemo]);

  const onBin = async (file: File | undefined) => {
    if (!file) return;
    setError(null);
    try {
      const buf = await readFileAsArrayBuffer(file);
      const raw = parseVelodyneBin(buf);
      setCloud(remapCloudToThreeFrame(raw));
    } catch (e) {
      setError(e instanceof Error ? e.message : "Invalid .bin");
      setCloud(null);
    }
  };

  const onCalib = async (file: File | undefined) => {
    if (!file) {
      setCalib(null);
      return;
    }
    setError(null);
    try {
      const text = await readFileAsText(file);
      setCalib(parseKittiCalib(text));
    } catch (e) {
      setError(e instanceof Error ? e.message : "Invalid calib");
      setCalib(null);
    }
  };

  const onLabels = async (file: File | undefined) => {
    if (!file) {
      setLabels([]);
      return;
    }
    setError(null);
    try {
      const text = await readFileAsText(file);
      setLabels(parseKittiLabelText(text));
    } catch (e) {
      setError(e instanceof Error ? e.message : "Invalid labels");
      setLabels([]);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 rounded-2xl border border-border bg-surface p-5 sm:flex-row sm:flex-wrap sm:items-end sm:justify-between">
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => void loadDemo()}
            className="rounded-full bg-foreground px-4 py-2 text-sm font-medium text-background transition-opacity hover:opacity-90"
          >
            Load bundled demo
          </button>
        </div>
        <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:gap-4">
          <label className="flex flex-col gap-1 text-xs text-muted">
            <span className="font-medium text-foreground">Velodyne .bin</span>
            <input
              id={binId}
              type="file"
              accept=".bin,application/octet-stream"
              className="max-w-[220px] text-[13px] file:mr-2 file:rounded-full file:border-0 file:bg-foreground/10 file:px-3 file:py-1.5 file:text-xs file:font-medium file:text-foreground"
              onChange={(e) => void onBin(e.target.files?.[0])}
            />
          </label>
          <label className="flex flex-col gap-1 text-xs text-muted">
            <span className="font-medium text-foreground">calib (optional)</span>
            <input
              id={calibId}
              type="file"
              accept=".txt,text/plain"
              className="max-w-[220px] text-[13px] file:mr-2 file:rounded-full file:border-0 file:bg-foreground/10 file:px-3 file:py-1.5 file:text-xs file:font-medium file:text-foreground"
              onChange={(e) => void onCalib(e.target.files?.[0])}
            />
          </label>
          <label className="flex flex-col gap-1 text-xs text-muted">
            <span className="font-medium text-foreground">labels (optional)</span>
            <input
              id={labelsId}
              type="file"
              accept=".txt,text/plain"
              className="max-w-[220px] text-[13px] file:mr-2 file:rounded-full file:border-0 file:bg-foreground/10 file:px-3 file:py-1.5 file:text-xs file:font-medium file:text-foreground"
              onChange={(e) => void onLabels(e.target.files?.[0])}
            />
          </label>
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <span className="text-xs font-medium uppercase tracking-[0.18em] text-muted">
          Color by
        </span>
        <div className="flex rounded-full border border-border bg-background p-0.5">
          {(
            [
              ["distance", "Distance"],
              ["intensity", "Intensity"],
            ] as const
          ).map(([value, label]) => (
            <button
              key={value}
              type="button"
              onClick={() => setColorMode(value)}
              className={`rounded-full px-3 py-1.5 text-xs font-medium transition-colors ${
                colorMode === value
                  ? "bg-foreground text-background"
                  : "text-muted hover:text-foreground"
              }`}
            >
              {label}
            </button>
          ))}
        </div>
        {cloud ? (
          <span className="text-xs text-muted">
            {cloud.count.toLocaleString()} points
          </span>
        ) : null}
      </div>

      {error ? (
        <p className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800 dark:border-red-900/50 dark:bg-red-950/40 dark:text-red-200">
          {error}
        </p>
      ) : null}

      <div className="relative h-[min(72vh,640px)] min-h-[420px] w-full overflow-hidden rounded-xl border border-border shadow-sm">
        {cloud ? (
          <LidarCanvas
            cloud={cloud}
            calib={calib}
            labels={labels}
            colorMode={colorMode}
          />
        ) : (
          <div className="flex h-full items-center justify-center bg-[#0c0c0e] text-center text-sm text-slate-400">
            <div className="max-w-sm px-6">
              <p className="text-foreground">No point cloud loaded</p>
              <p className="mt-2 leading-relaxed">
                Use <strong className="font-medium text-foreground">Load bundled demo</strong>{" "}
                or choose a KITTI Velodyne <code className="text-foreground">.bin</code>. Add{" "}
                <code className="text-foreground">calib</code> and{" "}
                <code className="text-foreground">label</code> files to draw 3D boxes.
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
