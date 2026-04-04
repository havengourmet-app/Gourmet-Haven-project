import { create } from "zustand";

export const useUiStore = create((set) => ({
  mobileMenuOpen: false,
  activeCity: "Hyderabad",
  setMobileMenuOpen: (value) => set({ mobileMenuOpen: value }),
  setActiveCity: (city) => set({ activeCity: city })
}));
