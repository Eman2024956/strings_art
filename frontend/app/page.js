"use client";

import React, { useState, useEffect, useCallback } from "react";
import Header from "../components/Header";
import UploadZone from "../components/UploadZone";
import ImageEditor from "../components/ImageEditor";
import ParametersPanel from "../components/ParametersPanel";
import StudioCanvas from "../components/StudioCanvas";
import ConstructionPlayer from "../components/ConstructionPlayer";
import ExportsSection from "../components/ExportsSection";
import ProgressModal from "../components/ProgressModal";
import { translations } from "../lib/i18n";
import {
  UploadCloud,
  Sliders,
  Play,
  RotateCcw,
  Sparkles,
  Info,
  HelpCircle,
  CheckCircle,
} from "lucide-react";

export default function Home() {
  const [lang, setLang] = useState("ar");
  const [theme, setTheme] = useState("dark");

  const t = translations[lang] || translations.en;

  // Upload State
  const [upload, setUpload] = useState(null);

  // Editor Adjustments State
  const [adjustments, setAdjustments] = useState({
    zoom: 1.0,
    rotation: 0,
    brightness: 1.0,
    contrast: 1.0,
    panX: 0,
    panY: 0,
  });

  // Algorithm Parameters State
  const [params, setParams] = useState({
    nails: 200,
    steps: 3000,
    size: 300,
    diameter_mm: 400.0,
    strength: 0.12,
    minGap: 10,
    startNail: 1,
    allowancePct: 15.0,
  });

  // Job and Generation State
  const [activeJobId, setActiveJobId] = useState(null);
  const [jobStatus, setJobStatus] = useState(null);
  const [jobResult, setJobResult] = useState(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isCancelling, setIsCancelling] = useState(false);
  const [genError, setGenError] = useState(null);

  // Canvas & Player State
  const [viewMode, setViewMode] = useState("string_art");
  const [currentStepIndex, setCurrentStepIndex] = useState(1);
  const [showNails, setShowNails] = useState(true);

  // Update theme class on HTML element
  useEffect(() => {
    const root = document.documentElement;
    if (theme === "dark") {
      root.classList.add("dark");
    } else {
      root.classList.remove("dark");
    }
  }, [theme]);

  // Handle generation start
  const handleStartGeneration = async () => {
    if (!upload) return;
    setIsGenerating(true);
    setGenError(null);
    setJobResult(null);

    try {
      const payload = {
        upload_id: upload.uploadId,
        nails: params.nails,
        steps: params.steps,
        size: params.size,
        diameter_mm: params.diameter_mm,
        strength: params.strength,
        min_gap: params.minGap,
        start_nail: params.startNail,
        allowance_pct: params.allowancePct,
        rotation: adjustments.rotation,
        brightness: adjustments.brightness,
        contrast: adjustments.contrast,
      };

      const res = await fetch("/api/jobs", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
        credentials: "include",
      });

      if (!res.ok) {
        const errJson = await res.json().catch(() => ({}));
        throw new Error(errJson.detail || "Failed to start generation job.");
      }

      const data = await res.json();
      setActiveJobId(data.job_id);
      setJobStatus({ status: "queued", progress_step: 0, total_steps: params.steps });
    } catch (err) {
      setGenError(err.message);
      setIsGenerating(false);
    }
  };

  // Poll job status
  useEffect(() => {
    if (!activeJobId || !isGenerating) return;

    const interval = setInterval(async () => {
      try {
        const res = await fetch(`/api/jobs/${activeJobId}`, { credentials: "include" });
        if (!res.ok) throw new Error("Status check failed.");
        const data = await res.json();
        setJobStatus(data);

        if (data.status === "completed") {
          setIsGenerating(false);
          clearInterval(interval);
          // Fetch final result
          const resResult = await fetch(`/api/jobs/${activeJobId}/result`, { credentials: "include" });
          if (resResult.ok) {
            const resultData = await resResult.json();
            setJobResult(resultData);
            if (resultData.sequence) {
              setCurrentStepIndex(resultData.sequence.length - 1);
            }
          }
        } else if (data.status === "cancelled") {
          setIsGenerating(false);
          clearInterval(interval);
        } else if (data.status === "failed") {
          setIsGenerating(false);
          setGenError(data.error_message || "Generation job failed.");
          clearInterval(interval);
        }
      } catch (err) {
        console.error("Polling error:", err);
      }
    }, 700);

    return () => clearInterval(interval);
  }, [activeJobId, isGenerating]);

  // Cancel Job
  const handleCancelJob = async () => {
    if (!activeJobId) return;
    setIsCancelling(true);
    try {
      await fetch(`/api/jobs/${activeJobId}/cancel`, {
        method: "POST",
        credentials: "include",
      });
    } catch (err) {
      console.error("Cancel request error:", err);
    } finally {
      setIsCancelling(false);
    }
  };

  return (
    <div
      dir={t.dir}
      className="min-h-screen bg-neutral-50 dark:bg-neutral-950 text-neutral-900 dark:text-neutral-100 flex flex-col font-sans transition-colors"
    >
      <Header
        lang={lang}
        setLang={setLang}
        theme={theme}
        setTheme={setTheme}
        t={t}
      />

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 py-6 sm:py-8 space-y-8">
        {/* Workflow Progress Breadcrumb */}
        <div className="flex items-center justify-between border-b border-neutral-200 dark:border-neutral-800 pb-4 overflow-x-auto gap-4">
          <div className="flex items-center gap-2 sm:gap-4 shrink-0 text-xs sm:text-sm font-semibold">
            <span
              className={`flex items-center gap-1.5 ${
                upload ? "text-emerald-600 dark:text-emerald-400" : "text-indigo-600 dark:text-indigo-400"
              }`}
            >
              <span className="w-5 h-5 rounded-full bg-current/10 flex items-center justify-center text-xs">
                {upload ? "✓" : "1"}
              </span>
              {t.step1_upload}
            </span>
            <span className="text-neutral-300 dark:text-neutral-700">➔</span>
            <span
              className={`flex items-center gap-1.5 ${
                upload
                  ? "text-indigo-600 dark:text-indigo-400"
                  : "text-neutral-400 dark:text-neutral-600"
              }`}
            >
              <span className="w-5 h-5 rounded-full bg-current/10 flex items-center justify-center text-xs">
                2
              </span>
              {t.step2_adjust}
            </span>
            <span className="text-neutral-300 dark:text-neutral-700">➔</span>
            <span
              className={`flex items-center gap-1.5 ${
                jobResult
                  ? "text-emerald-600 dark:text-emerald-400"
                  : upload
                  ? "text-indigo-600 dark:text-indigo-400"
                  : "text-neutral-400 dark:text-neutral-600"
              }`}
            >
              <span className="w-5 h-5 rounded-full bg-current/10 flex items-center justify-center text-xs">
                3
              </span>
              {t.step3_parameters}
            </span>
            <span className="text-neutral-300 dark:text-neutral-700">➔</span>
            <span
              className={`flex items-center gap-1.5 ${
                jobResult
                  ? "text-rose-600 dark:text-rose-400"
                  : "text-neutral-400 dark:text-neutral-600"
              }`}
            >
              <span className="w-5 h-5 rounded-full bg-current/10 flex items-center justify-center text-xs">
                4
              </span>
              {t.step4_generate}
            </span>
          </div>

          {upload && (
            <button
              onClick={() => {
                setUpload(null);
                setJobResult(null);
              }}
              className="text-xs text-neutral-500 hover:text-neutral-800 dark:hover:text-neutral-200 transition"
            >
              {t.changeImage}
            </button>
          )}
        </div>

        {/* Error notification if any */}
        {genError && (
          <div className="p-4 rounded-xl bg-rose-50 dark:bg-rose-950/30 border border-rose-200 dark:border-rose-900 text-rose-700 dark:text-rose-300 text-sm flex items-center justify-between">
            <span>{genError}</span>
            <button
              onClick={() => setGenError(null)}
              className="text-xs font-bold underline"
            >
              Dismiss
            </button>
          </div>
        )}

        {/* Step 1: Upload if no image uploaded yet */}
        {!upload && (
          <div className="max-w-2xl mx-auto py-12">
            <UploadZone onUploadSuccess={setUpload} t={t} />

            {/* Algorithm explainer callout */}
            <div className="mt-8 p-5 rounded-2xl bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 text-xs text-neutral-600 dark:text-neutral-400 space-y-2">
              <h4 className="font-bold text-neutral-800 dark:text-neutral-200 flex items-center gap-2">
                <Info className="w-4 h-4 text-indigo-500" />
                {t.algoNoteTitle}
              </h4>
              <p className="leading-relaxed">{t.algoNoteText}</p>
            </div>
          </div>
        )}

        {/* Studio Workspace when image is uploaded */}
        {upload && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
            {/* Left Sidebar: Adjustments and Parameters */}
            <div className="lg:col-span-5 space-y-6">
              <ImageEditor
                upload={upload}
                adjustments={adjustments}
                setAdjustments={setAdjustments}
                t={t}
              />

              <ParametersPanel
                params={params}
                setParams={setParams}
                onStartGeneration={handleStartGeneration}
                isGenerating={isGenerating}
                t={t}
              />
            </div>

            {/* Right Main Area: Canvas, Construction Player & Exports */}
            <div className="lg:col-span-7 space-y-6">
              {jobResult ? (
                <>
                  <StudioCanvas
                    jobResult={jobResult}
                    uploadId={upload.uploadId}
                    currentStepIndex={currentStepIndex}
                    showNails={showNails}
                    viewMode={viewMode}
                    setViewMode={setViewMode}
                    t={t}
                  />

                  <ConstructionPlayer
                    jobId={jobResult.job_id}
                    sequence={jobResult.sequence}
                    currentStep={currentStepIndex}
                    setCurrentStep={setCurrentStepIndex}
                    t={t}
                  />

                  <ExportsSection jobResult={jobResult} t={t} />
                </>
              ) : (
                <div className="h-[520px] rounded-2xl border-2 border-dashed border-neutral-200 dark:border-neutral-800 flex flex-col items-center justify-center p-8 text-center bg-white/40 dark:bg-neutral-900/40">
                  <div className="w-16 h-16 rounded-2xl bg-indigo-50 dark:bg-indigo-950/40 flex items-center justify-center text-indigo-600 dark:text-indigo-400 mb-4">
                    <Sparkles className="w-8 h-8" />
                  </div>
                  <h3 className="font-bold text-base text-neutral-800 dark:text-neutral-200 mb-1">
                    {t.step4_generate}
                  </h3>
                  <p className="text-xs text-neutral-500 max-w-sm">
                    {t.dir === "rtl"
                      ? "اضبط الصورة والإعدادات في الجانب ثم اضغط 'بدء توليد فن الخيوط' لرؤية خطوط الخيط المتحركة وقوالب الطباعة."
                      : "Adjust the subject and settings on the left, then click 'Generate String Art' to compute chords and construction files."}
                  </p>
                </div>
              )}
            </div>
          </div>
        )}
      </main>

      {/* Real-time Progress Modal */}
      <ProgressModal
        jobStatus={jobStatus}
        onCancel={handleCancelJob}
        isCancelling={isCancelling}
        t={t}
      />
    </div>
  );
}
