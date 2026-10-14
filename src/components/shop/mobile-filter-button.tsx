"use client";

import { useState } from "react";
import { SlidersHorizontal } from "lucide-react";
import { Sheet, SheetContent, SheetTitle } from "@/components/ui/sheet";
import { FilterPanel, type FilterPanelProps } from "./filter-panel";
import { useListingNav } from "./listing-shell";

export function MobileFilterButton({ activeCount, total, ...panel }: FilterPanelProps & { activeCount: number; total: number }) {
  const [open, setOpen] = useState(false);
  const { pending } = useListingNav();
  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="border-line-strong bg-surface inline-flex min-h-11 items-center gap-2 rounded-full border px-4 font-semibold lg:hidden"
        aria-haspopup="dialog"
      >
        <SlidersHorizontal aria-hidden className="size-4" />
        Filter
        {activeCount > 0 && <span className="bg-brand text-brand-ink rounded-full px-2 text-xs leading-5">{activeCount}</span>}
      </button>
      <SheetContent side="bottom" className="h-[88dvh]">
        <div className="border-line border-b px-5 py-4">
          <SheetTitle className="text-lg font-bold">Filter</SheetTitle>
        </div>
        <div className="flex-1 overflow-y-auto px-5 pb-4">
          <FilterPanel {...panel} variant="sidebar" />
        </div>
        <div className="border-line border-t p-4 pb-[calc(1rem+env(safe-area-inset-bottom))]">
          <button
            type="button"
            onClick={() => setOpen(false)}
            className="bg-ink text-bg min-h-12 w-full rounded-full font-semibold"
          >
            {pending ? "Wird aktualisiert …" : `${total} Artikel anzeigen`}
          </button>
        </div>
      </SheetContent>
    </Sheet>
  );
}
