import { useEffect, useRef, useState, type PointerEvent as ReactPointerEvent } from "react";
import { supabase } from "../lib/supabase";
import { drawingUrl, friendlyError, removeDrawingFiles } from "../lib/data";
import { canvasToBlob, cropCanvas, erasePaperBackground, fileToCanvas, padToSquare, scaleCanvas, trimTransparent, type Rect } from "../lib/imageTools";
import type { Drawing } from "../lib/types";

interface Props {
  planetId: string;
  organismId: string;
  value: Drawing | null | undefined;
  onChange: (d: Drawing | null) => void;
}

type Handle = "move" | "nw" | "ne" | "sw" | "se";

/**
 * Upload a drawing or photo, crop it, erase the paper background, flip it,
 * and save it to storage. Everything happens on the device before upload.
 */
export function DrawingEditor({ planetId, organismId, value, onChange }: Props) {
  const [source, setSource] = useState<HTMLCanvasElement | null>(null);
  const [crop, setCrop] = useState<Rect | null>(null);
  const [erase, setErase] = useState(true);
  const [tolerance, setTolerance] = useState(38);
  const [flip, setFlip] = useState(value?.flip ?? false);
  const [preview, setPreview] = useState<string>("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [sourceUrl, setSourceUrl] = useState("");
  // Where the photo actually sits inside the frame, in CSS pixels.
  const [disp, setDisp] = useState({ x: 0, y: 0, w: 1, h: 1 });
  const frameRef = useRef<HTMLDivElement>(null);
  const imgRef = useRef<HTMLImageElement>(null);
  const drag = useRef<{ handle: Handle; startX: number; startY: number; rect: Rect } | null>(null);
  const fileInput = useRef<HTMLInputElement>(null);

  function measure() {
    const img = imgRef.current, frame = frameRef.current;
    if (!img || !frame) return;
    const a = img.getBoundingClientRect(), b = frame.getBoundingClientRect();
    setDisp({ x: a.left - b.left, y: a.top - b.top, w: Math.max(1, a.width), h: Math.max(1, a.height) });
  }
  useEffect(() => {
    window.addEventListener("resize", measure);
    return () => window.removeEventListener("resize", measure);
  }, []);

  // Rebuild the preview whenever the crop, eraser, or tolerance changes.
  useEffect(() => {
    if (!source || !crop) return;
    const t = setTimeout(() => {
      try {
        let c = cropCanvas(source, crop);
        c = scaleCanvas(c, 700);
        if (erase) c = trimTransparent(erasePaperBackground(c, tolerance));
        setPreview(c.toDataURL("image/png"));
      } catch (e) {
        setError(friendlyError(e));
      }
    }, 120);
    return () => clearTimeout(t);
  }, [source, crop, erase, tolerance]);

  async function pick(file: File | undefined) {
    if (!file) return;
    setError("");
    setBusy(true);
    try {
      const c = await fileToCanvas(file, 1600);
      setSource(c);
      setSourceUrl(c.toDataURL("image/jpeg", 0.8));
      setCrop({ x: 0, y: 0, w: c.width, h: c.height });
    } catch (e) {
      setError(friendlyError(e));
    } finally {
      setBusy(false);
    }
  }

  function toImageCoords(e: ReactPointerEvent) {
    const r = imgRef.current!.getBoundingClientRect();
    const sx = source!.width / r.width;
    const sy = source!.height / r.height;
    return { x: (e.clientX - r.left) * sx, y: (e.clientY - r.top) * sy };
  }

  function onPointerDown(handle: Handle) {
    return (e: ReactPointerEvent) => {
      if (!crop) return;
      e.preventDefault();
      e.stopPropagation();
      (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
      const p = toImageCoords(e);
      drag.current = { handle, startX: p.x, startY: p.y, rect: { ...crop } };
    };
  }

  function onPointerMove(e: ReactPointerEvent) {
    if (!drag.current || !source) return;
    const p = toImageCoords(e);
    const dx = p.x - drag.current.startX;
    const dy = p.y - drag.current.startY;
    const r0 = drag.current.rect;
    const W = source.width, H = source.height, min = 24;
    let r: Rect = { ...r0 };
    switch (drag.current.handle) {
      case "move":
        r.x = Math.min(Math.max(0, r0.x + dx), W - r0.w);
        r.y = Math.min(Math.max(0, r0.y + dy), H - r0.h);
        break;
      case "nw": r = { x: r0.x + dx, y: r0.y + dy, w: r0.w - dx, h: r0.h - dy }; break;
      case "ne": r = { x: r0.x, y: r0.y + dy, w: r0.w + dx, h: r0.h - dy }; break;
      case "sw": r = { x: r0.x + dx, y: r0.y, w: r0.w - dx, h: r0.h + dy }; break;
      case "se": r = { x: r0.x, y: r0.y, w: r0.w + dx, h: r0.h + dy }; break;
    }
    // Keep the box inside the image and at least `min` big.
    if (r.w < min) { if (drag.current.handle === "nw" || drag.current.handle === "sw") r.x = r0.x + r0.w - min; r.w = min; }
    if (r.h < min) { if (drag.current.handle === "nw" || drag.current.handle === "ne") r.y = r0.y + r0.h - min; r.h = min; }
    if (r.x < 0) { r.w += r.x; r.x = 0; }
    if (r.y < 0) { r.h += r.y; r.y = 0; }
    if (r.x + r.w > W) r.w = W - r.x;
    if (r.y + r.h > H) r.h = H - r.y;
    setCrop(r);
  }

  function onPointerUp() {
    drag.current = null;
  }

  async function save() {
    if (!source || !crop) return;
    setBusy(true);
    setError("");
    try {
      let cut = cropCanvas(source, crop);
      cut = scaleCanvas(cut, 900);
      if (erase) cut = trimTransparent(erasePaperBackground(cut, tolerance));
      cut = padToSquare(cut);
      const stamp = Date.now().toString(36);
      const base = `${planetId}/${organismId}`;
      const originalPath = `${base}/original-${stamp}.jpg`;
      const cutoutPath = `${base}/cutout-${stamp}.png`;
      const [origBlob, cutBlob] = await Promise.all([
        canvasToBlob(scaleCanvas(source, 1400), "image/jpeg", 0.85),
        canvasToBlob(cut, "image/png"),
      ]);
      const bucket = supabase.storage.from("organism-art");
      const r1 = await bucket.upload(originalPath, origBlob, { contentType: "image/jpeg", upsert: true });
      if (r1.error) throw r1.error;
      const r2 = await bucket.upload(cutoutPath, cutBlob, { contentType: "image/png", upsert: true });
      if (r2.error) throw r2.error;
      if (value) removeDrawingFiles(value).catch(() => {});
      onChange({ originalPath, cutoutPath, flip });
      setSource(null);
      setPreview("");
      setSourceUrl("");
    } catch (e) {
      setError(friendlyError(e));
    } finally {
      setBusy(false);
    }
  }

  async function remove() {
    if (!value) return;
    if (!confirm("Remove this drawing? The app's own art will be used instead.")) return;
    await removeDrawingFiles(value).catch(() => {});
    onChange(null);
  }

  // Saved state: show the current drawing with replace / flip / remove.
  if (!source) {
    return (
      <div className="stack">
        <input ref={fileInput} type="file" accept="image/*" hidden onChange={(e) => pick(e.target.files?.[0])} />
        {value?.cutoutPath ? (
          <div className="drawing-current">
            <div className="art-frame" style={{ minHeight: 180 }}>
              <img src={drawingUrl(value.cutoutPath)} alt="Your drawing" style={{ maxWidth: 220, maxHeight: 220, transform: value.flip ? "scaleX(-1)" : undefined }} />
            </div>
            <div className="stack">
              <p className="small muted">This drawing is used everywhere the creature appears, including the region scenes.</p>
              <label className="row small"><input type="checkbox" checked={value.flip} onChange={(e) => onChange({ ...value, flip: e.target.checked })} /> Flip it so it faces the other way</label>
              <div className="row">
                <button type="button" className="btn btn-ghost btn-sm" onClick={() => fileInput.current?.click()} disabled={busy}>Replace drawing</button>
                <button type="button" className="btn btn-danger btn-sm" onClick={remove} disabled={busy}>Remove</button>
                <a className="btn btn-ghost btn-sm" href={drawingUrl(value.originalPath)} target="_blank" rel="noreferrer">View original</a>
              </div>
            </div>
          </div>
        ) : (
          <div className="stack">
            <p className="muted small">Drew it on paper or in a drawing app? Add a photo or picture of it. You can crop it and erase the paper so only the creature is left.</p>
            <button type="button" className="btn btn-accent" onClick={() => fileInput.current?.click()} disabled={busy}>{busy ? "Loading…" : "📷 Add your own drawing"}</button>
          </div>
        )}
        {error ? <p className="error small">{error}</p> : null}
      </div>
    );
  }

  const kx = disp.w / source.width, ky = disp.h / source.height;
  const cropStyle = crop
    ? { left: disp.x + crop.x * kx, top: disp.y + crop.y * ky, width: crop.w * kx, height: crop.h * ky }
    : undefined;

  return (
    <div className="drawing-editor">
      <div className="stack">
        <h3>1. Crop to the creature</h3>
        <p className="muted small">Drag the box or its corners. Leave a little paper around the edges.</p>
        <div className="crop-frame" ref={frameRef} style={disp.h > 1 ? { height: disp.h } : undefined} onPointerMove={onPointerMove} onPointerUp={onPointerUp} onPointerCancel={onPointerUp}>
          <img ref={imgRef} src={sourceUrl} alt="" draggable={false} onLoad={measure} />
          {crop ? (
            <div className="crop-box" style={cropStyle} onPointerDown={onPointerDown("move")}>
              <span className="crop-handle nw" onPointerDown={onPointerDown("nw")} />
              <span className="crop-handle ne" onPointerDown={onPointerDown("ne")} />
              <span className="crop-handle sw" onPointerDown={onPointerDown("sw")} />
              <span className="crop-handle se" onPointerDown={onPointerDown("se")} />
            </div>
          ) : null}
        </div>
        <div><button type="button" className="btn btn-ghost btn-sm" onClick={() => setCrop({ x: 0, y: 0, w: source.width, h: source.height })}>Reset crop</button></div>
      </div>
      <div className="stack">
        <h3>2. Erase the paper</h3>
        <label className="row small"><input type="checkbox" checked={erase} onChange={(e) => setErase(e.target.checked)} /> Erase the background</label>
        {erase ? (
          <label className="field small">Eraser strength: {tolerance}
            <input type="range" min={5} max={90} value={tolerance} onChange={(e) => setTolerance(Number(e.target.value))} />
            <span className="muted">Too low leaves paper behind. Too high eats light-colored parts of the creature.</span>
          </label>
        ) : null}
        <label className="row small"><input type="checkbox" checked={flip} onChange={(e) => setFlip(e.target.checked)} /> Flip so it faces right</label>
        <div className="art-frame checker" style={{ minHeight: 200 }}>
          {preview ? <img src={preview} alt="Preview" style={{ maxWidth: "100%", maxHeight: 260, transform: flip ? "scaleX(-1)" : undefined }} /> : <span className="muted">Preparing preview…</span>}
        </div>
        {error ? <p className="error small">{error}</p> : null}
        <div className="row">
          <button type="button" className="btn btn-primary" onClick={save} disabled={busy || !preview}>{busy ? "Saving…" : "Use this drawing"}</button>
          <button type="button" className="btn btn-ghost" onClick={() => { setSource(null); setPreview(""); setSourceUrl(""); }} disabled={busy}>Cancel</button>
        </div>
      </div>
    </div>
  );
}
