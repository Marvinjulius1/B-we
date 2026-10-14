"use client";

import Link from "next/link";
import Image from "next/image";
import { useState } from "react";
import { ChevronRight, LayoutGrid } from "lucide-react";
import { Sheet, SheetContent, SheetDescription, SheetTitle } from "@/components/ui/sheet";
import { useUi } from "@/stores/ui";
import { categoryImage } from "@/lib/category-visuals";
import { cn } from "@/lib/utils";
import type { CategoryNode } from "@/server/catalog/types";

/**
 * Kategorien als übersichtliches Panel statt 12-Punkte-Mega-Menü:
 * links Hauptkategorien als Bildkacheln, rechts die Unterkategorien der aktiven Auswahl.
 * Mobil: Vollbild-Sheet mit zweistufiger Liste.
 */
export function CategoryPanel({ tree }: { tree: CategoryNode[] }) {
  const open = useUi((s) => s.categoriesOpen);
  const setOpen = useUi((s) => s.setCategoriesOpen);
  const [activePath, setActivePath] = useState(tree[0]?.path);
  const active = tree.find((t) => t.path === activePath) ?? tree[0];

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetContent side="top" className="mx-auto max-h-[100dvh] max-w-[88rem] rounded-b-[var(--radius-tile)] md:max-h-[85dvh]">
        <div className="border-line border-b px-5 py-4 pr-16">
          <SheetTitle className="font-display text-xl font-bold">Sortiment</SheetTitle>
          <SheetDescription className="text-muted text-sm">
            Wählen Sie eine Kategorie – oder suchen Sie direkt mit <kbd className="font-sans">/</kbd>.
          </SheetDescription>
        </div>

        <div className="grid min-h-0 flex-1 overflow-hidden md:grid-cols-[minmax(0,1.35fr)_minmax(0,1fr)]">
          <ul className="grid min-h-0 grid-cols-2 content-start gap-2 overflow-y-auto p-3 sm:grid-cols-3 md:p-5">
            {tree.map((c) => (
              <li key={c.id}>
                <Link
                  href={c.href}
                  onClick={() => setOpen(false)}
                  onMouseEnter={() => setActivePath(c.path)}
                  onFocus={() => setActivePath(c.path)}
                  className={cn(
                    "group border-line bg-surface hover:border-ink flex h-full items-center gap-3 rounded-2xl border p-2.5 pr-3 transition-[border-color,background-color]",
                    active?.path === c.path && "md:border-ink md:bg-surface-2",
                  )}
                >
                  <Image
                    src={categoryImage(c.icon)}
                    alt=""
                    width={56}
                    height={56}
                    unoptimized
                    className="size-12 shrink-0 rounded-xl object-cover sm:size-14"
                  />
                  <span className="min-w-0">
                    <span className="block leading-tight font-semibold">{c.name}</span>
                    <span className="text-muted text-xs">{c.productCount} Artikel</span>
                  </span>
                </Link>
              </li>
            ))}
          </ul>

          {active && (
            <div className="border-line bg-surface-2/50 hidden min-h-0 overflow-y-auto border-l p-6 md:block" aria-live="polite">
              <p className="text-muted text-xs font-semibold tracking-wider uppercase">Unterkategorien</p>
              <h3 className="font-display mt-1 text-2xl font-bold">{active.name}</h3>
              {active.description && <p className="text-muted mt-2 text-sm">{active.description}</p>}
              <ul className="mt-5 grid grid-cols-2 gap-x-4 gap-y-1">
                {active.children.map((sub) => (
                  <li key={sub.id}>
                    <Link
                      href={sub.href}
                      onClick={() => setOpen(false)}
                      className="hover:bg-surface flex min-h-10 items-center justify-between gap-2 rounded-lg px-2"
                    >
                      <span>{sub.name}</span>
                      {sub.productCount > 0 && <span className="text-muted text-xs tabular-nums">{sub.productCount}</span>}
                    </Link>
                  </li>
                ))}
              </ul>
              <Link
                href={active.href}
                onClick={() => setOpen(false)}
                className="text-brand-text mt-6 inline-flex items-center gap-1 font-semibold hover:underline"
              >
                Alle Artikel in {active.name} <ChevronRight aria-hidden className="size-4" />
              </Link>
            </div>
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
}

export function CategoryPanelTrigger({ className, label = "Sortiment" }: { className?: string; label?: string }) {
  const setOpen = useUi((s) => s.setCategoriesOpen);
  return (
    <button
      type="button"
      onClick={() => setOpen(true)}
      aria-haspopup="dialog"
      className={cn(
        "bg-ink text-bg hover:bg-ink/85 inline-flex min-h-11 items-center gap-2 rounded-full px-4 font-semibold transition-colors",
        className,
      )}
    >
      <LayoutGrid aria-hidden className="size-4" />
      {label}
    </button>
  );
}
