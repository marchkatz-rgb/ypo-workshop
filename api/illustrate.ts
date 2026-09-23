import Anthropic from "@anthropic-ai/sdk";
import { createClient } from "@supabase/supabase-js";

/**
 * Turns a creator's drawing into an illustration in the app's own flat style.
 * Claude looks at the drawing and writes the vector shapes; we sanitize the
 * result and hand it back for the client to save with the creature. Only the
 * planet owner can call this.
 */

export const maxDuration = 120;

const MODEL = "claude-opus-5";
const BUCKET = "organism-art";

const STYLE_GUIDE = `You are the illustrator for "The World According to Miles", an app where a kid designs alien planets and creatures.

You will be shown the creator's own drawing of a creature. Redraw that same creature as an SVG illustration in the app's house style. Stay faithful to what the creator drew: the same body plan, number of limbs, eyes, tail, horns, wings, markings, and colors. Do not invent features that aren't there, and do not leave out ones that are.

House style:
- Flat cartoon vector art. Solid fills, bold rounded outlines, no photo textures.
- Outline color is a darker shade of each fill (about 50% darker), stroke width 3, stroke-linejoin round, stroke-linecap round.
- Two to four main colors, taken from the drawing. If the drawing is uncolored pencil, choose two friendly colors that suit the creature.
- One soft highlight: a small white ellipse at 20% opacity on the upper body.
- Friendly, clean, readable at small sizes. Rounded shapes. No tiny details that vanish when shrunk.

Technical rules (strict):
- Output ONLY the SVG markup, nothing else. No prose, no markdown fences.
- Root element: <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 200">.
- The creature must face RIGHT, be centered horizontally, and stand or rest on the bottom edge: its lowest point at about y=186. Flyers and swimmers should still fill the box with their lowest point near y=186.
- Use only these elements: g, path, circle, ellipse, rect, polygon, polyline, line. No text, no images, no gradients, no filters, no style elements, no scripts, no links, no external references.
- Use attributes for styling (fill, stroke, stroke-width, opacity), never CSS.
- Keep it under 12 KB.`;

interface Body {
  planetId?: string;
  organismId?: string;
  drawingPath?: string;
  name?: string;
  kind?: string;
  description?: string;
  traits?: Record<string, unknown>;
}

