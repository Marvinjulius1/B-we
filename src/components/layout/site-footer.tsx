import Link from "next/link";
import { Mail, MapPin, MessageCircle, Phone } from "lucide-react";
import { footerNav, site } from "@/config/site";
import { ConsentSettingsLink } from "@/components/consent/consent-settings-link";
import { ThemeToggle } from "./theme-toggle";
import { Logo } from "./logo";

function FooterList({ title, links }: { title: string; links: readonly { label: string; href: string }[] }) {
  return (
    <div>
      <h2 className="text-muted text-sm font-semibold tracking-wider uppercase">{title}</h2>
      <ul className="mt-4 space-y-2.5">
        {links.map((l) => (
          <li key={l.href}>
            <Link href={l.href} className="hover:text-brand-text text-[0.95rem]">
              {l.label}
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}

export function SiteFooter() {
  return (
    <footer className="border-line bg-surface mt-24 border-t pb-24 md:pb-0">
      <div className="container-page grid gap-12 py-14 lg:grid-cols-[1.3fr_repeat(3,1fr)]">
        <div className="space-y-5">
          <Logo />
          <p className="text-muted max-w-sm">
            {site.legalName} – Fach- und Großhandel für Handwerk, Industrie und Privatkunden. Familiengeführt in{" "}
            {site.facts.generation}, seit {site.foundingYear} in Aurich.
          </p>
          <address className="space-y-2 not-italic">
            <p className="flex gap-2">
              <MapPin aria-hidden className="text-brand-text mt-0.5 size-4 shrink-0" />
              <span>
                {site.address.street}, {site.address.postalCode} {site.address.city}
              </span>
            </p>
            <p>
              <a href={site.contact.phoneHref} className="hover:text-brand-text flex gap-2">
                <Phone aria-hidden className="text-brand-text mt-0.5 size-4 shrink-0" /> {site.contact.phoneDisplay}
              </a>
            </p>
            <p>
              <a href={site.contact.whatsappHref} className="hover:text-brand-text flex gap-2" target="_blank" rel="noopener">
                <MessageCircle aria-hidden className="text-brand-text mt-0.5 size-4 shrink-0" /> WhatsApp{" "}
                {site.contact.whatsappDisplay}
              </a>
            </p>
            <p>
              <a href={`mailto:${site.contact.email}`} className="hover:text-brand-text flex gap-2">
                <Mail aria-hidden className="text-brand-text mt-0.5 size-4 shrink-0" /> {site.contact.email}
              </a>
            </p>
          </address>
          <div>
            <h2 className="text-muted text-sm font-semibold tracking-wider uppercase">Öffnungszeiten</h2>
            <dl className="mt-2 grid max-w-xs grid-cols-[auto_1fr] gap-x-6 gap-y-1 text-[0.95rem]">
              {site.openingHours.map((h) => (
                <div key={h.label} className="contents">
                  <dt>{h.label}</dt>
                  <dd className="tabular-nums">
                    {h.opens} – {h.closes} Uhr
                  </dd>
                </div>
              ))}
            </dl>
            <p className="text-muted mt-1 text-sm">{site.openingHoursNote}</p>
          </div>
        </div>
        <FooterList title="Shop" links={footerNav.shop} />
        <FooterList title="Service" links={footerNav.service} />
        <FooterList title="Unternehmen" links={footerNav.company} />
      </div>

      <div className="border-line border-t">
        <div className="container-page text-muted flex flex-col gap-5 py-6 text-sm lg:flex-row lg:items-center lg:justify-between">
          <ul className="flex flex-wrap gap-x-5 gap-y-2">
            {footerNav.legal.map((l) => (
              <li key={l.href}>
                <Link href={l.href} className="hover:text-ink">
                  {l.label}
                </Link>
              </li>
            ))}
            <li>
              <ConsentSettingsLink className="hover:text-ink" />
            </li>
          </ul>
          <div className="flex flex-wrap items-center gap-4">
            <ul className="flex gap-4">
              {site.social.map((s) => (
                <li key={s.href}>
                  <a href={s.href} target="_blank" rel="noopener" className="hover:text-ink">
                    {s.label}
                  </a>
                </li>
              ))}
            </ul>
            <ThemeToggle />
          </div>
        </div>
        <p className="container-page text-muted pb-6 text-xs">
          Alle Preise inkl. gesetzl. MwSt., zzgl. Versandkosten. © {site.legalName}
        </p>
      </div>
    </footer>
  );
}
