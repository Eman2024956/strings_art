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
  RotateCcw,
  Sparkles,
} from "lucide-react";

export default function ExportsSection({ jobResult, onClearAll, t }) {
  if (!jobResult || !jobResult.job_id) return null;

  const jobId = jobResult.job_id;

  const downloadUrl = (artifact) =>
    `/api/jobs/${jobId}/downloads/${artifact}`;

  const stoppingReasonText =
    t[`reason_${jobResult.stopping_reason}`] || jobResult.stopping_reason || "";

  const getTimestampFilename = () => {
    const now = new Date();
    const dateStamp = now.toISOString().slice(0, 10);
    const timeStamp = now.toTimeString().slice(0, 8).replace(/:/g, "-");
    return `husam_art_${dateStamp}_${timeStamp}.txt`;
  };

  const handleDownloadTxt = () => {
    const filename = getTimestampFilename();
    let content = "";
    if (jobResult.sequence && Array.isArray(jobResult.sequence)) {
      content = jobResult.sequence.join(", ");
    }
    const blob = new Blob([content], { type: "text/plain;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

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

        <div className="flex flex-wrap items-center gap-2">
          {/* Download Text File Format (husam_art_YYYY-MM-DD_HH-mm-ss.txt) */}
          <button
            type="button"
            onClick={handleDownloadTxt}
            title={getTimestampFilename()}
            className="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-emerald-600 via-teal-600 to-indigo-600 text-white font-bold text-sm shadow-md shadow-emerald-600/20 hover:opacity-95 transition cursor-pointer"
          >
            <FileText className="w-4 h-4" />
            <span>{t.dir === "rtl" ? "تحميل ملف التسلسل (TXT)" : "Download Text File (TXT)"}</span>
          </button>

          {/* 
            Commented out per user request: Hide download all package ZIP
            <a
              href={downloadUrl("string_art_bundle.zip")}
              download="string_art_bundle.zip"
              className="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 text-white font-bold text-sm shadow-md shadow-emerald-600/20 hover:opacity-95 transition"
            >
              <Archive className="w-4 h-4" />
              <span>{t.downloadBundle}</span>
            </a>
          */}

          {/* Clear & Start New Artwork */}
          {onClearAll && (
            <button
              onClick={onClearAll}
              title={t.clearCacheTooltip}
              className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-neutral-100 hover:bg-rose-50 text-neutral-700 hover:text-rose-700 dark:bg-neutral-800 dark:hover:bg-rose-950/40 dark:text-neutral-200 dark:hover:text-rose-300 border border-neutral-200 dark:border-neutral-700 hover:border-rose-300 font-semibold text-sm transition"
            >
              <RotateCcw className="w-4 h-4" />
              <span>{t.startNewArtwork}</span>
            </button>
          )}
        </div>
      </div>

      {/* Stats Cards: One single row grid on mobile with compact small font */}
      <div className="grid grid-cols-3 gap-1.5 sm:gap-3">
        <div className="p-2 sm:p-3.5 rounded-xl bg-neutral-50 dark:bg-neutral-800/40 border border-neutral-100 dark:border-neutral-800 flex flex-col justify-between overflow-hidden">
          <span className="text-[9px] sm:text-[11px] uppercase tracking-wider font-bold text-neutral-500 truncate" title={t.statsLines}>
            {t.statsLines}
          </span>
          <div className="text-sm sm:text-2xl font-black text-neutral-900 dark:text-white font-mono mt-0.5 sm:mt-1 truncate">
            {jobResult.total_lines}
          </div>
        </div>

        <div className="p-2 sm:p-3.5 rounded-xl bg-neutral-50 dark:bg-neutral-800/40 border border-neutral-100 dark:border-neutral-800 flex flex-col justify-between overflow-hidden">
          <span className="text-[9px] sm:text-[11px] uppercase tracking-wider font-bold text-neutral-500 truncate" title={t.statsLengthRaw}>
            {t.statsLengthRaw}
          </span>
          <div className="text-sm sm:text-2xl font-black text-indigo-600 dark:text-indigo-400 font-mono mt-0.5 sm:mt-1 truncate">
            {jobResult.total_thread_m} <span className="text-[9px] sm:text-xs font-bold text-neutral-400">m</span>
          </div>
        </div>

        <div className="p-2 sm:p-3.5 rounded-xl bg-neutral-50 dark:bg-neutral-800/40 border border-neutral-100 dark:border-neutral-800 flex flex-col justify-between overflow-hidden">
          <span className="text-[9px] sm:text-[11px] uppercase tracking-wider font-bold text-neutral-500 truncate" title={`${t.statsLengthAllowance} (+${jobResult.allowance_pct}%)`}>
            {t.statsLengthAllowance} <span className="text-[8px] sm:text-[10px] text-neutral-400 font-normal">(+{jobResult.allowance_pct}%)</span>
          </span>
          <div className="text-sm sm:text-2xl font-black text-emerald-600 dark:text-emerald-400 font-mono mt-0.5 sm:mt-1 truncate">
            {jobResult.estimated_with_allowance_m} <span className="text-[9px] sm:text-xs font-bold text-neutral-400">m</span>
          </div>
        </div>
      </div>

      {/* 
        Hidden / Commented out per user request:
        Print warning alert and individual download items grid
      */}
      {false && (
        <>
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
                name: "sequence.txt",
                downloadName: getTimestampFilename(),
                title: t.downloadTxt,
                desc: "Raw comma-separated nail sequence (e.g. 1, 190, 24, 188...)",
                icon: FileText,
                badge: "TXT",
                onClick: (e) => {
                  e.preventDefault();
                  handleDownloadTxt();
                },
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
                desc: "High-resolution anti-aliased string art preview",
                icon: ImageIcon,
                badge: "PNG",
                onClick: (e) => {
                  const canvas = document.querySelector("canvas");
                  if (canvas) {
                    e.preventDefault();
                    const url = canvas.toDataURL("image/png");
                    const a = document.createElement("a");
                    a.href = url;
                    a.download = `string_art_preview_${new Date().toISOString().slice(0, 10)}.png`;
                    a.click();
                  }
                },
              },
            ].map((item) => {
              const Icon = item.icon;
              return (
                <a
                  key={item.name}
                  href={downloadUrl(item.name)}
                  download={item.downloadName || item.name}
                  onClick={item.onClick}
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
        </>
      )}
    </div>
  );
}
