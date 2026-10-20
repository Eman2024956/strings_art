"use client";

import React from "react";
import {
  Sparkles,
  ArrowRight,
  ArrowLeft,
  UploadCloud,
  FileText,
  CheckCircle2,
  Compass,
  Layers,
  MapPin,
  Flame,
} from "lucide-react";

// Precomputed deterministic SVG line coordinates to avoid floating-point SSR hydration mismatch
const HERO_LINES = Array.from({ length: 48 }).map((_, i) => {
  const a1 = (i * 2 * Math.PI) / 48;
  const a2 = ((i * 17) % 48) * (2 * Math.PI) / 48;
  return {
    x1: (100 + 95 * Math.cos(a1)).toFixed(2),
    y1: (100 + 95 * Math.sin(a1)).toFixed(2),
    x2: (100 + 95 * Math.cos(a2)).toFixed(2),
    y2: (100 + 95 * Math.sin(a2)).toFixed(2),
  };
});

export default function WelcomeHero({ onSelectMode, t }) {
  const isRtl = t.dir === "rtl";
  const ArrowIcon = isRtl ? ArrowLeft : ArrowRight;

  const scrollToStudio = (mode) => {
    if (mode && onSelectMode) {
      onSelectMode(mode);
    }
    const el = document.getElementById("studio-workspace");
    if (el) {
      el.scrollIntoView({ behavior: "smooth" });
    }
  };

  return (
    <section className="relative overflow-hidden pt-6 pb-12 sm:pt-10 sm:pb-16 border-b border-neutral-200/70 dark:border-neutral-800/70">
      {/* Ambient background glow accents */}
      <div className="absolute top-0 start-1/2 -translate-x-1/2 w-full max-w-7xl h-96 bg-gradient-to-b from-indigo-500/10 via-purple-500/5 to-transparent blur-3xl pointer-events-none -z-10" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
          {/* Main Hero Content */}
          <div className="lg:col-span-7 space-y-6 text-center lg:text-start">
            {/* Top Innovation Badge */}
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-gradient-to-r from-indigo-50 to-purple-50 dark:from-indigo-950/60 dark:to-purple-950/60 border border-indigo-200 dark:border-indigo-800/60 shadow-xs">
              <span className="flex h-2 w-2 rounded-full bg-indigo-600 dark:bg-indigo-400 animate-ping" />
              <span className="text-xs font-bold text-indigo-900 dark:text-indigo-200">
                {t.heroBadge}
              </span>
            </div>

            {/* Headline */}
            <h1 className="text-3xl sm:text-5xl lg:text-6xl font-black text-neutral-900 dark:text-white tracking-tight leading-[1.15]">
              <span>{t.heroTitle.split(" ")[0]} </span>
              <span className="bg-gradient-to-r from-indigo-600 via-purple-600 to-rose-600 bg-clip-text text-transparent">
                {t.heroTitle.split(" ").slice(1).join(" ")}
              </span>
            </h1>

            {/* Subtitle */}
            <p className="text-sm sm:text-base lg:text-lg text-neutral-600 dark:text-neutral-400 max-w-2xl mx-auto lg:mx-0 leading-relaxed font-normal">
              {t.heroSubtitle}
            </p>

            {/* Action Buttons & Quick Launch */}
            <div className="flex flex-wrap items-center justify-center lg:justify-start gap-3 pt-2">
              <button
                type="button"
                onClick={() => scrollToStudio("image")}
                className="inline-flex items-center justify-center gap-2 px-6 py-3.5 rounded-2xl bg-gradient-to-r from-indigo-600 via-purple-600 to-rose-600 hover:opacity-95 text-white font-bold text-sm sm:text-base shadow-lg shadow-indigo-600/25 transition transform hover:-translate-y-0.5 cursor-pointer"
              >
                <Sparkles className="w-5 h-5" />
                <span>{t.heroCtaLaunch}</span>
                <ArrowIcon className="w-4 h-4" />
              </button>

              <button
                type="button"
                onClick={() => scrollToStudio("sequence")}
                className="inline-flex items-center justify-center gap-2 px-5 py-3.5 rounded-2xl bg-white dark:bg-neutral-800 text-neutral-800 dark:text-neutral-200 hover:bg-neutral-100 dark:hover:bg-neutral-700/80 border border-neutral-300 dark:border-neutral-700 font-bold text-sm shadow-xs transition cursor-pointer"
              >
                <FileText className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
                <span>{t.heroCtaUploadText}</span>
              </button>
            </div>

            {/* Feature Highlights Pills */}
            <div className="flex flex-wrap items-center justify-center lg:justify-start gap-4 pt-2 text-xs text-neutral-500 dark:text-neutral-400">
              <span className="flex items-center gap-1.5 font-medium">
                <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
                <span>{t.dir === "rtl" ? "خوارزمية Greedy السريعة" : "High-speed Greedy Solver"}</span>
              </span>
              <span className="flex items-center gap-1.5 font-medium">
                <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
                <span>{t.dir === "rtl" ? "قوالب طباعة 1:1 مع مسطرة 10 سم" : "1:1 Templates with 10cm Ruler"}</span>
              </span>
              <span className="flex items-center gap-1.5 font-medium">
                <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
                <span>{t.dir === "rtl" ? "مشغل خطوات البناء التفاعلي" : "Physical Step Player"}</span>
              </span>
            </div>
          </div>

          {/* Hero Visual Mockup Card */}
          <div className="lg:col-span-5 flex justify-center">
            <div className="relative w-full max-w-md aspect-square rounded-3xl p-6 bg-gradient-to-b from-white to-neutral-100 dark:from-neutral-900 dark:to-neutral-950 border border-neutral-200 dark:border-neutral-800 shadow-2xl flex flex-col items-center justify-center text-center overflow-hidden group">
              {/* Decorative radial strings simulation */}
              <div className="absolute inset-4 rounded-full border border-dashed border-indigo-400/40 dark:border-indigo-500/30 flex items-center justify-center">
                <svg className="w-full h-full opacity-60 animate-spin-slow" viewBox="0 0 200 200">
                  <circle cx="100" cy="100" r="95" fill="none" stroke="#6366f1" strokeWidth="0.5" strokeDasharray="2 3" />
                  {HERO_LINES.map((line, i) => (
                    <line
                      key={i}
                      x1={line.x1}
                      y1={line.y1}
                      x2={line.x2}
                      y2={line.y2}
                      stroke="#09090b"
                      strokeWidth="0.4"
                      strokeOpacity="0.25"
                    />
                  ))}
                </svg>
              </div>

              {/* Central Floating Badge */}
              <div className="relative z-10 p-5 rounded-2xl bg-white/95 dark:bg-neutral-900/95 backdrop-blur-md border border-neutral-200/80 dark:border-neutral-700/80 shadow-xl max-w-xs space-y-2.5">
                <div className="w-12 h-12 rounded-xl mx-auto bg-gradient-to-tr from-indigo-600 to-rose-600 flex items-center justify-center text-white shadow-md shadow-indigo-600/30">
                  <Compass className="w-6 h-6" />
                </div>
                <h3 className="font-black text-sm text-neutral-900 dark:text-white">
                  {t.dir === "rtl" ? "دقة هندسية فيزيائية" : "Precision Physical Art"}
                </h3>
                <p className="text-[11px] text-neutral-500 dark:text-neutral-400 leading-normal">
                  {t.dir === "rtl"
                    ? "محاكاة مطابقة 100% لسماكة الخيوط الحقيقية والالتفاف حول المسامير الدائرية."
                    : "Accurate physical thread simulations for real wooden boards and boundary nails."}
                </p>
                <div className="pt-1 flex items-center justify-center gap-1.5 text-[11px] font-bold text-indigo-600 dark:text-indigo-400">
                  <MapPin className="w-3.5 h-3.5 text-rose-500" />
                  <span>{t.dir === "rtl" ? "العراق - بغداد 2026" : "Iraq - Baghdad 2026"}</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* 4 Stats Metrics Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mt-12 pt-8 border-t border-neutral-200/60 dark:border-neutral-800/60">
          {[
            { val: t.heroStat1Val, label: t.heroStat1Label, color: "text-indigo-600 dark:text-indigo-400" },
            { val: t.heroStat2Val, label: t.heroStat2Label, color: "text-purple-600 dark:text-purple-400" },
            { val: t.heroStat3Val, label: t.heroStat3Label, color: "text-rose-600 dark:text-rose-400" },
            { val: t.heroStat4Val, label: t.heroStat4Label, color: "text-emerald-600 dark:text-emerald-400" },
          ].map((item, idx) => (
            <div
              key={idx}
              className="p-4 rounded-2xl bg-white/60 dark:bg-neutral-900/40 border border-neutral-200/60 dark:border-neutral-800/60 backdrop-blur-xs text-center sm:text-start"
            >
              <div className={`text-2xl sm:text-3xl font-black font-mono tracking-tight ${item.color}`}>
                {item.val}
              </div>
              <div className="text-xs font-semibold text-neutral-600 dark:text-neutral-400 mt-1">
                {item.label}
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
