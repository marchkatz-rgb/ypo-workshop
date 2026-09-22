import type {
  AirMix,
  Atmosphere,
  DayLength,
  Gravity,
  Moons,
  Orbit,
  PlanetConfig,
  PlanetSize,
  Seasons,
  StarType,
  Water,
} from "./types";

export interface Choice<T extends string> {
  value: T;
  label: string;
  blurb: string; // the consequence, in plain language
}

export interface PlanetStep<K extends keyof PlanetConfig> {
  key: K;
  title: string;
  question: string;
  choices: Choice<PlanetConfig[K]>[];
}

export const STAR_CHOICES: Choice<StarType>[] = [
  { value: "red_dwarf", label: "Red dwarf", blurb: "Small, dim, and lives for trillions of years. Light is reddish and weak, so plants may need dark leaves to catch it. Flares can be violent." },
  { value: "orange", label: "Orange star", blurb: "A bit cooler and calmer than our Sun, and lives much longer. A steady, gentle home for life." },
  { value: "yellow", label: "Yellow star (like our Sun)", blurb: "Bright white-yellow light, about a 10-billion-year life. Familiar conditions for Earth-style life." },
  { value: "blue_white", label: "Blue-white giant", blurb: "Huge, blazing hot, and burns out in only millions of years. Intense ultraviolet light. Life would have to evolve fast and protect itself." },
];

export const ORBIT_CHOICES: Choice<Orbit>[] = [
  { value: "close", label: "Close to the star", blurb: "Hot. Oceans could boil away unless the atmosphere is thin. Short years." },
  { value: "habitable", label: "In the habitable zone", blurb: "Just right for liquid water on the surface. The classic place to look for life." },
  { value: "far", label: "Far from the star", blurb: "Cold and dim. Water freezes unless a thick atmosphere or volcanic heat keeps things warm. Long years." },
];

export const SIZE_CHOICES: Choice<PlanetSize>[] = [
  { value: "small", label: "Small (like Mars)", blurb: "Less mass, so it struggles to hold onto a thick atmosphere over time. Cools down faster inside, so fewer volcanoes." },
  { value: "earthlike", label: "Earth-sized", blurb: "Big enough to keep an atmosphere and stay geologically active for billions of years." },
  { value: "super", label: "Super-Earth", blurb: "Bigger than Earth. Holds a thick atmosphere easily. Deep oceans and strong volcanoes are likely." },
];

export const GRAVITY_CHOICES: Choice<Gravity>[] = [
  { value: "low", label: "Low gravity", blurb: "Creatures can grow tall and thin, jump far, and fly easily. Bones and stems can be lighter." },
  { value: "earthlike", label: "Earth-like gravity", blurb: "Bodies like the ones we know: sturdy legs, trees that stand tall, birds that fly with effort." },
  { value: "high", label: "High gravity", blurb: "Everything is heavier. Life tends to be low, wide, and strong. Flying is very hard. Falls are deadly." },
];

export const DAY_CHOICES: Choice<DayLength>[] = [
  { value: "short", label: "Short days (a few hours)", blurb: "Rapid day-night cycles. Temperatures stay even. Sleep and hunting rhythms would be quick." },
  { value: "earthlike", label: "Earth-like days", blurb: "Familiar rhythm of morning, noon, and night." },
  { value: "long", label: "Very long days (weeks)", blurb: "Scorching days and freezing nights. Life may migrate, hibernate, or burrow to survive each cycle." },
  { value: "tidally_locked", label: "Tidally locked", blurb: "One side always faces the star, the other is always dark. A ring of eternal twilight between them may be the best place for life." },
];

export const ATMOSPHERE_CHOICES: Choice<Atmosphere>[] = [
  { value: "none", label: "No atmosphere", blurb: "Airless like the Moon. No wind, no sound, no flight, brutal temperature swings. Life would have to be underground or under ice." },
  { value: "thin", label: "Thin atmosphere", blurb: "Little air to breathe or fly in. Weak weather. Big temperature swings between day and night." },
  { value: "earthlike", label: "Earth-like atmosphere", blurb: "Enough air for weather, flight, and easy breathing." },
  { value: "thick", label: "Thick atmosphere", blurb: "Dense, soupy air. Flying and floating are easy, even for big creatures. Strong greenhouse warming. Dim light at the surface." },
];

