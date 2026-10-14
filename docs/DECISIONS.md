# Entscheidungen & Annahmen

Format: **Entscheidung** – Begründung. Offene Punkte für den Kunden sind mit ❓ markiert.

## Technik

1. **Next.js 16.4 mit Cache Components + Partial Prefetching** (Default von `create-next-app`). Katalogdaten laufen über `"use cache"` (`cacheLife("hours")`, Tag `catalog`) und landen in der statischen Shell; nur such-/filterabhängige Teile streamen hinter `<Suspense>`. Nach einem Import invalidiert `POST /api/revalidate` (Bearer `REVALIDATE_SECRET`) den Tag.
2. **TypeScript 6.0, ESLint 9** statt der jeweils neuesten Major (TS 7 / ESLint 10) – `typescript-eslint` und `eslint-plugin-react` unterstützen diese noch nicht offiziell.
3. **Prisma 7.10 (stabil) statt 8.0-RC** mit Driver Adapter `better-sqlite3`. Enum-artige Felder (Lagerstatus, Versandklasse) sind Strings + TypeScript-Unions (`src/lib/catalog-constants.ts`), damit das Schema für PostgreSQL unverändert bleibt. Preise als **Integer-Cent brutto**.
   - Umstieg PostgreSQL: `provider = "postgresql"` im Schema, `@prisma/adapter-pg` in `src/server/db.ts`, Migrationen neu erzeugen.
4. **Repository-Schicht** (`src/server/catalog/types.ts` → `CatalogRepository`). UI-Komponenten importieren nur DTOs; für Shopware/JTL/Medusa wird eine weitere Implementierung geschrieben und in `src/server/catalog/index.ts` eingehängt.
5. **Suche: SQLite FTS5 in eigener Indexdatei** (`prisma/search.db`) statt in der Prisma-DB, weil virtuelle Tabellen sonst Migrations-Drift erzeugen. Zwei Indizes: Wort/Präfix (BM25 mit Spaltengewichten) + Trigramm für Teilwörter in Komposita („rost“ → „Gitterrost“). Deutsche Umschrift (ä→ae …) auf Index- und Anfrageseite. Hinter dem Interface `SearchProvider` → später PostgreSQL-Volltext oder Meilisearch.
6. **Facetten im Speicher** über die Grundmenge (Kategorie-Teilbaum ∩ Suchtreffer). Zähler sind exakt, Varianten zählen als ein Artikel. Unkritisch bis ca. 20.000 Artikel je Kategorie; darüber Facetten an die Suchmaschine abgeben.
7. **Varianten = eigene SKUs mit gleicher `variantGroup`**, Variantenachsen sind Attribute mit `variantAxis`. Entspricht dem Vater-/Kind-Modell gängiger Warenwirtschaften; jede Variante hat eine eigene, indexierbare URL. In Listen wird eine Gruppe zu einer Karte („ab …“, „n Varianten“) zusammengefasst.
8. **URLs:** Kategorien `/shop/<pfad>` (z. B. `/shop/gitterroste/normroste`), Produkte `/produkt/<slug>`, Marken `/marken/<slug>`. Filter als sprechende Query-Parameter (`?marke=stihl&maschenweite=30+x+30`). Kategorie-Slugs mit deutscher Umschrift.
9. **404-Verhalten mit PPR:** Für nicht vorgerenderte, unbekannte Slugs liefert der erste Aufruf die App-Shell (HTTP 200 + `noindex`), ab dem zweiten Aufruf echtes 404 (ISR-Eintrag). Bekannte Kategorien/Top-500-Produkte werden beim Build vorgerendert. Querverweise und alte URLs laufen über `next.config` als echte **301**.
10. **Tailwind v4 + eigene Komponenten im shadcn/ui-Muster** (Radix-Primitives, `cva`, `cn`). Die shadcn-CLI wurde nicht verwendet, die Komponenten liegen direkt in `src/components/ui`.
11. **Fonts selbst gehostet** (`@fontsource-variable/archivo` mit wdth/wght-Achse für Headlines, `inter` für Text) über `next/font/local` – keine Laufzeitanfrage an Google (DSGVO).
12. **Theme:** eigener 3-Stufen-Schalter (Hell/Dunkel/System) mit Inline-Script vor dem ersten Paint; Ohne JS greift `prefers-color-scheme`. Speicherung der expliziten Wahl in `localStorage` (vom Nutzer angefordert → technisch notwendig).
13. **Warenkorb (Phase 1 vorgezogen, minimal):** clientseitig (zustand + localStorage), damit „In den Warenkorb“ funktioniert. Preise dort nur zur Anzeige; im Checkout (Phase 2) wird serverseitig neu berechnet.

## Marke & Design

