import Image from "next/image";
import Link from "next/link";
import { cn } from "@/lib/utils";

/** Original-Wortmarke (vektorisiert, Seitenverhältnis 4,88:1 – feste Maße verhindern Layout-Shift). */
export function Logo({ className, eager = false }: { className?: string; eager?: boolean }) {
  return (
    <Link href="/" className={cn("inline-flex shrink-0 items-center", className)} aria-label="Böwe GmbH – zur Startseite">
      <Image
        src="/brand/boewe-logo.svg"
        alt=""
        width={488}
        height={100}
        loading={eager ? "eager" : "lazy"}
        unoptimized
        className="h-8 w-auto sm:h-9"
      />
    </Link>
  );
}