export const AIR_CHOICES: Choice<AirMix>[] = [
  { value: "oxygen", label: "Oxygen and nitrogen", blurb: "Like Earth. Oxygen is a sign that something is making it, usually photosynthesis. Fire is possible." },
  { value: "carbon_dioxide", label: "Mostly carbon dioxide", blurb: "Like Venus or Mars. Strong greenhouse effect. Animals would need a different way to get energy than breathing oxygen." },
  { value: "methane", label: "Methane haze", blurb: "Like Titan. Orange smog that blocks light. Chemistry runs slow and cold. Life might use liquid methane instead of water." },
  { value: "hydrogen", label: "Hydrogen-rich", blurb: "Very light gas, like a mini gas giant. Floating creatures could fill their bodies with it to rise like balloons." },
];

export const WATER_CHOICES: Choice<Water>[] = [
  { value: "dry", label: "Desert world", blurb: "Almost no surface water. Life clusters around underground water and morning dew. Water-saving is everything." },
  { value: "lakes", label: "Lakes and rivers", blurb: "Mostly land with scattered water. Lots of shoreline, which is great for evolving new species." },
  { value: "oceans", label: "Oceans and continents", blurb: "Like Earth. Deep oceans, wide beaches, and plenty of land for big animals." },
  { value: "waterworld", label: "Water world", blurb: "Almost no land. Life must swim, float, or fly. Islands are rare treasures." },
];

export const SEASON_CHOICES: Choice<Seasons>[] = [
  { value: "none", label: "No seasons", blurb: "The planet stands straight up. Every day is like every other. Life doesn't need to migrate or store food." },
  { value: "mild", label: "Mild seasons", blurb: "Gentle tilt, like Earth. Spring, summer, autumn, winter." },
  { value: "extreme", label: "Extreme seasons", blurb: "Tipped way over on its side. Months of daylight, then months of darkness. Life must migrate, hibernate, or store energy." },
];

export const MOON_CHOICES: Choice<Moons>[] = [
  { value: "none", label: "No moons", blurb: "Weak tides. Fewer tidal pools, so the sea-to-land path is harder. The planet may wobble over time." },
  { value: "one", label: "One big moon", blurb: "Strong tides that stir up nutrients and steady the planet's tilt. Bright nights for hunting or hiding." },
  { value: "many", label: "Several moons", blurb: "Complicated tides that rise and fall in tangled patterns. Many bright and dark nights." },
];

export const PLANET_STEPS = [
  { key: "star", title: "The star", question: "What kind of star does your planet orbit?", choices: STAR_CHOICES },
  { key: "orbit", title: "Distance", question: "How far is the planet from its star?", choices: ORBIT_CHOICES },
  { key: "size", title: "Size", question: "How big is the planet?", choices: SIZE_CHOICES },
  { key: "gravity", title: "Gravity", question: "How strong is gravity at the surface?", choices: GRAVITY_CHOICES },
  { key: "day", title: "Day length", question: "How fast does the planet spin?", choices: DAY_CHOICES },
  { key: "atmosphere", title: "Atmosphere", question: "How much air does it have?", choices: ATMOSPHERE_CHOICES },
  { key: "air", title: "What the air is made of", question: "What is the air mostly made of?", choices: AIR_CHOICES },
  { key: "water", title: "Water", question: "How much liquid water is on the surface?", choices: WATER_CHOICES },
  { key: "seasons", title: "Seasons", question: "How tilted is the planet?", choices: SEASON_CHOICES },
  { key: "moons", title: "Moons", question: "How many moons does it have?", choices: MOON_CHOICES },
] as const;

export const DEFAULT_PLANET: PlanetConfig = {
  star: "yellow",
  orbit: "habitable",
  size: "earthlike",
  gravity: "earthlike",
  day: "earthlike",
  atmosphere: "earthlike",
  air: "oxygen",
  water: "oceans",
  seasons: "mild",
  moons: "one",
};

export function labelFor<K extends keyof PlanetConfig>(key: K, value: PlanetConfig[K]): string {
  const step = PLANET_STEPS.find((s) => s.key === key);
  const choice = step?.choices.find((c) => c.value === value);
  return choice?.label ?? String(value);
}

