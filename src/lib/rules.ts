import { regionInfo } from "./regionOptions";
import type { Appearance, Organism, OrganismKind, OrganismTraits, PlanetConfig, Region } from "./types";

export interface Finding {
  id: string;
  level: "warn" | "info";
  text: string;
  question: string;
}

interface Draft {
  kind: OrganismKind;
  traits: OrganismTraits;
  appearance: Appearance;
  regionId: string | null;
}

/**
 * Checks a creature against its planet, its home region, and the other
 * organisms. Returns friendly findings with a follow-up question each.
 * These never block the creator; they make the creator think.
 */
export function checkOrganism(
  draft: Draft,
  planet: PlanetConfig,
  regions: Region[],
  others: Organism[],
  selfId?: string,
): Finding[] {
  const f: Finding[] = [];
  const t = draft.traits;
  const region = regions.find((r) => r.id === draft.regionId);
  const ri = region ? regionInfo(region.kind) : null;
  const peers = others.filter((o) => o.id !== selfId);
  const add = (id: string, level: Finding["level"], text: string, question: string) =>
    f.push({ id, level, text, question });

  // Air and flight
  if (t.locomotion === "flying" && planet.atmosphere === "none")
    add("fly-no-air", "warn", "There is no air on this planet, so wings have nothing to push against.", "Could it move some other way, or is there a special case, like jumping in low gravity?");
  if (t.locomotion === "flying" && planet.atmosphere === "thin")
    add("fly-thin-air", "warn", "The air is thin, so flying takes enormous wings and a very light body.", "How does it stay in the air? Huge wings, gas sacs, tiny body?");
  if (t.locomotion === "flying" && planet.gravity === "high" && (t.size === "large" || t.size === "giant"))
    add("fly-heavy", "warn", "High gravity plus a big body makes powered flight nearly impossible.", "Would gliding from cliffs work better, or should it be smaller?");
  if ((t.locomotion === "flying" || t.locomotion === "gliding") && planet.atmosphere === "thick")
    add("fly-thick-air", "info", "Thick air gives lots of lift. Even big creatures could fly or float here.", "Could it be bigger than an Earth flyer? What would it feed on up there?");
  if (t.locomotion === "gliding" && planet.air === "hydrogen")
    add("float-hydrogen", "info", "Hydrogen air is very light, so a floater needs an even lighter gas inside, or hot gas, to rise.", "What fills its float sacs?");
  if (t.locomotion === "flying" && ri?.value === "caves")
    add("fly-cave", "info", "Flying in tight, dark caves is tricky without echolocation.", "How does it avoid crashing into walls?");

  // Water and land
  if (t.locomotion === "swimming" && ri && !ri.water)
    add("swim-on-land", "warn", `Its home, ${region!.name}, is not a body of water, but it swims.`, "Is there water there we haven't heard about, or should it live somewhere else?");
  if (t.breathing === "gills" && ri && !ri.water)
    add("gills-dry", "warn", "Gills need water to work. On dry land they collapse and dry out.", "Does it keep them wet somehow, or does it also have lungs?");
  if (t.breathing === "lungs" && ri?.water && t.locomotion === "swimming")
    add("lungs-underwater", "info", "Lungs work underwater only if it surfaces to breathe, like a whale.", "How long can it hold its breath, and where does it come up?");
  if (t.breathing === "lungs" && planet.atmosphere === "none")
    add("lungs-no-air", "warn", "There is no air to breathe.", "Where does its energy come from instead?");
  if (t.breathing === "lungs" && planet.air === "carbon_dioxide" && draft.kind === "animal")
    add("lungs-co2", "warn", "The air has almost no oxygen. Earth-style lungs would be useless.", "Does it breathe something else, or get energy from food alone?");
  if (t.breathing === "skin" && (ri?.value === "desert" || planet.water === "dry"))
    add("skin-dry", "warn", "Breathing through skin only works if the skin stays wet, which is hard in a dry place.", "Does it live in burrows, come out at night, or have a moist chamber?");
  if (t.breathing === "skin" && (t.size === "large" || t.size === "giant"))
    add("skin-big", "warn", "Big bodies have too little skin for their volume, so skin breathing can't supply enough gas.", "Could it be smaller, or use lungs or gills instead?");
  if (t.breathing === "spiracles" && (t.size === "large" || t.size === "giant") && planet.atmosphere !== "thick")
    add("spiracles-big", "warn", "Insect-style breathing can't push gas deep into a big body unless the air is very rich.", "Could it be smaller, or could the air be thicker?");
  if (t.locomotion === "walking" && ri?.water && ri.value === "deep_sea")
    add("walk-deep", "info", "Walking on the deep sea floor is possible, like a crab, but it's dark and cold.", "How does it find food down there?");
  if (t.locomotion === "burrowing" && ri?.value === "ice")
    add("burrow-ice", "info", "Burrowing through ice takes heat or strong claws.", "Does it melt its way, dig, or use existing cracks?");

  // Light and senses
  const dark = ri?.dark === true;
  if (t.diet === "photosynthesis" && dark)
    add("photo-dark", "warn", `There is no light in ${region!.name}, so photosynthesis can't work there.`, "Could it use chemicals instead, or grow near a light source?");
  if (t.diet === "photosynthesis" && planet.star === "red_dwarf")
    add("photo-red", "info", "The star is dim and red. Plants may need dark or black surfaces to soak up enough light.", "What color are its light-catching parts?");
  if (t.diet === "photosynthesis" && planet.atmosphere === "thick")
    add("photo-thick", "info", "Thick air dims the surface. Plants may grow very wide or float up to find light.", "How does it catch enough light?");
  if (t.senses.includes("sight") && dark && t.senses.length === 1)
    add("sight-dark", "warn", "Its only sense is sight, but its home is dark.", "What sense helps it find food and avoid danger? Sound, smell, heat?");
  if (t.senses.includes("sight") && dark)
    add("sight-dark-info", "info", "Eyes are almost useless in the dark. Many cave animals lose them over time.", "Why does it still have eyes? Does it visit lit places?");
  if (t.senses.includes("echolocation") && planet.atmosphere === "none")
    add("echo-no-air", "warn", "Sound needs air or water to travel. With no air, echolocation won't work on the surface.", "Could it sense vibrations through the ground instead?");
  if (t.senses.includes("electric") && ri && !ri.water)
    add("electric-dry", "info", "Electric sense works well in water but barely at all in air.", "Is it in wet places when it uses this sense?");
  if (t.senses.length === 0)
    add("no-senses", "warn", "It has no senses at all.", "How does it find food or notice danger?");

  // Gravity and size
  if (t.size === "giant" && planet.gravity === "high" && !ri?.water)
    add("giant-heavy", "warn", "A giant on land under high gravity would crush its own legs.", "Could it live in water, be smaller, or have a different body plan?");
  if (t.size === "giant" && t.locomotion === "walking" && planet.gravity !== "low")
    add("giant-walk", "info", "Giant walkers need thick, pillar-like legs, like elephants or sauropods.", "What do its legs look like?");
  if (planet.gravity === "low" && t.locomotion === "walking")
    add("low-g-walk", "info", "In low gravity, walkers can be tall and thin and bound in huge leaps.", "Does it hop, stride, or bounce?");

  // Food web
  const animals = peers.filter((o) => o.kind === "animal");
  const producers = peers.filter((o) => o.traits.diet === "photosynthesis" || o.traits.diet === "chemosynthesis" || o.kind === "plant");
  if (t.diet === "carnivore" && animals.length === 0)
    add("carnivore-nothing", "warn", "It hunts animals, but there are no other animals on this planet yet.", "What does it eat? You could add its prey next.");
  if (t.diet === "herbivore" && producers.length === 0)
    add("herbivore-nothing", "warn", "It eats plants, but no plants or producers exist here yet.", "What does it eat? You could add a plant next.");
  if (t.diet === "scavenger" && animals.length === 0)
    add("scavenger-nothing", "info", "Scavengers need things to die. With no other animals, meals would be rare.", "What dies here often enough to feed it?");
  if (t.diet === "parasite" && peers.length === 0)
    add("parasite-nothing", "warn", "A parasite needs a host, and there is nothing else on the planet yet.", "Which creature does it live on?");
  if ((t.diet === "carnivore" || t.diet === "omnivore" || t.diet === "herbivore" || t.diet === "parasite") && t.eats.length === 0 && peers.length > 0)
    add("eats-empty", "info", "You haven't picked what it eats from the creatures on this planet.", "Which ones are on the menu?");
  if (t.diet === "chemosynthesis" && ri && ri.value !== "volcanic" && ri.value !== "deep_sea" && ri.value !== "caves")
    add("chemo-where", "info", "Chemistry-eaters usually need vents, hot springs, or mineral-rich rock.", "Where does it get its chemicals in this region?");
  if (t.diet === "filter_feeder" && ri && !ri.water && ri.value !== "sky")
    add("filter-dry", "info", "Filter feeders strain food from water or air.", "What is it filtering out of the air here?");

  // Kind-specific
  if (draft.kind === "plant" && t.locomotion !== "none" && t.locomotion !== "drifting")
    add("plant-moves", "info", "Most plants stay put, but yours moves.", "Why would moving help it? Chasing light, escaping grazers?");
  if (draft.kind === "plant" && t.diet !== "photosynthesis" && t.diet !== "chemosynthesis")
    add("plant-eats", "info", "Your plant eats like an animal.", "Is it a trap plant, like a Venus flytrap? How does it catch food?");
  if (draft.kind === "animal" && (t.reproduction === "spores" || t.reproduction === "seeds"))
    add("animal-spores", "info", "Animals on Earth don't make spores or seeds, but alien ones could.", "How do the young grow from a spore?");
  if (draft.kind === "microbe" && (t.size !== "tiny"))
    add("microbe-big", "info", "Microbes are usually tiny single cells.", "Is this a colony of microbes acting together, like a mat or a slime?");

  // Climate
  const cold = ri?.value === "ice" || ri?.value === "nightside" || planet.orbit === "far";
  const bare = ["smooth", "slime", "scales", "leaves"].includes(draft.appearance.covering);
  if (cold && bare && draft.kind === "animal")
    add("cold-bare", "info", "It lives somewhere cold with no fur, fat, or shell mentioned.", "How does it stay warm? Antifreeze blood, huddling, fat?");
  if (planet.day === "tidally_locked" && (t.activity === "day" || t.activity === "night") && ri?.value !== "twilight")
    add("locked-day", "info", "On a tidally locked planet there is no day-night cycle to be active in.", "What rhythm does it follow instead? Tides, flares, hunger?");
  if (planet.seasons === "extreme" && t.locomotion === "none" && draft.kind === "animal")
    add("extreme-stuck", "info", "Extreme seasons bring months of darkness, but this creature can't move to escape.", "Does it hibernate, store food, or shut down?");
  if (planet.star === "blue_white" && ri && !ri.water && !ri.dark && t.defense !== "armor")
    add("uv", "info", "The star pours out ultraviolet light. Skin needs protection.", "Does it have pigment, a shell, or does it hide by day?");

  // Defense logic
  if (t.defense === "camouflage" && ri?.value === "sky")
    add("camo-sky", "info", "Camouflage in the open sky means matching the clouds or the sky color.", "What does it look like from below and from above?");
  if (t.defense === "size" && (t.size === "tiny" || t.size === "small"))
    add("size-small", "warn", "It relies on being big, but it's small.", "Should it be bigger, or should it defend itself another way?");
  if (t.defense === "herd" && t.social === "solitary")
    add("herd-alone", "warn", "It relies on safety in numbers but lives alone.", "Does it gather only when danger is near, or should it live in groups?");

  return dedupe(f);
}

function dedupe(list: Finding[]): Finding[] {
  const seen = new Set<string>();
  return list.filter((x) => (seen.has(x.id) ? false : (seen.add(x.id), true)));
}
