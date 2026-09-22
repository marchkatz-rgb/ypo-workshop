import type { ReactElement } from "react";
import type { Appearance, OrganismKind, SizeClass } from "../lib/types";

interface Props {
  appearance: Appearance;
  kind: OrganismKind;
  seed: string;
  /** Rendered pixel size (square). Omit when nesting inside another SVG. */
  size?: number;
  x?: number;
  y?: number;
  className?: string;
}

/** Deterministic pseudo-random numbers from a string, so art never changes between visits. */
function rng(seed: string) {
  let h = 2166136261;
  for (let i = 0; i < seed.length; i++) {
    h ^= seed.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return () => {
    h += 0x6d2b79f5;
    let t = h;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function darken(hex: string, amount = 0.25): string {
  const n = parseInt(hex.replace("#", ""), 16);
  if (Number.isNaN(n)) return hex;
  const r = Math.max(0, Math.round(((n >> 16) & 255) * (1 - amount)));
  const g = Math.max(0, Math.round(((n >> 8) & 255) * (1 - amount)));
  const b = Math.max(0, Math.round((n & 255) * (1 - amount)));
  return `#${((r << 16) | (g << 8) | b).toString(16).padStart(6, "0")}`;
}

export function sizeScale(size: SizeClass): number {
  return { tiny: 0.45, small: 0.65, medium: 0.85, large: 1.05, giant: 1.3 }[size];
}

/**
 * Draws a creature from its appearance settings. Everything is built from
 * simple shapes so the same settings always give the same picture.
 */
export function CreatureArt({ appearance: a, kind, seed, size, x, y, className }: Props) {
  const rand = rng(seed);
  const uid = "c" + seed.replace(/[^a-z0-9]/gi, "").slice(0, 12);
  const dark = darken(a.primary);
  const stroke = darken(a.primary, 0.5);
  const jitter = (n: number) => (rand() - 0.5) * n;

  // Body geometry in a 200x200 box. Front of the creature faces right.
  const cx = 100;
  const cy = 112;
  let bodyPath = "";
  let headX = 0;
  let headY = 0;
  let headR = 0;
  let bottomY = cy + 40;
  let topY = cy - 40;
  let backX = cx - 55;

  switch (a.bodyShape) {
    case "blob":
      bodyPath = ellipsePath(cx, cy, 52, 42);
      headX = cx + 44; headY = cy - 22; headR = 24; bottomY = cy + 42; topY = cy - 42; backX = cx - 52;
      break;
    case "slender":
      bodyPath = ellipsePath(cx, cy + 6, 74, 26);
      headX = cx + 66; headY = cy - 8; headR = 20; bottomY = cy + 32; topY = cy - 20; backX = cx - 74;
      break;
    case "segmented": {
      const parts = [];
      for (let i = 0; i < 4; i++) parts.push(ellipsePath(cx - 54 + i * 36, cy + 8 + jitter(4), 22 - i * 2, 20 - i * 2));
      bodyPath = parts.join(" ");
      headX = cx + 60; headY = cy; headR = 20; bottomY = cy + 28; topY = cy - 12; backX = cx - 76;
      break;
    }
    case "radial": {
      const arms = Math.max(3, Math.min(8, a.limbCount || 5));
      let d = "";
      for (let i = 0; i < arms; i++) {
        const ang = (i / arms) * Math.PI * 2 - Math.PI / 2;
        const ax = cx + Math.cos(ang) * 78;
        const ay = cy + Math.sin(ang) * 78;
        const l = ang - 0.32;
        const r = ang + 0.32;
        d += `M${cx + Math.cos(l) * 30},${cy + Math.sin(l) * 30} Q${ax},${ay} ${cx + Math.cos(r) * 30},${cy + Math.sin(r) * 30} Z `;
      }
      bodyPath = d + circlePath(cx, cy, 36);
      headX = cx; headY = cy; headR = 30; bottomY = cy + 40; topY = cy - 80; backX = cx - 80;
      break;
    }
    case "tree":
      bodyPath = `M${cx - 9},${cy + 70} L${cx - 6},${cy - 10} L${cx + 6},${cy - 10} L${cx + 9},${cy + 70} Z ` +
        circlePath(cx, cy - 30, 40) + circlePath(cx - 32, cy - 12, 26) + circlePath(cx + 34, cy - 14, 28);
      headX = cx; headY = cy - 30; headR = 40; bottomY = cy + 70; topY = cy - 70; backX = cx - 58;
      break;
    case "mushroom":
      bodyPath = `M${cx - 12},${cy + 70} L${cx - 10},${cy} L${cx + 10},${cy} L${cx + 12},${cy + 70} Z ` +
        `M${cx - 64},${cy + 4} A64,52 0 0 1 ${cx + 64},${cy + 4} L${cx + 64},${cy + 10} L${cx - 64},${cy + 10} Z`;
      headX = cx; headY = cy - 20; headR = 40; bottomY = cy + 70; topY = cy - 48; backX = cx - 64;
      break;
  }

  const hasHead = a.bodyShape !== "tree" && a.bodyShape !== "mushroom" && a.bodyShape !== "radial";
  const limbW = 6;
  const legs: ReactElement[] = [];
  const behind: ReactElement[] = [];
  const front: ReactElement[] = [];
  const n = Math.max(0, Math.min(8, a.limbCount));

  if (a.bodyShape !== "radial") {
    if (a.limbType === "legs" && n > 0) {
      const span = Math.min(110, (cx - backX) * 1.6);
      for (let i = 0; i < n; i++) {
        const lx = backX + 20 + (span / Math.max(1, n - 1 || 1)) * i * (n > 1 ? 1 : 0) + (n === 1 ? span / 2 : 0);
        const kneeX = lx + 6 + jitter(4);
        const ground = 186;
        legs.push(
          <path key={"leg" + i} d={`M${lx},${bottomY - 8} L${kneeX},${bottomY + 22} L${lx - 2},${ground}`} stroke={i % 2 ? dark : stroke} strokeWidth={limbW} fill="none" strokeLinecap="round" strokeLinejoin="round" />,
        );
      }
    }
    if (a.limbType === "tentacles" && n > 0) {
      for (let i = 0; i < n; i++) {
        const tx = backX + 24 + ((cx - backX) * 1.5 * i) / Math.max(1, n - 1 || 1);
        const sway = jitter(30);
        legs.push(
          <path key={"tent" + i} d={`M${tx},${bottomY - 6} C${tx + sway},${bottomY + 30} ${tx - sway},${bottomY + 50} ${tx + sway / 2},${bottomY + 76}`} stroke={i % 2 ? a.secondary : dark} strokeWidth={limbW} fill="none" strokeLinecap="round" />,
        );
      }
    }
    if (a.limbType === "roots" && n > 0) {
      for (let i = 0; i < n; i++) {
        const rx = cx - 20 + (40 * i) / Math.max(1, n - 1 || 1);
        legs.push(<path key={"root" + i} d={`M${cx},${bottomY - 4} Q${rx + jitter(10)},${bottomY + 20} ${rx + jitter(30)},${bottomY + 34}`} stroke={dark} strokeWidth={4} fill="none" strokeLinecap="round" />);
      }
    }
    if (a.limbType === "fins" && n > 0) {
      const finSpots = Math.min(n, 4);
      for (let i = 0; i < finSpots; i++) {
        const fx = backX + 30 + ((cx - backX) * 1.3 * i) / Math.max(1, finSpots - 1 || 1);
        const up = i % 2 === 0;
        const yy = up ? topY + 6 : bottomY - 6;
        const dir = up ? -1 : 1;
        front.push(<path key={"fin" + i} d={`M${fx - 14},${yy} L${fx + 4},${yy + dir * 34} L${fx + 22},${yy} Z`} fill={a.secondary} stroke={stroke} strokeWidth={2} />);
      }
      behind.push(<path key="tailfin" d={`M${backX + 4},${cy} L${backX - 34},${cy - 30} L${backX - 26},${cy} L${backX - 34},${cy + 30} Z`} fill={a.secondary} stroke={stroke} strokeWidth={2} />);
    }
    if (a.limbType === "wings" && n > 0) {
      const pairs = Math.max(1, Math.ceil(n / 2));
      for (let i = 0; i < pairs; i++) {
        const wx = cx - 10 - i * 26;
        behind.push(
          <path key={"wing" + i} d={`M${wx},${topY + 6} C${wx - 70},${topY - 60} ${wx + 40},${topY - 90} ${wx + 60},${topY - 20} L${wx + 30},${topY + 4} Z`} fill={a.secondary} stroke={stroke} strokeWidth={2} opacity={0.95} />,
        );
      }
    }
  }

  // Tail and horns
  if (a.tail && hasHead) {
    behind.push(<path key="tail" d={`M${backX + 6},${cy + 6} C${backX - 30},${cy - 10} ${backX - 40},${cy + 40} ${backX - 60},${cy + 20}`} stroke={dark} strokeWidth={8} fill="none" strokeLinecap="round" />);
  }
  if (a.horns) {
    const hx = hasHead ? headX : cx;
    const hy = hasHead ? headY - headR + 4 : topY + 6;
    front.push(<path key="hornL" d={`M${hx - 12},${hy} L${hx - 22},${hy - 30} L${hx - 2},${hy - 6} Z`} fill={a.secondary} stroke={stroke} strokeWidth={2} />);
    front.push(<path key="hornR" d={`M${hx + 10},${hy} L${hx + 22},${hy - 30} L${hx + 2},${hy - 6} Z`} fill={a.secondary} stroke={stroke} strokeWidth={2} />);
  }

  // Eyes
  const eyes: ReactElement[] = [];
  const eyeCount = Math.max(0, Math.min(8, a.eyes));
  const eyeCx = hasHead ? headX + 4 : cx;
  const eyeCy = hasHead ? headY - 2 : (a.bodyShape === "radial" ? cy : cy - 30);
  const spread = hasHead ? 9 : 16;
  for (let i = 0; i < eyeCount; i++) {
    const row = Math.floor(i / 4);
    const col = i % 4;
    const per = Math.min(eyeCount - row * 4, 4);
    const ex = eyeCx + (col - (per - 1) / 2) * spread;
    const ey = eyeCy + row * 12 - 4;
    const r = eyeCount > 4 ? 4 : 6;
    eyes.push(
      <g key={"eye" + i}>
        <circle cx={ex} cy={ey} r={r} fill="#fff" stroke={stroke} strokeWidth={1.5} />
        <circle cx={ex + 1.5} cy={ey} r={r * 0.5} fill="#111" />
      </g>,
    );
  }

  // Mouth for headed animals
  const mouth = hasHead && kind === "animal" ? (
    <path d={`M${headX + 6},${headY + 12} Q${headX + 14},${headY + 18} ${headX + 22},${headY + 10}`} stroke={stroke} strokeWidth={2.5} fill="none" strokeLinecap="round" />
  ) : null;

  // Covering overlays
  const overlays: ReactElement[] = [];
  const pat = `${uid}-pat`;
  const defs: ReactElement[] = [];
  const sec = a.secondary;
  switch (a.covering) {
    case "scales":
      defs.push(
        <pattern key="sc" id={pat} width="14" height="12" patternUnits="userSpaceOnUse">
          <path d="M0,12 A7,7 0 0 1 14,12" fill="none" stroke={dark} strokeWidth="1.5" />
          <path d="M-7,6 A7,7 0 0 1 7,6 M7,6 A7,7 0 0 1 21,6" fill="none" stroke={dark} strokeWidth="1.5" />
        </pattern>,
      );
      overlays.push(<rect key="scov" x="0" y="0" width="200" height="200" fill={`url(#${pat})`} opacity="0.6" />);
      break;
    case "fur":
      overlays.push(<path key="fur" d={bodyPath} fill="none" stroke={dark} strokeWidth="6" strokeDasharray="2 5" strokeLinecap="round" opacity="0.8" />);
      break;
    case "shell":
      overlays.push(<path key="shell" d={`M${backX + 10},${cy} A${(cx - backX)},${cy - topY + 10} 0 0 1 ${cx + (cx - backX) - 10},${cy} Z`} fill={sec} stroke={stroke} strokeWidth="2" opacity="0.95" />);
      overlays.push(<path key="shell2" d={`M${backX + 30},${cy - 6} Q${cx},${topY - 6} ${cx + (cx - backX) - 30},${cy - 6}`} fill="none" stroke={darken(sec)} strokeWidth="2" />);
      break;
    case "feathers":
      defs.push(
        <pattern key="fe" id={pat} width="16" height="14" patternUnits="userSpaceOnUse">
          <path d="M8,0 Q14,8 8,14 Q2,8 8,0 Z" fill={sec} stroke={dark} strokeWidth="1" opacity="0.7" />
        </pattern>,
      );
      overlays.push(<rect key="fcov" x="0" y="0" width="200" height="200" fill={`url(#${pat})`} opacity="0.7" />);
      break;
    case "bark":
      defs.push(
        <pattern key="ba" id={pat} width="8" height="20" patternUnits="userSpaceOnUse">
          <path d="M2,0 L3,20 M6,0 L5,20" stroke={dark} strokeWidth="1.5" opacity="0.7" />
        </pattern>,
      );
      overlays.push(<rect key="bcov" x="0" y="0" width="200" height="200" fill={`url(#${pat})`} />);
      break;
    case "leaves":
      defs.push(
        <pattern key="le" id={pat} width="22" height="18" patternUnits="userSpaceOnUse">
          <path d="M4,14 Q10,0 18,4 Q14,16 4,14 Z" fill={sec} stroke={dark} strokeWidth="1" opacity="0.85" />
        </pattern>,
      );
      overlays.push(<rect key="lcov" x="0" y="0" width="200" height="200" fill={`url(#${pat})`} />);
      break;
    case "slime":
      overlays.push(<ellipse key="sl" cx={cx - 10} cy={topY + 22} rx={22} ry={9} fill="#fff" opacity="0.35" />);
      break;
    case "smooth":
      overlays.push(<ellipse key="sh" cx={cx - 14} cy={topY + 20} rx={16} ry={6} fill="#fff" opacity="0.2" />);
      break;
  }
  if (a.pattern === "stripes") {
    defs.push(
      <pattern key="st" id={pat + "s"} width="18" height="18" patternUnits="userSpaceOnUse" patternTransform="rotate(70)">
        <rect width="8" height="18" fill={sec} opacity="0.8" />
      </pattern>,
    );
    overlays.unshift(<rect key="stc" x="0" y="0" width="200" height="200" fill={`url(#${pat}s)`} />);
  }
  if (a.pattern === "spots") {
    defs.push(
      <pattern key="sp" id={pat + "p"} width="22" height="22" patternUnits="userSpaceOnUse">
        <circle cx="7" cy="7" r="5" fill={sec} opacity="0.85" />
        <circle cx="18" cy="17" r="3.5" fill={sec} opacity="0.85" />
      </pattern>,
    );
    overlays.unshift(<rect key="spc" x="0" y="0" width="200" height="200" fill={`url(#${pat}p)`} />);
  }

  const clipId = `${uid}-clip`;
  const glowId = `${uid}-glow`;
  const svgProps = size !== undefined ? { width: size, height: size } : { x, y, width: 200, height: 200 };

  return (
    <svg viewBox="0 0 200 200" className={className} {...svgProps} overflow="visible" aria-hidden="true">
      <defs>
        <clipPath id={clipId}>
          <path d={bodyPath} />
          {hasHead ? <circle cx={headX} cy={headY} r={headR} /> : null}
        </clipPath>
        {a.glow ? (
          <filter id={glowId} x="-30%" y="-30%" width="160%" height="160%">
            <feGaussianBlur stdDeviation="6" result="b" />
            <feMerge><feMergeNode in="b" /><feMergeNode in="SourceGraphic" /></feMerge>
          </filter>
        ) : null}
        {defs}
      </defs>
      <g filter={a.glow ? `url(#${glowId})` : undefined}>
        {behind}
        {legs}
        <path d={bodyPath} fill={a.primary} stroke={stroke} strokeWidth="3" strokeLinejoin="round" />
        {hasHead ? <circle cx={headX} cy={headY} r={headR} fill={a.primary} stroke={stroke} strokeWidth="3" /> : null}
        <g clipPath={`url(#${clipId})`}>{overlays}</g>
        {front}
        {eyes}
        {mouth}
      </g>
    </svg>
  );
}

function ellipsePath(cx: number, cy: number, rx: number, ry: number): string {
  return `M${cx - rx},${cy} A${rx},${ry} 0 1 0 ${cx + rx},${cy} A${rx},${ry} 0 1 0 ${cx - rx},${cy} Z`;
}
function circlePath(cx: number, cy: number, r: number): string {
  return ellipsePath(cx, cy, r, r);
}
