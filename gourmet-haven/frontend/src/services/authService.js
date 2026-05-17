import { supabase, isSupabaseConfigured, supabaseConfigError, supabaseUrl } from "../lib/supabase";
import { apiRequest } from "./apiClient";

function isNetworkAuthError(error) {
  const message = String(error?.message || error || "");
  return (
    error instanceof TypeError ||
    message.includes("Failed to fetch") ||
    message.includes("NetworkError") ||
    message.includes("fetch")
  );
}

function toAuthError(error) {
  if (isNetworkAuthError(error)) {
    return new Error(
      `Cannot reach Supabase at ${supabaseUrl}. Check VITE_SUPABASE_URL in frontend/.env, your internet/DNS, and whether the Supabase project still exists.`
    );
  }

  return error instanceof Error ? error : new Error("Authentication failed.");
}

function assertSupabaseConfigured() {
  if (!isSupabaseConfigured) {
    throw new Error(supabaseConfigError || "Supabase Auth is not configured.");
  }
}

export async function getSession() {
  if (!supabase) {
    return null;
  }

  try {
    const {
      data: { session }
    } = await supabase.auth.getSession();

    return session;
  } catch (error) {
    await supabase.auth.signOut({ scope: "local" }).catch(() => {});
    throw toAuthError(error);
  }
}

export async function signIn({ email, password }) {
  assertSupabaseConfigured();

  try {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password
    });

    if (error) {
      throw error;
    }

    return data.session;
  } catch (error) {
    throw toAuthError(error);
  }
}

export async function signUp({ fullName, email, password, role }) {
  assertSupabaseConfigured();

  try {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          full_name: fullName,
          role
        }
      }
    });

    if (error) {
      throw error;
    }

    return data;
  } catch (error) {
    throw toAuthError(error);
  }
}

export async function signOut() {
  if (!supabase) {
    return;
  }

  const { error } = await supabase.auth.signOut();

  if (error) {
    throw error;
  }
}

export async function getProfile(userId) {
  if (supabase) {
    try {
      const { data, error } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", userId)
        .single();

      if (!error && data) {
        return data;
      }
    } catch (error) {
      if (isNetworkAuthError(error)) {
        throw toAuthError(error);
      }
    }
  }

  const response = await apiRequest("/auth/me");
  return response?.data || response;
}
