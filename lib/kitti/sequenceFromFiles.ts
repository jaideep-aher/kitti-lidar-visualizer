/** Build a KITTI object-style sequence index from a directory upload (webkitRelativePath). */

export type FrameBundle = {
  id: string;
  bin?: File;
  calib?: File;
  label?: File;
  image?: File;
};

const NUMERIC_ID = /^\d+$/;

function basenameStem(name: string): string {
  const i = name.lastIndexOf(".");
  return i === -1 ? name : name.slice(0, i);
}

function parentFolder(segments: string[]): string | undefined {
  if (segments.length < 2) return undefined;
  return segments[segments.length - 2]?.toLowerCase();
}

export function classifyKittiFile(
  webkitRelativePath: string,
  fileName: string
): { kind: keyof FrameBundle; id: string } | null {
  const segs = webkitRelativePath.replace(/\\/g, "/").split("/").filter(Boolean);
  const stem = basenameStem(fileName);
  if (!NUMERIC_ID.test(stem)) return null;

  const parent = parentFolder(segs);
  const lower = fileName.toLowerCase();

  if (parent === "velodyne" && lower.endsWith(".bin")) {
    return { kind: "bin", id: stem };
  }
  if (parent === "label_2" && lower.endsWith(".txt")) {
    return { kind: "label", id: stem };
  }
  if (parent === "calib" && lower.endsWith(".txt")) {
    return { kind: "calib", id: stem };
  }
  if (
    parent === "image_2" &&
    (lower.endsWith(".png") || lower.endsWith(".jpg") || lower.endsWith(".jpeg"))
  ) {
    return { kind: "image", id: stem };
  }

  return null;
}

export function buildSequenceFromFileList(files: FileList | File[]): {
  frameIds: string[];
  bundles: Map<string, FrameBundle>;
} | null {
  const list = Array.from(files);
  const bundles = new Map<string, FrameBundle>();

  for (const file of list) {
    const rel = file.webkitRelativePath || file.name;
    const classified = classifyKittiFile(rel, file.name);
    if (!classified) continue;

    let b = bundles.get(classified.id);
    if (!b) {
      b = { id: classified.id };
      bundles.set(classified.id, b);
    }

    if (classified.kind === "bin") b.bin = file;
    else if (classified.kind === "label") b.label = file;
    else if (classified.kind === "calib") b.calib = file;
    else if (classified.kind === "image") b.image = file;
  }

  const withBin = [...bundles.entries()].filter(([, v]) => v.bin != null);
  if (withBin.length === 0) return null;

  const frameIds = withBin
    .map(([id]) => id)
    .sort((a, b) => parseInt(a, 10) - parseInt(b, 10));

  return { frameIds, bundles };
}

export function resolveCalibFile(
  frameId: string,
  frameIds: string[],
  bundles: Map<string, FrameBundle>
): File | undefined {
  const idx = frameIds.indexOf(frameId);
  if (idx === -1) return undefined;
  for (let i = idx; i >= 0; i--) {
    const c = bundles.get(frameIds[i])?.calib;
    if (c) return c;
  }
  for (let i = idx + 1; i < frameIds.length; i++) {
    const c = bundles.get(frameIds[i])?.calib;
    if (c) return c;
  }
  return undefined;
}
