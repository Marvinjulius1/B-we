"use client";

import { useSyncExternalStore } from "react";
import {
  CONSENT_COOKIE,
  CONSENT_MAX_AGE_DAYS,
  CONSENT_VERSION,
  parseConsent,
  type ConsentCategory,
  type ConsentState,
} from "@/lib/consent";

/** Sentinel für "noch nicht hydriert" – auf dem Server und beim ersten Client-Render. */
export const UNKNOWN = "unknown" as const;
type Snapshot = ConsentState | null | typeof UNKNOWN;

const listeners = new Set<() => void>();
let cache: Snapshot = UNKNOWN;
let settingsOpen = false;
const settingsListeners = new Set<() => void>();

function readCookie(): ConsentState | null {
  const m = document.cookie.match(new RegExp(`(?:^|; )${CONSENT_COOKIE}=([^;]*)`));
  return parseConsent(m?.[1]);
}

function subscribe(cb: () => void) {
  listeners.add(cb);
  return () => listeners.delete(cb);
}

function getSnapshot(): Snapshot {
  if (cache === UNKNOWN) cache = readCookie();
  return cache;
}

export function saveConsent(granted: Record<ConsentCategory, boolean>) {
  const state: ConsentState = { v: CONSENT_VERSION, at: new Date().toISOString(), granted };
  const secure = location.protocol === "https:" ? "; Secure" : "";
  document.cookie = `${CONSENT_COOKIE}=${encodeURIComponent(JSON.stringify(state))}; path=/; max-age=${
    CONSENT_MAX_AGE_DAYS * 86400
  }; SameSite=Lax${secure}`;
  cache = state;
  listeners.forEach((l) => l());
}

export function useConsent(): Snapshot {
  return useSyncExternalStore(subscribe, getSnapshot, () => UNKNOWN);
}

export function useHasConsent(category: ConsentCategory): boolean {
  const s = useConsent();
  return s !== UNKNOWN && s !== null && s.granted[category];
}

// Einstellungen von überall öffnen (z. B. Footer-Link "Cookie-Einstellungen")
export function openConsentSettings() {
  settingsOpen = true;
  settingsListeners.forEach((l) => l());
}
export function closeConsentSettings() {
  settingsOpen = false;
  settingsListeners.forEach((l) => l());
}
export function useConsentSettingsOpen(): boolean {
  return useSyncExternalStore(
    (cb) => {
      settingsListeners.add(cb);
      return () => settingsListeners.delete(cb);
    },
    () => settingsOpen,
    () => false,
  );
}
