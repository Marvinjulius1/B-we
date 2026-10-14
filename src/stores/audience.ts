"use client";

import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";

/** Zielgruppen-Einstieg: beeinflusst nur Hervorhebungen, nicht Sortiment oder Preise. */
export type Audience = "profi" | "privat" | null;

export const useAudience = create<{ audience: Audience; setAudience: (a: Audience) => void }>()(
  persist((set) => ({ audience: null, setAudience: (audience) => set({ audience }) }), {
    name: "boewe-audience",
    storage: createJSONStorage(() => localStorage),
    skipHydration: true,
  }),
);
