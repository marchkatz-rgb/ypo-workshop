# YPO Workshop

A simple starter website built with [Vite](https://vitejs.dev), connected to a
[Supabase](https://supabase.com) database, and deployed on [Vercel](https://vercel.com).

The site shows a public guestbook: visitors can post a short message and see recent entries.

## Local development

```bash
npm install
cp .env.example .env   # then fill in the values from the Supabase dashboard
npm run dev
```

## Environment variables

| Name | Where to find it |
| --- | --- |
| `VITE_SUPABASE_URL` | Supabase dashboard → Project Settings → API → Project URL |
| `VITE_SUPABASE_PUBLISHABLE_KEY` | Supabase dashboard → Project Settings → API Keys → Publishable key |

Both values are **public** and safe to ship to the browser. Never put the Supabase
`secret` / `service_role` key in this repo or in the website.

## Database

The `guestbook` table lives in `supabase/migrations/`. Row Level Security is enabled:
anyone can read and insert entries; nobody can update or delete them from the client.

## Deployment

Vercel builds from the `main` branch. Every push to `main` is a production deployment.
