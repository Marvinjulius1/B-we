import Link from "next/link";
import Image from "next/image";
import { ArrowUpRight } from "lucide-react";
import type { CategoryNode } from "@/server/catalog/types";
import { categoryImage } from "@/lib/category-visuals";
import { cn } from "@/lib/utils";

/** Bento-Kachel für Kategorien (Startseite, Shop-Übersicht). */
export function CategoryTile({
  category,
  size = "md",
  className,
}: {
  category: CategoryNode;
  size?: "md" | "lg";
  className?: string;
}) {
  return (
    <Link
      href={category.href}
      className={cn(
        "group border-line bg-surface hover:border-line-strong relative flex min-h-56 flex-col justify-between overflow-hidden rounded-[var(--radius-tile)] border p-5 transition-[border-color,box-shadow] duration-300 hover:shadow-[var(--shadow-lift)] md:p-6",
        size === "lg" && "md:min-h-[26rem]",
        className,
      )}
    >
      <div className="relative z-10 max-w-[75%]">
        <h3 className={cn("leading-none font-extrabold", size === "lg" ? "text-3xl md:text-5xl" : "text-2xl")}>
          {category.name}
        </h3>
        <p className="text-muted mt-2 text-sm">{category.productCount} Artikel</p>
        {size === "lg" && category.description && <p className="text-muted mt-3 max-w-sm">{category.description}</p>}
      </div>
      <Image
        src={categoryImage(category.icon)}
        alt=""
        width={400}
        height={400}
        unoptimized
        className={cn(
          "pointer-events-none absolute -right-6 -bottom-6 rounded-[var(--radius-tile)] transition-transform duration-700 ease-[var(--ease-out-expo)] group-hover:-translate-x-1 group-hover:-translate-y-1 group-hover:scale-105",
          size === "lg" ? "w-3/5" : "w-40 md:w-44",
        )}
      />
      <span className="bg-ink text-bg group-hover:bg-brand group-hover:text-brand-ink relative z-10 inline-flex size-11 items-center justify-center rounded-full transition-colors">
        <ArrowUpRight aria-hidden className="size-5" />
        <span className="sr-only">Zu {category.name}</span>
      </span>
    </Link>
  );
}
