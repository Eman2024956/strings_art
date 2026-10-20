"use client";

import React, { useState } from "react";
import {
  FileText,
  Sliders,
  Ruler,
  Hash,
  Sparkles,
  RotateCcw,
  Upload,
  Info,
  CheckCircle,
} from "lucide-react";
import { computeSequenceResult } from "../lib/sequenceParser";

export default function SequenceInfoPanel({
  jobResult,
  onUpdateJobResult,
  onClearAll,
  t,
}) {
  const sequence = jobResult?.sequence || [];
  const maxNail = sequence.length > 0 ? Math.max(...sequence) : 200;

  const [nails, setNails] = useState(jobResult?.nails_count || 200);
  const [diameterMm, setDiameterMm] = useState(jobResult?.diameter_mm || 400);
  const [allowancePct, setAllowancePct] = useState(jobResult?.allowance_pct || 15);

  const handleApplyChanges = () => {
    const updated = computeSequenceResult({
      sequence,
      nailsCount: parseInt(nails, 10) || 200,
      diameterMm: parseFloat(diameterMm) || 400.0,
      allowancePct: parseFloat(allowancePct) || 15.0,
      filename: jobResult?.imported_filename || "sequence.txt",
      customJobId: jobResult?.job_id,
    });
    onUpdateJobResult(updated);
  };

  return (
    <div className="space-y-6">
      {/* File & Mode Status Card */}
      <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-2xl p-5 shadow-sm space-y-4">
        <div className="flex items-center justify-between border-b border-neutral-100 dark:border-neutral-800 pb-3">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-indigo-50 dark:bg-indigo-950/40 flex items-center justify-center text-indigo-600 dark:text-indigo-400">
              <FileText className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-xs uppercase tracking-wider font-bold text-neutral-500">
                {t.importedBadge}
              </h3>
              <div className="text-sm font-bold text-neutral-900 dark:text-neutral-100">
                {jobResult?.imported_filename || "sequence.txt"}
              </div>
            </div>
          </div>

          <span className="text-[11px] font-mono font-bold px-2 py-0.5 rounded-md bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800/60">
            ✓ {t.dir === "rtl" ? "نشط" : "Active"}
          </span>
        </div>

        <p className="text-xs text-neutral-500 dark:text-neutral-400 leading-relaxed">
          {t.importedSequenceDesc}
        </p>

        {/* First Steps Preview Bar */}
        <div className="p-3 rounded-xl bg-neutral-50 dark:bg-neutral-800/40 border border-neutral-100 dark:border-neutral-800 space-y-1">
          <span className="text-[10px] uppercase font-bold text-neutral-500 block">
            {t.dir === "rtl" ? "بداية التسلسل:" : "Starting Sequence:"}
          </span>
          <div className="font-mono text-xs font-semibold text-neutral-700 dark:text-neutral-300 truncate">
            {sequence.slice(0, 12).join(" ➔ ")} {sequence.length > 12 && "..."}
          </div>
        </div>
      </div>

      {/* Geometry & Nails Tuning Card */}
      <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-2xl p-5 shadow-sm space-y-4">
        <div className="flex items-center gap-2 border-b border-neutral-100 dark:border-neutral-800 pb-3">
          <Sliders className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
          <h3 className="font-bold text-sm text-neutral-900 dark:text-neutral-100">
            {t.overrideNailsTitle}
          </h3>
        </div>

        <div className="space-y-4">
          <div>
            <div className="flex items-center justify-between text-xs font-bold text-neutral-700 dark:text-neutral-300 mb-1">
              <span>{t.detectedNails}</span>
              <span className="font-mono text-indigo-600 dark:text-indigo-400">{nails}</span>
            </div>
            <input
              type="number"
              min={maxNail}
              max={500}
              value={nails}
              onChange={(e) => setNails(Math.max(maxNail, parseInt(e.target.value, 10) || maxNail))}
              className="w-full px-3 py-2 rounded-xl text-xs font-mono font-bold border border-neutral-300 dark:border-neutral-700 bg-neutral-50 dark:bg-neutral-800 text-neutral-900 dark:text-neutral-100 focus:ring-2 focus:ring-indigo-500"
            />
            <span className="text-[10px] text-neutral-500 block mt-1">
              {t.dir === "rtl"
                ? `الحد الأدنى: ${maxNail} (أعلى رقم مسمار تم رصده في الملف)`
                : `Minimum: ${maxNail} (highest nail index in file)`}
            </span>
          </div>

          <div>
            <div className="flex items-center justify-between text-xs font-bold text-neutral-700 dark:text-neutral-300 mb-1">
              <span>{t.boardDiameter}</span>
              <span className="font-mono text-indigo-600 dark:text-indigo-400">{diameterMm} mm ({diameterMm / 10} cm)</span>
            </div>
            <input
              type="number"
              min={100}
              max={2000}
              step={10}
              value={diameterMm}
              onChange={(e) => setDiameterMm(parseFloat(e.target.value) || 400)}
              className="w-full px-3 py-2 rounded-xl text-xs font-mono font-bold border border-neutral-300 dark:border-neutral-700 bg-neutral-50 dark:bg-neutral-800 text-neutral-900 dark:text-neutral-100 focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          <div>
            <div className="flex items-center justify-between text-xs font-bold text-neutral-700 dark:text-neutral-300 mb-1">
              <span>{t.allowancePct}</span>
              <span className="font-mono text-indigo-600 dark:text-indigo-400">{allowancePct}%</span>
            </div>
            <input
              type="number"
              min={0}
              max={50}
              step={1}
              value={allowancePct}
              onChange={(e) => setAllowancePct(parseFloat(e.target.value) || 15)}
              className="w-full px-3 py-2 rounded-xl text-xs font-mono font-bold border border-neutral-300 dark:border-neutral-700 bg-neutral-50 dark:bg-neutral-800 text-neutral-900 dark:text-neutral-100 focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          <button
            type="button"
            onClick={handleApplyChanges}
            className="w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs shadow-sm transition"
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>{t.recalculatePreview}</span>
          </button>
        </div>
      </div>

      {/* Switch / Start New Card */}
      <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-2xl p-5 shadow-sm space-y-3">
        <button
          type="button"
          onClick={onClearAll}
          className="w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl bg-neutral-100 hover:bg-rose-50 text-neutral-700 hover:text-rose-700 dark:bg-neutral-800 dark:hover:bg-rose-950/40 dark:text-neutral-200 dark:hover:text-rose-300 border border-neutral-200 dark:border-neutral-700 font-semibold text-xs transition"
        >
          <RotateCcw className="w-3.5 h-3.5" />
          <span>{t.startNewArtwork}</span>
        </button>
      </div>
    </div>
  );
}
