"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { Command } from "cmdk";
import { Dialog } from "radix-ui";
import { ArrowRight, Clock, FolderTree, Loader2, Search, Tag } from "lucide-react";
import { useUi } from "@/stores/ui";
import { formatPrice } from "@/lib/money";
import type { SuggestResult } from "@/server/catalog/types";

const RECENT_KEY = "boewe-recent-searches";
const DEBOUNCE_MS = 180;

const QUICK_LINKS = [
  { label: "Gitterroste", href: "/shop/gitterroste" },
  { label: "Gitterroste nach Maß", href: "/gitterroste-nach-mass" },
  { label: "Stihl", href: "/shop/garten-und-forst/stihl" },
  { label: "Arbeitsschutz", href: "/shop/arbeitsschutz" },
  { label: "Doppelstabmatten", href: "/shop/zaeune/doppelstabmatten" },
  { label: "Fundgrube", href: "/shop/fundgrube" },
];

function readRecent(): string[] {
  try {
    return JSON.parse(localStorage.getItem(RECENT_KEY) ?? "[]") as string[];
  } catch {
    return [];
  }
}

function rememberSearch(q: string) {
  try {
    const next = [q, ...readRecent().filter((r) => r.toLowerCase() !== q.toLowerCase())].slice(0, 5);
    localStorage.setItem(RECENT_KEY, JSON.stringify(next));
  } catch {
    /* ignorieren */
  }
}

const EMPTY: SuggestResult = { products: [], categories: [], brands: [] };

/**
 * Globale Suche im Command-Palette-Stil.
 * Tastenkürzel: "/" (außerhalb von Eingabefeldern) und Strg/⌘ + K.
 * Vorschläge kommen debounced von /api/search/suggest; Enter ohne Auswahl → Ergebnisseite.
 */
