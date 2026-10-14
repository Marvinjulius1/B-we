"use client";

import { useId, useState } from "react";
import Link from "next/link";
import { Switch } from "radix-ui";
import { Cookie } from "lucide-react";
import { Button } from "@/components/ui/button";
import { CONSENT_CATEGORIES, DENY_ALL, GRANT_ALL, type ConsentCategory } from "@/lib/consent";
import { closeConsentSettings, saveConsent, UNKNOWN, useConsent, useConsentSettingsOpen } from "./consent-store";

/**
 * Einwilligungsbanner: nicht blockierend, gleichwertige Schaltflächen "Ablehnen" und "Akzeptieren",
 * granulare Einstellungen. Erscheint erst nach der Hydration (kein Layout-Shift im SSR-HTML).
 */
export function ConsentBanner() {
  const consent = useConsent();
  const settingsRequested = useConsentSettingsOpen();
  const visible = consent !== UNKNOWN && (consent === null || settingsRequested);
  if (!visible) return null;
  // key: beim erneuten Öffnen startet das Panel mit der gespeicherten Auswahl
  return (
    <ConsentPanel
      key={settingsRequested ? "settings" : "first"}
      initial={consent?.granted ?? DENY_ALL}
      startWithDetails={settingsRequested}
    />
  );
}

function ConsentPanel({ initial, startWithDetails }: { initial: Record<ConsentCategory, boolean>; startWithDetails: boolean }) {
  const [detailsOpen, setShowDetails] = useState(startWithDetails);
  const [draft, setDraft] = useState<Record<ConsentCategory, boolean>>(initial);
  const titleId = useId();

  const decide = (granted: Record<ConsentCategory, boolean>) => {
    saveConsent(granted);
    setShowDetails(false);
    closeConsentSettings();
  };

  return (
    <section
      role="region"
      aria-labelledby={titleId}
      className="border-line bg-surface text-ink fixed inset-x-2 bottom-[calc(4.75rem+env(safe-area-inset-bottom))] z-[45] mx-auto max-w-2xl rounded-[var(--radius-card)] border p-5 shadow-[var(--shadow-lift)] md:bottom-4 md:p-6"
    >
      <div className="flex items-start gap-3">
        <Cookie aria-hidden className="text-brand-text mt-0.5 size-6 shrink-0" />
        <div className="min-w-0 flex-1">
          <h2 id={titleId} className="text-lg font-bold">
            Ihre Privatsphäre, Ihre Entscheidung
          </h2>
          <p className="text-muted mt-1 text-sm">
            Wir verwenden nur technisch notwendige Speicher. Statistik, Marketing und externe Medien (z. B. Videos, Karten) laden
            wir erst, wenn Sie zustimmen. Ihre Auswahl können Sie jederzeit im Footer unter „Cookie-Einstellungen“ ändern. Mehr in
            der{" "}
            <Link href="/datenschutz" className="text-brand-text font-medium underline underline-offset-2">
              Datenschutzerklärung
            </Link>
            .
          </p>
        </div>
      </div>

      {detailsOpen && (
        <ul className="mt-4 max-h-[40dvh] space-y-3 overflow-y-auto pr-1">
          {CONSENT_CATEGORIES.map((c) => {
            const id = `consent-${c.id}`;
            const checked = c.required ? true : draft[c.id as ConsentCategory];
            return (
              <li key={c.id} className="border-line bg-surface-2/60 rounded-xl border p-3">
                <div className="flex items-center justify-between gap-4">
                  <label htmlFor={id} className="font-semibold">
                    {c.label}
                    {c.required && <span className="text-muted ml-2 text-xs font-normal">immer aktiv</span>}
                  </label>
                  <Switch.Root
                    id={id}
                    checked={checked}
                    disabled={c.required}
                    onCheckedChange={(v) => setDraft((d) => ({ ...d, [c.id]: v }))}
                    className="bg-line-strong data-[state=checked]:bg-brand relative h-7 w-12 shrink-0 rounded-full transition-colors disabled:opacity-60"
                  >
                    <Switch.Thumb className="bg-surface block size-6 translate-x-0.5 rounded-full shadow transition-transform data-[state=checked]:translate-x-[1.375rem]" />
                  </Switch.Root>
                </div>
                <p className="text-muted mt-1 text-sm">{c.description}</p>
                <p className="text-muted mt-1 text-xs">Dienste: {c.services.join(" · ")}</p>
              </li>
            );
          })}
        </ul>
      )}

      <div className="mt-5 grid gap-2 sm:grid-cols-3">
        <Button variant="outline" onClick={() => decide(DENY_ALL)}>
          Alle ablehnen
        </Button>
        {detailsOpen ? (
          <Button variant="outline" onClick={() => decide(draft)}>
            Auswahl speichern
          </Button>
        ) : (
          <Button variant="outline" onClick={() => setShowDetails(true)}>
            Einstellungen
          </Button>
        )}
        <Button variant="outline" onClick={() => decide(GRANT_ALL)}>
          Alle akzeptieren
        </Button>
      </div>
    </section>
  );
}
