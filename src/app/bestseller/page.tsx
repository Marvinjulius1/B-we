import type { Metadata } from "next";
import { FlagListingPage } from "@/components/catalog/flag-listing-page";

export const metadata: Metadata = {
  title: "Bestseller",
  description: "Die meistgekauften Artikel bei Böwe – bewährt im Handwerk und rund ums Haus.",
  alternates: { canonical: "/bestseller" },
};

export default function BestsellerPage({ searchParams }: PageProps<"/bestseller">) {
  return (
    <FlagListingPage
      title="Bestseller"
      intro="Was Handwerker und Hausbesitzer aus Ostfriesland am häufigsten bei uns kaufen."
      href="/bestseller"
      flag="isBestseller"
      searchParams={searchParams}
    />
  );
}
