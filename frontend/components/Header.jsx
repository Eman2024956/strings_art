"use client";

import React, { useEffect, useState } from "react";
import { Moon, Sun, Globe, Activity } from "lucide-react";

export default function Header({ lang, setLang, theme, setTheme, t }) {
  const [healthy, setHealthy] = useState(null);

  useEffect(() => {
    fetch("/health")
      .then((res) => (res.ok ? setHealthy(true) : setHealthy(false)))
      .catch(() => setHealthy(false));
  }, []);

  return (
    <header className="border-b border-neutral-200 dark:border-neutral-800 bg-white/80 dark:bg-neutral-900/80 backdrop-blur-md sticky top-0 z-50 transition-colors">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-amber-500 via-rose-500 to-indigo-600 flex items-center justify-center shadow-md shadow-rose-500/20">
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
              <h1 className="font-bold text-lg text-neutral-900 dark:text-white tracking-tight">
                {t.appTitle}
              </h1>
              {healthy !== null && (
                <span
                  title={healthy ? "API Online" : "API Offline"}
                  className={`inline-block w-2.5 h-2.5 rounded-full ${
                    healthy ? "bg-emerald-500 animate-pulse" : "bg-rose-500"
                  }`}
                />
              )}
            </div>
            <p className="text-xs text-neutral-500 dark:text-neutral-400 hidden sm:block">
              {t.tagline}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 sm:gap-3">
          {/* Language Toggle */}
          <button
            onClick={() => setLang(lang === "ar" ? "en" : "ar")}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-neutral-200 dark:border-neutral-700 bg-neutral-50 dark:bg-neutral-800 text-xs font-medium text-neutral-700 dark:text-neutral-200 hover:bg-neutral-100 dark:hover:bg-neutral-750 transition"
          >
            <Globe className="w-3.5 h-3.5" />
            <span>{t.langToggle}</span>
          </button>

          {/* Theme Toggle */}
          <button
            onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
            className="p-2 rounded-lg border border-neutral-200 dark:border-neutral-700 bg-neutral-50 dark:bg-neutral-800 text-neutral-700 dark:text-neutral-200 hover:bg-neutral-100 dark:hover:bg-neutral-750 transition"
            title={theme === "dark" ? t.themeLight : t.themeDark}
          >
            {theme === "dark" ? (
              <Sun className="w-4 h-4 text-amber-400" />
            ) : (
              <Moon className="w-4 h-4 text-neutral-600" />
            )}
          </button>
        </div>
      </div>
    </header>
  );
}
