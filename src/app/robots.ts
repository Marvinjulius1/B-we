import type { MetadataRoute } from "next";
import { site } from "@/config/site";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [{ userAgent: "*", allow: "/", disallow: ["/api/", "/konto", "/warenkorb", "/kasse", "/suche"] }],
    sitemap: `${site.url}/sitemap.xml`,
    host: site.url,
  };
}
