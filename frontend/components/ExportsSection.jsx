"use client";

import React from "react";
import {
  Download,
  FileText,
  FileCode,
  Image as ImageIcon,
  Archive,
  AlertTriangle,
  Ruler,
  Check,
} from "lucide-react";

export default function ExportsSection({ jobResult, t }) {
  if (!jobResult || !jobResult.job_id) return null;

  const jobId = jobResult.job_id;

  const downloadUrl = (artifact) =>
    `/api/jobs/${jobId}/downloads/${artifact}`;

  const stoppingReasonText =
    t[`reason_${jobResult.stopping_reason}`] || jobResult.stopping_reason;

  return (
    <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-2xl p-6 shadow-sm space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-neutral-100 dark:border-neutral-800 pb-4">
        <div>
          <h2 className="font-bold text-lg text-neutral-900 dark:text-neutral-100 flex items-center gap-2">
            <Download className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
            <span>{t.exportTitle}</span>
          </h2>
          <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-0.5">
            {t.stoppingReason}: <span className="font-semibold text-neutral-700 dark:text-neutral-300">{stoppingReasonText}</span>
          </p>
        </div>

        {/* 1-Click ZIP bundle */}
        <a
          href={downloadUrl("string_art_bundle.zip")}
          download="string_art_bundle.zip"
          className="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 text-white font-bold text-sm shadow-md shadow-emerald-600/20 hover:opacity-95 transition"
        >
          <Archive className="w-4 h-4" />
          <span>{t.downloadBundle}</span>
        </a>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <div className="p-3.5 rounded-xl bg-neutral-50 dark:bg-neutral-800/40 border border-neutral-100 dark:border-neutral-800">
          <span className="text-[11px] uppercase tracking-wider font-semibold text-neutral-500">
            {t.statsLines}
          </span>
          <div className="text-xl font-extrabold text-neutral-900 dark:text-white font-mono mt-1">
            {jobResult.total_lines}
          </div>
        </div>

        <div className="p-3.5 rounded-xl bg-neutral-50 dark:bg-neutral-800/40 border border-neutral-100 dark:border-neutral-800">
          <span className="text-[11px] uppercase tracking-wider font-semibold text-neutral-500">
            {t.statsLengthRaw}
          </span>
          <div className="text-xl font-extrabold text-indigo-600 dark:text-indigo-400 font-mono mt-1">
            {jobResult.total_thread_m} m
          </div>
        </div>

        <div className="p-3.5 rounded-xl bg-neutral-50 dark:bg-neutral-800/40 border border-neutral-100 dark:border-neutral-800">
          <span className="text-[11px] uppercase tracking-wider font-semibold text-neutral-500">
            {t.statsLengthAllowance} (+{jobResult.allowance_pct}%)
          </span>
          <div className="text-xl font-extrabold text-emerald-600 dark:text-emerald-400 font-mono mt-1">
            {jobResult.estimated_with_allowance_m} m
          </div>
        </div>
      </div>

      {/* Print Warning Alert */}
      <div className="flex items-start gap-3 p-4 rounded-xl bg-amber-50/80 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-900/50 text-amber-900 dark:text-amber-200 text-xs">
        <AlertTriangle className="w-5 h-5 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
        <div>
          <span className="font-bold block mb-1">{t.printWarning}</span>
          <p className="text-amber-800/90 dark:text-amber-300/80 leading-relaxed">
            {t.dir === "rtl"
              ? "تحتوي القوالب على مسطرة اختبار بطول 10 سم؛ تأكد بعد الطباعة من مطابقتها التامة لمسطرة يدوية قبل تثبيت المسامير."
              : "Templates include a printed 10 cm test ruler; verify against a physical ruler before hammering nails."}
          </p>
        </div>
      </div>

      {/* Individual Download Items */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        {[
          {
            name: "nails_template_tiled_a4.pdf",
            title: t.downloadPdfTiled,
            desc: "Multi-page A4 tiled with overlap, marks, and 10cm ruler",
            icon: FileText,
            badge: "PDF A4",
          },
          {
            name: "nails_template_actual_size.pdf",
            title: t.downloadPdfActual,
            desc: "1:1 single sheet actual size printout",
            icon: FileText,
            badge: "PDF 1:1",
          },
          {
            name: "nails_template.svg",
            title: t.downloadSvg,
            desc: "Scalable vector with exact mm dimension attributes",
            icon: FileCode,
            badge: "SVG",
          },
          {
            name: "sequence.csv",
            title: t.downloadCsv,
            desc: "Tabular steps (step, from_nail, to_nail)",
            icon: FileText,
            badge: "CSV",
          },
          {
            name: "instructions.json",
            title: t.downloadJson,
            desc: "Complete metadata, nail positions & sequence array",
            icon: FileCode,
            badge: "JSON",
          },
          {
            name: "preview.png",
            title: t.downloadPng,
            desc: "High-resolution string art bitmap preview",
            icon: ImageIcon,
            badge: "PNG",
          },
        ].map((item) => {
          const Icon = item.icon;
          return (
            <a
              key={item.name}
              href={downloadUrl(item.name)}
              download={item.name}
              className="flex items-center justify-between p-3.5 rounded-xl border border-neutral-200 dark:border-neutral-800 hover:border-indigo-400 dark:hover:border-indigo-600 bg-neutral-50/40 dark:bg-neutral-800/30 hover:bg-white dark:hover:bg-neutral-800 transition group"
            >
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-lg bg-indigo-50 dark:bg-indigo-950/40 flex items-center justify-center text-indigo-600 dark:text-indigo-400 group-hover:scale-105 transition">
                  <Icon className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="font-semibold text-xs text-neutral-800 dark:text-neutral-200">
                    {item.title}
                  </h4>
                  <p className="text-[11px] text-neutral-500 dark:text-neutral-400">
                    {item.desc}
                  </p>
                </div>
              </div>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded-md bg-neutral-200/70 dark:bg-neutral-700 text-neutral-700 dark:text-neutral-300">
                {item.badge}
              </span>
            </a>
          );
        })}
      </div>
    </div>
  );
}
