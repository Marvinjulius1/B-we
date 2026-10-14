"use client";

import Link from "next/link";
import { ArrowRight, Building2, Check, Home, Receipt, Store, Truck, Users } from "lucide-react";
import { useAudience, type Audience } from "@/stores/audience";
import { cn } from "@/lib/utils";

const OPTIONS: { value: Exclude<Audience, null>; title: string; text: string; Icon: typeof Home }[] = [
  { value: "profi", title: "Ich bin Profi / Gewerbe", text: "Handwerk, Industrie, Kommunen & Landwirtschaft", Icon: Building2 },
  { value: "privat", title: "Ich bin Privatkunde", text: "Haus, Hof & Garten in Ostfriesland und überall", Icon: Home },
];

const HIGHLIGHTS: Record<Exclude<Audience, null>, { Icon: typeof Home; text: string; href?: string }[]> = {
  profi: [
    { Icon: Receipt, text: "Kauf auf Rechnung" },
    { Icon: Truck, text: "Speditionsversand für große Mengen und schwere Artikel" },
    { Icon: Building2, text: "Geschäftskunden-Konditionen im B2B-Shop", href: "/geschaeftskunden" },
  ],
  privat: [
    { Icon: Users, text: "Persönliche Beratung – am Telefon, per WhatsApp oder im Laden" },
    { Icon: Store, text: "Abholung im Ladengeschäft Aurich" },
    { Icon: Check, text: "Gastbestellung ohne Kundenkonto" },
  ],
};

/**
 * Zielgruppen-Einstieg. Beide Wege führen in denselben Shop; die Auswahl passt nur Hervorhebungen an
 * und wird lokal gemerkt (keine Einwilligung nötig, keine Weitergabe).
 */
export function AudienceSwitch() {
  const audience = useAudience((s) => s.audience);
  const setAudience = useAudience((s) => s.setAudience);

  return (
    <div className="space-y-4">
      <div role="radiogroup" aria-label="Wer sind Sie?" className="grid gap-3 sm:grid-cols-2">
        {OPTIONS.map(({ value, title, text, Icon }) => {
          const active = audience === value;
          return (
            <button
              key={value}
              type="button"
              role="radio"
              aria-checked={active}
              onClick={() => setAudience(active ? null : value)}
              className={cn(
                "group flex items-center gap-4 rounded-[var(--radius-card)] border p-4 text-left transition-[border-color,background-color,box-shadow] duration-300",
                active ? "border-ink bg-ink text-bg shadow-[var(--shadow-lift)]" : "border-line bg-surface hover:border-ink",
              )}
            >
              <span
                className={cn(
                  "inline-flex size-12 shrink-0 items-center justify-center rounded-2xl transition-colors",
                  active ? "bg-brand text-brand-ink" : "bg-surface-2 text-ink group-hover:bg-brand group-hover:text-brand-ink",
                )}
              >
                <Icon aria-hidden className="size-6" />
              </span>
              <span>
                <span className="block font-bold">{title}</span>
                <span className={cn("text-sm", active ? "opacity-75" : "text-muted")}>{text}</span>
              </span>
            </button>
          );
        })}
      </div>

      {audience && (
        <div className="animate-fade-up border-line bg-surface rounded-[var(--radius-card)] border p-4" aria-live="polite">
          <ul className="grid gap-2 sm:grid-cols-3">
            {HIGHLIGHTS[audience].map(({ Icon, text, href }) => (
              <li key={text} className="flex items-start gap-2 text-sm">
                <Icon aria-hidden className="text-brand-text mt-0.5 size-4 shrink-0" />
                {href ? (
                  <Link href={href} className="underline underline-offset-2">
                    {text}
                  </Link>
                ) : (
                  text
                )}
              </li>
            ))}
          </ul>
          <Link href="/shop" className="text-brand-text mt-4 inline-flex items-center gap-1.5 font-semibold hover:underline">
            Zum Sortiment <ArrowRight aria-hidden className="size-4" />
          </Link>
        </div>
      )}
    </div>
  );
}
