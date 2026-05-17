import { create } from "zustand";
import {
  getProfile,
  getSession,
  signIn as signInRequest,
  signOut as signOutRequest,
  signUp as signUpRequest
} from "../services/authService";

function fallbackProfile(user) {
  if (!user) {
    return null;
  }

  return {
    id: user.id,
    full_name: user.user_metadata?.full_name || user.email?.split("@")[0] || "QuickDyne User",
    role: user.user_metadata?.role || "customer",
    phone: user.phone || null
  };
}

export const useAuthStore = create((set, get) => ({
  session: null,
  user: null,
  profile: null,
  isReady: false,
  isLoading: false,
  error: null,

  bootstrapAuth: async () => {
    if (get().isReady || get().isLoading) {
      return;
    }

    set({ isLoading: true, error: null });

    try {
      const session = await getSession();
      const user = session?.user ?? null;
      const profile = user ? await getProfile(user.id).catch(() => fallbackProfile(user)) : null;

      set({
        session,
        user,
        profile,
        isReady: true,
        isLoading: false
      });
    } catch (error) {
      set({
        error: error.message,
        isReady: true,
        isLoading: false
      });
    }
  },

  signIn: async (values) => {
    set({ isLoading: true, error: null });

    try {
      const session = await signInRequest(values);
      const user = session?.user ?? null;
      const profile = user ? await getProfile(user.id).catch(() => fallbackProfile(user)) : null;

      set({
        session,
        user,
        profile,
        isLoading: false
      });

      return profile;
    } catch (error) {
      set({ error: error.message, isLoading: false });
      throw error;
    }
  },

  signUp: async (values) => {
    set({ isLoading: true, error: null });

    try {
      const data = await signUpRequest(values);
      set({ isLoading: false });
      return data;
    } catch (error) {
      set({ error: error.message, isLoading: false });
      throw error;
    }
  },

  signOut: async () => {
    set({ isLoading: true, error: null });

    try {
      await signOutRequest();
      set({
        session: null,
        user: null,
        profile: null,
        isLoading: false
      });
    } catch (error) {
      set({ error: error.message, isLoading: false });
      throw error;
    }
  },

  clearError: () => set({ error: null }),

  defaultRouteForRole: () => {
    const role = get().profile?.role || "customer";

    if (role === "owner") {
      return "/owner";
    }

    if (role === "delivery") {
      return "/delivery";
    }

    return "/customer";
  }
}));
