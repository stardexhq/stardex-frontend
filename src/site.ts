/** Shared external links and static copy used across the site. */

export const GITHUB_URL = "https://github.com/stardexhq";
export const STELLAR_URL = "https://stellar.org";

export const NAV_LINKS = [
  { to: "/", label: "Home", end: true },
  { to: "/invoices", label: "Invoices", end: false },
  { to: "/payments", label: "Payments", end: false },
  { to: "/explorer", label: "Explorer", end: false },
  { to: "/settings", label: "Settings", end: false },
] as const;
