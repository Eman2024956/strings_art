"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import {
  Sliders,
  FileText,
  Sparkles,
  Layers,
  Menu,
  X,
  PlayCircle,
  UploadCloud,
  Moon,
  Sun,
  Globe,
  RotateCcw,
  Download,
  Info,
  ChevronRight,
  ChevronLeft,
  CheckCircle,
  MapPin,
  ShieldCheck,
  Compass,
} from "lucide-react";

export default function MobileBottomNav({
  lang,
  setLang,
  theme,
  setTheme,
  t,
  upload,
  jobResult,
  isGenerating,
  onStartGeneration,
  onOpenTextMode,
  onClearAll,
  isMenuOpen,
  setIsMenuOpen,
}) {
  const [healthy, setHealthy] = useState(null);
  const isRtl = t.dir === "rtl";
  const ArrowIcon = isRtl ? ChevronLeft : ChevronRight;

  useEffect(() => {
    fetch("/health")
      .then((res) => (res.ok ? setHealthy(true) : setHealthy(false)))
      .catch(() => setHealthy(false));
  }, []);

  // Smooth scroll helper
  const scrollTo = (id) => {
    setIsMenuOpen(false);
    const el = document.getElementById(id);
    if (el) {
      el.scrollIntoView({ behavior: "smooth" });
    }
  };

  // Center button handler
  const handleCenterAction = () => {
    if (jobResult) {
      // If we have results, jump to player/canvas
      scrollTo("studio-workspace");
    } else if (upload && !upload.isTextSequence) {
      // Trigger generation
      if (onStartGeneration && !isGenerating) {
        onStartGeneration();
      } else {
        scrollTo("studio-workspace");
      }
    } else {
      // Scroll to upload
      scrollTo("studio-workspace");
    }
  };

  return (
    <>
      {/* =========================================================================
          1. BOTTOM NAVIGATION APP BAR (Fixed at bottom on all responsive devices)
          ========================================================================= */}
      <nav
        aria-label="Mobile Navigation App Bar"
        className="fixed bottom-0 inset-x-0 z-40 bg-white/92 dark:bg-neutral-900/95 backdrop-blur-xl border-t border-neutral-200/80 dark:border-neutral-800/80 shadow-[0_-8px_30px_rgba(0,0,0,0.08)] dark:shadow-[0_-8px_30px_rgba(0,0,0,0.4)] pb-[max(0.6rem,env(safe-area-inset-bottom))]"
      >
        <div className="max-w-md md:max-w-xl mx-auto px-2 sm:px-4 h-16 flex items-center justify-around relative">
          {/* Tab 1: Studio / Workspace */}
          <button
            type="button"
            onClick={() => scrollTo("studio-workspace")}
            className="flex-1 flex flex-col items-center justify-center py-1 px-1 text-neutral-600 dark:text-neutral-400 hover:text-indigo-600 dark:hover:text-indigo-400 active:scale-95 transition group cursor-pointer"
          >
            <div className="relative p-1 rounded-xl group-hover:bg-indigo-50 dark:group-hover:bg-indigo-950/40 transition">
              <Sliders className="w-5 h-5 text-current group-hover:scale-110 transition-transform" />
              {upload && (
                <span className="absolute top-1 end-1 w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              )}
            </div>
            <span className="text-[10px] font-bold tracking-tight mt-0.5">
              {t.bottomNavStudio}
            </span>
          </button>

          {/* Tab 2: Text Preview Mode */}
          <button
            type="button"
            onClick={() => {
              if (onOpenTextMode) onOpenTextMode();
              scrollTo("studio-workspace");
            }}
            className="flex-1 flex flex-col items-center justify-center py-1 px-1 text-neutral-600 dark:text-neutral-400 hover:text-indigo-600 dark:hover:text-indigo-400 active:scale-95 transition group cursor-pointer"
          >
            <div className="relative p-1 rounded-xl group-hover:bg-indigo-50 dark:group-hover:bg-indigo-950/40 transition">
              <FileText className="w-5 h-5 text-current group-hover:scale-110 transition-transform" />
              <span className="absolute -top-1 -end-2 text-[8px] font-mono font-black px-1 rounded bg-indigo-100 dark:bg-indigo-900/80 text-indigo-700 dark:text-indigo-300">
                TXT
              </span>
            </div>
            <span className="text-[10px] font-bold tracking-tight mt-0.5">
              {t.bottomNavText}
            </span>
          </button>

          {/* Tab 3: Center Action Button (Sleek Compact Shape) */}
          <div className="flex-1 flex flex-col items-center justify-center -mt-3 sm:-mt-4">
            <button
              type="button"
              onClick={handleCenterAction}
              disabled={isGenerating}
              className={`w-10 h-10 sm:w-11 sm:h-11 rounded-full flex items-center justify-center shadow-md transition-all duration-300 transform active:scale-90 cursor-pointer ${
                isGenerating
                  ? "bg-neutral-800 text-neutral-400 animate-pulse cursor-wait"
                  : "bg-gradient-to-tr from-amber-500 via-rose-500 to-indigo-600 text-white shadow-rose-500/25 hover:shadow-rose-500/40 hover:scale-105 ring-2 ring-white dark:ring-neutral-900"
              }`}
              title={
                jobResult
                  ? t.bottomNavActionPlay
                  : upload
                  ? t.bottomNavActionGenerate
                  : t.bottomNavActionStart
              }
            >
              {isGenerating ? (
                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : jobResult ? (
                <PlayCircle className="w-5 h-5 stroke-[2.2]" />
              ) : upload ? (
                <Sparkles className="w-4.5 h-4.5 stroke-[2.2]" />
              ) : (
                <UploadCloud className="w-4.5 h-4.5 stroke-[2.2]" />
              )}
            </button>
            <span className="text-[9px] font-bold text-neutral-700 dark:text-neutral-300 mt-0.5 truncate max-w-[60px]">
              {isGenerating
                ? "..."
                : jobResult
                ? t.bottomNavActionPlay
                : upload
                ? t.bottomNavActionGenerate
                : t.bottomNavActionStart}
            </span>
          </div>

          {/* Tab 4: Developer Profile */}
          <a
            href="https://falahpedia.tawassl.com/"
            target="_blank"
            rel="noopener noreferrer"
            className="flex-1 flex flex-col items-center justify-center py-1 px-1 text-neutral-600 dark:text-neutral-400 hover:text-indigo-600 dark:hover:text-indigo-400 active:scale-95 transition group cursor-pointer"
            title="Developer Profile"
          >
            <div className="p-1 rounded-xl group-hover:bg-indigo-50 dark:group-hover:bg-indigo-950/40 transition">
              <Globe className="w-5 h-5 text-current group-hover:scale-110 transition-transform" />
            </div>
            <span className="text-[10px] font-bold tracking-tight mt-0.5">
              {isRtl ? "المطور" : "Developer"}
            </span>
          </a>

          {/* Tab 5: Menu Drawer Toggle */}
          <button
            type="button"
            onClick={() => setIsMenuOpen(!isMenuOpen)}
            className={`flex-1 flex flex-col items-center justify-center py-1 px-1 active:scale-95 transition group cursor-pointer ${
              isMenuOpen
                ? "text-indigo-600 dark:text-indigo-400"
                : "text-neutral-600 dark:text-neutral-400 hover:text-indigo-600 dark:hover:text-indigo-400"
            }`}
          >
            <div
              className={`p-1 rounded-xl transition ${
                isMenuOpen
                  ? "bg-indigo-100 dark:bg-indigo-950/60"
                  : "group-hover:bg-indigo-50 dark:group-hover:bg-indigo-950/40"
              }`}
            >
              {isMenuOpen ? (
                <X className="w-5 h-5 text-current transition-transform" />
              ) : (
                <Menu className="w-5 h-5 text-current transition-transform group-hover:scale-110" />
              )}
            </div>
            <span className="text-[10px] font-bold tracking-tight mt-0.5">
              {t.bottomNavMenu}
            </span>
          </button>
        </div>
      </nav>

      {/* =========================================================================
          2. MENU APP BAR DRAWER / SHEET (Slide up from bottom on mobile)
          ========================================================================= */}
      {isMenuOpen && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-50 flex flex-col justify-end bg-black/60 backdrop-blur-xs transition-opacity animate-in fade-in duration-200"
          onClick={() => setIsMenuOpen(false)}
        >
          <div
            className="w-full max-w-2xl mx-auto bg-white dark:bg-neutral-900 rounded-t-3xl border-t border-neutral-200 dark:border-neutral-800 shadow-2xl max-h-[88vh] overflow-y-auto p-5 sm:p-6 pb-24 space-y-6 animate-in slide-in-from-bottom duration-300"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Top Sheet Drag Indicator Handle */}
            <div className="w-12 h-1.5 rounded-full bg-neutral-300 dark:bg-neutral-700 mx-auto -mt-1 mb-2" />

            {/* Menu Header with App Info and Status */}
            <div className="flex items-center justify-between border-b border-neutral-200 dark:border-neutral-800 pb-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-amber-500 via-rose-500 to-indigo-600 flex items-center justify-center text-white shadow-md shadow-rose-500/20">
                  <svg
                    className="w-5 h-5 stroke-[2]"
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
                  <h3 className="font-bold text-sm sm:text-base text-neutral-900 dark:text-white flex items-center gap-2">
                    <span>{t.appTitle}</span>
                    {healthy !== null && (
                      <span
                        title={healthy ? t.menuStatusOnline : t.menuStatusOffline}
                        className={`inline-block w-2.5 h-2.5 rounded-full ${
                          healthy ? "bg-emerald-500 animate-pulse" : "bg-rose-500"
                        }`}
                      />
                    )}
                  </h3>
                  <p className="text-xs text-neutral-500 dark:text-neutral-400">
                    {t.menuSubtitle}
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setIsMenuOpen(false)}
                className="p-2 rounded-xl text-neutral-500 hover:text-neutral-900 dark:hover:text-white hover:bg-neutral-100 dark:hover:bg-neutral-800 transition cursor-pointer"
                title={t.menuClose}
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Quick Navigation Cards */}
            <div className="space-y-3">
              <h4 className="text-xs font-bold uppercase tracking-wider text-neutral-500 dark:text-neutral-400">
                {t.menuNavigation}
              </h4>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                {/* 1. Studio Workspace */}
                <button
                  type="button"
                  onClick={() => scrollTo("studio-workspace")}
                  className="w-full flex items-center justify-between p-3.5 rounded-2xl bg-neutral-50 dark:bg-neutral-800/60 hover:bg-indigo-50/70 dark:hover:bg-indigo-950/40 border border-neutral-200/80 dark:border-neutral-800 text-start transition group cursor-pointer"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-xl bg-indigo-100 dark:bg-indigo-900/50 text-indigo-600 dark:text-indigo-400 flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
                      <Sliders className="w-4 h-4" />
                    </div>
                    <div>
                      <div className="text-xs font-bold text-neutral-900 dark:text-white">
                        {t.navStudio}
                      </div>
                      <div className="text-[11px] text-neutral-500 dark:text-neutral-400 line-clamp-1">
                        {t.menuStudioDesc}
                      </div>
                    </div>
                  </div>
                  <ArrowIcon className="w-4 h-4 text-neutral-400 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition" />
                </button>

                {/* 2. Text Sequence Preview */}
                <button
                  type="button"
                  onClick={() => {
                    if (onOpenTextMode) onOpenTextMode();
                    scrollTo("studio-workspace");
                  }}
                  className="w-full flex items-center justify-between p-3.5 rounded-2xl bg-neutral-50 dark:bg-neutral-800/60 hover:bg-indigo-50/70 dark:hover:bg-indigo-950/40 border border-neutral-200/80 dark:border-neutral-800 text-start transition group cursor-pointer"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-xl bg-purple-100 dark:bg-purple-900/50 text-purple-600 dark:text-purple-400 flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
                      <FileText className="w-4 h-4" />
                    </div>
                    <div>
                      <div className="text-xs font-bold text-neutral-900 dark:text-white flex items-center gap-1.5">
                        <span>{t.navTextPreview}</span>
                        <span className="text-[9px] px-1.5 py-0.2 rounded bg-purple-100 dark:bg-purple-950 text-purple-700 dark:text-purple-300 font-mono font-bold">
                          TXT
                        </span>
                      </div>
                      <div className="text-[11px] text-neutral-500 dark:text-neutral-400 line-clamp-1">
                        {t.menuTextDesc}
                      </div>
                    </div>
                  </div>
                  <ArrowIcon className="w-4 h-4 text-neutral-400 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition" />
                </button>

                {/* 3. Developer Profile */}
                <a
                  href="https://falahpedia.tawassl.com/"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-full flex items-center justify-between p-3.5 rounded-2xl bg-indigo-50/70 dark:bg-indigo-950/40 hover:bg-indigo-100/70 border border-indigo-200/80 dark:border-indigo-800 text-start transition group cursor-pointer"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-xl bg-indigo-600 text-white flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
                      <Globe className="w-4 h-4" />
                    </div>
                    <div>
                      <div className="text-xs font-bold text-neutral-900 dark:text-white">
                        {isRtl ? "ملف المطور (FalahPedia)" : "Developer Profile"}
                      </div>
                      <div className="text-[11px] text-neutral-500 dark:text-neutral-400 line-clamp-1">
                        https://falahpedia.tawassl.com/
                      </div>
                    </div>
                  </div>
                  <ArrowIcon className="w-4 h-4 text-indigo-500 group-hover:translate-x-0.5 transition" />
                </a>

                {/* 4. Tawassl.com */}
                <a
                  href="https://tawassl.com/"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-full flex items-center justify-between p-3.5 rounded-2xl bg-neutral-50 dark:bg-neutral-800/60 hover:bg-neutral-100 dark:hover:bg-neutral-800 border border-neutral-200/80 dark:border-neutral-800 text-start transition group cursor-pointer"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-xl bg-emerald-100 dark:bg-emerald-900/50 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
                      <Sparkles className="w-4 h-4" />
                    </div>
                    <div>
                      <div className="text-xs font-bold text-neutral-900 dark:text-white">
                        Tawassl.com
                      </div>
                      <div className="text-[11px] text-neutral-500 dark:text-neutral-400 line-clamp-1">
                        {isRtl ? "حقوق النشر ٢٠٢٦ العراق - بغداد" : "Copyright 2026 Iraq Baghdad"}
                      </div>
                    </div>
                  </div>
                  <ArrowIcon className="w-4 h-4 text-neutral-400 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition" />
                </a>
              </div>

              {/* Exports Quick Access (if generated) */}
              {jobResult && (
                <button
                  type="button"
                  onClick={() => scrollTo("studio-workspace")}
                  className="w-full flex items-center justify-between p-3.5 rounded-2xl bg-gradient-to-r from-emerald-50 to-teal-50 dark:from-emerald-950/40 dark:to-teal-950/30 border border-emerald-200 dark:border-emerald-800 text-start transition group cursor-pointer"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-xl bg-emerald-600 text-white flex items-center justify-center shrink-0 shadow-sm">
                      <Download className="w-4 h-4" />
                    </div>
                    <div>
                      <div className="text-xs font-bold text-emerald-900 dark:text-emerald-200 flex items-center gap-2">
                        <span>{t.menuExports}</span>
                        <span className="text-[10px] px-1.5 py-0.2 rounded bg-emerald-200/70 dark:bg-emerald-800 text-emerald-800 dark:text-emerald-200 font-bold">
                          {jobResult.total_lines} {t.statsLines}
                        </span>
                      </div>
                      <div className="text-[11px] text-emerald-700/80 dark:text-emerald-400 line-clamp-1">
                        {t.menuExportsDesc}
                      </div>
                    </div>
                  </div>
                  <ArrowIcon className="w-4 h-4 text-emerald-600 dark:text-emerald-400 group-hover:translate-x-1 transition-transform" />
                </button>
              )}
            </div>

            {/* Appearance & Language Preferences */}
            <div className="space-y-3 pt-2 border-t border-neutral-200 dark:border-neutral-800">
              <h4 className="text-xs font-bold uppercase tracking-wider text-neutral-500 dark:text-neutral-400">
                {t.menuPreferences}
              </h4>

              <div className="grid grid-cols-2 gap-3">
                {/* Language Switcher Segmented Control */}
                <div className="p-1 rounded-2xl bg-neutral-100 dark:bg-neutral-800 flex items-center">
                  <button
                    type="button"
                    onClick={() => setLang("ar")}
                    className={`flex-1 py-2 px-2.5 rounded-xl text-xs font-bold transition flex items-center justify-center gap-1.5 ${
                      lang === "ar"
                        ? "bg-white dark:bg-neutral-700 text-indigo-600 dark:text-indigo-300 shadow-sm"
                        : "text-neutral-600 dark:text-neutral-400"
                    }`}
                  >
                    <span>العربية</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setLang("en")}
                    className={`flex-1 py-2 px-2.5 rounded-xl text-xs font-bold transition flex items-center justify-center gap-1.5 ${
                      lang === "en"
                        ? "bg-white dark:bg-neutral-700 text-indigo-600 dark:text-indigo-300 shadow-sm"
                        : "text-neutral-600 dark:text-neutral-400"
                    }`}
                  >
                    <span>English</span>
                  </button>
                </div>

                {/* Theme Switcher Segmented Control */}
                <div className="p-1 rounded-2xl bg-neutral-100 dark:bg-neutral-800 flex items-center">
                  <button
                    type="button"
                    onClick={() => setTheme("light")}
                    className={`flex-1 py-2 px-2.5 rounded-xl text-xs font-bold transition flex items-center justify-center gap-1.5 ${
                      theme === "light"
                        ? "bg-white dark:bg-neutral-700 text-amber-600 dark:text-amber-300 shadow-sm"
                        : "text-neutral-600 dark:text-neutral-400"
                    }`}
                    title={t.themeLight}
                  >
                    <Sun className="w-3.5 h-3.5" />
                    <span>{t.themeLight}</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setTheme("dark")}
                    className={`flex-1 py-2 px-2.5 rounded-xl text-xs font-bold transition flex items-center justify-center gap-1.5 ${
                      theme === "dark"
                        ? "bg-white dark:bg-neutral-700 text-indigo-600 dark:text-indigo-300 shadow-sm"
                        : "text-neutral-600 dark:text-neutral-400"
                    }`}
                    title={t.themeDark}
                  >
                    <Moon className="w-3.5 h-3.5" />
                    <span>{t.themeDark}</span>
                  </button>
                </div>
              </div>
            </div>

            {/* Project Actions (Clear / Reset) */}
            {upload && (
              <div className="space-y-3 pt-2 border-t border-neutral-200 dark:border-neutral-800">
                <h4 className="text-xs font-bold uppercase tracking-wider text-neutral-500 dark:text-neutral-400">
                  {t.menuActions}
                </h4>
                <button
                  type="button"
                  onClick={() => {
                    setIsMenuOpen(false);
                    if (onClearAll) onClearAll();
                  }}
                  className="w-full flex items-center justify-center gap-2 py-3 px-4 rounded-2xl bg-rose-50 hover:bg-rose-100 dark:bg-rose-950/40 dark:hover:bg-rose-900/50 text-rose-700 dark:text-rose-300 border border-rose-200 dark:border-rose-900 text-xs font-bold transition cursor-pointer"
                >
                  <RotateCcw className="w-4 h-4" />
                  <span>{t.startNewArtwork}</span>
                </button>
              </div>
            )}

            {/* Iraq Baghdad 2026 Footer Badge & Copyright */}
            <div className="pt-3 border-t border-neutral-200 dark:border-neutral-800 flex flex-col gap-2 text-xs text-neutral-500 dark:text-neutral-400">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1.5 font-bold text-neutral-700 dark:text-neutral-300">
                  <MapPin className="w-4 h-4 text-rose-500" />
                  <span>{isRtl ? "العراق - بغداد ٢٠٢٦" : "Iraq, Baghdad 2026"}</span>
                </div>
                <div className="flex items-center gap-1 text-emerald-600 dark:text-emerald-400 text-[11px] font-semibold">
                  <ShieldCheck className="w-3.5 h-3.5" />
                  <span>Tawassl.com</span>
                </div>
              </div>
              <div className="text-[11px] text-neutral-400 text-center">
                © Copyright Tawassl.com 2026 Iraq Baghdad. All rights reserved.
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
