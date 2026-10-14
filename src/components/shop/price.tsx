import Link from "next/link";
import { formatPrice } from "@/lib/money";
import { cn } from "@/lib/utils";

/**
 * Preisangabe nach PAngV: Bruttopreis, Hinweis "inkl. MwSt. zzgl. Versand" mit Link zu den Versandkosten.
 */
export function Price({
  cents,
  fromCents,
  compareAtCents,
  unit,
  size = "md",
  showTaxNote = true,
  className,
}: {
  cents: number;
  fromCents?: number | null;
  compareAtCents?: number | null;
  unit?: string;
  size?: "sm" | "md" | "lg";
  showTaxNote?: boolean;
  className?: string;
}) {
  const display = fromCents ?? cents;
  return (
    <div className={cn("leading-tight", className)}>
      <p className="flex flex-wrap items-baseline gap-x-2">
        <span
          className={cn(
            "font-display font-extrabold tracking-tight tabular-nums",
            size === "sm" && "text-lg",
            size === "md" && "text-xl",
            size === "lg" && "text-4xl",
          )}
        >
          {fromCents ? <span className="mr-1 text-[0.7em] font-semibold">ab</span> : null}
          {formatPrice(display)}
        </span>
        {compareAtCents && compareAtCents > display ? (
          <span className="text-muted text-sm line-through">
            <span className="sr-only">bisheriger Preis </span>
            {formatPrice(compareAtCents)}
          </span>
        ) : null}
        {unit && unit !== "Stück" ? <span className="text-muted text-sm">/ {unit}</span> : null}
      </p>
      {showTaxNote && (
        <p className="text-muted mt-0.5 text-xs">
          inkl. MwSt.{" "}
          <Link href="/service/versand" className="hover:text-ink underline underline-offset-2">
            zzgl. Versand
          </Link>
        </p>
      )}
    </div>
  );
}
