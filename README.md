# The World According to Miles

An interactive speculative-evolution app: design a planet, carve it into regions,
then invent the organisms that could survive there. A science mentor (powered by
Claude) asks the hard questions; the creator makes every decision.

Built with [Vite](https://vitejs.dev) + React, [Supabase](https://supabase.com)
(database and accounts), and deployed on [Vercel](https://vercel.com).

## What it does

- **Planet builder**: star, orbit, size, gravity, day length, atmosphere, air,
  water, seasons, moons. Each choice explains its consequence for life.
- **Regions**: biomes like shallow seas, deserts, caves, or the twilight ring of
  a tidally locked world, each drawn as a living scene.
- **Creature workshop**: a guided set of questions (home, food, movement,
  breathing, senses, reproduction, defense, behavior, appearance). Built-in rules
  flag clashes with the planet and the food web and ask follow-up questions.
- **Illustrator**: every creature is drawn from its own settings, so it always
  looks the same.
- **Your own drawings**: upload a photo or picture of a creature, crop it, and erase
  the paper background on the device. The drawing is the main picture on the field
  guide page. Files live in Supabase Storage (bucket `organism-art`).
- **App-style illustrations**: Claude looks at the drawing and redraws it as flat
  vector art in the app's style (`api/illustrate.ts`). The SVG is sanitized on the
  server and stored with the creature; it is what appears in scenes and on cards.
- **Field guide**: a page per organism with anatomy, diet, behavior, and who eats whom.
- **Science mentor**: chat with Claude about the planet or a specific creature. When a
  creature has a drawing, the mentor can see it.
- **Accounts**: anyone can view public worlds; you must sign in to build.

## Local development

```bash
npm install
cp .env.example .env   # fill in the public Supabase values
npm run dev
```

## Environment variables

| Name | Where it lives | Notes |
| --- | --- | --- |
| `VITE_SUPABASE_URL` | Vercel + `.env` | Public. Supabase dashboard → Project Settings → API |
| `VITE_SUPABASE_PUBLISHABLE_KEY` | Vercel + `.env` | Public. Supabase dashboard → API Keys → Publishable key |
| `ANTHROPIC_API_KEY` | Vercel only (sensitive) | **Secret.** Enables the science mentor. Never put it in the code or `.env.example`. |

## Database

Migrations live in `supabase/migrations/`. Row Level Security is on for every
table: public planets are readable by everyone; only the owner can change a
planet, its regions, and its organisms; mentor chats are private to their author.

## Deployment

Vercel builds from the `main` branch as a production deployment. The mentor runs
as a serverless function in `api/mentor.ts`, so the Anthropic key stays on the server.
