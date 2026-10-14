import Link from "next/link";
import { ChevronRight } from "lucide-react";
import { breadcrumbSchema, JsonLd } from "@/components/seo/json-ld";
import { cn } from "@/lib/utils";

export interface Crumb {
  name: string;
  href: string;
}

/** Breadcrumbs inkl. BreadcrumbList-JSON-LD. Der letzte Eintrag ist die aktuelle Seite. */
export function Breadcrumbs({ items, className }: { items: Crumb[]; className?: string }) {
  const all = [{ name: "Start", href: "/" }, ...items];
  return (
    <>
      <nav aria-label="Brotkrumen" className={cn("text-muted text-sm", className)}>
        <ol className="flex flex-wrap items-center gap-x-1 gap-y-1">
          {all.map((c, i) => {
            const last = i === all.length - 1;
            return (
              <li key={c.href} className="inline-flex items-center gap-1">
                {last ? (
                  <span aria-current="page" className="text-ink font-medium">
                    {c.name}
                  </span>
                ) : (
                  <>
                    <Link href={c.href} className="hover:text-ink hover:underline">
                      {c.name}
                    </Link>
                    <ChevronRight aria-hidden className="size-3.5" />
                  </>
                )}
              </li>
            );
          })}
        </ol>
      </nav>
      <JsonLd data={breadcrumbSchema(all)} />
    </>
  );
}
