"use client";

import { create } from "zustand";

/** Globale UI-Zustände (nicht persistiert): Such-Palette, Kategorie-Panel. */
interface UiState {
  paletteOpen: boolean;
  categoriesOpen: boolean;
  setPaletteOpen: (open: boolean) => void;
  setCategoriesOpen: (open: boolean) => void;
}

export const useUi = create<UiState>()((set) => ({
  paletteOpen: false,
  categoriesOpen: false,
  setPaletteOpen: (paletteOpen) => set({ paletteOpen, categoriesOpen: false }),
  setCategoriesOpen: (categoriesOpen) => set({ categoriesOpen, paletteOpen: false }),
}));
