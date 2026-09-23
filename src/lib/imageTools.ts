/**
 * Browser-side image helpers for reference drawings: downscale, crop,
 * "paper eraser" background removal, trimming, and encoding.
 */

export interface Rect {
  x: number;
  y: number;
  w: number;
  h: number;
}

/** Load an image file into a canvas no larger than maxSize on its longest side. */
export async function fileToCanvas(file: File, maxSize: number): Promise<HTMLCanvasElement> {
  const url = URL.createObjectURL(file);
  try {
    const img = await new Promise<HTMLImageElement>((resolve, reject) => {
      const el = new Image();
      el.onload = () => resolve(el);
      el.onerror = () => reject(new Error("That file doesn't look like an image."));
      el.src = url;
    });
    const scale = Math.min(1, maxSize / Math.max(img.naturalWidth, img.naturalHeight));
    const canvas = document.createElement("canvas");
    canvas.width = Math.max(1, Math.round(img.naturalWidth * scale));
    canvas.height = Math.max(1, Math.round(img.naturalHeight * scale));
    const ctx = canvas.getContext("2d")!;
    ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
    return canvas;
  } finally {
    URL.revokeObjectURL(url);
  }
}

export function cropCanvas(src: HTMLCanvasElement, r: Rect): HTMLCanvasElement {
  const out = document.createElement("canvas");
  out.width = Math.max(1, Math.round(r.w));
  out.height = Math.max(1, Math.round(r.h));
  out.getContext("2d")!.drawImage(src, r.x, r.y, r.w, r.h, 0, 0, out.width, out.height);
  return out;
}

export function scaleCanvas(src: HTMLCanvasElement, maxSize: number): HTMLCanvasElement {
  const scale = Math.min(1, maxSize / Math.max(src.width, src.height));
  if (scale === 1) return src;
  const out = document.createElement("canvas");
  out.width = Math.max(1, Math.round(src.width * scale));
  out.height = Math.max(1, Math.round(src.height * scale));
  out.getContext("2d")!.drawImage(src, 0, 0, out.width, out.height);
  return out;
}

/**
 * Paper eraser. Samples the color around the edges of the image (the paper),
 * then flood-fills inward from the edges, making every pixel close to that
 * color transparent. White areas fully enclosed by the drawing are kept, so a
 * creature's white belly survives. `tolerance` is 0-100.
 */
export function erasePaperBackground(src: HTMLCanvasElement, tolerance: number): HTMLCanvasElement {
  const w = src.width;
  const h = src.height;
  const ctx = src.getContext("2d")!;
  const img = ctx.getImageData(0, 0, w, h);
  const d = img.data;

  // Paper color: median of a ring of pixels around the border.
  const rs: number[] = [], gs: number[] = [], bs: number[] = [];
  const ring = Math.max(2, Math.round(Math.min(w, h) * 0.02));
  const step = Math.max(1, Math.round((w + h) / 400));
  for (let y = 0; y < h; y += step) {
    for (let x = 0; x < w; x += step) {
      if (x < ring || y < ring || x >= w - ring || y >= h - ring) {
        const i = (y * w + x) * 4;
        rs.push(d[i]); gs.push(d[i + 1]); bs.push(d[i + 2]);
      }
    }
  }
  const median = (a: number[]) => { const s = [...a].sort((p, q) => p - q); return s[Math.floor(s.length / 2)] ?? 255; };
  const pr = median(rs), pg = median(gs), pb = median(bs);

  // Distance threshold in RGB space; tolerance 0-100 maps to 0-~220.
  const thresh = (tolerance / 100) * 220;
  const thresh2 = thresh * thresh;
  const soft = Math.max(8, thresh * 0.35); // band for feathered edges
  const near = (i: number) => {
    const dr = d[i] - pr, dg = d[i + 1] - pg, db = d[i + 2] - pb;
    return dr * dr + dg * dg + db * db;
  };

  const visited = new Uint8Array(w * h);
  const queue = new Int32Array(w * h);
  let head = 0, tail = 0;
  const push = (p: number) => { if (!visited[p]) { visited[p] = 1; queue[tail++] = p; } };
  for (let x = 0; x < w; x++) { push(x); push((h - 1) * w + x); }
  for (let y = 0; y < h; y++) { push(y * w); push(y * w + w - 1); }

  while (head < tail) {
    const p = queue[head++];
    const i = p * 4;
    const dist2 = near(i);
    if (dist2 > thresh2) continue; // this pixel is drawing, stop here
    d[i + 3] = 0; // erase
    const x = p % w, y = (p - x) / w;
    if (x > 0) push(p - 1);
    if (x < w - 1) push(p + 1);
    if (y > 0) push(p - w);
    if (y < h - 1) push(p + w);
  }

  // Feather: pixels next to erased ones that are close to paper get partial alpha.
  const alpha = new Uint8ClampedArray(w * h);
  for (let p = 0; p < w * h; p++) alpha[p] = d[p * 4 + 3];
  for (let y = 1; y < h - 1; y++) {
    for (let x = 1; x < w - 1; x++) {
      const p = y * w + x;
      if (alpha[p] === 0) continue;
      const touchesErased = alpha[p - 1] === 0 || alpha[p + 1] === 0 || alpha[p - w] === 0 || alpha[p + w] === 0;
      if (!touchesErased) continue;
      const dist = Math.sqrt(near(p * 4));
      const t = Math.min(1, Math.max(0, (dist - thresh) / soft));
      d[p * 4 + 3] = Math.round(255 * Math.max(0.35, t));
    }
  }

  const out = document.createElement("canvas");
  out.width = w;
  out.height = h;
  out.getContext("2d")!.putImageData(img, 0, 0);
  return out;
}

/** Crop away fully transparent margins, leaving a small padding. */
export function trimTransparent(src: HTMLCanvasElement, pad = 6): HTMLCanvasElement {
  const w = src.width, h = src.height;
  const d = src.getContext("2d")!.getImageData(0, 0, w, h).data;
  let minX = w, minY = h, maxX = -1, maxY = -1;
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      if (d[(y * w + x) * 4 + 3] > 12) {
        if (x < minX) minX = x;
        if (x > maxX) maxX = x;
        if (y < minY) minY = y;
        if (y > maxY) maxY = y;
      }
    }
  }
  if (maxX < 0) return src; // nothing left; keep as is
  const r: Rect = {
    x: Math.max(0, minX - pad),
    y: Math.max(0, minY - pad),
    w: Math.min(w, maxX + pad + 1) - Math.max(0, minX - pad),
    h: Math.min(h, maxY + pad + 1) - Math.max(0, minY - pad),
  };
  return cropCanvas(src, r);
}

export function canvasToBlob(canvas: HTMLCanvasElement, type: "image/png" | "image/jpeg", quality?: number): Promise<Blob> {
  return new Promise((resolve, reject) => {
    canvas.toBlob((b) => (b ? resolve(b) : reject(new Error("Could not encode the image."))), type, quality);
  });
}

/** Squares off a transparent cutout so it sits on the bottom edge, like the app's own art. */
export function padToSquare(src: HTMLCanvasElement): HTMLCanvasElement {
  const size = Math.max(src.width, src.height);
  const out = document.createElement("canvas");
  out.width = size;
  out.height = size;
  out.getContext("2d")!.drawImage(src, Math.round((size - src.width) / 2), size - src.height);
  return out;
}
