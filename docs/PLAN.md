# Umsetzungsplan – Onlineshop & Firmenwebsite Böwe GmbH

Stand: 14.10.2026 · Grundlage: `docs/boewe-briefing.md` · Entscheidungen: `docs/DECISIONS.md`

## 1. Architektur

```
Browser ──► Next.js 16 (App Router, Cache Components / PPR)
             ├─ Server Components  ── Repository-Schicht (src/server/catalog)
             │                         └─ Prisma 7 + SQLite (dev) / PostgreSQL (prod)
             ├─ Suche               ── SearchProvider (src/server/search)
             │                         └─ SQLite FTS5 (eigene Indexdatei) / später Postgres-FTS oder Meilisearch
             ├─ Route Handler       ── /api/search/suggest, /api/products (Mehr laden), später Checkout/Payment
             ├─ Client-Inseln       ── Suche (Command-Palette), Filter-Steuerung, Warenkorb (zustand), Consent
             └─ 3D/Effekte (Phase 4)── R3F/drei nur dynamisch (ssr:false), GSAP/Lenis, Framer Motion
```

Leitlinien

- **Server first:** Katalogseiten sind Server Components. Katalogdaten werden mit `"use cache"` + `cacheTag("catalog")` gecacht und landen in der statischen Shell (PPR); nur filter-/suchabhängige Teile streamen hinter `<Suspense>`.
- **Austauschbares Backend:** UI kennt nur die Interfaces `CatalogRepository` und `SearchProvider`. Ein späterer Wechsel auf Shopware/JTL/Medusa heißt: neue Implementierung derselben Interfaces, keine UI-Änderung.
- **Eine Importpipeline für alles:** Seed-Daten, Warenwirtschafts-Exporte (CSV/JSON/XML) und ein evtl. späterer Crawler erzeugen dasselbe validierte Importformat (zod) und laufen durch denselben idempotenten Importer.
- **Effekte sind progressive Erweiterung:** Inhalt und Navigation funktionieren ohne JS-Effekte, ohne WebGL und mit `prefers-reduced-motion`.

## 2. Ordnerstruktur

```
data/                     Kategoriebaum, Marken, Seed-Produkte (Importformat), redirects.csv
docs/                     Briefing, Plan, Entscheidungen
prisma/                   schema.prisma, migrations/, seed.ts
public/brand/             Logo (PNG-Original + vektorisiertes SVG), OG-Bild
public/images/placeholder Selbst erzeugte Produkt-Platzhalter (SVG)
scripts/                  brand-assets.ts, generate-placeholders.ts, import-products.ts
src/app/                  Routen (App Router)
  (shop)/shop/[[...path]]   Kategorien / Produktlisten
  produkt/[slug]            Produktseite
  suche/                    Suchergebnisse
  api/                      Route Handler
src/components/           ui/ (Basis-Komponenten), layout/, shop/, search/, consent/
src/config/               site.ts (Kontakt, Öffnungszeiten, Navigation) – zentrale Pflegepunkte
src/lib/                  Formatierung (Preis, Lieferzeit), SEO-Helfer, Utilities
src/server/               nur serverseitig: db, catalog (Repository), search, import
src/stores/               Client-Stores (Warenkorb, Wunschzettel, Vergleich)
tests/                    Vitest (Logik), e2e/ (Playwright, Phase 5)
```

## 3. Datenmodell (Kern)

| Modell             | Zweck                                                                                         | Wichtige Felder                                                                                                                                                                                                                                            |
| ------------------ | --------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `Category`         | Baum (selbstreferenziell)                                                                     | `slug`, `path` (unique, z. B. `gitterroste/normroste`), `parentId`, `depth`, `sortOrder`, `filterKeys` (JSON), Meta-Felder                                                                                                                                 |
| `Brand`            | Hersteller                                                                                    | `slug`, `name`, `featured`                                                                                                                                                                                                                                 |
| `Product`          | Artikel = 1 SKU                                                                               | `sku`, `slug`, `name`, `priceGrossCents`, `taxRate`, `shippingClass` (PAKET/SPEDITION), `stockStatus`, `deliveryTime`, `ean`, `mpn`, `variantGroup`, Flags (`isNew`, `isBestseller`, `isTopProduct`, `isClearance`, `containsBattery`), `source`, `rights` |
| `ProductImage`     | Bilder                                                                                        | `url`, `alt`, `sortOrder`, `source`, `rights`                                                                                                                                                                                                              |
| `ProductAttribute` | Technische Daten & Filter                                                                     | `key`, `label`, `value`, `unit`, `numericValue`, `isVariantAxis`                                                                                                                                                                                           |
| `ProductCategory`  | n:m Produkt↔Kategorie                                                                         | erste Kategorie = Primärkategorie (Breadcrumb, kanonische URL)                                                                                                                                                                                             |
| `ProductRelation`  | „Passend dazu“                                                                                | `type` (ACCESSORY / SIMILAR)                                                                                                                                                                                                                               |
| ab Phase 2         | `User`, `Account`, `Session`, `Address`, `Order`, `OrderItem`, `WishlistItem`                 |                                                                                                                                                                                                                                                            |
| ab Phase 3         | `NewsletterSubscriber` (Double-Opt-in), `ContactRequest`, `CallbackRequest`, `GratingInquiry` |                                                                                                                                                                                                                                                            |

