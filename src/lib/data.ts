import { supabase } from "./supabase";
import { normalizeAppearance, normalizeTraits } from "./creatureOptions";
import { DEFAULT_PLANET } from "./planetOptions";
import type { Drawing, MentorMessage, Organism, Planet, PlanetConfig, Profile, Region, RegionKind } from "./types";

function asPlanet(row: Record<string, unknown>): Planet {
  return { ...(row as unknown as Planet), config: { ...DEFAULT_PLANET, ...((row.config as Partial<PlanetConfig>) ?? {}) } };
}

function asOrganism(row: Record<string, unknown>): Organism {
  const o = row as unknown as Organism;
  return { ...o, traits: normalizeTraits(o.traits), appearance: normalizeAppearance(o.appearance) };
}

export async function listPlanets(): Promise<{ planets: Planet[]; owners: Record<string, Profile>; counts: Record<string, number> }> {
  const { data, error } = await supabase.from("planets").select("*").order("updated_at", { ascending: false });
  if (error) throw error;
  const planets = (data ?? []).map(asPlanet);
  const ownerIds = [...new Set(planets.map((p) => p.owner_id))];
  const owners: Record<string, Profile> = {};
  if (ownerIds.length) {
    const { data: profs } = await supabase.from("profiles").select("id, display_name").in("id", ownerIds);
    for (const p of profs ?? []) owners[p.id] = p as Profile;
  }
  const counts: Record<string, number> = {};
  if (planets.length) {
    const { data: orgs } = await supabase.from("organisms").select("planet_id").in("planet_id", planets.map((p) => p.id));
    for (const o of orgs ?? []) counts[o.planet_id] = (counts[o.planet_id] ?? 0) + 1;
  }
  return { planets, owners, counts };
}

export interface PlanetBundle {
  planet: Planet;
  regions: Region[];
  organisms: Organism[];
  owner: Profile | null;
}

export async function loadPlanet(id: string): Promise<PlanetBundle | null> {
  const { data: planet, error } = await supabase.from("planets").select("*").eq("id", id).maybeSingle();
  if (error) throw error;
  if (!planet) return null;
  const [regionsRes, orgsRes, ownerRes] = await Promise.all([
    supabase.from("regions").select("*").eq("planet_id", id).order("sort_order").order("created_at"),
    supabase.from("organisms").select("*").eq("planet_id", id).order("created_at"),
    supabase.from("profiles").select("id, display_name").eq("id", planet.owner_id).maybeSingle(),
  ]);
  if (regionsRes.error) throw regionsRes.error;
  if (orgsRes.error) throw orgsRes.error;
  return {
    planet: asPlanet(planet),
    regions: (regionsRes.data ?? []) as Region[],
    organisms: (orgsRes.data ?? []).map(asOrganism),
    owner: (ownerRes.data as Profile | null) ?? null,
  };
}

export async function createPlanet(ownerId: string, name: string, description: string, config: PlanetConfig): Promise<Planet> {
  const { data, error } = await supabase
    .from("planets")
    .insert({ owner_id: ownerId, name, description, config })
    .select("*")
    .single();
  if (error) throw error;
  return asPlanet(data);
}

export async function updatePlanet(id: string, patch: Partial<Pick<Planet, "name" | "description" | "config" | "is_public">>): Promise<void> {
  const { error } = await supabase.from("planets").update(patch).eq("id", id);
  if (error) throw error;
}

export async function deletePlanet(id: string): Promise<void> {
  const { error } = await supabase.from("planets").delete().eq("id", id);
  if (error) throw error;
}

export async function saveRegion(input: { id?: string; planet_id: string; name: string; kind: RegionKind; description: string; sort_order?: number }): Promise<Region> {
  const { id, ...rest } = input;
  const q = id
    ? supabase.from("regions").update(rest).eq("id", id).select("*").single()
    : supabase.from("regions").insert(rest).select("*").single();
  const { data, error } = await q;
  if (error) throw error;
  return data as Region;
}

export async function deleteRegion(id: string): Promise<void> {
  const { error } = await supabase.from("regions").delete().eq("id", id);
  if (error) throw error;
}

export async function saveOrganism(
  input: Partial<Organism> & { id: string; planet_id: string; name: string },
  mode: "create" | "update",
): Promise<Organism> {
  const { id, created_at: _c, updated_at: _u, ...rest } = input;
  const q = mode === "update"
    ? supabase.from("organisms").update(rest).eq("id", id).select("*").single()
    : supabase.from("organisms").insert({ id, ...rest }).select("*").single();
  const { data, error } = await q;
  if (error) throw error;
  return asOrganism(data);
}

export async function deleteOrganism(id: string, planetId: string): Promise<void> {
  const { error } = await supabase.from("organisms").delete().eq("id", id);
  if (error) throw error;
  // Best effort: clean up any drawings stored for this creature.
  try {
    const folder = `${planetId}/${id}`;
    const { data } = await supabase.storage.from("organism-art").list(folder);
    if (data?.length) await supabase.storage.from("organism-art").remove(data.map((f) => `${folder}/${f.name}`));
  } catch {
    /* ignore */
  }
}

const ART_BUCKET = "organism-art";

/** Public URL for a file in the drawings bucket. */
export function drawingUrl(path: string): string {
  return supabase.storage.from(ART_BUCKET).getPublicUrl(path).data.publicUrl;
}

export async function removeDrawingFiles(d: Drawing): Promise<void> {
  const paths = [d.originalPath, d.cutoutPath].filter(Boolean);
  if (paths.length) await supabase.storage.from(ART_BUCKET).remove(paths);
}

export async function loadMentorHistory(planetId: string, organismId: string | null): Promise<MentorMessage[]> {
  let q = supabase.from("mentor_messages").select("*").eq("planet_id", planetId).order("created_at").limit(60);
  q = organismId ? q.eq("organism_id", organismId) : q.is("organism_id", null);
  const { data, error } = await q;
  if (error) throw error;
  return (data ?? []) as MentorMessage[];
}

export async function clearMentorHistory(planetId: string, organismId: string | null): Promise<void> {
  let q = supabase.from("mentor_messages").delete().eq("planet_id", planetId);
  q = organismId ? q.eq("organism_id", organismId) : q.is("organism_id", null);
  const { error } = await q;
  if (error) throw error;
}

export interface MentorRequest {
  planetId: string;
  organismId?: string | null;
  message: string;
  /** Draft creature not yet saved, for "check my creature" reviews. */
  draft?: unknown;
}

export async function askMentor(req: MentorRequest): Promise<string> {
  const { data: sess } = await supabase.auth.getSession();
  const token = sess.session?.access_token;
  if (!token) throw new Error("Please sign in to talk to the mentor.");
  const res = await fetch("/api/mentor", {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
    body: JSON.stringify(req),
  });
  const body = (await res.json().catch(() => ({}))) as { reply?: string; error?: string };
  if (!res.ok) throw new Error(body.error ?? `Mentor error (${res.status})`);
  return body.reply ?? "";
}

export function friendlyError(e: unknown): string {
  if (e instanceof Error) return e.message;
  if (typeof e === "object" && e && "message" in e) return String((e as { message: unknown }).message);
  return "Something went wrong.";
}
