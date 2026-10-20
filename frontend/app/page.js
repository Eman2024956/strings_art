"use client";

import React, { useState, useEffect, useCallback } from "react";
import Header from "../components/Header";
import UploadZone from "../components/UploadZone";
import ImageEditor from "../components/ImageEditor";
import ParametersPanel from "../components/ParametersPanel";
import StudioCanvas from "../components/StudioCanvas";
// ConstructionPlayer & ServicesSection are hidden/commented out per user request:
// import ConstructionPlayer from "../components/ConstructionPlayer";
import ExportsSection from "../components/ExportsSection";
import ProgressModal from "../components/ProgressModal";
import SequenceUploader from "../components/SequenceUploader";
import SequenceInfoPanel from "../components/SequenceInfoPanel";
import WelcomeHero from "../components/WelcomeHero";
// import ServicesSection from "../components/ServicesSection";
import Footer from "../components/Footer";
import MobileBottomNav from "../components/MobileBottomNav";
// AutoTestRunner is hidden/commented out per user request:
// import AutoTestRunner from "../components/AutoTestRunner";
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
  FileText,
} from "lucide-react";

export default function Home() {
  const [lang, setLang] = useState("ar");
  const [theme, setTheme] = useState("dark");
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const t = translations[lang] || translations.en;

  // Upload State
  const [upload, setUpload] = useState(null);
  const [entryMode, setEntryMode] = useState("image"); // "image" | "sequence"

  // Editor Adjustments State
  const [adjustments, setAdjustments] = useState({
    zoom: 1.35,
    rotation: 0,
    brightness: 1.0,
    contrast: 1.0,
    panX: 0,
    panY: 0,
  });

  // Algorithm Parameters State (Calibrated for physical 200-nail string machines)
  const [params, setParams] = useState({
    nails: 200,
    steps: 2200,
    size: 300,
    diameter_mm: 400.0,
    strength: 0.10,
    minGap: 14,
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

  // Auto-Regeneration State
  const [autoRegen, setAutoRegen] = useState(true);
  const [isAutoGenerating, setIsAutoGenerating] = useState(false);
  const abortControllerRef = React.useRef(null);
  const debounceTimerRef = React.useRef(null);

  // Canvas & Player State
  const [viewMode, setViewMode] = useState("string_art");
  const [currentStepIndex, setCurrentStepIndex] = useState(1);
  const [showNails, setShowNails] = useState(true);

  // Load saved theme on mount
  useEffect(() => {
    try {
      const savedTheme = localStorage.getItem("string_art_theme");
      if (savedTheme === "light" || savedTheme === "dark") {
        setTheme(savedTheme);
      } else {
        const prefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
        setTheme(prefersDark ? "dark" : "light");
      }
    } catch {
      // Ignore
    }
  }, []);

  // Update theme class on HTML element & persist
  useEffect(() => {
    const root = document.documentElement;
    if (theme === "dark") {
      root.classList.add("dark");
      document.body.classList.add("dark");
    } else {
      root.classList.remove("dark");
      document.body.classList.remove("dark");
    }
    try {
      localStorage.setItem("string_art_theme", theme);
    } catch {
      // Ignore
    }
  }, [theme]);

  // Handle generation start (supports fast background auto-regeneration)
  const handleStartGeneration = useCallback(
    async ({ isAuto = false } = {}) => {
      if (!upload || upload.isTextSequence) return;

      // Abort previous in-flight request if user dragged a slider again
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
      const controller = new AbortController();
      abortControllerRef.current = controller;

      setIsGenerating(true);
      setIsAutoGenerating(isAuto);
      setGenError(null);

      // Only wipe canvas if it's a manual generation; keep previous artwork visible during auto-regen
      if (!isAuto) {
        setJobResult(null);
      }

      try {
        const payload = {
          upload_id: upload.uploadId,
          image_base64: upload.imageBase64,
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
          zoom: adjustments.zoom,
          pan_x: adjustments.panX,
          pan_y: adjustments.panY,
        };

        const res = await fetch("/api/jobs", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
          credentials: "include",
          signal: controller.signal,
        });

        if (!res.ok) {
          const errJson = await res.json().catch(() => ({}));
          throw new Error(errJson.detail || "Failed to start generation job.");
        }

        const data = await res.json();
        setActiveJobId(data.job_id);

        // If the backend completed generation synchronously (high-speed path)
        if (data.result) {
          const fullResult = {
            ...data.result,
            job_id: data.result.job_id || data.job_id,
            nails_px: data.result.nails_px || data.result.nailsPx,
          };
          setJobResult(fullResult);
          setJobStatus({
            status: "completed",
            progress_step: fullResult.total_lines,
            total_steps: fullResult.total_lines,
          });
          if (fullResult.sequence) {
            setCurrentStepIndex(fullResult.sequence.length - 1);
          }
          setIsGenerating(false);
          setIsAutoGenerating(false);
          return;
        }

        setJobStatus({ status: "queued", progress_step: 0, total_steps: params.steps });
      } catch (err) {
        if (err.name === "AbortError") {
          // Superseded by a newer slider update, ignore quietly
          return;
        }
        setGenError(err.message);
        setIsGenerating(false);
        setIsAutoGenerating(false);
      }
    },
    [upload, params, adjustments]
  );

  // Auto-regeneration trigger when parameters or image adjustments change
  useEffect(() => {
    // Skip if sequence text file is loaded or no image uploaded
    if (!upload || upload.isTextSequence || !autoRegen) return;

    // Clear any pending debounce timer
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }

    // Debounce generation by 380ms for ultra-responsive slider interaction
    debounceTimerRef.current = setTimeout(() => {
      handleStartGeneration({ isAuto: true });
    }, 380);

    return () => {
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }
    };
  }, [
    upload,
    params.nails,
    params.steps,
    params.size,
    params.diameter_mm,
    params.strength,
    params.minGap,
    params.startNail,
    params.allowancePct,
    adjustments.zoom,
    adjustments.rotation,
    adjustments.brightness,
    adjustments.contrast,
    adjustments.panX,
    adjustments.panY,
    autoRegen,
    handleStartGeneration,
  ]);

  // Handle image upload and reset crop adjustments to perfect center
  const handleUploadSuccess = (newUpload) => {
    setAdjustments({
      zoom: 1.35,
      rotation: 0,
      brightness: 1.0,
      contrast: 1.0,
      panX: 0,
      panY: 0,
    });
    setUpload(newUpload);
  };

  // Handle text sequence uploaded and parsed
  const handleSequenceLoaded = (payload) => {
    setUpload({
      uploadId: payload.uploadId,
      filename: payload.filename,
      isTextSequence: true,
    });
    setJobResult(payload.jobResult);
    setActiveJobId(payload.jobResult.job_id);
    setJobStatus({
      status: "completed",
      progress_step: payload.jobResult.total_lines,
      total_steps: payload.jobResult.total_lines,
    });
    if (payload.jobResult.sequence) {
      setCurrentStepIndex(payload.jobResult.sequence.length - 1);
    }
    setIsGenerating(false);
    setIsAutoGenerating(false);
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
          setIsAutoGenerating(false);
          clearInterval(interval);
          // Fetch final result
          const resResult = await fetch(`/api/jobs/${activeJobId}/result`, { credentials: "include" });
          if (resResult.ok) {
            const resultData = await resResult.json();
            const fullResult = {
              ...resultData,
              job_id: resultData.job_id || activeJobId,
              nails_px: resultData.nails_px || resultData.nailsPx,
            };
            setJobResult(fullResult);
            if (fullResult.sequence) {
              setCurrentStepIndex(fullResult.sequence.length - 1);
            }
          }
        } else if (data.status === "cancelled") {
          setIsGenerating(false);
          setIsAutoGenerating(false);
          clearInterval(interval);
        } else if (data.status === "failed") {
          setIsGenerating(false);
          setIsAutoGenerating(false);
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
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    if (!activeJobId) {
      setIsGenerating(false);
      setIsAutoGenerating(false);
      return;
    }
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
      setIsGenerating(false);
      setIsAutoGenerating(false);
    }
  };

  // Clear all states, caches, local storage, and server store to upload a new image
  const handleClearAll = useCallback(async () => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }

    // 1. Revoke object URL
    if (upload?.localPreviewUrl) {
      try {
        URL.revokeObjectURL(upload.localPreviewUrl);
      } catch (e) { }
    }

    // 2. Clear localStorage keys related to string art steps
    try {
      if (typeof window !== "undefined" && window.localStorage) {
        const keysToRemove = [];
        for (let i = 0; i < localStorage.length; i++) {
          const key = localStorage.key(i);
          if (key && (key.startsWith("string_art_") || key.includes("string_art"))) {
            keysToRemove.push(key);
          }
        }
        keysToRemove.forEach((k) => localStorage.removeItem(k));
      }
    } catch (e) { }

    // 3. Notify backend to clear cache
    try {
      await fetch("/api/clear", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          job_id: activeJobId || jobResult?.job_id,
          upload_id: upload?.uploadId,
          all: true,
        }),
      }).catch(() => { });
    } catch (e) { }

    // 4. Reset all React state
    setUpload(null);
    setJobResult(null);
    setActiveJobId(null);
    setJobStatus(null);
    setIsGenerating(false);
    setIsAutoGenerating(false);
    setIsCancelling(false);
    setGenError(null);
    setCurrentStepIndex(1);
    setViewMode("string_art");
    setAdjustments({
      zoom: 1.35,
      rotation: 0,
      brightness: 1.0,
      contrast: 1.0,
      panX: 0,
      panY: 0,
    });
  }, [upload, activeJobId, jobResult]);

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
        onOpenMenu={() => setIsMobileMenuOpen(true)}
        onOpenTextMode={() => {
          setEntryMode("sequence");
          if (!upload?.isTextSequence) {
            setUpload(null);
            setJobResult(null);
          }
          const el = document.getElementById("studio-workspace");
          if (el) el.scrollIntoView({ behavior: "smooth" });
        }}
      />

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 py-6 sm:py-8 pb-28 lg:pb-12 space-y-12">
        {/* Welcome Hero on initial view */}
        {!upload && <WelcomeHero onSelectMode={setEntryMode} t={t} />}

        <div id="studio-workspace" className="scroll-mt-20 space-y-8">
          {/* Workflow Progress Stepper (Optimized 4-Col Grid for Mobile) */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-neutral-200 dark:border-neutral-800 pb-3 sm:pb-4 gap-3 sm:gap-4">
            {upload?.isTextSequence ? (
              <div className="flex items-center gap-2 sm:gap-3 text-xs sm:text-sm font-semibold">
                <span className="flex items-center gap-1.5 px-3 py-1 rounded-xl bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800">
                  <FileText className="w-4 h-4" />
                  <span>{t.importedBadge}</span>
                </span>
                <span className="font-mono text-neutral-800 dark:text-neutral-200 font-bold truncate max-w-[150px] sm:max-w-none">
                  {upload.filename}
                </span>
                <span className="text-neutral-300 dark:text-neutral-700">•</span>
                <span className="text-indigo-600 dark:text-indigo-400 font-mono font-bold">
                  {jobResult?.total_lines || 0} {t.detectedSteps}
                </span>
              </div>
            ) : (
              <div className="grid grid-cols-4 sm:flex sm:items-center gap-1 sm:gap-3 w-full sm:w-auto p-1 sm:p-0 rounded-2xl bg-neutral-100/70 sm:bg-transparent dark:bg-neutral-800/40 sm:dark:bg-transparent border border-neutral-200/50 sm:border-0 dark:border-neutral-700/50">
                {/* Step 1 */}
                <div
                  className={`flex flex-col sm:flex-row items-center justify-center gap-1 sm:gap-1.5 py-1 px-1 rounded-xl transition ${
                    upload
                      ? "text-emerald-600 dark:text-emerald-400 font-bold bg-white/80 sm:bg-transparent dark:bg-neutral-800/80 sm:dark:bg-transparent shadow-xs sm:shadow-none"
                      : "text-indigo-600 dark:text-indigo-400 font-bold"
                  }`}
                >
                  <span className="w-5 h-5 rounded-full bg-current/15 flex items-center justify-center text-[10px] sm:text-xs font-bold shrink-0">
                    {upload ? "✓" : "1"}
                  </span>
                  <span className="text-[10px] sm:text-xs md:text-sm truncate">
                    <span className="sm:hidden">{t.dir === "rtl" ? "رفع" : "Upload"}</span>
                    <span className="hidden sm:inline">{t.step1_upload}</span>
                  </span>
                </div>

                <span className="hidden sm:inline text-neutral-300 dark:text-neutral-700">➔</span>

                {/* Step 2 */}
                <div
                  className={`flex flex-col sm:flex-row items-center justify-center gap-1 sm:gap-1.5 py-1 px-1 rounded-xl transition ${
                    upload
                      ? "text-indigo-600 dark:text-indigo-400 font-bold bg-white/80 sm:bg-transparent dark:bg-neutral-800/80 sm:dark:bg-transparent shadow-xs sm:shadow-none"
                      : "text-neutral-400 dark:text-neutral-600"
                  }`}
                >
                  <span className="w-5 h-5 rounded-full bg-current/15 flex items-center justify-center text-[10px] sm:text-xs font-bold shrink-0">
                    {upload && jobResult ? "✓" : "2"}
                  </span>
                  <span className="text-[10px] sm:text-xs md:text-sm truncate">
                    <span className="sm:hidden">{t.dir === "rtl" ? "الضبط" : "Adjust"}</span>
                    <span className="hidden sm:inline">{t.step2_adjust}</span>
                  </span>
                </div>

                <span className="hidden sm:inline text-neutral-300 dark:text-neutral-700">➔</span>

                {/* Step 3 */}
                <div
                  className={`flex flex-col sm:flex-row items-center justify-center gap-1 sm:gap-1.5 py-1 px-1 rounded-xl transition ${
                    jobResult
                      ? "text-emerald-600 dark:text-emerald-400 font-bold bg-white/80 sm:bg-transparent dark:bg-neutral-800/80 sm:dark:bg-transparent shadow-xs sm:shadow-none"
                      : upload
                      ? "text-indigo-600 dark:text-indigo-400 font-bold"
                      : "text-neutral-400 dark:text-neutral-600"
                  }`}
                >
                  <span className="w-5 h-5 rounded-full bg-current/15 flex items-center justify-center text-[10px] sm:text-xs font-bold shrink-0">
                    {jobResult ? "✓" : "3"}
                  </span>
                  <span className="text-[10px] sm:text-xs md:text-sm truncate">
                    <span className="sm:hidden">{t.dir === "rtl" ? "خيارات" : "Params"}</span>
                    <span className="hidden sm:inline">{t.step3_parameters}</span>
                  </span>
                </div>

                <span className="hidden sm:inline text-neutral-300 dark:text-neutral-700">➔</span>

                {/* Step 4 */}
                <div
                  className={`flex flex-col sm:flex-row items-center justify-center gap-1 sm:gap-1.5 py-1 px-1 rounded-xl transition ${
                    jobResult
                      ? "text-rose-600 dark:text-rose-400 font-bold bg-white/80 sm:bg-transparent dark:bg-neutral-800/80 sm:dark:bg-transparent shadow-xs sm:shadow-none"
                      : "text-neutral-400 dark:text-neutral-600"
                  }`}
                >
                  <span className="w-5 h-5 rounded-full bg-current/15 flex items-center justify-center text-[10px] sm:text-xs font-bold shrink-0">
                    4
                  </span>
                  <span className="text-[10px] sm:text-xs md:text-sm truncate">
                    <span className="sm:hidden">{t.dir === "rtl" ? "تصدير" : "Export"}</span>
                    <span className="hidden sm:inline">{t.step4_generate}</span>
                  </span>
                </div>
              </div>
            )}

            {upload && (
              <button
                onClick={handleClearAll}
                title={t.clearCacheTooltip}
                className="self-end sm:self-auto inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold text-rose-600 hover:text-rose-700 bg-rose-50 hover:bg-rose-100 dark:bg-rose-950/40 dark:text-rose-300 dark:hover:bg-rose-900/50 border border-rose-200 dark:border-rose-900 shadow-xs transition shrink-0 cursor-pointer"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span className="text-[11px] sm:text-xs">{t.startNewArtwork}</span>
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

          {/* Initial Choice: Generate from Photo OR Preview from Text File */}
          {!upload && (
            <div className="max-w-2xl mx-auto py-8 space-y-6">
              {/* Top Switcher Tabs */}
              <div className="flex items-center justify-center p-1.5 rounded-2xl bg-neutral-200/60 dark:bg-neutral-900/80 max-w-md mx-auto border border-neutral-200 dark:border-neutral-800 shadow-inner">
                <button
                  type="button"
                  onClick={() => setEntryMode("image")}
                  className={`flex-1 flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl text-xs sm:text-sm font-bold transition ${entryMode === "image"
                      ? "bg-white dark:bg-neutral-800 text-indigo-600 dark:text-indigo-400 shadow-sm"
                      : "text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-neutral-200"
                    }`}
                >
                  <UploadCloud className="w-4 h-4" />
                  <span>{t.tabUploadImage}</span>
                </button>
                <button
                  type="button"
                  onClick={() => setEntryMode("sequence")}
                  className={`flex-1 flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl text-xs sm:text-sm font-bold transition ${entryMode === "sequence"
                      ? "bg-white dark:bg-neutral-800 text-indigo-600 dark:text-indigo-400 shadow-sm"
                      : "text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-neutral-200"
                    }`}
                >
                  <FileText className="w-4 h-4" />
                  <span>{t.tabUploadText}</span>
                </button>
              </div>

              {/* Mode 1: Image Upload */}
              {entryMode === "image" && (
                <>
                  <UploadZone onUploadSuccess={handleUploadSuccess} t={t} />

                  {/* Algorithm explainer callout */}
                  <div className="mt-8 p-5 rounded-2xl bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 text-xs text-neutral-600 dark:text-neutral-400 space-y-2">
                    <h4 className="font-bold text-neutral-800 dark:text-neutral-200 flex items-center gap-2">
                      <Info className="w-4 h-4 text-indigo-500" />
                      {t.algoNoteTitle}
                    </h4>
                    <p className="leading-relaxed">{t.algoNoteText}</p>
                  </div>
                </>
              )}

              {/* Mode 2: Text File Sequence Upload & Preview */}
              {entryMode === "sequence" && (
                <SequenceUploader onSequenceLoaded={handleSequenceLoaded} t={t} />
              )}
            </div>
          )}

          {/* Studio Workspace when image or text sequence is loaded */}
          {upload && (
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
              {/* Left Sidebar: Adjustments and Parameters (or Sequence Info for text upload) */}
              <div className="lg:col-span-5 space-y-6">
                {upload.isTextSequence ? (
                  <SequenceInfoPanel
                    jobResult={jobResult}
                    onUpdateJobResult={setJobResult}
                    onClearAll={handleClearAll}
                    t={t}
                  />
                ) : (
                  <>
                    <ImageEditor
                      upload={upload}
                      adjustments={adjustments}
                      setAdjustments={setAdjustments}
                      t={t}
                    />

                    {/* مستكشف المعاملات التلقائي (Auto-Tune Runner) - تم إخفاؤه وتعطيله مؤقتاً
                    <AutoTestRunner
                      params={params}
                      setParams={setParams}
                      adjustments={adjustments}
                      setAdjustments={setAdjustments}
                      jobResult={jobResult}
                      isGenerating={isGenerating}
                      t={t}
                    />
                    */}

                    <ParametersPanel
                      params={params}
                      setParams={setParams}
                      onStartGeneration={() => handleStartGeneration({ isAuto: false })}
                      isGenerating={isGenerating}
                      autoRegen={autoRegen}
                      setAutoRegen={setAutoRegen}
                      isAutoGenerating={isAutoGenerating}
                      t={t}
                    />
                  </>
                )}
              </div>

              {/* Right Main Area: Canvas, Construction Player & Exports */}
              <div className="lg:col-span-7 space-y-6">
                {/* High-speed Non-blocking Auto-Regeneration Status Bar */}
                {isAutoGenerating && (
                  <div className="flex items-center justify-between px-4 py-2.5 rounded-2xl bg-indigo-50/95 dark:bg-indigo-950/70 border border-indigo-200/90 dark:border-indigo-800 backdrop-blur-md shadow-md animate-fade-in text-xs font-semibold text-indigo-700 dark:text-indigo-300">
                    <div className="flex items-center gap-2.5">
                      <span className="relative flex h-2.5 w-2.5">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-indigo-400 opacity-75"></span>
                        <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-indigo-600 dark:bg-indigo-400"></span>
                      </span>
                      <span>{t.autoGeneratingStatus}</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="font-mono text-[11px] text-neutral-500 dark:text-neutral-400 hidden sm:inline">
                        ⚡ {params.nails} nails • {params.steps} steps
                      </span>
                      <div className="w-24 sm:w-32 h-1.5 bg-indigo-200 dark:bg-indigo-900 rounded-full overflow-hidden">
                        <div className="h-full bg-gradient-to-r from-indigo-500 via-rose-500 to-indigo-600 rounded-full w-full animate-pulse" />
                      </div>
                    </div>
                  </div>
                )}

                {jobResult ? (
                  <>
                    <StudioCanvas
                      jobResult={jobResult}
                      uploadId={upload.uploadId}
                      currentStepIndex={currentStepIndex}
                      showNails={showNails}
                      setShowNails={setShowNails}
                      viewMode={viewMode}
                      setViewMode={setViewMode}
                      t={t}
                    />

                    {/* مشغل خطوات البناء والتنفيذ (Construction Player) - مخفي ومعلق برمجياً
                    <ConstructionPlayer
                      jobId={jobResult.job_id}
                      sequence={jobResult.sequence}
                      currentStep={currentStepIndex}
                      setCurrentStep={setCurrentStepIndex}
                      t={t}
                    />
                    */}

                    <ExportsSection jobResult={jobResult} onClearAll={handleClearAll} t={t} />
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
        </div>

        {/* حلول وخدمات استوديو الخيوط + خطوات التنفيذ البسيطة - تم إخفاؤها وتعليقها برمجياً
        <ServicesSection t={t} />
        */}
      </main>

      {/* Modern Footer with Copyright Iraq Baghdad 2026 */}
      <Footer t={t} />

      {/* Real-time Progress Modal (only shown for manual generation, hidden during auto-regen) */}
      <ProgressModal
        jobStatus={jobStatus}
        onCancel={handleCancelJob}
        isCancelling={isCancelling}
        isAuto={isAutoGenerating}
        t={t}
      />

      {/* Mobile Bottom Navigation with Menu App Bar Style */}
      <MobileBottomNav
        lang={lang}
        setLang={setLang}
        theme={theme}
        setTheme={setTheme}
        t={t}
        upload={upload}
        jobResult={jobResult}
        isGenerating={isGenerating}
        onStartGeneration={() => handleStartGeneration({ isAuto: false })}
        onOpenTextMode={() => {
          setEntryMode("sequence");
          if (!upload?.isTextSequence) {
            setUpload(null);
            setJobResult(null);
          }
          const el = document.getElementById("studio-workspace");
          if (el) el.scrollIntoView({ behavior: "smooth" });
        }}
        onClearAll={handleClearAll}
        isMenuOpen={isMobileMenuOpen}
        setIsMenuOpen={setIsMobileMenuOpen}
      />
    </div>
  );
}
