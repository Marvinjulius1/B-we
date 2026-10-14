"use client";

import { Search } from "lucide-react";
import { useUi } from "@/stores/ui";
import { cn } from "@/lib/utils";

/** Suchfeld-Optik im Header; öffnet die Command-Palette. */
export function SearchTrigger({ className }: { className?: string }) {
  const open = useUi((s) => s.setPaletteOpen);
  return (
    <button
      type="button"
      onClick={() => open(true)}
      aria-haspopup="dialog"
      aria-keyshortcuts="/ Control+K Meta+K"
      className={cn(
        "group border-line bg-surface text-muted hover:border-line-strong flex min-h-11 w-full items-center gap-3 rounded-full border px-4 text-left shadow-[var(--shadow-soft)] transition-colors",
        className,
      )}
    >
      <Search aria-hidden className="text-ink size-5" />
      <span className="flex-1 truncate text-[0.95rem]">Suchen nach Artikel, Marke, Artikelnummer …</span>
      <kbd className="border-line bg-surface-2 text-muted hidden rounded-md border px-1.5 py-0.5 font-sans text-xs lg:inline-block">
        Strg K
      </kbd>
    </button>
  );
}
