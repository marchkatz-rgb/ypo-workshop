import Anthropic from "@anthropic-ai/sdk";
import { createClient } from "@supabase/supabase-js";

/**
 * The science mentor. Runs on Vercel, never in the browser, so the Anthropic
 * API key stays secret. Callers must be signed in and must own the planet.
 */

const MODEL = "claude-opus-5";
const MAX_HISTORY = 20;

const SYSTEM_PROMPT = `You are the Science Mentor inside "The World According to Miles", an app where a curious 12-year-old designs fictional planets and the life that evolves on them (speculative evolution).

Your job is to help the creator make their world feel scientifically believable while keeping every creative decision theirs.

How to behave:
- Be warm, curious, and direct. Talk like a favorite science teacher, not a textbook and not a cheerleader.
- The creator is smart and knows a lot of science. Use real terms (convergent evolution, square-cube law, niche, thermoregulation) and explain them in one short phrase the first time.
- Ask good questions more than you give answers. Usually respond with one or two clear thoughts and then one question that pushes the idea further.
- Ground everything in the planet facts you are given: star, gravity, air, water, day length, regions, and the other species. Point out clashes plainly ("Your flyer weighs as much as a horse and the air is thin; that's a problem") and then offer two or three ways it could still work.
- Never take over. Don't invent whole creatures, names, or regions unless asked. Offer options, not decisions.
- Keep replies short: usually under 150 words. No headers, no bullet lists longer than three items.
- If the creator asks something off-topic or inappropriate for a kid, gently steer back to the planet.
- If asked to check a draft creature, give: what works, the biggest problem (if any), and one question.`;

interface Body {
  planetId?: string;
  organismId?: string | null;
  message?: string;
  draft?: unknown;
}

export async function POST(request: Request): Promise<Response> {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) return json({ error: "The science mentor isn't switched on yet. Ask the site owner to add the ANTHROPIC_API_KEY setting." }, 503);

  const supabaseUrl = process.env.VITE_SUPABASE_URL;
  const supabaseKey = process.env.VITE_SUPABASE_PUBLISHABLE_KEY;
  if (!supabaseUrl || !supabaseKey) return json({ error: "Server is missing its database settings." }, 500);

  const token = (request.headers.get("authorization") ?? "").replace(/^Bearer\s+/i, "");
  if (!token) return json({ error: "Please sign in to talk to the mentor." }, 401);

  let body: Body;
  try {
    body = (await request.json()) as Body;
  } catch {
    return json({ error: "Bad request." }, 400);
  }
  const message = (body.message ?? "").toString().trim().slice(0, 2000);
  const planetId = body.planetId;
  const organismId = body.organismId ?? null;
  if (!planetId || !message) return json({ error: "Missing planet or message." }, 400);

  // A client that acts as the signed-in user, so Row Level Security applies.
  const supabase = createClient(supabaseUrl, supabaseKey, {
    global: { headers: { Authorization: `Bearer ${token}` } },
    auth: { persistSession: false, autoRefreshToken: false },
  });
  const { data: userData, error: userErr } = await supabase.auth.getUser(token);
  if (userErr || !userData.user) return json({ error: "Your sign-in has expired. Please sign in again." }, 401);
  const user = userData.user;

  const { data: planet } = await supabase.from("planets").select("*").eq("id", planetId).maybeSingle();
  if (!planet) return json({ error: "Planet not found." }, 404);
  if (planet.owner_id !== user.id) return json({ error: "Only the planet's creator can talk to the mentor about it." }, 403);

  const [{ data: regions }, { data: organisms }, { data: history }] = await Promise.all([
    supabase.from("regions").select("id, name, kind, description").eq("planet_id", planetId).order("sort_order"),
    supabase.from("organisms").select("id, region_id, name, kind, description, traits").eq("planet_id", planetId).order("created_at"),
    (() => {
      let q = supabase.from("mentor_messages").select("role, content").eq("planet_id", planetId).order("created_at", { ascending: false }).limit(MAX_HISTORY);
      q = organismId ? q.eq("organism_id", organismId) : q.is("organism_id", null);
      return q;
    })(),
  ]);

  const regionList = regions ?? [];
  const orgList = organisms ?? [];
  const focus = organismId ? orgList.find((o) => o.id === organismId) : null;

  const context = [
    `PLANET: ${planet.name}`,
    planet.description ? `Description: ${planet.description}` : "",
    `Settings: ${JSON.stringify(planet.config)}`,
    `REGIONS (${regionList.length}): ${regionList.map((r) => `${r.name} [${r.kind}]${r.description ? ": " + r.description : ""}`).join("; ") || "none yet"}`,
    `SPECIES (${orgList.length}): ${orgList
      .map((o) => {
        const t = (o.traits ?? {}) as Record<string, unknown>;
        const home = regionList.find((r) => r.id === o.region_id)?.name ?? "no region";
        return `${o.name} (${o.kind}, ${t.size ?? "?"}, ${t.diet ?? "?"}, moves: ${t.locomotion ?? "?"}, home: ${home})`;
      })
      .join("; ") || "none yet"}`,
    focus ? `FOCUS SPECIES (the creator is asking about this one): ${JSON.stringify({ name: focus.name, kind: focus.kind, description: focus.description, traits: focus.traits })}` : "",
    body.draft ? `DRAFT (unsaved creature the creator is working on right now): ${JSON.stringify(body.draft).slice(0, 6000)}` : "",
  ]
    .filter(Boolean)
    .join("\n");

  const past = (history ?? []).reverse();
  const messages: Anthropic.MessageParam[] = [
    ...past.map((m) => ({ role: m.role as "user" | "assistant", content: m.content })),
    { role: "user", content: message },
  ];
  // The API requires the conversation to start with a user turn.
  while (messages.length && messages[0].role !== "user") messages.shift();

  const client = new Anthropic({ apiKey });
  let reply = "";
  try {
    const response = await client.messages.create({
      model: MODEL,
      max_tokens: 1024,
      output_config: { effort: "medium" },
      system: [
        { type: "text", text: SYSTEM_PROMPT, cache_control: { type: "ephemeral" } },
        { type: "text", text: `Here is everything known about the creator's current world:\n${context}` },
      ],
      messages,
    });
    if (response.stop_reason === "refusal") {
      reply = "I can't help with that one. Let's get back to your planet. What are you working on?";
    } else {
      reply = response.content
        .filter((b): b is Anthropic.TextBlock => b.type === "text")
        .map((b) => b.text)
        .join("\n")
        .trim();
    }
  } catch (err) {
    if (err instanceof Anthropic.AuthenticationError) return json({ error: "The mentor's API key isn't valid. Ask the site owner to check it." }, 502);
    if (err instanceof Anthropic.RateLimitError) return json({ error: "The mentor is busy right now. Try again in a minute." }, 429);
    if (err instanceof Anthropic.APIError) return json({ error: `The mentor had a problem (${err.status}). Try again.` }, 502);
    return json({ error: "The mentor had a problem. Try again." }, 502);
  }

  if (!reply) reply = "Hmm, I lost my train of thought. Ask me again?";

  await supabase.from("mentor_messages").insert([
    { planet_id: planetId, organism_id: organismId, user_id: user.id, role: "user", content: message },
    { planet_id: planetId, organism_id: organismId, user_id: user.id, role: "assistant", content: reply },
  ]);

  return json({ reply });
}

function json(data: unknown, status = 200): Response {
  return new Response(JSON.stringify(data), { status, headers: { "Content-Type": "application/json" } });
}
