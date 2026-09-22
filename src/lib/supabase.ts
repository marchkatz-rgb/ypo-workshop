import { createClient } from "@supabase/supabase-js";

// PUBLIC values. The publishable key is safe in the browser; Row Level
// Security in the database decides who can read or change what.
const url = import.meta.env.VITE_SUPABASE_URL as string | undefined;
const key = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY as string | undefined;

export const isConfigured = Boolean(url && key);

export const supabase = createClient(url ?? "https://missing.supabase.co", key ?? "missing");
