"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import Header from "../../components/Header";
import Footer from "../../components/Footer";
import MobileBottomNav from "../../components/MobileBottomNav";
import SequenceUploader from "../../components/SequenceUploader";
import StudioCanvas from "../../components/StudioCanvas";
import ConstructionPlayer from "../../components/ConstructionPlayer";
import SequenceInfoPanel from "../../components/SequenceInfoPanel";
import { translations } from "../../lib/i18n";
import {
  computeSequenceResult,
  generateSampleSequence,
} from "../../lib/sequenceParser";
import {
  FileText,
  Sparkles,
  ArrowRight,
  ArrowLeft,
  RotateCcw,
  Download,
  Sliders,
  CheckCircle2,
  ExternalLink,
  Layers,
} from "lucide-react";

export default function TextPreviewServicePage() {
  const [lang, setLang] = useState("ar");
  const [theme, setTheme] = useState("dark");
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const t = translations[lang] || translations.en;

  // Loaded Sequence & Artwork State
  const [jobResult, setJobResult] = useState(null);
  const [uploadInfo, setUploadInfo] = useState(null);
  const [currentStepIndex, setCurrentStepIndex] = useState(1);
  const [showNails, setShowNails] = useState(true);
  const [viewMode, setViewMode] = useState("string_art");

  // Sync theme
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

  // Handle sequence loaded from SequenceUploader
  const handleSequenceLoaded = (payload) => {
    setUploadInfo({
      uploadId: payload.uploadId,
      filename: payload.filename,
    });
    setJobResult(payload.jobResult);
    if (payload.jobResult?.sequence) {
      setCurrentStepIndex(payload.jobResult.sequence.length - 1);
    }
  };

  // Load a quick sample sequence for demonstration
  const handleLoadSample = (sampleType) => {
    let seq;
    let filename;
    if (sampleType === "mandala") {
      seq = generateSampleSequence(200, 3, 1400);
      filename = "sample_mandala_1400steps.txt";
    } else {
      seq = generateSampleSequence(240, 2, 2200);
      filename = "sample_geometric_2200steps.txt";
    }

    const computed = computeSequenceResult({
      sequence: seq,
      filename,
      nailsCount: sampleType === "mandala" ? 200 : 240,
      diameterMm: 400,
      allowancePct: 15,
      size: 300,
    });

    setUploadInfo({
      uploadId: computed.job_id,
      filename,
    });
    setJobResult(computed);
    setCurrentStepIndex(computed.sequence.length - 1);
  };

  // Clear current sequence
  const handleReset = () => {
    setJobResult(null);
    setUploadInfo(null);
    setCurrentStepIndex(1);
  };

  const BackArrow = t.dir === "rtl" ? ArrowRight : ArrowLeft;

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
      />

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 py-8 pb-28 lg:pb-12 space-y-8">
        {/* Breadcrumb & Navigation Header */}
        <div className="flex items-center justify-between border-b border-neutral-200 dark:border-neutral-800 pb-4 flex-wrap gap-4">
          <div className="flex items-center gap-3 text-xs sm:text-sm">
            <Link
              href="/"
              className="inline-flex items-center gap-1.5 text-neutral-500 hover:text-indigo-600 dark:hover:text-indigo-400 font-semibold transition"
            >
              <BackArrow className="w-4 h-4" />
              <span>{t.navHome}</span>
            </Link>
            <span className="text-neutral-300 dark:text-neutral-700">/</span>
            <span className="flex items-center gap-1.5 px-3 py-1 rounded-xl bg-indigo-50 dark:bg-indigo-950/50 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800 font-bold">
              <FileText className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400" />
              <span>{t.navTextPreview}</span>
            </span>
          </div>

          <div className="flex items-center gap-2">
            {jobResult && (
              <button
                type="button"
                onClick={handleReset}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold text-rose-600 hover:text-rose-700 bg-rose-50 hover:bg-rose-100 dark:bg-rose-950/40 dark:text-rose-300 dark:hover:bg-rose-900/50 border border-rose-200 dark:border-rose-900 transition"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>{t.dir === "rtl" ? "ملف جديد" : "New File"}</span>
              </button>
            )}

            <Link
              href="/"
              className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 text-white text-xs font-bold shadow-xs hover:opacity-95 transition"
            >
              <span>{t.backToStudio}</span>
              <ExternalLink className="w-3.5 h-3.5" />
            </Link>
          </div>
        </div>

        {/* Hero Banner for Text Preview Service */}
        <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-indigo-950 via-neutral-900 to-neutral-950 border border-indigo-900/40 p-6 sm:p-8 shadow-xl text-white">
          <div className="relative z-10 max-w-3xl space-y-3">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 text-xs font-bold">
              <Sparkles className="w-3.5 h-3.5 text-indigo-400" />
              <span>{t.dir === "rtl" ? "خدمة استيراد ومعاينة ملفات الأرقام" : "Nail Sequence Preview Service"}</span>
            </div>
            <h1 className="text-xl sm:text-3xl font-extrabold tracking-tight">
              {t.textServiceTitle}
            </h1>
            <p className="text-xs sm:text-sm text-neutral-300 leading-relaxed max-w-2xl">
              {t.textServiceSubtitle}
            </p>

            {/* Quick Sample Sequence Trigger Buttons */}
            {!jobResult && (
              <div className="pt-2 flex flex-wrap items-center gap-2.5">
                <span className="text-xs font-bold text-neutral-400">
                  {t.dir === "rtl" ? "أو جرب نموذج جاهز بنقرة واحدة:" : "Or test with a sample file:"}
                </span>
                <button
                  type="button"
                  onClick={() => handleLoadSample("mandala")}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white/10 hover:bg-white/20 text-white text-xs font-bold border border-white/20 backdrop-blur-sm transition cursor-pointer"
                >
                  <Layers className="w-3.5 h-3.5 text-indigo-400" />
                  <span>{t.dir === "rtl" ? "نموذج ماندالا (1400 خط)" : "Mandala Sample (1400 lines)"}</span>
                </button>
                <button
                  type="button"
                  onClick={() => handleLoadSample("geometric")}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white/10 hover:bg-white/20 text-white text-xs font-bold border border-white/20 backdrop-blur-sm transition cursor-pointer"
                >
                  <Sparkles className="w-3.5 h-3.5 text-rose-400" />
                  <span>{t.dir === "rtl" ? "نموذج متقاطع دقيق (2200 خط)" : "Geometric HD (2200 lines)"}</span>
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Main Service Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* Left Column: Upload Box or Sequence Parameters Editor */}
          <div className="lg:col-span-5 space-y-6">
            {jobResult ? (
              <SequenceInfoPanel
                jobResult={jobResult}
                onUpdateJobResult={setJobResult}
                onClearAll={handleReset}
                t={t}
              />
            ) : (
              <SequenceUploader onSequenceLoaded={handleSequenceLoaded} t={t} />
            )}
          </div>

          {/* Right Column: Canvas Preview & Step-by-Step Construction Player */}
          <div className="lg:col-span-7 space-y-6">
            {jobResult ? (
              <>
                <StudioCanvas
                  jobResult={jobResult}
                  uploadId={uploadInfo?.uploadId}
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
              </>
            ) : (
              <div className="h-[520px] rounded-3xl border-2 border-dashed border-neutral-200 dark:border-neutral-800 flex flex-col items-center justify-center p-8 text-center bg-white/40 dark:bg-neutral-900/40">
                <div className="w-16 h-16 rounded-2xl bg-indigo-50 dark:bg-indigo-950/40 flex items-center justify-center text-indigo-600 dark:text-indigo-400 mb-4 shadow-inner">
                  <FileText className="w-8 h-8" />
                </div>
                <h3 className="font-bold text-base text-neutral-800 dark:text-neutral-200 mb-1">
                  {t.dir === "rtl" ? "في انتظار رفع أو لصق ملف التسلسل" : "Awaiting Nail Sequence File"}
                </h3>
                <p className="text-xs text-neutral-500 max-w-sm mb-4 leading-relaxed">
                  {t.dir === "rtl"
                    ? "ارفع ملف أرقام المسامير (.txt أو .csv أو .json) أو الصق الأرقام مباشرة من الجهة المقابلة لرؤية لوحة الخيوط مرسومة بدقة متناهية."
                    : "Upload a nail sequence text file or paste numbers on the left to render the continuous thread simulation with physical distance measurements."}
                </p>
                <div className="flex flex-wrap items-center justify-center gap-2">
                  <button
                    type="button"
                    onClick={() => handleLoadSample("mandala")}
                    className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold shadow-md shadow-indigo-600/20 transition cursor-pointer"
                  >
                    {t.dir === "rtl" ? "عرض عينة تجريبية فورية" : "Load Instant Demo Sample"}
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </main>

      <Footer t={t} />

      {/* Mobile Bottom Navigation with Menu App Bar Style */}
      <MobileBottomNav
        lang={lang}
        setLang={setLang}
        theme={theme}
        setTheme={setTheme}
        t={t}
        upload={uploadInfo ? { ...uploadInfo, isTextSequence: true } : null}
        jobResult={jobResult}
        isGenerating={false}
        onClearAll={handleReset}
        isMenuOpen={isMobileMenuOpen}
        setIsMenuOpen={setIsMobileMenuOpen}
      />
    </div>
  );
}
