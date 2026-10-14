# Produktimport

```bash
npm run import -- data/examples/wawi-export.csv --dry-run   # nur prüfen
npm run import -- export.csv --source wawi --deactivate-missing
```

Ablauf: Datei lesen (CSV/JSON/XML, Format wird erkannt) → Spalten normalisieren → zod-Validierung → idempotenter Upsert per SKU → „Passend dazu“-Beziehungen → Suchindex neu → optional Shop-Cache invalidieren. Unveränderte Datensätze werden per Hash übersprungen. Jeder Lauf schreibt `reports/import-<zeit>.json` mit Fehlern und Warnungen (Zeilennummer, SKU, Feld, Meldung).

## Felder (kanonisch)

| Feld                                                                                  | Pflicht | Aliase (Auswahl)                                  | Hinweise                                                                                                                   |
| ------------------------------------------------------------------------------------- | ------- | ------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------- |
| `sku`                                                                                 | ✔       | Artikelnummer, ArtNr, Bestellnummer               | eindeutig; Buchstaben, Ziffern, `. - _ /`                                                                                  |
| `name`                                                                                | ✔       | Bezeichnung, Artikelname, Titel                   |                                                                                                                            |
| `categories`                                                                          | ✔       | Kategorie, Kategoriepfad, Warengruppe             | mehrere mit `\|`; Pfad als Slugs (`gitterroste/normroste`) oder Namen (`Gitterroste > Normroste`); erste = Primärkategorie |
| `priceGross`                                                                          | ✔       | VK Brutto, Bruttopreis, Preis                     | `32,50` · `1.299,00` · `32.50`                                                                                             |
| `taxRate`                                                                             |         | MwSt, Steuersatz                                  | 19 (Standard) oder 7                                                                                                       |
| `brand`                                                                               |         | Hersteller, Marke                                 | unbekannte Marken werden angelegt (Warnung)                                                                                |
| `shippingClass`                                                                       |         | Versandart, Versandklasse                         | `PAKET` (Paket/DHL/DPD/UPS) oder `SPEDITION` (Spedition/Palette/Sperrgut)                                                  |
| `stockStatus`                                                                         |         | Lagerstatus, Verfügbarkeit                        | Auf Lager · wenige · nicht lieferbar · auf Anfrage; sonst aus `stockQuantity` abgeleitet                                   |
| `stockQuantity`                                                                       |         | Bestand, Lagerbestand                             |                                                                                                                            |
| `deliveryTime`                                                                        |         | Lieferzeit                                        | überschreibt den Standard (Paket 2–3 Werktage)                                                                             |
| `ean`                                                                                 |         | GTIN, EAN13                                       | Prüfziffer wird geprüft                                                                                                    |
| `mpn`                                                                                 |         | Herstellernummer, HAN                             |                                                                                                                            |
| `shortDescription`, `description`                                                     |         | Kurzbeschreibung, Beschreibung/Langtext           | Absätze durch Leerzeile                                                                                                    |
| `attributes`                                                                          |         | Merkmale, Technische Daten                        | JSON-Objekt/-Array, `Key=Wert\|…` oder Spalten `attr:<Name> [Einheit]`                                                     |
| `images`                                                                              |         | Bilder, Bild-URLs                                 | mehrere mit `\|`                                                                                                           |
| `variantGroup`                                                                        |         | Vaterartikel, Parent-SKU                          | gleiche Gruppe = Varianten; Achsen über `variantAxes` (z. B. `groesse`) oder `variantAxis` im Attribut                     |
| `related`                                                                             |         | Zubehör, Cross-Selling                            | SKUs, mit `\|` oder `,`                                                                                                    |
| `weightGrams` / Gewicht (kg)                                                          |         | Gewicht, Versandgewicht                           | kg wird in g umgerechnet                                                                                                   |
| `isNew`, `isBestseller`, `isTopProduct`, `isClearance`, `containsBattery`, `isActive` |         | Neu, Bestseller, Top, Restposten, Batterie, Aktiv | ja/nein, 1/0, x                                                                                                            |
| `source`, `rights`                                                                    |         | Quelle, Bildrechte                                | Herkunft & Nutzungsrechte (siehe DECISIONS)                                                                                |

Attribut-Schlüssel und Anzeigenamen werden über `data/attributes.json` vereinheitlicht („Maschenweite“ → `maschenweite`). Welche Attribute je Kategorie als Filter erscheinen, steht in `data/categories.json` (`filters`).

Beispiele: `data/examples/wawi-export.csv`, `data/examples/shop-export.xml`, `data/seed-products.json`.