export async function POST(request: Request): Promise<Response> {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) return json({ error: "Illustrations aren't switched on yet. Ask the site owner to add the ANTHROPIC_API_KEY setting." }, 503);
  const supabaseUrl = process.env.VITE_SUPABASE_URL;
  const supabaseKey = process.env.VITE_SUPABASE_PUBLISHABLE_KEY;
  if (!supabaseUrl || !supabaseKey) return json({ error: "Server is missing its database settings." }, 500);

  const token = (request.headers.get("authorization") ?? "").replace(/^Bearer\s+/i, "");
  if (!token) return json({ error: "Please sign in first." }, 401);

  let body: Body;
  try {
    body = (await request.json()) as Body;
  } catch {
    return json({ error: "Bad request." }, 400);
  }
  const { planetId, organismId, drawingPath } = body;
  const uuid = /^[0-9a-f-]{36}$/i;
  if (!planetId || !organismId || !uuid.test(planetId) || !uuid.test(organismId)) return json({ error: "Missing planet or creature." }, 400);
  if (!drawingPath || !drawingPath.startsWith(`${planetId}/${organismId}/`) || drawingPath.includes("..")) return json({ error: "Add a drawing first." }, 400);

  const supabase = createClient(supabaseUrl, supabaseKey, {
    global: { headers: { Authorization: `Bearer ${token}` } },
    auth: { persistSession: false, autoRefreshToken: false },
  });
  const { data: userData, error: userErr } = await supabase.auth.getUser(token);
  if (userErr || !userData.user) return json({ error: "Your sign-in has expired. Please sign in again." }, 401);

  const { data: planet } = await supabase.from("planets").select("id, owner_id, name, config").eq("id", planetId).maybeSingle();
  if (!planet) return json({ error: "Planet not found." }, 404);
  if (planet.owner_id !== userData.user.id) return json({ error: "Only the planet's creator can illustrate its creatures." }, 403);

  const imageUrl = `${supabaseUrl}/storage/v1/object/public/${BUCKET}/${drawingPath}`;
  const traits = body.traits ?? {};
  const context = [
    `Creature name: ${(body.name ?? "unnamed").toString().slice(0, 80)}`,
    `Kind: ${(body.kind ?? "animal").toString().slice(0, 20)}`,
    body.description ? `Creator's description: ${body.description.toString().slice(0, 600)}` : "",
    `Traits: size ${traits.size ?? "?"}, moves by ${traits.locomotion ?? "?"}, covering and limbs as drawn.`,
    `Planet: ${planet.name}.`,
  ].filter(Boolean).join("\n");

  const client = new Anthropic({ apiKey });
  let svg = "";
  try {
    const response = await client.messages.create({
      model: MODEL,
      max_tokens: 8000,
      output_config: { effort: "medium" },
      system: [{ type: "text", text: STYLE_GUIDE, cache_control: { type: "ephemeral" } }],
      messages: [
        {
          role: "user",
          content: [
            { type: "image", source: { type: "url", url: imageUrl } },
            { type: "text", text: `${context}\n\nRedraw this creature in the house style. Output only the SVG.` },
          ],
        },
      ],
    });
    if (response.stop_reason === "refusal") return json({ error: "The illustrator couldn't draw this one. Try a different picture." }, 422);
    if (response.stop_reason === "max_tokens") return json({ error: "The illustration came out too complex. Try again." }, 502);
    svg = response.content.filter((b): b is Anthropic.TextBlock => b.type === "text").map((b) => b.text).join("\n");
  } catch (err) {
    if (err instanceof Anthropic.AuthenticationError) return json({ error: "The illustrator's API key isn't valid. Ask the site owner to check it." }, 502);
    if (err instanceof Anthropic.RateLimitError) return json({ error: "The illustrator is busy right now. Try again in a minute." }, 429);
    if (err instanceof Anthropic.APIError) return json({ error: `The illustrator had a problem (${err.status}). Try again.` }, 502);
    return json({ error: "The illustrator had a problem. Try again." }, 502);
  }

  const clean = sanitizeSvg(svg);
  if (!clean) return json({ error: "The illustration didn't come out right. Try again." }, 502);

  // The client stores the SVG with the creature, so drafts work too.
  return json({ svg: clean });
}

/** Keeps only safe drawing elements and attributes, and normalizes the root. */
function sanitizeSvg(raw: string): string | null {
  const m = raw.match(/<svg[\s\S]*?<\/svg>/i);
  if (!m) return null;
  let s = m[0];
  if (s.length > 80_000) return null;
  // Drop dangerous or disallowed elements entirely.
  s = s.replace(/<!--[\s\S]*?-->/g, "");
  s = s.replace(/<(script|style|foreignObject|image|use|a|iframe|embed|object|link|meta|text|textPath|filter|animate|animateTransform|animateMotion|set|linearGradient|radialGradient|pattern|mask|clipPath|defs)\b[\s\S]*?(<\/\1>|\/>)/gi, "");
  // Remove event handlers, references, and CSS.
  s = s.replace(/\s(on\w+|href|xlink:href|style|class|id|filter|mask|clip-path)\s*=\s*("[^"]*"|'[^']*')/gi, "");
  if (/javascript:|url\(|<script|<image|<foreignObject/i.test(s)) return null;
  // Only allow known tags.
  const tags = new Set<string>();
  for (const t of s.matchAll(/<\/?([a-zA-Z][\w:-]*)/g)) tags.add(t[1].toLowerCase());
  const allowed = new Set(["svg", "g", "path", "circle", "ellipse", "rect", "polygon", "polyline", "line", "title"]);
  for (const t of tags) if (!allowed.has(t)) return null;
  // Normalize the root element.
  s = s.replace(/<svg\b[^>]*>/i, '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 200">');
  return s.trim();
}

function json(data: unknown, status = 200): Response {
  return new Response(JSON.stringify(data), { status, headers: { "Content-Type": "application/json" } });
}
