import type {
  Activity,
  Appearance,
  BodyShape,
  Breathing,
  Covering,
  Defense,
  Diet,
  LimbType,
  Locomotion,
  OrganismKind,
  OrganismTraits,
  Pattern,
  Reproduction,
  Sense,
  SizeClass,
  Social,
} from "./types";

export interface Opt<T extends string> {
  value: T;
  label: string;
  blurb: string;
}

export const KIND_OPTIONS: Opt<OrganismKind>[] = [
  { value: "animal", label: "Animal", blurb: "Moves, eats other things, senses the world." },
  { value: "plant", label: "Plant", blurb: "Makes its own food from light or chemicals. Usually stays put." },
  { value: "fungus", label: "Fungus", blurb: "Breaks down dead things or lives inside others. Spreads with spores." },
  { value: "microbe", label: "Microbe", blurb: "Tiny single cells. The first life on most worlds, and the toughest." },
];

export const SIZE_OPTIONS: Opt<SizeClass>[] = [
  { value: "tiny", label: "Tiny", blurb: "Smaller than a coin. Easy to hide, easy to eat." },
  { value: "small", label: "Small", blurb: "Mouse to cat sized." },
  { value: "medium", label: "Medium", blurb: "Dog to human sized." },
  { value: "large", label: "Large", blurb: "Horse to elephant sized. Needs lots of food." },
  { value: "giant", label: "Giant", blurb: "Bigger than a whale. Only possible where gravity or water supports it." },
];

export const DIET_OPTIONS: Opt<Diet>[] = [
  { value: "photosynthesis", label: "Sunlight (photosynthesis)", blurb: "Turns light into food. Needs light, water, and gas from the air." },
  { value: "chemosynthesis", label: "Chemicals (chemosynthesis)", blurb: "Eats minerals or volcanic chemicals. Works in total darkness." },
  { value: "herbivore", label: "Plant-eater", blurb: "Eats plants. Needs big guts to digest tough leaves." },
  { value: "carnivore", label: "Meat-eater", blurb: "Hunts animals. Needs speed, stealth, or strength." },
  { value: "omnivore", label: "Eats anything", blurb: "Plants and animals. Flexible, survives change." },
  { value: "filter_feeder", label: "Filter feeder", blurb: "Strains tiny food from water or air." },
  { value: "scavenger", label: "Scavenger", blurb: "Eats what's already dead. Nature's clean-up crew." },
  { value: "parasite", label: "Parasite", blurb: "Lives on or inside another creature and feeds off it." },
];

export const LOCOMOTION_OPTIONS: Opt<Locomotion>[] = [
  { value: "none", label: "Stays put", blurb: "Rooted or anchored. Food must come to it." },
  { value: "walking", label: "Walks or runs", blurb: "Legs on the ground." },
  { value: "burrowing", label: "Burrows", blurb: "Digs through soil, sand, or ice." },
  { value: "swimming", label: "Swims", blurb: "Fins, tails, or jets in water." },
  { value: "flying", label: "Flies", blurb: "Powered flight with wings. Needs air and low weight." },
  { value: "gliding", label: "Glides or floats", blurb: "Rides the air with membranes or gas sacs." },
  { value: "crawling", label: "Crawls or slithers", blurb: "No legs, just muscle and slime." },
  { value: "drifting", label: "Drifts", blurb: "Carried by currents or wind, like a jellyfish." },
];

export const BREATHING_OPTIONS: Opt<Breathing>[] = [
  { value: "lungs", label: "Lungs", blurb: "Pulls gas from the air." },
  { value: "gills", label: "Gills", blurb: "Pulls gas from water." },
  { value: "skin", label: "Through the skin", blurb: "Only works if the skin stays wet and the body is small." },
  { value: "spiracles", label: "Spiracles (tiny holes)", blurb: "Insect-style breathing. Limits how big the body can get." },
  { value: "none", label: "Doesn't breathe", blurb: "Gets energy some other way, like a microbe or a chemistry-eater." },
];

export const SENSE_OPTIONS: Opt<Sense>[] = [
  { value: "sight", label: "Sight", blurb: "Needs light to work." },
  { value: "infrared", label: "Heat vision", blurb: "Sees warmth. Great in the dark or for finding warm prey." },
  { value: "echolocation", label: "Echolocation", blurb: "Sees with sound. Needs air or water to carry it." },
  { value: "smell", label: "Smell and taste", blurb: "Tracks chemicals in air or water." },
  { value: "electric", label: "Electric sense", blurb: "Feels the electric fields of other bodies. Works best in water." },
  { value: "vibration", label: "Vibration sense", blurb: "Feels footsteps and tremors through the ground." },
  { value: "touch", label: "Touch and whiskers", blurb: "Feels the world up close." },
];

export const REPRODUCTION_OPTIONS: Opt<Reproduction>[] = [
  { value: "eggs", label: "Lays eggs", blurb: "Many young, little care." },
  { value: "live_birth", label: "Live birth", blurb: "Fewer young, more care." },
  { value: "spores", label: "Spores", blurb: "Clouds of tiny cells carried by wind or water." },
  { value: "budding", label: "Budding or splitting", blurb: "Makes copies of itself. No mate needed." },
  { value: "seeds", label: "Seeds", blurb: "Packets of food and baby plant, spread by wind, water, or animals." },
];

