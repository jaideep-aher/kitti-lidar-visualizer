"use client";

import dynamic from "next/dynamic";
import {
  useCallback,
  useEffect,
  useId,
  useRef,
  useState,
} from "react";
import { parseVelodyneBin } from "@/lib/kitti/parseVelodyneBin";
import { parseKittiCalib } from "@/lib/kitti/parseCalib";
import { parseKittiLabelText } from "@/lib/kitti/parseLabel";
import { remapCloudToThreeFrame } from "@/lib/kitti/veloToThreeFrame";
import {
  buildSequenceFromFileList,
  resolveCalibFile,
  type FrameBundle,
} from "@/lib/kitti/sequenceFromFiles";
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

const DEFAULT_PLAYBACK_MS = 280;

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

type SequenceState = {
  frameIds: string[];
  bundles: Map<string, FrameBundle>;
};

export function LidarVisualizer() {
  const id = useId();
  const binId = `${id}-bin`;
  const calibId = `${id}-calib`;
  const labelsId = `${id}-labels`;
  const folderId = `${id}-folder`;
  const scrubId = `${id}-scrub`;

  const [error, setError] = useState<string | null>(null);
  const [colorMode, setColorMode] = useState<ColorMode>("distance");
  const [cloud, setCloud] = useState<VelodyneCloud | null>(null);
  const [calib, setCalib] = useState<KittiCalib | null>(null);
  const [labels, setLabels] = useState<KittiLabel3D[]>([]);
  const [refitKey, setRefitKey] = useState(0);
  const bumpRefit = useCallback(() => setRefitKey((k) => k + 1), []);

  const [sequence, setSequence] = useState<SequenceState | null>(null);
  const [seqIndex, setSeqIndex] = useState(0);
  const [playing, setPlaying] = useState(false);
  const [playbackMs, setPlaybackMs] = useState(DEFAULT_PLAYBACK_MS);
  const [frameLoading, setFrameLoading] = useState(false);
  const [cameraUrl, setCameraUrl] = useState<string | null>(null);
  const [folderInputKey, setFolderInputKey] = useState(0);

  const loadGen = useRef(0);
  const refitAfterNextFrameLoad = useRef(false);

  const revokeCamera = useCallback(() => {
    setCameraUrl((prev) => {
      if (prev) URL.revokeObjectURL(prev);
      return null;
    });
  }, []);

  const clearSequence = useCallback(() => {
    setSequence(null);
    setSeqIndex(0);
    setPlaying(false);
    revokeCamera();
    setFolderInputKey((k) => k + 1);
    refitAfterNextFrameLoad.current = false;
  }, [revokeCamera]);

  useEffect(() => {
    return () => {
      revokeCamera();
    };
  }, [revokeCamera]);

  const loadDemo = useCallback(async () => {
    clearSequence();
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
      bumpRefit();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load demo");
      setCloud(null);
      setCalib(null);
      setLabels([]);
    }
  }, [bumpRefit, clearSequence]);

  useEffect(() => {
    void loadDemo();
  }, [loadDemo]);

  const onBin = async (file: File | undefined) => {
    if (!file) return;
    clearSequence();
    setError(null);
    try {
      const buf = await readFileAsArrayBuffer(file);
      const raw = parseVelodyneBin(buf);
      setCloud(remapCloudToThreeFrame(raw));
      bumpRefit();
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
    if (sequence) return;
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
    if (sequence) return;
    setError(null);
    try {
      const text = await readFileAsText(file);
      setLabels(parseKittiLabelText(text));
    } catch (e) {
      setError(e instanceof Error ? e.message : "Invalid labels");
      setLabels([]);
    }
  };

  const onTrainingFolder = (fileList: FileList | null) => {
    if (!fileList?.length) return;
    clearSequence();
    setError(null);
    const built = buildSequenceFromFileList(fileList);
    if (!built) {
      setError(
        "No Velodyne .bin files found. Select the folder that contains KITTI paths like training/velodyne/000000.bin (or pick `training` so velodyne/, calib/, label_2/, image_2/ appear in paths)."
      );
      return;
    }
    refitAfterNextFrameLoad.current = true;
    setSequence({
      frameIds: built.frameIds,
      bundles: built.bundles,
    });
    setSeqIndex(0);
    setPlaying(false);
  };

  useEffect(() => {
    if (!sequence) return;

    const { frameIds, bundles } = sequence;
    const frameId = frameIds[seqIndex];
    const bundle = bundles.get(frameId);
    if (!bundle?.bin) return;

    const gen = ++loadGen.current;
    setFrameLoading(true);
    setError(null);

    (async () => {
      try {
        const buf = await readFileAsArrayBuffer(bundle.bin!);
        const raw = parseVelodyneBin(buf);
        const mapped = remapCloudToThreeFrame(raw);

        const calibFile =
          bundle.calib ?? resolveCalibFile(frameId, frameIds, bundles);
        let nextCalib: KittiCalib | null = null;
        if (calibFile) {
          try {
            nextCalib = parseKittiCalib(await readFileAsText(calibFile));
          } catch {
            nextCalib = null;
          }
        }

        let nextLabels: KittiLabel3D[] = [];
        if (bundle.label) {
          try {
            const t = await readFileAsText(bundle.label);
            nextLabels = parseKittiLabelText(t);
          } catch {
            nextLabels = [];
          }
        }

        let nextCam: string | null = null;
        if (bundle.image) {
          nextCam = URL.createObjectURL(bundle.image);
        }

        if (gen !== loadGen.current) {
          if (nextCam) URL.revokeObjectURL(nextCam);
          return;
        }

        setCameraUrl((prev) => {
          if (prev) URL.revokeObjectURL(prev);
          return nextCam;
        });
        setCloud(mapped);
        setCalib(nextCalib);
        setLabels(nextLabels);

        if (refitAfterNextFrameLoad.current) {
          refitAfterNextFrameLoad.current = false;
          bumpRefit();
        }
      } catch (e) {
        if (gen !== loadGen.current) return;
        setError(e instanceof Error ? e.message : "Failed to load frame");
        setCloud(null);
        setCalib(null);
        setLabels([]);
        revokeCamera();
      } finally {
        if (gen === loadGen.current) setFrameLoading(false);
      }
    })();
  }, [sequence, seqIndex, bumpRefit, revokeCamera]);

  useEffect(() => {
    if (!playing || !sequence) return;
    const n = sequence.frameIds.length;
    if (n < 2) return;
    const t = window.setInterval(() => {
      setSeqIndex((i) => (i + 1) % n);
    }, playbackMs);
    return () => window.clearInterval(t);
  }, [playing, playbackMs, sequence]);

  useEffect(() => {
    if (!sequence) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;
      const n = sequence.frameIds.length;
      if (e.key === "ArrowLeft") {
        e.preventDefault();
        setSeqIndex((i) => (i - 1 + n) % n);
      } else if (e.key === "ArrowRight") {
        e.preventDefault();
        setSeqIndex((i) => (i + 1) % n);
      } else if (e.key === " ") {
        e.preventDefault();
        setPlaying((p) => !p);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [sequence]);

  const nFrames = sequence?.frameIds.length ?? 0;
  const currentFrameId = sequence && nFrames ? sequence.frameIds[seqIndex] : null;

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 rounded-2xl border border-border bg-surface p-5 sm:flex-row sm:flex-wrap sm:items-end sm:justify-between">
        <div className="flex flex-col gap-3">
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => void loadDemo()}
              className="rounded-full bg-foreground px-4 py-2 text-sm font-medium text-background transition-opacity hover:opacity-90"
            >
              Load bundled demo
            </button>
            <label className="inline-flex cursor-pointer items-center rounded-full border border-border bg-background px-4 py-2 text-sm font-medium text-foreground transition-colors hover:bg-foreground/[0.04]">
              <span>Load KITTI training folder</span>
              <input
                key={folderInputKey}
                id={folderId}
                type="file"
                className="sr-only"
                // @ts-expect-error webkitdirectory is valid in browsers
                webkitdirectory=""
                multiple
                onChange={(e) => onTrainingFolder(e.target.files)}
              />
            </label>
            {sequence ? (
              <button
                type="button"
                onClick={clearSequence}
                className="rounded-full border border-border px-4 py-2 text-sm font-medium text-muted transition-colors hover:text-foreground"
              >
                Exit sequence
              </button>
            ) : null}
            {cloud ? (
              <button
                type="button"
                onClick={() => bumpRefit()}
                className="rounded-full border border-border px-4 py-2 text-sm font-medium text-muted transition-colors hover:text-foreground"
              >
                Recenter camera
              </button>
            ) : null}
          </div>
          <div className="max-w-xl space-y-2 text-[12px] leading-relaxed text-muted">
            <p>
              <span className="font-medium text-foreground">Single scan:</span> use the file inputs
              on the right—good for one-off <code className="text-foreground">.bin</code> files.
            </p>
            <p>
              <span className="font-medium text-foreground">Sequence:</span>{" "}
              <strong className="font-medium text-foreground">Load KITTI training folder</strong>{" "}
              and pick your <code className="text-foreground">training</code> folder (or a parent
              whose paths still contain{" "}
              <code className="text-foreground">velodyne/</code>,{" "}
              <code className="text-foreground">calib/</code>,{" "}
              <code className="text-foreground">label_2/</code>, optional{" "}
              <code className="text-foreground">image_2/</code>). You can scrub or play through
              frames to see motion and, with camera files, compare 2D and LiDAR for the same id.
            </p>
            <p className="text-[11px]">
              Keys when a sequence is loaded: ← → step, space play/pause (not in text fields).{" "}
              <strong className="font-medium text-foreground">Recenter camera</strong> refits the 3D
              view; scrubbing keeps your angle so you can compare neighbors.
            </p>
          </div>
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
              disabled={!!sequence}
              className="max-w-[220px] text-[13px] file:mr-2 file:rounded-full file:border-0 file:bg-foreground/10 file:px-3 file:py-1.5 file:text-xs file:font-medium file:text-foreground disabled:opacity-40"
              onChange={(e) => void onCalib(e.target.files?.[0])}
            />
          </label>
          <label className="flex flex-col gap-1 text-xs text-muted">
            <span className="font-medium text-foreground">labels (optional)</span>
            <input
              id={labelsId}
              type="file"
              accept=".txt,text/plain"
              disabled={!!sequence}
              className="max-w-[220px] text-[13px] file:mr-2 file:rounded-full file:border-0 file:bg-foreground/10 file:px-3 file:py-1.5 file:text-xs file:font-medium file:text-foreground disabled:opacity-40"
              onChange={(e) => void onLabels(e.target.files?.[0])}
            />
          </label>
        </div>
      </div>

      {sequence && nFrames > 0 ? (
        <div className="rounded-2xl border border-border bg-surface px-4 py-4 sm:px-6">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-xs font-medium uppercase tracking-[0.18em] text-muted">
                Sequence
              </span>
              <span className="font-mono text-sm text-foreground">
                {currentFrameId} <span className="text-muted">·</span>{" "}
                {seqIndex + 1} / {nFrames}
              </span>
              {frameLoading ? (
                <span className="text-xs text-muted">Loading…</span>
              ) : null}
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <button
                type="button"
                aria-label="Previous frame"
                className="rounded-lg border border-border px-3 py-1.5 text-sm font-medium text-foreground hover:bg-foreground/[0.04]"
                onClick={() =>
                  setSeqIndex((i) => (i - 1 + nFrames) % nFrames)
                }
              >
                ←
              </button>
              <button
                type="button"
                aria-label="Next frame"
                className="rounded-lg border border-border px-3 py-1.5 text-sm font-medium text-foreground hover:bg-foreground/[0.04]"
                onClick={() => setSeqIndex((i) => (i + 1) % nFrames)}
              >
                →
              </button>
              <button
                type="button"
                className="rounded-lg bg-foreground px-3 py-1.5 text-sm font-medium text-background hover:opacity-90"
                onClick={() => setPlaying((p) => !p)}
              >
                {playing ? "Pause" : "Play"}
              </button>
              <label className="flex items-center gap-2 text-xs text-muted">
                <span>Step</span>
                <select
                  className="rounded-md border border-border bg-background px-2 py-1 text-foreground"
                  value={playbackMs}
                  onChange={(e) => setPlaybackMs(Number(e.target.value))}
                >
                  <option value={400}>Slow</option>
                  <option value={280}>Normal</option>
                  <option value={150}>Fast</option>
                </select>
              </label>
            </div>
          </div>
          <div className="mt-4">
            <label className="sr-only" htmlFor={scrubId}>
              Frame scrubber
            </label>
            <input
              id={scrubId}
              type="range"
              min={0}
              max={Math.max(0, nFrames - 1)}
              value={seqIndex}
              onChange={(e) => setSeqIndex(Number(e.target.value))}
              className="h-2 w-full cursor-pointer accent-foreground"
            />
          </div>
        </div>
      ) : null}

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

      <div
        className={`flex flex-col gap-4 ${cameraUrl ? "lg:flex-row lg:items-stretch" : ""}`}
      >
        <div
          className={`relative min-h-[420px] overflow-hidden rounded-xl border border-border shadow-sm ${cameraUrl ? "min-h-[min(72vh,640px)] flex-1 lg:min-h-[min(72vh,640px)]" : "h-[min(72vh,640px)] w-full"}`}
        >
          {cloud ? (
            <LidarCanvas
              cloud={cloud}
              calib={calib}
              labels={labels}
              colorMode={colorMode}
              refitKey={refitKey}
            />
          ) : (
            <div className="flex h-full min-h-[420px] items-center justify-center bg-[#0c0c0e] text-center text-sm text-slate-400">
              <div className="max-w-sm px-6">
                <p className="text-foreground">No point cloud loaded</p>
                <p className="mt-2 leading-relaxed">
                  Use <strong className="font-medium text-foreground">Load bundled demo</strong>,{" "}
                  <strong className="font-medium text-foreground">Load KITTI training folder</strong>
                  , or a single <code className="text-foreground">.bin</code>.
                </p>
              </div>
            </div>
          )}
        </div>
        {cameraUrl ? (
          <div className="flex w-full shrink-0 flex-col rounded-xl border border-border bg-[#0c0c0e] lg:w-[min(420px,42vw)]">
            <div className="border-b border-border px-3 py-2 text-xs font-medium uppercase tracking-wider text-muted">
              image_2 (synced frame)
            </div>
            <div className="relative flex flex-1 items-center justify-center p-2">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={cameraUrl}
                alt={`KITTI camera frame ${currentFrameId ?? ""}`}
                className="max-h-[min(56vh,520px)] w-full object-contain"
              />
            </div>
          </div>
        ) : null}
      </div>
    </div>
  );
}