export function CommandPalette() {
  const open = useUi((s) => s.paletteOpen);
  const setOpen = useUi((s) => s.setPaletteOpen);
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [result, setResult] = useState<SuggestResult>(EMPTY);
  const [loading, setLoading] = useState(false);
  const [recent, setRecent] = useState<string[]>([]);
  const abortRef = useRef<AbortController | null>(null);

  // Tastenkürzel
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const t = e.target as HTMLElement | null;
      const typing = !!t && (t.isContentEditable || /^(INPUT|TEXTAREA|SELECT)$/.test(t.tagName));
      if ((e.key === "k" || e.key === "K") && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        setOpen(!useUi.getState().paletteOpen);
      } else if (e.key === "/" && !typing && !e.metaKey && !e.ctrlKey && !e.altKey) {
        e.preventDefault();
        setOpen(true);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [setOpen]);

  // Debounced Vorschläge
  useEffect(() => {
    const q = query.trim();
    if (q.length < 2) {
      abortRef.current?.abort();
      return;
    }
    const timer = window.setTimeout(async () => {
      abortRef.current?.abort();
      const ctrl = new AbortController();
      abortRef.current = ctrl;
      setLoading(true);
      try {
        const res = await fetch(`/api/search/suggest?q=${encodeURIComponent(q)}`, { signal: ctrl.signal });
        if (res.ok) setResult((await res.json()) as SuggestResult);
      } catch (err) {
        if ((err as Error).name !== "AbortError") setResult(EMPTY);
      } finally {
        if (!ctrl.signal.aborted) setLoading(false);
      }
    }, DEBOUNCE_MS);
    return () => window.clearTimeout(timer);
  }, [query]);

  const go = (href: string, remember?: string) => {
    if (remember) rememberSearch(remember);
    setOpen(false);
    router.push(href);
  };

  const submitSearch = (q = query.trim()) => {
    if (q) go(`/suche?q=${encodeURIComponent(q)}`, q);
  };

  const onOpenChange = (o: boolean) => {
    setOpen(o);
    if (o) setRecent(readRecent());
  };

  const showSuggestions = query.trim().length >= 2;
  const hasResults = result.products.length + result.categories.length + result.brands.length > 0;

  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-50 bg-[var(--overlay)] backdrop-blur-sm data-[state=open]:animate-[fade-in_.2s_ease-out]" />
        <Dialog.Content
          className="fixed inset-x-0 top-0 z-50 mx-auto w-full max-w-2xl p-2 outline-none data-[state=open]:animate-[palette-in_.25s_var(--ease-out-expo)] sm:top-[10vh] sm:p-4"
          aria-describedby={undefined}
          onOpenAutoFocus={() => setRecent(readRecent())}
        >
          <Dialog.Title className="sr-only">Suche</Dialog.Title>
          <Command
            shouldFilter={false}
            label="Produktsuche"
            className="border-line bg-surface text-ink overflow-hidden rounded-[var(--radius-card)] border shadow-[var(--shadow-lift)]"
            onKeyDown={(e) => {
              // Enter ohne aktiven Vorschlag → Volltextsuche
              if (e.key === "Enter" && !document.querySelector("[cmdk-item][data-selected=true]")) {
                e.preventDefault();
                submitSearch();
              }
            }}
          >
            <div className="border-line flex items-center gap-3 border-b px-4">
              {loading ? (
                <Loader2 aria-hidden className="text-muted size-5 animate-spin" />
              ) : (
                <Search aria-hidden className="text-muted size-5" />
              )}
              <Command.Input
                value={query}
                onValueChange={setQuery}
                placeholder="z. B. Gitterrost 30/30, Stihl Akku, GR-1061"
                className="placeholder:text-muted h-16 flex-1 bg-transparent text-lg outline-none"
                aria-label="Suchbegriff"
              />
              <kbd className="border-line text-muted hidden rounded-md border px-1.5 py-0.5 text-xs sm:block">Esc</kbd>
            </div>

            <Command.List className="max-h-[min(70dvh,32rem)] overflow-y-auto overscroll-contain p-2">
              {!showSuggestions && (
                <>
                  {recent.length > 0 && (
                    <Command.Group heading="Zuletzt gesucht" className="palette-group">
                      {recent.map((r) => (
                        <Command.Item key={r} value={`recent-${r}`} onSelect={() => submitSearch(r)} className="palette-item">
                          <Clock aria-hidden className="text-muted size-4" />
                          {r}
                        </Command.Item>
                      ))}
                    </Command.Group>
                  )}
                  <Command.Group heading="Schnellzugriff" className="palette-group">
                    {QUICK_LINKS.map((l) => (
                      <Command.Item key={l.href} value={l.href} onSelect={() => go(l.href)} className="palette-item">
                        <ArrowRight aria-hidden className="text-brand-text size-4" />
                        {l.label}
                      </Command.Item>
                    ))}
                  </Command.Group>
                </>
              )}

              {showSuggestions && !loading && !hasResults && (
                <Command.Empty className="text-muted px-4 py-8 text-center">
                  Keine direkten Treffer für „{query.trim()}“. Mit Enter starten Sie die Volltextsuche – oder rufen Sie uns an,
                  wir finden es für Sie.
                </Command.Empty>
              )}

              {showSuggestions && result.categories.length > 0 && (
                <Command.Group heading="Kategorien" className="palette-group">
                  {result.categories.map((c) => (
                    <Command.Item
                      key={c.path}
                      value={`cat-${c.path}`}
                      onSelect={() => go(`/shop/${c.path}`, query.trim())}
                      className="palette-item"
                    >
                      <FolderTree aria-hidden className="text-muted size-4" />
                      <span>
                        {c.name}
                        {c.parentName && <span className="text-muted"> in {c.parentName}</span>}
                      </span>
                    </Command.Item>
                  ))}
                </Command.Group>
              )}

              {showSuggestions && result.products.length > 0 && (
                <Command.Group heading="Artikel" className="palette-group">
                  {result.products.map((p) => (
                    <Command.Item
                      key={p.id}
                      value={`p-${p.id}`}
                      onSelect={() => go(`/produkt/${p.slug}`, query.trim())}
                      className="palette-item"
                    >
                      <Image
                        src={p.images[0]?.url ?? "/images/placeholder/default-1.svg"}
                        alt=""
                        width={44}
                        height={44}
                        unoptimized
                        className="bg-surface-2 size-11 shrink-0 rounded-lg object-cover"
                      />
                      <span className="min-w-0 flex-1">
                        <span className="block truncate font-medium">{p.name}</span>
                        <span className="text-muted block text-xs">
                          {p.brand?.name ? `${p.brand.name} · ` : ""}Art.-Nr. {p.sku}
                        </span>
                      </span>
                      <span className="shrink-0 font-semibold tabular-nums">{formatPrice(p.priceGrossCents)}</span>
                    </Command.Item>
                  ))}
                </Command.Group>
              )}

              {showSuggestions && result.brands.length > 0 && (
                <Command.Group heading="Marken" className="palette-group">
                  {result.brands.map((b) => (
                    <Command.Item
                      key={b.slug}
                      value={`b-${b.slug}`}
                      onSelect={() => go(`/marken/${b.slug}`, query.trim())}
                      className="palette-item"
                    >
                      <Tag aria-hidden className="text-muted size-4" />
                      {b.name}
                    </Command.Item>
                  ))}
                </Command.Group>
              )}

              {showSuggestions && (
                <Command.Item
                  value="__all__"
                  onSelect={() => submitSearch()}
                  className="palette-item border-line mt-1 border-t pt-3"
                >
                  <Search aria-hidden className="text-brand-text size-4" />
                  Alle Ergebnisse für „{query.trim()}“
                </Command.Item>
              )}
            </Command.List>
          </Command>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
