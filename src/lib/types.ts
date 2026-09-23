export type StarType = "red_dwarf" | "orange" | "yellow" | "blue_white";
export type Orbit = "close" | "habitable" | "far";
export type PlanetSize = "small" | "earthlike" | "super";
export type Gravity = "low" | "earthlike" | "high";
export type DayLength = "short" | "earthlike" | "long" | "tidally_locked";
export type Atmosphere = "none" | "thin" | "earthlike" | "thick";
export type AirMix = "oxygen" | "carbon_dioxide" | "methane" | "hydrogen";
export type Water = "dry" | "lakes" | "oceans" | "waterworld";
export type Seasons = "none" | "mild" | "extreme";
export type Moons = "none" | "one" | "many";

export interface PlanetConfig {
  star: StarType;
  orbit: Orbit;
  size: PlanetSize;
  gravity: Gravity;
  day: DayLength;
  atmosphere: Atmosphere;
  air: AirMix;
  water: Water;
  seasons: Seasons;
  moons: Moons;
}

export interface Planet {
  id: string;
  owner_id: string;
  name: string;
  description: string;
  config: PlanetConfig;
  is_public: boolean;
  created_at: string;
  updated_at: string;
}

export type RegionKind =
  | "shallow_sea"
  | "deep_sea"
  | "coast"
  | "plains"
  | "forest"
  | "desert"
  | "mountains"
  | "ice"
  | "volcanic"
  | "caves"
  | "sky"
  | "twilight"
  | "nightside";

export interface Region {
  id: string;
  planet_id: string;
  name: string;
  kind: RegionKind;
  description: string;
  traits: Record<string, unknown>;
  sort_order: number;
  created_at: string;
}

export type OrganismKind = "animal" | "plant" | "fungus" | "microbe";
export type SizeClass = "tiny" | "small" | "medium" | "large" | "giant";
export type Diet =
  | "photosynthesis"
  | "chemosynthesis"
  | "herbivore"
  | "carnivore"
  | "omnivore"
  | "filter_feeder"
  | "scavenger"
  | "parasite";
export type Locomotion =
  | "none"
  | "walking"
  | "burrowing"
  | "swimming"
  | "flying"
  | "gliding"
  | "crawling"
  | "drifting";
export type Breathing = "lungs" | "gills" | "skin" | "spiracles" | "none";
export type Sense = "sight" | "infrared" | "echolocation" | "smell" | "electric" | "vibration" | "touch";
export type Reproduction = "eggs" | "live_birth" | "spores" | "budding" | "seeds";
export type Defense = "armor" | "camouflage" | "speed" | "poison" | "spines" | "size" | "herd" | "none";
export type Activity = "day" | "night" | "both";
export type Social = "solitary" | "pairs" | "herds" | "hive";

export interface OrganismTraits {
  size: SizeClass;
  diet: Diet;
  locomotion: Locomotion;
  breathing: Breathing;
  senses: Sense[];
  reproduction: Reproduction;
  defense: Defense;
  activity: Activity;
  social: Social;
  eats: string[]; // organism ids
  behavior: string;
  anatomy: string;
  notes: string; // creator's explanations for design choices
  acknowledged: string[]; // rule ids the creator has answered
}

export type BodyShape = "blob" | "slender" | "segmented" | "radial" | "tree" | "mushroom";
export type LimbType = "legs" | "fins" | "wings" | "tentacles" | "roots" | "none";
export type Covering = "smooth" | "scales" | "fur" | "shell" | "feathers" | "bark" | "leaves" | "slime";
export type Pattern = "none" | "stripes" | "spots";

/** A creator-supplied reference drawing, stored in Supabase Storage. */
export interface Drawing {
  originalPath: string; // the photo or file as uploaded (downscaled)
  cutoutPath: string; // cropped, background removed, transparent PNG
  flip: boolean; // mirror so the creature faces right in scenes
}

/** The app's own illustration of the creator's drawing, as sanitized SVG markup. */
export interface Illustration {
  svg: string;
  createdAt: string;
}

export interface Appearance {
  drawing?: Drawing | null;
  illustration?: Illustration | null;
  bodyShape: BodyShape;
  limbType: LimbType;
  limbCount: number; // 0-8
  eyes: number; // 0-8
  covering: Covering;
  primary: string;
  secondary: string;
  pattern: Pattern;
  horns: boolean;
  tail: boolean;
  glow: boolean;
}

export interface Organism {
  id: string;
  planet_id: string;
  region_id: string | null;
  name: string;
  kind: OrganismKind;
  description: string;
  traits: OrganismTraits;
  appearance: Appearance;
  created_at: string;
  updated_at: string;
}

export interface Profile {
  id: string;
  display_name: string;
}

export interface MentorMessage {
  id: number;
  planet_id: string;
  organism_id: string | null;
  role: "user" | "assistant";
  content: string;
  created_at: string;
}
