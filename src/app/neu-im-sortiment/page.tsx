import type { Metadata } from "next";
import { FlagListingPage } from "@/components/catalog/flag-listing-page";

export const metadata: Metadata = {
  title: "Neu im Sortiment",
  description:
    "Neuheiten bei Böwe in Aurich: frisch eingetroffene Artikel aus Garten und Forst, Gitterroste, Sicherheitstechnik und mehr.",
  alternates: { canonical: "/neu-im-sortiment" },
};

export default function NewPage({ searchParams }: PageProps<"/neu-im-sortiment">) {
  return (
    <FlagListingPage
      title="Neu im Sortiment"
      intro="Frisch eingetroffen – das haben wir neu für Sie aufgenommen."
      href="/neu-im-sortiment"
      flag="isNew"
      searchParams={searchParams}
    />
  );
}
