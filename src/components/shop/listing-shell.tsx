"use client";

import { createContext, useCallback, useContext, useTransition } from "react";
import { useRouter } from "next/navigation";
import { cn } from "@/lib/utils";

interface ListingNav {
  pending: boolean;
  navigate: (href: string) => void;
}

const Ctx = createContext<ListingNav>({ pending: false, navigate: () => {} });

/** Teilt den Navigationszustand zwischen Filtern und Trefferliste (Liste wird während des Ladens gedimmt). */
export function ListingShell({ children, className }: { children: React.ReactNode; className?: string }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const navigate = useCallback((href: string) => startTransition(() => router.replace(href, { scroll: false })), [router]);
  return (
    <Ctx.Provider value={{ pending, navigate }}>
      <div className={className} data-pending={pending || undefined}>
        {children}
      </div>
    </Ctx.Provider>
  );
}

export const useListingNav = () => useContext(Ctx);

export function ListingResults({ children, className }: { children: React.ReactNode; className?: string }) {
  const { pending } = useListingNav();
  return (
    <div aria-busy={pending} className={cn("transition-opacity duration-200", pending && "opacity-50", className)}>
      {children}
    </div>
  );
}
