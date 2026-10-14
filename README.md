# Böwe GmbH – Onlineshop & Firmenwebsite

Neuer Shop für die Böwe GmbH, Aurich (Fach- und Großhandel seit 1924). Next.js 16 · TypeScript · Tailwind v4 · Prisma 7 (SQLite dev / PostgreSQL prod) · SQLite-FTS5-Suche.

- Plan & Phasen: [`docs/PLAN.md`](docs/PLAN.md)
- Entscheidungen & offene Fragen: [`docs/DECISIONS.md`](docs/DECISIONS.md)
- Importformat: [`docs/IMPORT.md`](docs/IMPORT.md)
- Briefing (Faktenbasis): [`docs/boewe-briefing.md`](docs/boewe-briefing.md)

## Schnellstart

```bash
cp .env.example .env
npm install            # erzeugt auch den Prisma-Client
npm run setup          # Migrationen + Seed (Kategorien, Marken, 59 Beispielartikel, Suchindex)
npm run dev            # http://localhost:3000
```

## Skripte

| Befehl                      | Zweck                                                                        |
| --------------------------- | ---------------------------------------------------------------------------- |
| `npm run check`             | typecheck · lint · test · build                                              |
| `npm run import -- <datei>` | Produktimport CSV/JSON/XML (`--dry-run`, `--source`, `--deactivate-missing`) |
| `npm run db:seed`           | Seed erneut einspielen (idempotent)                                          |
| `npm run brand:assets`      | Logo-SVG, Favicons, OG-Bild aus `public/brand/boewe-logo.png` erzeugen       |
| `npm run placeholders`      | Produkt-Platzhalterbilder erzeugen                                           |

## Struktur

```
data/          Kategoriebaum, Attribute, Marken, Seed-Produkte, redirects.csv
prisma/        Schema, Migrationen, Seed
scripts/       Import, Marken-Assets, Platzhalter
src/app/       Routen (App Router)
src/components UI, Layout, Shop, Suche, Consent
src/config/    Firmendaten, Öffnungszeiten, Navigation, Aktionen
src/server/    DB, Katalog-Repository, Suche, Import
tests/         Vitest
```

Deploy-Anleitung folgt in Phase 5.