14. **Farben per Pixelanalyse des Logos:** Orange **#EF7100** (häufigster Farbwert, 10.249 px), Schattenkante **#1A1A18**. Hellblau der alten Seite wird nicht übernommen.
15. **Kontraste (WCAG 2.2 AA):** Orange auf Weiß hat nur 3,0:1 → Orange wird als Fläche mit dunkler Schrift genutzt (5,8:1). Orange als Textfarbe: `#A84E00` hell (5,6:1), `#F07A10` dunkel (6,2:1). Gedämpfter Text `#5C5853` (6,7:1) bzw. `#A8A29A` (7,5:1).
16. **Logo-Vektorisierung** (`npm run brand:assets`): Potrace-Trace in zwei Ebenen (Schattenkante + Orange), Farben 1:1. Favicon/Apple-Touch-Icon aus dem „b“-Glyph, OG-Bild 1200×630. Das Original-PNG bleibt unverändert in `public/brand/`. ❓ Für Dark Mode wird das Logo unverändert genutzt; eine Negativ-Variante (helle Schattenkante) bitte mit Böwe abstimmen.
17. **Markenlogos (Stihl, Abus …) nicht eingebunden** – nur Text-Chips, bis Nutzungsrechte geklärt sind.

## Inhalte & Daten

18. **Öffnungszeiten:** Mo–Do 8–17, Fr 8–13 Uhr als Standard (Widerspruch auf der alten Seite). Zentral in `src/config/site.ts`. ❓ Vom Kunden bestätigen.
19. **Kategoriebaum bereinigt** (`data/categories.json`): „Haus & Garten“ und „Gartengeräte“ zu „Garten und Forst“ zusammengeführt; Stihl nur noch an einer Stelle. **Türschlösser** existieren nur unter Sicherheitstechnik; unter „Tore und Türen“ als Querverweis (`linkTo`, 301 auf die kanonische URL). Der fehlerhafte Slug `/https/wwwboewe24de/arbeitskleidung/` wird per Redirect korrigiert.
20. **Seed-Daten sind Beispieldaten** (`source = "seed:beispiel"`): 59 SKUs (davon 3 Variantengruppen). Preise orientieren sich an den Briefing-Beispielen (Normrost 400×600 = 32,50 €, ABUS Gitterrostsicherung = 25,30 €, secuENTRY 299 €, Stihl-Akku bis 899 €), alle übrigen sind Schätzwerte und **nicht verbindlich**. EANs stammen aus dem GS1-Bereich 20–29 (intern, kollidiert nicht mit echten Hersteller-EANs), Herstellernummern sind mit `BSP-` gekennzeichnet. Ein Hinweisbanner („Beispieldaten“) erscheint, solange `NEXT_PUBLIC_DEMO_DATA=true`.
21. **Bilder & Texte – Rechte:** Jedes Produkt und jedes Bild hat `source` und `rights`. Seed-Texte sind selbst verfasst, Bilder sind selbst erzeugte SVG-Platzhalter (`npm run placeholders`). Beim Import echter Daten ist zu klären, ob Hersteller-Bilder/-Texte genutzt werden dürfen (Händlerportale, Lizenzbedingungen, Fotografenrechte). ❓
22. **Aktionen** (`src/config/promotions.ts`) enthalten keine Rabattversprechen – nur Inhalte mit freigegebenen Konditionen eintragen. Streichpreise (`compareAtPrice`) nur mit belegbarem niedrigstem Preis der letzten 30 Tage (PAngV § 11).
23. **Crawler für boewe24.de wurde nicht gebaut** – nur mit ausdrücklicher Freigabe des Betreibers (siehe Auftrag).
24. **Zielgruppen-Einstieg** (Profi/Privat) ändert nur Hervorhebungen, nicht Preise oder Sortiment; Auswahl lokal gespeichert.

## Recht & Datenschutz

25. **Cookie-Consent:** Opt-in, Standard „abgelehnt“, gleichwertige Buttons „Alle ablehnen“/„Alle akzeptieren“, granular (Statistik, Marketing, Externe Medien). Gespeichert als First-Party-Cookie `boewe_consent` (Version + Zeitstempel als Nachweis, 180 Tage). Drittinhalte nur über `<ConsentGate>`. Aktuell werden **keine** Drittanbieter geladen.
26. **Karte:** statischer Link zu OpenStreetMap statt Einbettung.
27. **Handelsregisternummer, USt-ID, Rechtstexte:** werden nicht erfunden; Rechtsseiten folgen in Phase 3 als gekennzeichnete Entwürfe. ❓

## Bekannte Einschränkungen nach Phase 1

- Footer/Header verlinken bereits auf Seiten aus Phase 2/3 (Konto, Merkzettel, Warenkorb, Kontakt, Rechtstexte …), die noch 404 liefern.
- Hero ist statisch; die 3D-Kamerafahrt folgt in Phase 4.