Preise als Integer-Cent (keine Rundungsfehler), brutto, MwSt.-Satz je Artikel. Varianten: mehrere SKUs mit gleicher `variantGroup`; Variantenachsen sind Attribute mit `isVariantAxis`.

## 4. Phasen

| Phase               | Inhalt                                                                                                                                                                                                                                                           | Abnahme                                |
| ------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------- |
| 0 Setup             | Next.js/TS strict, Tailwind-Tokens, Fonts, Logo-Assets (SVG-Trace, Favicons, OG), Layout-Shell (Header mit Suche/Command-Palette, Kategorie-Panel, Footer, Mobile-Leiste), Dark/Light, Cookie-Consent (Opt-in), DECISIONS.md                                     | typecheck · lint · build               |
| 1 Daten & Shop-Kern | Prisma-Schema, Importpipeline + Fehlerreport, Seed (≈50 Artikel), Kategorien, Listen mit Facetten/Sortierung/Pagination + „Mehr laden“, Produktseite, Suche (FTS5) mit Autovervollständigung, SEO-Grundlagen (Meta, JSON-LD, Sitemap, Robots, Redirects aus CSV) | + Vitest                               |
| 2 Kaufprozess       | Warenkorb (Mini-Cart + Seite), Wunschzettel, Vergleich, Auth.js-Konto, Gast-Checkout, Versand-/Zahlarten über Adapter (Stripe/PayPal Test), Bestellbestätigung (Dev-Mail)                                                                                        | + Vitest für Preis-/Versandlogik       |
| 3 Inhalte & Service | Kontakt + Rückruf (Spamschutz), Newsletter DOI, Gitterrost-Anfrage, Marken, Fundgrube, Anhängerzubehör, Ladengeschäft, Service- und Rechtsseiten (Entwürfe), Widerrufsformular                                                                                   |                                        |
| 4 Wow-Effekte       | Hero-Kamerafahrt (R3F, Spline), Zeitreise „Über uns“, Konfigurator-Vorschau, Micro-Interactions, Page-Transitions, alle Fallbacks                                                                                                                                | fps-/Fallback-Checks                   |
| 5 Qualität          | Performance-Tuning, a11y-Audit, Playwright-Kernflows, SEO-Feinschliff, README/Deploy                                                                                                                                                                             | Lighthouse ≥ 90 mobil (Listen/Produkt) |

## 5. Risiken & Gegenmaßnahmen

| Risiko                                              | Gegenmaßnahme                                                                                                  |
| --------------------------------------------------- | -------------------------------------------------------------------------------------------------------------- |
| Keine echten Produktdaten/Bilder                    | Importpipeline zuerst, Seed als Beispieldaten klar gekennzeichnet (`source`), Platzhalterbilder selbst erzeugt |
| Rechtstexte/Firmendaten fehlen (HRB, USt-ID)        | Entwurfsplatzhalter, deutlich markiert, nichts erfunden                                                        |
| 3D kostet Performance/Barrierefreiheit              | Nur Startseite/Über uns, Idle-Load, Geräte-Check, DPR-Limit, Reduced-Motion- und No-WebGL-Fallback             |
| SQLite-FTS ist nicht 1:1 auf PostgreSQL übertragbar | Suche hinter `SearchProvider`-Interface, Index in separater Datei                                              |
| Next.js 16 Cache Components neu                     | Konsequent `"use cache"` für Katalogdaten, Runtime-Daten hinter `<Suspense>`                                   |
| Zahlungsdaten                                       | Ausschließlich Test-Modus über Adapter, keine Kartendaten auf eigenem Server (Stripe Elements/Checkout)        |
| Markenlogos/Herstellerbilder (Rechte)               | Marken nur als Text-Chips, `rights`-Feld je Produkt/Bild                                                       |
| Widersprüchliche Öffnungszeiten                     | Zentral in `src/config/site.ts`, Standard Mo–Do 8–17, Fr 8–13                                                  |
