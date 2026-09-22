import type { PlanetConfig, RegionKind } from "./types";

export interface RegionKindInfo {
  value: RegionKind;
  label: string;
  blurb: string;
  water: boolean; // is this region mostly liquid?
  dark: boolean; // is there little or no light?
  air: boolean; // is it in the open air?
  scene: "sea" | "land" | "sky" | "cave" | "ice" | "lava" | "dusk";
  ground: string;
  groundLow: string;
}

export const REGION_KINDS: RegionKindInfo[] = [
  { value: "shallow_sea", label: "Shallow sea", blurb: "Sunlit water near land. Reefs, tide pools, and lots of food.", water: true, dark: false, air: false, scene: "sea", ground: "#2f8fbf", groundLow: "#154f7a" },
  { value: "deep_sea", label: "Deep sea", blurb: "Cold, pitch dark, crushing pressure. Life glows or eats what sinks from above.", water: true, dark: true, air: false, scene: "sea", ground: "#0b2340", groundLow: "#02101f" },
  { value: "coast", label: "Coast", blurb: "Where water meets land. Tides, mud, and creatures that live in both worlds.", water: false, dark: false, air: true, scene: "land", ground: "#d8c48b", groundLow: "#8b7a4a" },
  { value: "plains", label: "Plains", blurb: "Wide open ground. Great for herds, runners, and things that hide in the grass.", water: false, dark: false, air: true, scene: "land", ground: "#8fbf5a", groundLow: "#4d7a2c" },
  { value: "forest", label: "Forest", blurb: "Tall plants and shade. Climbers, gliders, and ambush hunters.", water: false, dark: false, air: true, scene: "land", ground: "#3f7d3a", groundLow: "#1f4a1c" },
  { value: "desert", label: "Desert", blurb: "Dry, hot by day, cold by night. Water-savers and burrowers.", water: false, dark: false, air: true, scene: "land", ground: "#e0a85a", groundLow: "#9a6a2c" },
  { value: "mountains", label: "Mountains", blurb: "Thin air, steep rock, and cold. Climbers and soaring gliders.", water: false, dark: false, air: true, scene: "land", ground: "#8a8a95", groundLow: "#4a4a55" },
  { value: "ice", label: "Ice cap", blurb: "Frozen and bright. Insulation, fat, and fur matter here.", water: false, dark: false, air: true, scene: "ice", ground: "#dbeefb", groundLow: "#9dbbd6" },
  { value: "volcanic", label: "Volcanic fields", blurb: "Heat, ash, and minerals. Chemistry-eaters and heat-lovers thrive.", water: false, dark: false, air: true, scene: "lava", ground: "#4a3030", groundLow: "#1f0f0f" },
  { value: "caves", label: "Caves", blurb: "Total darkness underground. Eyes are useless; touch, smell, and sound rule.", water: false, dark: true, air: true, scene: "cave", ground: "#4a4038", groundLow: "#1f1a15" },
  { value: "sky", label: "The open sky", blurb: "Life that never lands: floaters, gliders, and cloud grazers.", water: false, dark: false, air: true, scene: "sky", ground: "#b9d6f2", groundLow: "#7fa9d6" },
  { value: "twilight", label: "Twilight ring", blurb: "The permanent dusk band on a tidally locked world. Mild and windy.", water: false, dark: false, air: true, scene: "dusk", ground: "#7a6a8f", groundLow: "#3f3550" },
  { value: "nightside", label: "Night side", blurb: "Never sees the star. Frozen, dark, and heated only from below.", water: false, dark: true, air: true, scene: "cave", ground: "#2a2f45", groundLow: "#101423" },
];

export function regionInfo(kind: RegionKind): RegionKindInfo {
  return REGION_KINDS.find((r) => r.value === kind) ?? REGION_KINDS[3];
}

/** Which region types make sense for this planet. */
export function suggestedRegionKinds(c: PlanetConfig): RegionKindInfo[] {
  return REGION_KINDS.filter((r) => {
    if (r.value === "twilight" || r.value === "nightside") return c.day === "tidally_locked";
    if (r.water && c.water === "dry") return false;
    if (r.value === "sky" && (c.atmosphere === "none" || c.atmosphere === "thin")) return false;
    if (!r.water && r.value !== "caves" && c.water === "waterworld" && r.value !== "coast" && r.value !== "sky") return false;
    if (r.value === "ice" && (c.orbit === "close")) return false;
    return true;
  });
}
