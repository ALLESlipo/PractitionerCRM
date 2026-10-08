"use client";

import Link from "next/link";
import { useEffect, useState, type ReactNode } from "react";
import { BRAND } from "@/lib/brand";
import { Logo } from "@/components/logo";

const sections = [
  { href: "#how", label: "How it works" },
  { href: "#features", label: "Features" },
  { href: "#privacy", label: "Privacy" },
];

/**
 * Fixed landing header: transparent over the hero, solid once the page scrolls.
 * On small screens the section links and account buttons move into a menu panel.
 * `account` is server-rendered (it reads the session) and styles itself with
 * `group-data-[solid=true]:` variants.
 */
export function LandingHeader({ account }: { account: ReactNode }) {
  const [scrolled, setScrolled] = useState(false);
  const [open, setOpen] = useState(false);
  const solid = scrolled || open;

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 24);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    const onResize = () => window.innerWidth >= 768 && setOpen(false);
    window.addEventListener("keydown", onKey);
    window.addEventListener("resize", onResize);
    return () => {
      window.removeEventListener("keydown", onKey);
      window.removeEventListener("resize", onResize);
    };
  }, [open]);

  return (
    <header
      data-solid={solid}
      className={`group fixed inset-x-0 top-0 z-50 transition-colors duration-300 ${
        solid ? "border-b border-slate-200/80 bg-white/90 shadow-sm backdrop-blur-md" : "bg-transparent"
      }`}
    >
      <div className="mx-auto flex h-16 w-full max-w-6xl items-center justify-between gap-4 px-4 sm:h-20 sm:px-6">
        <Link href="/" aria-label={`${BRAND} home`} onClick={() => setOpen(false)}>
          <Logo light={!solid} />
        </Link>

        <nav className="hidden items-center gap-8 text-sm md:flex" aria-label="Sections">
          {sections.map((s) => (
            <a
              key={s.href}
              href={s.href}
              className={`transition-colors ${solid ? "text-slate-600 hover:text-teal-800" : "text-white/80 hover:text-white"}`}
            >
              {s.label}
            </a>
          ))}
        </nav>

        <div className="hidden items-center gap-1 md:flex">{account}</div>

        <button
          type="button"
          className={`-mr-2 inline-flex h-11 w-11 items-center justify-center rounded-full transition-colors md:hidden ${
            solid ? "text-slate-800 hover:bg-slate-100" : "text-white hover:bg-white/10"
          }`}
          aria-expanded={open}
          aria-controls="landing-menu"
          aria-label={open ? "Close menu" : "Open menu"}
          onClick={() => setOpen((o) => !o)}
        >
          <svg viewBox="0 0 24 24" className="h-6 w-6" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
            {open ? <path d="M6 6l12 12M18 6L6 18" /> : <path d="M4 7h16M4 12h16M4 17h16" />}
          </svg>
        </button>
      </div>

      <div
        id="landing-menu"
        hidden={!open}
        className="border-t border-slate-200 bg-white px-4 pt-2 pb-5 shadow-lg md:hidden"
      >
        <nav className="flex flex-col" aria-label="Sections">
          {sections.map((s) => (
            <a
              key={s.href}
              href={s.href}
              onClick={() => setOpen(false)}
              className="rounded-lg px-3 py-3 text-base font-medium text-slate-800 hover:bg-slate-50"
            >
              {s.label}
            </a>
          ))}
        </nav>
        <div className="mt-3 flex flex-col gap-2 border-t border-slate-100 pt-4 [&>a]:justify-center">{account}</div>
      </div>
    </header>
  );
}