/** Rough surface temperature band, derived from star, orbit and atmosphere. */
export function climateOf(c: PlanetConfig): { label: string; score: number } {
  let score = 0;
  score += { red_dwarf: -1, orange: -0.5, yellow: 0, blue_white: 1.5 }[c.star];
  score += { close: 2, habitable: 0, far: -2 }[c.orbit];
  score += { none: -1, thin: -0.5, earthlike: 0, thick: 1.5 }[c.atmosphere];
  if (c.air === "carbon_dioxide" && c.atmosphere !== "none") score += 1;
  if (c.air === "methane" && c.atmosphere !== "none") score += 0.5;
  let label = "Temperate";
  if (score >= 2.5) label = "Scorching";
  else if (score >= 1) label = "Hot";
  else if (score <= -2.5) label = "Frozen";
  else if (score <= -1) label = "Cold";
  return { label, score };
}

export function starColor(star: StarType): { disc: string; sky: string; skyLow: string } {
  switch (star) {
    case "red_dwarf":
      return { disc: "#ff6b4a", sky: "#3a1f2e", skyLow: "#8a3b3b" };
    case "orange":
      return { disc: "#ffb347", sky: "#3b2f4a", skyLow: "#c2723a" };
    case "yellow":
      return { disc: "#fff2b0", sky: "#3b6fb6", skyLow: "#9fd0f5" };
    case "blue_white":
      return { disc: "#dff4ff", sky: "#2b4a8a", skyLow: "#b9e0ff" };
  }
}

/** Plain-language facts the app and the mentor use to keep life consistent. */
export function planetFacts(c: PlanetConfig): string[] {
  const facts: string[] = [];
  const climate = climateOf(c);
  facts.push(`Climate: ${climate.label.toLowerCase()} overall.`);
  if (c.star === "red_dwarf") facts.push("Light is dim and red, so plants may be dark-colored or black to catch every photon, and flares can strip unprotected skin.");
  if (c.star === "blue_white") facts.push("Ultraviolet light is intense, so life needs sunscreen: pigments, shells, or living underwater.");
  if (c.gravity === "high") facts.push("Gravity is strong, so bodies are low and wide, bones thick, and flight nearly impossible for anything big.");
  if (c.gravity === "low") facts.push("Gravity is weak, so creatures can be tall, thin, and springy, and flight is easy.");
  if (c.atmosphere === "none") facts.push("There is no air: no breathing, no flight, no sound, and no liquid water on the open surface.");
  if (c.atmosphere === "thin") facts.push("The air is thin, so flight needs huge wings and breathing needs large lungs or gills.");
  if (c.atmosphere === "thick") facts.push("The air is thick and soupy, so even large creatures can fly or float, and sound carries far.");
  if (c.air === "carbon_dioxide") facts.push("There is little free oxygen, so animals can't breathe the way Earth animals do.");
  if (c.air === "methane") facts.push("Orange methane haze dims the surface and chemistry runs cold and slow.");
  if (c.air === "hydrogen") facts.push("Hydrogen air lets creatures float by filling sacs with lighter gas.");
  if (c.water === "dry") facts.push("Surface water is scarce, so every organism must find, store, or make its own water.");
  if (c.water === "waterworld") facts.push("There is almost no land, so life swims, floats, or flies.");
  if (c.day === "tidally_locked") facts.push("One side is always day and one always night; the twilight ring between them is the mildest place.");
  if (c.day === "long") facts.push("Days last weeks, so temperatures swing from scorching to freezing within one day.");
  if (c.seasons === "extreme") facts.push("Seasons are extreme: months of light, then months of dark. Life migrates, hibernates, or stores energy.");
  if (c.moons === "none") facts.push("With no moon the tides are weak and tidal pools are rare.");
  if (c.moons === "many") facts.push("Several moons make tangled, unpredictable tides.");
  if (c.size === "small") facts.push("The planet is small, so its atmosphere leaks away slowly over ages and volcanoes are rare.");
  if (c.size === "super") facts.push("The planet is a super-Earth with a deep interior, strong volcanoes, and probably deep oceans.");
  return facts;
}
