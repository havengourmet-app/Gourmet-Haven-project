import { supabase } from "../lib/supabase";

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "/api";

async function getAccessToken() {
  if (!supabase) {
    return null;
  }

  const {
    data: { session }
  } = await supabase.auth.getSession();

  return session?.access_token ?? null;
}

// Fixes H7: previously a 401 from the backend (expired/invalid token) just
// threw a generic "Invalid or expired token" Error like any other failure,
// so the user saw a wall of unrelated-looking error toasts across whatever
// page they were on instead of a clean forced re-login. Now, any 401 forces
// a local sign-out and a hard redirect to /login, clearing the stale session
// so the next login starts clean. This is a fallback safety net — with the
// C4 fix (autoRefreshToken: true) this should rarely fire in practice, but
// it still matters for revoked tokens, clock skew, or a session deleted out
// from under the app.
let isHandlingUnauthorized = false;

async function handleUnauthorized() {
  if (isHandlingUnauthorized) return;
  isHandlingUnauthorized = true;

  try {
    if (supabase) {
      await supabase.auth.signOut({ scope: "local" }).catch(() => {});
    }
  } finally {
    if (typeof window !== "undefined" && !window.location.pathname.startsWith("/login")) {
      window.location.assign("/login");
    }
    isHandlingUnauthorized = false;
  }
}

export async function apiRequest(path, options = {}) {
  const token = await getAccessToken();
  const headers = new Headers(options.headers || {});

  if (!headers.has("Content-Type") && options.body && !(options.body instanceof FormData)) {
    headers.set("Content-Type", "application/json");
  }

  if (token) {
    headers.set("Authorization", `Bearer ${token}`);
  }

  const response = await fetch(`${API_BASE_URL}${path}`, {
    ...options,
    headers
  });

  if (response.status === 401) {
    void handleUnauthorized();
    throw new Error("Your session has expired. Please sign in again.");
  }

  if (!response.ok) {
    let payload = null;

    try {
      payload = await response.json();
    } catch {
      payload = null;
    }

    const message = payload?.message || payload?.error || "Request failed";
    throw new Error(message);
  }

  if (response.status === 204) {
    return null;
  }

  return response.json();
}