export const DEFENSE_OPTIONS: Opt<Defense>[] = [
  { value: "armor", label: "Armor or shell", blurb: "Hard to bite, but heavy and slow." },
  { value: "camouflage", label: "Camouflage", blurb: "Blends in. Works best where there's something to blend into." },
  { value: "speed", label: "Speed", blurb: "Outruns danger. Costs energy." },
  { value: "poison", label: "Poison or venom", blurb: "Often advertised with bright warning colors." },
  { value: "spines", label: "Spines or horns", blurb: "Ouch." },
  { value: "size", label: "Sheer size", blurb: "Too big to bother." },
  { value: "herd", label: "Safety in numbers", blurb: "Many eyes, and the group confuses hunters." },
  { value: "none", label: "None", blurb: "Relies on hiding, breeding fast, or just being lucky." },
];

export const ACTIVITY_OPTIONS: Opt<Activity>[] = [
  { value: "day", label: "Active by day", blurb: "Uses light, avoids night cold." },
  { value: "night", label: "Active at night", blurb: "Avoids heat and daytime hunters." },
  { value: "both", label: "Active any time", blurb: "Sleeps in short bursts." },
];

export const SOCIAL_OPTIONS: Opt<Social>[] = [
  { value: "solitary", label: "Lives alone", blurb: "Meets others only to mate." },
  { value: "pairs", label: "Pairs or small families", blurb: "Parents raise young together." },
  { value: "herds", label: "Herds or schools", blurb: "Big groups for safety and finding food." },
  { value: "hive", label: "Hive or colony", blurb: "Many bodies, one super-organism." },
];

export const BODY_OPTIONS: Opt<BodyShape>[] = [
  { value: "blob", label: "Round body", blurb: "Compact and sturdy." },
  { value: "slender", label: "Long body", blurb: "Streamlined for speed or slipping through gaps." },
  { value: "segmented", label: "Segmented body", blurb: "Repeating sections, like a caterpillar or a centipede." },
  { value: "radial", label: "Radial body", blurb: "Round with parts all the way around, like a starfish." },
  { value: "tree", label: "Trunk and canopy", blurb: "Tall stalk with a crown on top." },
  { value: "mushroom", label: "Stalk and cap", blurb: "A stem holding up a dome." },
];

export const LIMB_OPTIONS: Opt<LimbType>[] = [
  { value: "none", label: "No limbs", blurb: "" },
  { value: "legs", label: "Legs", blurb: "" },
  { value: "fins", label: "Fins or flippers", blurb: "" },
  { value: "wings", label: "Wings", blurb: "" },
  { value: "tentacles", label: "Tentacles", blurb: "" },
  { value: "roots", label: "Roots", blurb: "" },
];

export const COVERING_OPTIONS: Opt<Covering>[] = [
  { value: "smooth", label: "Smooth skin", blurb: "" },
  { value: "scales", label: "Scales", blurb: "" },
  { value: "fur", label: "Fur", blurb: "" },
  { value: "shell", label: "Shell or plates", blurb: "" },
  { value: "feathers", label: "Feathers", blurb: "" },
  { value: "bark", label: "Bark", blurb: "" },
  { value: "leaves", label: "Leaves or fronds", blurb: "" },
  { value: "slime", label: "Slime", blurb: "" },
];

export const PATTERN_OPTIONS: Opt<Pattern>[] = [
  { value: "none", label: "Plain", blurb: "" },
  { value: "stripes", label: "Stripes", blurb: "" },
  { value: "spots", label: "Spots", blurb: "" },
];

export const PALETTE = [
  "#e05252", "#f28c28", "#f2d02f", "#7bc850", "#2fa88a", "#3b82f6", "#7c5cd6", "#e06fb0",
  "#8b5a2b", "#5a5a5a", "#1c1c1c", "#f5f0e6",
];

export const DEFAULT_TRAITS: OrganismTraits = {
  size: "medium",
  diet: "herbivore",
  locomotion: "walking",
  breathing: "lungs",
  senses: ["sight", "smell"],
  reproduction: "eggs",
  defense: "speed",
  activity: "day",
  social: "herds",
  eats: [],
  behavior: "",
  anatomy: "",
  notes: "",
  acknowledged: [],
};

export const DEFAULT_APPEARANCE: Appearance = {
  bodyShape: "blob",
  limbType: "legs",
  limbCount: 4,
  eyes: 2,
  covering: "smooth",
  primary: "#7bc850",
  secondary: "#f2d02f",
  pattern: "none",
  horns: false,
  tail: true,
  glow: false,
};

export function optLabel<T extends string>(opts: Opt<T>[], value: T | undefined): string {
  return opts.find((o) => o.value === value)?.label ?? String(value ?? "");
}

/** Fill in any missing fields so old records never break the UI. */
export function normalizeTraits(t: Partial<OrganismTraits> | null | undefined): OrganismTraits {
  return { ...DEFAULT_TRAITS, ...(t ?? {}), senses: t?.senses ?? DEFAULT_TRAITS.senses, eats: t?.eats ?? [], acknowledged: t?.acknowledged ?? [] };
}

export function normalizeAppearance(a: Partial<Appearance> | null | undefined): Appearance {
  return { ...DEFAULT_APPEARANCE, ...(a ?? {}) };
}
