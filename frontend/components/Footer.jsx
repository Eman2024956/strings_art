"use client";

import React from "react";
import {
  Sparkles,
  MapPin,
  Heart,
  FileCode,
  FileText,
  Printer,
  ShieldCheck,
  Globe,
  ExternalLink,
  UserCheck
} from "lucide-react";

export default function Footer({ t }) {
  const isRtl = t.dir === "rtl";

  const scrollToSection = (id) => {
    const el = document.getElementById(id);
    if (el) {
      el.scrollIntoView({ behavior: "smooth" });
    }
  };

  return (
    <footer className="border-t border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-950 transition-colors pt-12 pb-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 space-y-12">
        {/* Main Footer Grid */}
        <div className="grid grid-cols-1 md:grid-cols-12 gap-8 lg:gap-12">
          {/* Brand Col */}
          <div className="md:col-span-7 space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-amber-500 via-rose-500 to-indigo-600 flex items-center justify-center shadow-md shadow-rose-500/20 text-white">
                <svg
                  className="w-6 h-6 stroke-[2]"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                >
                  <circle cx="12" cy="12" r="9" strokeDasharray="2 2" />
                  <path d="M12 3 L20 16 L4 16 Z" opacity="0.8" />
                  <path d="M12 21 L4 8 L20 8 Z" opacity="0.8" />
                </svg>
              </div>
              <span className="font-black text-lg text-neutral-900 dark:text-white tracking-tight">
                {t.appTitle}
              </span>
            </div>

            <p className="text-xs sm:text-sm text-neutral-500 dark:text-neutral-400 leading-relaxed max-w-md">
              {t.footerBrandDesc}
            </p>

            {/* Location & Developer Profile Badge */}
            <div className="flex flex-wrap items-center gap-2">
              <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-neutral-100 dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 text-xs font-bold text-neutral-800 dark:text-neutral-200 shadow-xs">
                <MapPin className="w-3.5 h-3.5 text-rose-500" />
                <span>{isRtl ? "العراق - بغداد ٢٠٢٦" : "Iraq Baghdad 2026"}</span>
              </div>

              {/* Developer Profile Link Badge */}
              <a
                href="https://falahpedia.tawassl.com/"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-indigo-50 dark:bg-indigo-950/60 border border-indigo-200 dark:border-indigo-800/80 text-xs font-bold text-indigo-700 dark:text-indigo-300 hover:bg-indigo-100 dark:hover:bg-indigo-900/60 transition shadow-xs group"
                title="Developer Profile - FalahPedia"
              >
                <UserCheck className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400" />
                <span>{isRtl ? "ملف المطور (Developer Profile)" : "Developer Profile"}</span>
                <ExternalLink className="w-3.5 h-3.5 opacity-70 group-hover:opacity-100 transition" />
              </a>
            </div>
          </div>

          {/* Developer & Links */}
          <div className="md:col-span-5 space-y-3">
            <h4 className="text-xs font-bold uppercase tracking-wider text-neutral-900 dark:text-neutral-200">
              {isRtl ? "المطور وحقوق النشر" : "Developer & Links"}
            </h4>
            <ul className="space-y-2 text-xs text-neutral-600 dark:text-neutral-400">
              <li>
                <button
                  type="button"
                  onClick={() => scrollToSection("studio-workspace")}
                  className="hover:text-indigo-600 dark:hover:text-indigo-400 transition cursor-pointer"
                >
                  {t.navStudio}
                </button>
              </li>
              <li>
                <a
                  href="https://falahpedia.tawassl.com/"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 hover:text-indigo-600 dark:hover:text-indigo-400 transition"
                >
                  <span>FalahPedia (Developer Profile)</span>
                  <ExternalLink className="w-3 h-3 opacity-60" />
                </a>
              </li>
              <li>
                <a
                  href="https://tawassl.com/"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 hover:text-indigo-600 dark:hover:text-indigo-400 transition"
                >
                  <span>Tawassl.com</span>
                  <ExternalLink className="w-3 h-3 opacity-60" />
                </a>
              </li>
            </ul>
          </div>

          {/* Formats & Tech (الصيغ المدعومة) - Hidden and commented out from codebase per user request */}
          {/*
          <div className="md:col-span-4 space-y-3">
            <h4 className="text-xs font-bold uppercase tracking-wider text-neutral-900 dark:text-neutral-200">
              {t.footerFormatsTitle}
            </h4>
            <div className="flex flex-wrap gap-2">
              {[
                { name: "SVG Vector", desc: "1:1 exact scale" },
                { name: "PDF A4 Tiled", desc: "Multi-page printable" },
                { name: "PDF 1:1 Actual", desc: "Single poster" },
                { name: "TXT Sequence", desc: "Nail indices" },
                { name: "CSV Excel", desc: "Step tabular" },
                { name: "JSON Data", desc: "Coordinates" },
                { name: "PNG Preview", desc: "Anti-aliased" },
                { name: "ZIP Bundle", desc: "Complete pack" },
              ].map((fmt, i) => (
                <span
                  key={i}
                  className="text-[11px] font-mono px-2.5 py-1 rounded-lg bg-neutral-100 dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 text-neutral-700 dark:text-neutral-300"
                >
                  {fmt.name}
                </span>
              ))}
            </div>
          </div>
          */}
        </div>

        {/* Bottom Copyright Bar with Tawassl.com 2026 Iraq Baghdad */}
        <div className="pt-6 border-t border-neutral-200/80 dark:border-neutral-800/80 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-neutral-500 dark:text-neutral-400">
          <div className="flex flex-wrap items-center gap-2 font-medium">
            <span>© Copyright</span>
            <a
              href="https://tawassl.com/"
              target="_blank"
              rel="noopener noreferrer"
              className="font-bold text-neutral-800 dark:text-neutral-200 hover:text-indigo-600 dark:hover:text-indigo-400 transition"
            >
              Tawassl.com
            </a>
            <span>2026 Iraq Baghdad.</span>
            <span>{isRtl ? "جميع الحقوق محفوظة." : "All rights reserved."}</span>
          </div>

          <div className="flex items-center gap-3 text-[11px] font-semibold">
            <a
              href="https://falahpedia.tawassl.com/"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 text-indigo-600 dark:text-indigo-400 hover:underline"
            >
              <span>{isRtl ? "ملف المطور:" : "Developer:"} https://falahpedia.tawassl.com/</span>
              <ExternalLink className="w-3 h-3" />
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
}
