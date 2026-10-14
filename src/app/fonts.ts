import localFont from "next/font/local";

/**
 * Selbst gehostete variable Fonts (keine Google-Fonts-Anfrage zur Laufzeit → DSGVO-freundlich).
 * Archivo: Headlines (Achsen wght + wdth für kräftige, schmal laufende Überschriften)
 * Inter: Fließtext und UI
 */
export const archivo = localFont({
  src: "../../node_modules/@fontsource-variable/archivo/files/archivo-latin-wdth-normal.woff2",
  variable: "--font-archivo",
  weight: "100 900",
  display: "swap",
  preload: true,
});

export const inter = localFont({
  src: "../../node_modules/@fontsource-variable/inter/files/inter-latin-wght-normal.woff2",
  variable: "--font-inter",
  weight: "100 900",
  display: "swap",
  preload: true,
});
