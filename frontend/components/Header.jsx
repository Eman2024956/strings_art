"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { Moon, Sun, Globe, Activity, Sparkles, FileText, Menu } from "lucide-react";

export default function Header({
  lang,
  setLang,
  theme,
  setTheme,
  t,
  onOpenTextMode,
  onOpenMenu,
}) {
  const [healthy, setHealthy] = useState(null);

  useEffect(() => {
    fetch("/health")
      .then((res) => (res.ok ? setHealthy(true) : setHealthy(false)))
      .catch(() => setHealthy(false));
  }, []);

  const scrollToSection = (id) => {
    const el = document.getElementById(id);
    if (el) {
      el.scrollIntoView({ behavior: "smooth" });
    }
  };

  return (
    <header className="border-b border-neutral-200 dark:border-neutral-800 bg-white/85 dark:bg-neutral-900/85 backdrop-blur-md sticky top-0 z-50 transition-colors">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between gap-4">
        {/* Brand */}
        <div className="flex items-center gap-3">
          <Link
            href="/"
            className="flex items-center gap-3 text-start cursor-pointer group"
          >
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-amber-500 via-rose-500 to-indigo-600 flex items-center justify-center shadow-md shadow-rose-500/20 group-hover:scale-105 transition">
              <svg
                className="w-6 h-6 text-white stroke-[2]"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
              >
                <circle cx="12" cy="12" r="9" strokeDasharray="2 2" />
                <path d="M12 3 L20 16 L4 16 Z" opacity="0.8" />
                <path d="M12 21 L4 8 L20 8 Z" opacity="0.8" />
              </svg>
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-bold text-sm sm:text-base md:text-[17px] text-neutral-900 dark:text-neutral-50 tracking-tight leading-snug">
                  {t.appTitle}
                </span>
                {healthy !== null && (
                  <span
                    title={healthy ? "API Online" : "API Offline"}
                    className={`inline-block w-2 h-2 sm:w-2.5 sm:h-2.5 rounded-full shrink-0 ${
                      healthy ? "bg-emerald-500 animate-pulse" : "bg-rose-500"
                    }`}
                  />
                )}
              </div>
              <p className="text-[11px] sm:text-xs text-neutral-500 dark:text-neutral-400 hidden sm:block line-clamp-1">
                {t.tagline}
              </p>
            </div>
          </Link>
        </div>

        {/* Center Nav Links (Hidden on small screens) */}
        <nav className="hidden lg:flex items-center gap-5 text-xs font-bold text-neutral-600 dark:text-neutral-300">
          <button
            type="button"
            onClick={() => scrollToSection("studio-workspace")}
            className="hover:text-indigo-600 dark:hover:text-indigo-400 transition cursor-pointer"
          >
            {t.navStudio}
          </button>

          {/* Text Preview Service Link */}
          <Link
            href="/text-preview"
            onClick={(e) => {
              if (onOpenTextMode) {
                e.preventDefault();
                onOpenTextMode();
              }
            }}
            className="hover:text-indigo-600 dark:hover:text-indigo-400 transition cursor-pointer flex items-center gap-1.5 py-1 px-2.5 rounded-lg hover:bg-indigo-50 dark:hover:bg-indigo-950/40"
          >
            <FileText className="w-3.5 h-3.5 text-indigo-500" />
            <span>{t.navTextPreview}</span>
            <span className="text-[10px] px-1.5 py-0.2 rounded bg-indigo-100 dark:bg-indigo-900/60 text-indigo-600 dark:text-indigo-300 font-mono font-bold">
              TXT
            </span>
          </Link>

          {/* Navigation links for services and how-it-works commented out as sections are hidden
          <button
            type="button"
            onClick={() => scrollToSection("services-overview")}
            className="hover:text-indigo-600 dark:hover:text-indigo-400 transition cursor-pointer"
          >
            {t.navServices}
          </button>
          <button
            type="button"
            onClick={() => scrollToSection("how-it-works")}
            className="hover:text-indigo-600 dark:hover:text-indigo-400 transition cursor-pointer"
          >
            {t.navHowItWorks}
          </button>
          */}
        </nav>

        {/* Actions */}
        <div className="flex items-center gap-2 sm:gap-3">
          {/* Service Button: Upload Text to Preview String Art */}
          <Link
            href="/text-preview"
            onClick={(e) => {
              if (onOpenTextMode) {
                e.preventDefault();
                onOpenTextMode();
              }
            }}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-indigo-50 hover:bg-indigo-100 dark:bg-indigo-950/60 dark:hover:bg-indigo-900/60 text-indigo-700 dark:text-indigo-300 border border-indigo-200/90 dark:border-indigo-800 text-xs font-bold transition shadow-xs cursor-pointer group"
            title={t.headerUploadTextBtn}
          >
            <FileText className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400 group-hover:scale-110 transition" />
            <span className="hidden sm:inline">{t.headerUploadTextBtn}</span>
            <span className="sm:hidden font-mono">TXT</span>
          </Link>

          {/* Quick Launch CTA */}
          <button
            type="button"
            onClick={() => scrollToSection("studio-workspace")}
            className="hidden md:inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 text-white text-xs font-bold shadow-xs hover:opacity-95 transition cursor-pointer"
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>{t.launchButton}</span>
          </button>

          {/* Language Toggle */}
          <button
            onClick={() => setLang(lang === "ar" ? "en" : "ar")}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-neutral-200 dark:border-neutral-700 bg-neutral-50 dark:bg-neutral-800 text-xs font-medium text-neutral-700 dark:text-neutral-200 hover:bg-neutral-100 dark:hover:bg-neutral-700 transition"
          >
            <Globe className="w-3.5 h-3.5" />
            <span>{t.langToggle}</span>
          </button>

          {/* Theme Toggle */}
          <button
            onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
            className="p-2 rounded-xl border border-neutral-200 dark:border-neutral-700 bg-neutral-50 dark:bg-neutral-800 text-neutral-700 dark:text-neutral-200 hover:bg-neutral-100 dark:hover:bg-neutral-700 transition"
            title={theme === "dark" ? t.themeLight : t.themeDark}
          >
            {theme === "dark" ? (
              <Sun className="w-4 h-4 text-amber-400" />
            ) : (
              <Moon className="w-4 h-4 text-neutral-600" />
            )}
          </button>

          {/* Mobile Menu Button (lg:hidden) */}
          {onOpenMenu && (
            <button
              type="button"
              onClick={onOpenMenu}
              className="lg:hidden p-2 rounded-xl border border-neutral-200 dark:border-neutral-700 bg-neutral-50 dark:bg-neutral-800 text-neutral-700 dark:text-neutral-200 hover:bg-neutral-100 dark:hover:bg-neutral-700 transition cursor-pointer"
              title={t.bottomNavMenu}
              aria-label={t.bottomNavMenu}
            >
              <Menu className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>
    </header>
  );
}
