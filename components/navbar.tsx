"use client";

import { useState } from "react";
import NextLink from "next/link";
import { usePathname } from "next/navigation";
import clsx from "clsx";

import { siteConfig } from "@/config/site";
import { ThemeSwitch } from "@/components/theme-switch";

export const Navbar = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const pathname = usePathname();

  return (
    <nav className="sticky top-0 z-40 w-full border-b border-separator bg-background/80 backdrop-blur-lg">
      <header className="mx-auto flex h-14 max-w-7xl items-center justify-between gap-4 px-6">
        <div className="flex items-center gap-6">
          <NextLink className="flex items-baseline gap-2 no-underline" href="/">
            <span className="text-lg font-semibold tracking-tight text-foreground">
              VANTA
            </span>
            <span className="text-sm text-muted">Lang Results</span>
          </NextLink>
          <ul className="hidden items-center gap-1 sm:flex">
            {siteConfig.navItems.map((item) => {
              const active =
                item.href === "/"
                  ? pathname === "/"
                  : pathname.startsWith(item.href);
              return (
                <li key={item.href}>
                  <NextLink
                    className={clsx(
                      "rounded-md px-3 py-1.5 text-sm transition-colors no-underline",
                      active
                        ? "bg-accent/15 font-medium text-accent"
                        : "text-muted hover:text-foreground",
                    )}
                    href={item.href}
                  >
                    {item.label}
                  </NextLink>
                </li>
              );
            })}
          </ul>
        </div>

        <div className="flex items-center gap-2">
          <ThemeSwitch />
          <button
            aria-expanded={isMenuOpen}
            aria-label="Toggle menu"
            className="p-2 sm:hidden"
            type="button"
            onClick={() => setIsMenuOpen((v) => !v)}
          >
            <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              {isMenuOpen ? (
                <path
                  d="M6 18L18 6M6 6l12 12"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                />
              ) : (
                <path
                  d="M4 6h16M4 12h16M4 18h16"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                />
              )}
            </svg>
          </button>
        </div>
      </header>

      {isMenuOpen ? (
        <ul className="flex flex-col gap-1 border-t border-separator px-4 py-3 sm:hidden">
          {siteConfig.navItems.map((item) => (
            <li key={item.href}>
              <NextLink
                className="block rounded-md px-3 py-2 text-sm no-underline text-foreground"
                href={item.href}
                onClick={() => setIsMenuOpen(false)}
              >
                {item.label}
              </NextLink>
            </li>
          ))}
        </ul>
      ) : null}
    </nav>
  );
};
