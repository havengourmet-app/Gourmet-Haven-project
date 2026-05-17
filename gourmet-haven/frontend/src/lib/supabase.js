import { createClient } from "@supabase/supabase-js";

const rawSupabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const rawSupabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

function normalizeSupabaseUrl(value) {
  return typeof value === "string" ? value.trim().replace(/\/+$/, "") : "";
}

function normalizeSupabaseAnonKey(value) {
  return typeof value === "string" ? value.trim() : "";
}

function getSupabaseConfigError(url, anonKey) {
  if (!url || !anonKey) {
    return "Supabase is not configured. Add VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY to frontend/.env.";
  }

  try {
    const parsedUrl = new URL(url);

    if (!["http:", "https:"].includes(parsedUrl.protocol)) {
      return "VITE_SUPABASE_URL must start with http:// or https://.";
    }
  } catch {
    return "VITE_SUPABASE_URL is not a valid URL.";
  }

  return "";
}

export const supabaseUrl = normalizeSupabaseUrl(rawSupabaseUrl);
export const supabaseAnonKey = normalizeSupabaseAnonKey(rawSupabaseAnonKey);
export const supabaseConfigError = getSupabaseConfigError(supabaseUrl, supabaseAnonKey);
export const isSupabaseConfigured = !supabaseConfigError;

export const supabase = isSupabaseConfigured
  ? createClient(supabaseUrl, supabaseAnonKey, {
      auth: {
        autoRefreshToken: false,
        detectSessionInUrl: true,
        persistSession: true,
        storageKey: "quickdyne-auth"
      }
    })
  : null;
