"use client";

import { useState } from "react";
import { ShieldCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { ConsentCategory } from "@/lib/consent";
import { saveConsent, useConsent, UNKNOWN } from "./consent-store";
import { DENY_ALL } from "@/lib/consent";

/**
 * Lädt Drittanbieter-Inhalte (YouTube, Karte, Captcha …) erst nach Einwilligung.
 * Bis dahin wird ein neutraler Platzhalter mit Erklärung gezeigt – ohne Verbindung zum Anbieter.
 */
export function ConsentGate({
  category,
  service,
  children,
  className,
}: {
  category: ConsentCategory;
  /** Anzeigename des Anbieters, z. B. "YouTube" */
  service: string;
  children: React.ReactNode;
  className?: string;
}) {
  const consent = useConsent();
  const [once, setOnce] = useState(false);
  const granted = once || (consent !== UNKNOWN && consent !== null && consent.granted[category]);

  if (granted) return <>{children}</>;

  return (
    <div className={className}>
      <div className="border-line-strong bg-surface-2 flex h-full min-h-48 flex-col items-center justify-center gap-3 rounded-[var(--radius-card)] border border-dashed p-6 text-center">
        <ShieldCheck aria-hidden className="text-brand-text size-8" />
        <p className="text-muted max-w-md text-sm">
          Hier wird ein Inhalt von <strong className="text-ink">{service}</strong> angezeigt. Beim Laden werden Daten an den
          Anbieter übertragen.
        </p>
        <div className="flex flex-wrap justify-center gap-2">
          <Button size="sm" variant="outline" onClick={() => setOnce(true)}>
            Einmal laden
          </Button>
          <Button
            size="sm"
            variant="dark"
            onClick={() => {
              const base = consent !== UNKNOWN && consent ? consent.granted : DENY_ALL;
              saveConsent({ ...base, [category]: true });
            }}
          >
            Immer erlauben
          </Button>
        </div>
      </div>
    </div>
  );
}
