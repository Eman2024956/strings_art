"use client";

import React from "react";
import { Loader2, XCircle, AlertCircle } from "lucide-react";

export default function ProgressModal({
  jobStatus,
  onCancel,
  isCancelling,
  t,
}) {
  if (!jobStatus || (jobStatus.status !== "queued" && jobStatus.status !== "running" && jobStatus.status !== "cancelling")) {
    return null;
  }

  const progressStep = jobStatus.progress_step || 0;
  const totalSteps = jobStatus.total_steps || 1;
  const pct = Math.min(100, Math.round((progressStep / totalSteps) * 100));

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
      <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-3xl p-6 sm:p-8 max-w-md w-full shadow-2xl text-center space-y-6">
        {/* Pulsing indicator */}
        <div className="relative mx-auto w-16 h-16 flex items-center justify-center">
          <div className="absolute inset-0 rounded-full bg-indigo-500/20 dark:bg-indigo-500/30 animate-ping" />
          <div className="w-16 h-16 rounded-full bg-gradient-to-tr from-indigo-600 to-rose-600 flex items-center justify-center text-white shadow-lg shadow-indigo-600/30">
            <Loader2 className="w-8 h-8 animate-spin" />
          </div>
        </div>

        <div>
          <h3 className="text-lg font-extrabold text-neutral-900 dark:text-white">
            {jobStatus.status === "cancelling" ? t.cancelling : t.generatingTitle}
          </h3>
          <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-1">
            {jobStatus.status === "queued"
              ? "In Queue... preparing high-speed chord optimizer"
              : `Calculating optimal continuous thread path`}
          </p>
        </div>

        {/* Real Progress Bar */}
        <div className="space-y-2">
          <div className="flex justify-between text-xs font-mono font-semibold text-neutral-600 dark:text-neutral-300">
            <span>
              {progressStep} / {totalSteps} lines
            </span>
            <span>{pct}%</span>
          </div>
          <div className="w-full h-3 bg-neutral-100 dark:bg-neutral-800 rounded-full overflow-hidden p-0.5 border border-neutral-200 dark:border-neutral-700">
            <div
              className="h-full bg-gradient-to-r from-indigo-600 to-rose-500 rounded-full transition-all duration-300 ease-out"
              style={{ width: `${pct}%` }}
            />
          </div>
          {jobStatus.current_nail && (
            <p className="text-[11px] text-neutral-400 font-mono">
              Active Nail: #{jobStatus.current_nail}
            </p>
          )}
        </div>

        {/* Cancel Action */}
        <button
          onClick={onCancel}
          disabled={isCancelling || jobStatus.status === "cancelling"}
          className="w-full py-2.5 rounded-xl border border-rose-200 dark:border-rose-900/60 bg-rose-50/50 dark:bg-rose-950/20 hover:bg-rose-100 dark:hover:bg-rose-900/40 text-rose-600 dark:text-rose-400 font-semibold text-xs transition flex items-center justify-center gap-1.5 disabled:opacity-50"
        >
          <XCircle className="w-4 h-4" />
          <span>{jobStatus.status === "cancelling" ? t.cancelling : t.cancelJob}</span>
        </button>
      </div>
    </div>
  );
}
