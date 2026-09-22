import { createClient } from "@supabase/supabase-js";

// These are PUBLIC values. The publishable key is safe to ship to the browser;
// access is controlled by Row Level Security policies in the database.
const url = import.meta.env.VITE_SUPABASE_URL;
const key = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;

export const isConfigured = Boolean(url && key);

export const supabase = isConfigured ? createClient(url, key) : null;
