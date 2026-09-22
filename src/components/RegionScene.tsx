import { CreatureArt, sizeScale } from "./CreatureArt";
import { regionInfo } from "../lib/regionOptions";
import { starColor } from "../lib/planetOptions";
import type { Organism, PlanetConfig, Region } from "../lib/types";

interface Props {
  planet: PlanetConfig;
  region: Region;
  organisms: Organism[];
  onSelect?: (o: Organism) => void;
  height?: number;
}

const W = 800;
const H = 420;

/** A stylized view of one region with its creatures placed and gently moving. */
export function RegionScene({ planet, region, organisms, onSelect, height }: Props) {
  const ri = regionInfo(region.kind);
  const star = starColor(planet.star);
  const dark = ri.dark;
  const uid = "sc" + region.id.replace(/[^a-z0-9]/gi, "").slice(0, 10);
  const skyTop = dark ? "#05070f" : star.sky;
  const skyBottom = dark ? "#0b1020" : star.skyLow;
  const waterLine = ri.scene === "sea" ? 120 : ri.value === "coast" ? 300 : null;
  const groundLine = ri.scene === "sea" ? H : ri.scene === "sky" ? H : 300;

  const flyers = organisms.filter((o) => o.traits.locomotion === "flying" || o.traits.locomotion === "gliding" || o.traits.locomotion === "drifting" && ri.scene !== "sea");
  const swimmers = organisms.filter((o) => !flyers.includes(o) && (o.traits.locomotion === "swimming" || (ri.scene === "sea" && o.traits.locomotion === "drifting")));
  const walkers = organisms.filter((o) => !flyers.includes(o) && !swimmers.includes(o));

  const place = (list: Organism[], yMin: number, yMax: number, band: string) =>
    list.map((o, i) => {
      const px = sizeScale(o.traits.size) * 150;
      const slots = list.length;
      const x = 40 + ((W - 80 - px) * (slots === 1 ? 0.5 : i / (slots - 1)));
      const rawY = band === "ground" ? groundLine - px * 0.93 : yMin + ((yMax - yMin) * ((i * 37) % 100)) / 100;
      const y = Math.min(rawY, H - px - 24);
      return (
        <g key={o.id} transform={`translate(${x},${y})`}>
          <g
            className={`creature ${band}`}
            style={{ animationDelay: `${(i * 0.7) % 3}s` }}
            onClick={() => onSelect?.(o)}
            role={onSelect ? "button" : undefined}
            tabIndex={onSelect ? 0 : undefined}
            onKeyDown={(e) => { if (e.key === "Enter") onSelect?.(o); }}
          >
            <title>{o.name}</title>
            <svg width={px} height={px} viewBox="0 0 200 200" overflow="visible">
              <CreatureArt appearance={o.appearance} kind={o.kind} seed={o.id} x={0} y={0} />
            </svg>
            <text x={px / 2} y={px + 14} textAnchor="middle" className="creature-label">{o.name}</text>
          </g>
        </g>
      );
    });

  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="scene" style={{ height }} preserveAspectRatio="xMidYMid slice" role="img" aria-label={`${region.name}, a ${ri.label.toLowerCase()} region`}>
      <defs>
        <linearGradient id={uid + "sky"} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor={skyTop} />
          <stop offset="1" stopColor={skyBottom} />
        </linearGradient>
        <linearGradient id={uid + "ground"} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor={ri.ground} />
          <stop offset="1" stopColor={ri.groundLow} />
        </linearGradient>
        <linearGradient id={uid + "water"} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor={dark ? "#0a2038" : "#3aa0d8"} stopOpacity="0.9" />
          <stop offset="1" stopColor={dark ? "#020a14" : "#124a7a"} />
        </linearGradient>
      </defs>
      <rect width={W} height={H} fill={`url(#${uid}sky)`} />

      {/* star and moons */}
      {!dark && ri.scene !== "cave" ? (
        <circle cx={ri.scene === "dusk" ? 60 : 660} cy={ri.scene === "dusk" ? 300 : 70} r={planet.star === "red_dwarf" ? 44 : planet.star === "blue_white" ? 26 : 34} fill={star.disc} opacity={0.95} />
      ) : null}
      {planet.moons !== "none" && ri.scene !== "cave" && ri.scene !== "sea" ? <circle cx={140} cy={80} r={14} fill="#e8e8f0" opacity={0.7} /> : null}
      {planet.moons === "many" && ri.scene !== "cave" && ri.scene !== "sea" ? <><circle cx={220} cy={50} r={8} fill="#e8e8f0" opacity={0.6} /><circle cx={100} cy={140} r={6} fill="#e8e8f0" opacity={0.5} /></> : null}
      {dark ? Array.from({ length: 18 }, (_, i) => <circle key={i} cx={(i * 97) % W} cy={(i * 53) % 200} r={1.4} fill="#fff" opacity={0.6} />) : null}

      {/* clouds in the sky region */}
      {ri.scene === "sky" ? (
        <g opacity={0.85} fill="#ffffff">
          <ellipse cx={150} cy={330} rx={140} ry={34} /><ellipse cx={420} cy={360} rx={180} ry={40} /><ellipse cx={690} cy={320} rx={120} ry={30} />
        </g>
      ) : null}

      {/* cave ceiling */}
      {ri.scene === "cave" ? (
        <path d={`M0,0 L${W},0 L${W},90 Q700,60 640,130 Q600,40 520,110 Q470,50 400,120 Q330,60 260,110 Q200,50 130,120 Q60,60 0,100 Z`} fill="#241c16" />
      ) : null}

      {/* ground or sea */}
      {ri.scene === "sea" ? (
        <>
          <rect x={0} y={waterLine ?? 0} width={W} height={H} fill={`url(#${uid}water)`} />
          <path d={`M0,${waterLine} Q100,${(waterLine ?? 0) - 12} 200,${waterLine} T400,${waterLine} T600,${waterLine} T800,${waterLine} L800,${(waterLine ?? 0) + 30} L0,${(waterLine ?? 0) + 30} Z`} fill="#ffffff" opacity={0.25} />
          <path d={`M0,${H} L0,${H - 40} Q200,${H - 80} 400,${H - 50} T800,${H - 60} L800,${H} Z`} fill={`url(#${uid}ground)`} />
        </>
      ) : ri.scene !== "sky" ? (
        <>
          <path d={`M0,${groundLine} Q150,${groundLine - 30} 300,${groundLine} T600,${groundLine} T800,${groundLine} L800,${H} L0,${H} Z`} fill={`url(#${uid}ground)`} />
          {ri.value === "coast" ? <rect x={520} y={groundLine + 10} width={W} height={H} fill={`url(#${uid}water)`} opacity={0.9} /> : null}
          {ri.value === "mountains" ? <path d={`M0,${groundLine} L120,150 L220,${groundLine - 40} L340,110 L470,${groundLine - 30} L600,140 L800,${groundLine}`} fill="#6b6b78" opacity={0.8} /> : null}
          {ri.scene === "lava" ? <path d={`M60,${groundLine + 50} Q200,${groundLine + 30} 330,${groundLine + 70} T620,${groundLine + 60}`} stroke="#ff7a1a" strokeWidth={6} fill="none" opacity={0.9} /> : null}
          {ri.value === "forest" ? Array.from({ length: 6 }, (_, i) => <g key={i}><rect x={60 + i * 130} y={groundLine - 120} width={14} height={120} fill="#3a2a1a" /><circle cx={67 + i * 130} cy={groundLine - 130} r={44} fill={planet.star === "red_dwarf" ? "#3a2a4a" : "#2e7d32"} /></g>) : null}
          {ri.value === "desert" ? <circle cx={600} cy={groundLine + 60} r={40} fill="#c98a3a" opacity={0.6} /> : null}
        </>
      ) : null}

      {place(flyers, 30, 150, "air")}
      {place(swimmers, (waterLine ?? 120) + 20, H - 150, "water")}
      {place(walkers, 0, 0, "ground")}

      {organisms.length === 0 ? (
        <text x={W / 2} y={H / 2} textAnchor="middle" className="scene-empty">No life here yet</text>
      ) : null}
    </svg>
  );
}
