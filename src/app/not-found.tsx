import Link from "next/link";
import { buttonVariants } from "@/components/ui/button";
import { SearchTrigger } from "@/components/search/search-trigger";
import { site } from "@/config/site";

export default function NotFound() {
  return (
    <div className="container-page flex flex-col items-center py-24 text-center">
      <p className="font-display text-brand-text text-8xl font-extrabold">404</p>
      <h1 className="mt-4 text-3xl font-extrabold">Diese Seite gibt es nicht (mehr).</h1>
      <p className="text-muted mt-3 max-w-lg">
        Vielleicht ist der Artikel umgezogen. Suchen Sie direkt – oder rufen Sie uns an unter{" "}
        <a href={site.contact.phoneHref} className="text-ink font-semibold underline">
          {site.contact.phoneDisplay}
        </a>
        .
      </p>
      <div className="mt-8 w-full max-w-md">
        <SearchTrigger />
      </div>
      <Link href="/shop" className={`${buttonVariants({ variant: "dark" })} mt-6`}>
        Zum Sortiment
      </Link>
    </div>
  );
}
