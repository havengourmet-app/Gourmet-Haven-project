import { supabase, isSupabaseConfigured } from "../lib/supabase";
import { apiRequest } from "./apiClient";

export async function getSession() {
  if (!supabase) {
    return null;
  }

  const {
    data: { session }
  } = await supabase.auth.getSession();

  return session;
}

export async function signIn({ email, password }) {
  if (!isSupabaseConfigured) {
    throw new Error("Supabase Auth is not configured.");
  }

  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password
  });

  if (error) {
    throw error;
  }

  return data.session;
}

export async function signUp({ fullName, email, password, role }) {
  if (!isSupabaseConfigured) {
    throw new Error("Supabase Auth is not configured.");
  }

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
    const { data, error } = await supabase
      .from("profiles")
      .select("*")
      .eq("id", userId)
      .single();

    if (!error && data) {
      return data;
    }
  }

  const response = await apiRequest("/auth/me");
  return response?.data || response;
}
