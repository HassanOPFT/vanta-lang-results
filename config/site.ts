export type SiteConfig = typeof siteConfig;

export const siteConfig = {
  name: "VANTA Lang Results",
  description: "Honest pass/fail and timing metrics across Moodle language benchmark runs.",
  navItems: [
    { label: "Overview", href: "/" },
    { label: "Compare", href: "/compare" },
    { label: "Experiments", href: "/experiments" },
  ],
};
