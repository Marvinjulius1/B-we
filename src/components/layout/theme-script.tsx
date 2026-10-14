/**
 * Setzt data-theme vor dem ersten Paint (kein Aufblitzen).
 * Gespeichert wird nur die explizite Wahl ("light" | "dark"); "system" folgt prefers-color-scheme.
 */
export const THEME_STORAGE_KEY = "boewe-theme";

const script = `(function(){try{var k="${THEME_STORAGE_KEY}",s=localStorage.getItem(k),m=window.matchMedia("(prefers-color-scheme: dark)"),d=document.documentElement;function a(){var v=localStorage.getItem(k);d.setAttribute("data-theme",v==="light"||v==="dark"?v:(m.matches?"dark":"light"))}a();m.addEventListener("change",a)}catch(e){}})()`;

export function ThemeScript() {
  return <script dangerouslySetInnerHTML={{ __html: script }} />;
}
