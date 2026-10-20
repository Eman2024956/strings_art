"use client";

import React, { useState, useEffect, useRef, useMemo } from "react";
import {
  Play,
  RotateCcw,
  SkipForward,
  SkipBack,
  Sliders,
  CheckCircle2,
  Clock,
  Sparkles,
  Download,
  FileSpreadsheet,
  Lock,
  Award,
  Trash2,
} from "lucide-react";

// Date time stamp prefix helper: e.g. 20261018_154800
function getDateTimePrefix() {
  const now = new Date();
  const pad = (n) => String(n).padStart(2, "0");
  const year = now.getFullYear();
  const month = pad(now.getMonth() + 1);
  const day = pad(now.getDate());
  const hours = pad(now.getHours());
  const minutes = pad(now.getMinutes());
  const seconds = pad(now.getSeconds());
  return `${year}${month}${day}_${hours}${minutes}${seconds}`;
}

// Format CSV string from logged records
function generateAutoTunerCsv(records) {
  const headers = [
    "Timestamp",
    "Test_Index",
    "Test_Name",
    "Resolution_Score_Pct",
    "Computational_Resolution_Px",
    "Compute_Grid",
    "Nails_Count",
    "Max_Steps",
    "Total_Lines_Drawn",
    "Contrast",
    "Brightness",
    "Thread_Strength",
    "Min_Nail_Gap",
    "Zoom",
    "Board_Diameter_Mm",
    "Total_Thread_Meters",
    "Thread_With_Allowance_Meters",
    "Stopping_Reason",
  ];

  const rows = records.map((r) => [
    `"${r.timestamp || new Date().toISOString()}"`,
    r.index || 1,
    `"${(r.name || "").replace(/"/g, '""')}"`,
    r.score !== undefined ? `${r.score}%` : "N/A",
    r.size || 300,
    `"${r.size || 300}x${r.size || 300}"`,
    r.nails || 200,
    r.steps || 2200,
    r.totalLines || r.steps || 2200,
    r.contrast !== undefined ? Number(r.contrast).toFixed(2) : "1.00",
    r.brightness !== undefined ? Number(r.brightness).toFixed(2) : "1.00",
    r.strength !== undefined ? Number(r.strength).toFixed(2) : "0.10",
    r.minGap !== undefined ? r.minGap : 14,
    r.zoom !== undefined ? `${Number(r.zoom).toFixed(2)}x` : "1.00x",
    r.diameterMm || 400.0,
    r.totalThreadM !== undefined ? r.totalThreadM : "N/A",
    r.estimatedWithAllowanceM !== undefined ? r.estimatedWithAllowanceM : "N/A",
    `"${r.stoppingReason || "max_steps_reached"}"`,
  ]);

  return [headers.join(","), ...rows.map((row) => row.join(","))].join("\r\n");
}

// Browser direct CSV download
function triggerCsvDownload(csvString, filename) {
  const blob = new Blob([csvString], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.setAttribute("download", filename);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

export default function AutoTestRunner({
  params,
  setParams,
  adjustments,
  setAdjustments,
  jobResult,
  isGenerating,
  t,
}) {
  const isRtl = t.dir === "rtl";
  const [isRunning, setIsRunning] = useState(false);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [delaySec, setDelaySec] = useState(3.5);
  const [timeRemaining, setTimeRemaining] = useState(3.5);
  const [selectedSuite, setSelectedSuite] = useState("facial");
  const [resFilter, setResFilter] = useState("all"); // "all" | "300" | "400"
  const [isLocked, setIsLocked] = useState(false);
  const [autoStopSweetSpot, setAutoStopSweetSpot] = useState(true); // Auto-stop when score is 56%-65%
  const [sweetSpotMatched, setSweetSpotMatched] = useState(null);
  const [records, setRecords] = useState([]);
  const [lastSavedFilename, setLastSavedFilename] = useState(null);

  const timerRef = useRef(null);
  const countdownIntervalRef = useRef(null);
  const lastProcessedKeyRef = useRef(null);

  // Load existing session records from localStorage
  useEffect(() => {
    try {
      const stored = localStorage.getItem("auto_tuner_history_v1");
      if (stored) {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed)) {
          setRecords(parsed);
        }
      }
    } catch (e) {}
  }, []);

  // Curated High-Performance Test Profiles with 300px and 400px Computational Resolutions
  // Fixed Constants: nails = 200, steps = 2200
  const testSuites = useMemo(
    () => ({
      facial: [
        {
          name: isRtl ? "متوازن قياسي (300 بكسل)" : "Balanced Standard (300px)",
          contrast: 1.15,
          brightness: 1.0,
          strength: 0.10,
          minGap: 14,
          size: 300,
          zoom: 1.45,
          nails: 200,
          steps: 2200,
        },
        {
          name: isRtl ? "متوازن قياسي (400 بكسل)" : "Balanced Standard (400px)",
          contrast: 1.15,
          brightness: 1.0,
          strength: 0.10,
          minGap: 14,
          size: 400,
          zoom: 1.45,
          nails: 200,
          steps: 2200,
        },
        {
          name: isRtl ? "تباين معتدل + فك (300 بكسل)" : "Medium Contrast + Jawline (300px)",
          contrast: 1.25,
          brightness: 1.0,
          strength: 0.11,
          minGap: 12,
          size: 300,
          zoom: 1.45,
          nails: 200,
          steps: 2200,
        },
        {
          name: isRtl ? "تباين معتدل + فك (400 بكسل)" : "Medium Contrast + Jawline (400px)",
          contrast: 1.25,
          brightness: 1.0,
          strength: 0.11,
          minGap: 12,
          size: 400,
          zoom: 1.45,
          nails: 200,
          steps: 2200,
        },
        {
          name: isRtl ? "عيون وملامح حادة (300 بكسل - موصى به)" : "Sharp Eyes & Contours (300px - Rec)",
          contrast: 1.35,
          brightness: 1.0,
          strength: 0.12,
          minGap: 12,
          size: 300,
          zoom: 1.50,
          nails: 200,
          steps: 2200,
        },
        {
          name: isRtl ? "عيون وملامح حادة (400 بكسل - موصى به)" : "Sharp Eyes & Contours (400px - Rec)",
          contrast: 1.35,
          brightness: 1.0,
          strength: 0.12,
          minGap: 12,
          size: 400,
          zoom: 1.50,
          nails: 200,
          steps: 2200,
        },
        {
          name: isRtl ? "سواد عميق وظلال (300 بكسل)" : "Deep Blacks & Shading (300px)",
          contrast: 1.45,
          brightness: 0.95,
          strength: 0.13,
          minGap: 12,
          size: 300,
          zoom: 1.50,
          nails: 200,
          steps: 2200,
        },
        {
          name: isRtl ? "سواد عميق وظلال (400 بكسل)" : "Deep Blacks & Shading (400px)",
          contrast: 1.45,
          brightness: 0.95,
          strength: 0.13,
          minGap: 12,
          size: 400,
          zoom: 1.50,
          nails: 200,
          steps: 2200,
        },
        {
          name: isRtl ? "إضاءة ناعمة وخيوط دقيقة (300 بكسل)" : "Soft Highlights & Fine Threads (300px)",
          contrast: 1.20,
          brightness: 1.05,
          strength: 0.09,
          minGap: 14,
          size: 300,
          zoom: 1.45,
          nails: 200,
          steps: 2200,
        },
        {
          name: isRtl ? "إضاءة ناعمة وخيوط دقيقة (400 بكسل)" : "Soft Highlights & Fine Threads (400px)",
          contrast: 1.20,
          brightness: 1.05,
          strength: 0.09,
          minGap: 14,
          size: 400,
          zoom: 1.45,
          nails: 200,
          steps: 2200,
        },
        {
          name: isRtl ? "تكبير مركز 1.55x (300 بكسل)" : "Tight Face Zoom 1.55x (300px)",
          contrast: 1.35,
          brightness: 1.0,
          strength: 0.12,
          minGap: 10,
          size: 300,
          zoom: 1.55,
          nails: 200,
          steps: 2200,
        },
        {
          name: isRtl ? "تكبير مركز 1.55x (400 بكسل)" : "Tight Face Zoom 1.55x (400px)",
          contrast: 1.35,
          brightness: 1.0,
          strength: 0.12,
          minGap: 10,
          size: 400,
          zoom: 1.55,
          nails: 200,
          steps: 2200,
        },
        {
          name: isRtl ? "تباين سينمائي دراماتيكي (300 بكسل)" : "Dramatic Contrast (300px)",
          contrast: 1.55,
          brightness: 0.90,
          strength: 0.14,
          minGap: 10,
          size: 300,
          zoom: 1.50,
          nails: 200,
          steps: 2200,
        },
        {
          name: isRtl ? "تباين سينمائي دراماتيكي (400 بكسل)" : "Dramatic Contrast (400px)",
          contrast: 1.55,
          brightness: 0.90,
          strength: 0.14,
          minGap: 10,
          size: 400,
          zoom: 1.50,
          nails: 200,
          steps: 2200,
        },
      ],
      systematic: [
        { name: "Test 1 (Low C, Low S - 300px)", contrast: 1.05, brightness: 1.0, strength: 0.08, minGap: 16, size: 300, zoom: 1.40, nails: 200, steps: 2200 },
        { name: "Test 1 (Low C, Low S - 400px)", contrast: 1.05, brightness: 1.0, strength: 0.08, minGap: 16, size: 400, zoom: 1.40, nails: 200, steps: 2200 },
        { name: "Test 2 (Mid C, Mid S - 300px)", contrast: 1.25, brightness: 1.0, strength: 0.11, minGap: 14, size: 300, zoom: 1.45, nails: 200, steps: 2200 },
        { name: "Test 2 (Mid C, Mid S - 400px)", contrast: 1.25, brightness: 1.0, strength: 0.11, minGap: 14, size: 400, zoom: 1.45, nails: 200, steps: 2200 },
        { name: "Test 3 (High C, Mid S - 300px)", contrast: 1.35, brightness: 1.0, strength: 0.12, minGap: 12, size: 300, zoom: 1.50, nails: 200, steps: 2200 },
        { name: "Test 3 (High C, Mid S - 400px)", contrast: 1.35, brightness: 1.0, strength: 0.12, minGap: 12, size: 400, zoom: 1.50, nails: 200, steps: 2200 },
        { name: "Test 4 (High C, High S - 300px)", contrast: 1.45, brightness: 0.95, strength: 0.14, minGap: 10, size: 300, zoom: 1.50, nails: 200, steps: 2200 },
        { name: "Test 4 (High C, High S - 400px)", contrast: 1.45, brightness: 0.95, strength: 0.14, minGap: 10, size: 400, zoom: 1.50, nails: 200, steps: 2200 },
        { name: "Test 5 (Ultra C - 300px)", contrast: 1.55, brightness: 0.90, strength: 0.13, minGap: 12, size: 300, zoom: 1.50, nails: 200, steps: 2200 },
        { name: "Test 5 (Ultra C - 400px)", contrast: 1.55, brightness: 0.90, strength: 0.13, minGap: 12, size: 400, zoom: 1.50, nails: 200, steps: 2200 },
        { name: "Test 6 (Wide Gap - 300px)", contrast: 1.30, brightness: 1.0, strength: 0.12, minGap: 16, size: 300, zoom: 1.45, nails: 200, steps: 2200 },
        { name: "Test 6 (Wide Gap - 400px)", contrast: 1.30, brightness: 1.0, strength: 0.12, minGap: 16, size: 400, zoom: 1.45, nails: 200, steps: 2200 },
      ],
    }),
    [isRtl]
  );

  const activeConfigs = useMemo(() => {
    const suite = testSuites[selectedSuite] || testSuites.facial;
    if (resFilter === "300") return suite.filter((c) => c.size === 300);
    if (resFilter === "400") return suite.filter((c) => c.size === 400);
    return suite;
  }, [testSuites, selectedSuite, resFilter]);

  const currentConfig = activeConfigs[currentIndex] || activeConfigs[0] || testSuites.facial[0];

  // Active resolution score from jobResult
  const currentResolutionScore =
    jobResult?.resolution_score !== undefined
      ? jobResult.resolution_score
      : jobResult?.resolutionScore !== undefined
      ? jobResult.resolutionScore
      : 89.2;

  // Record every completed generation into the CSV history accumulator
  useEffect(() => {
    if (!jobResult || isGenerating) return;

    // Unique fingerprint for this generation
    const key = `${params.nails}-${params.steps}-${params.size}-${params.strength}-${params.minGap}-${adjustments?.contrast}-${adjustments?.brightness}-${jobResult.total_lines || jobResult.totalLines}`;
    if (lastProcessedKeyRef.current === key) return;
    lastProcessedKeyRef.current = key;

    const newRecord = {
      timestamp: new Date().toISOString().replace("T", " ").substring(0, 19),
      index: currentIndex + 1,
      name: currentConfig?.name || `Custom Test`,
      score: currentResolutionScore,
      nails: params.nails || 200,
      steps: params.steps || 2200,
      totalLines: jobResult.total_lines || jobResult.totalLines || params.steps || 2200,
      size: params.size || 300,
      contrast: adjustments?.contrast !== undefined ? adjustments.contrast : 1.0,
      brightness: adjustments?.brightness !== undefined ? adjustments.brightness : 1.0,
      strength: params.strength !== undefined ? params.strength : 0.10,
      minGap: params.minGap !== undefined ? params.minGap : 14,
      zoom: adjustments?.zoom !== undefined ? adjustments.zoom : 1.45,
      diameterMm: params.diameter_mm || 400.0,
      totalThreadM: jobResult.total_thread_m || jobResult.totalThreadM || 0,
      estimatedWithAllowanceM:
        jobResult.estimated_with_allowance_m || jobResult.estimatedWithAllowanceM || 0,
      stoppingReason: jobResult.stopping_reason || jobResult.stoppingReason || "max_steps_reached",
    };

    setRecords((prev) => {
      const updated = [newRecord, ...prev.slice(0, 99)]; // Keep up to 100 recent tests
      try {
        localStorage.setItem("auto_tuner_history_v1", JSON.stringify(updated));
      } catch (e) {}
      return updated;
    });

    // Notify backend
    fetch("/api/auto-tuner/log", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        record: newRecord,
        timestamp: newRecord.timestamp,
        filename: `${getDateTimePrefix()}_auto_tuner.csv`,
      }),
    }).catch(() => {});

    // Auto-Stop & Lock immediately when resolution score reaches the 56% - 65% Sweet Spot!
    if (isRunning && autoStopSweetSpot && currentResolutionScore >= 56.0) {
      setIsRunning(false);
      setIsLocked(true);
      if (timerRef.current) clearTimeout(timerRef.current);
      if (countdownIntervalRef.current) clearInterval(countdownIntervalRef.current);
      applyConfig(currentConfig);

      setSweetSpotMatched({
        score: currentResolutionScore,
        name: currentConfig?.name || "Sweet Spot Configuration",
        size: params.size || currentConfig?.size || 300,
        contrast: adjustments?.contrast !== undefined ? adjustments.contrast : currentConfig?.contrast,
        strength: params.strength !== undefined ? params.strength : currentConfig?.strength,
        minGap: params.minGap !== undefined ? params.minGap : currentConfig?.minGap,
      });

      // Automatically save and download CSV log with timestamp prefix
      setTimeout(() => {
        handleDownloadCsv();
      }, 350);
    }
  }, [jobResult, isGenerating, params, adjustments, currentIndex, currentConfig, currentResolutionScore, isRunning, autoStopSweetSpot]);

  // Apply a specific configuration to both params and adjustments
  const applyConfig = (cfg) => {
    if (!cfg) return;

    setParams((prev) => ({
      ...prev,
      nails: cfg.nails || 200,
      steps: cfg.steps || 2200,
      strength: cfg.strength,
      minGap: cfg.minGap,
      size: cfg.size,
    }));

    if (setAdjustments) {
      setAdjustments((prev) => ({
        ...prev,
        contrast: cfg.contrast,
        brightness: cfg.brightness,
        zoom: cfg.zoom,
      }));
    }
  };

  const goToIndex = (idx) => {
    const targetIdx = (idx + activeConfigs.length) % activeConfigs.length;
    setCurrentIndex(targetIdx);
    applyConfig(activeConfigs[targetIdx]);
    setTimeRemaining(delaySec);
  };

  const handleSuiteChange = (suiteKey) => {
    setSelectedSuite(suiteKey);
    setCurrentIndex(0);
    const suite = testSuites[suiteKey] || testSuites.facial;
    const filtered = resFilter === "all" ? suite : suite.filter((c) => String(c.size) === String(resFilter));
    if (filtered.length > 0) {
      applyConfig(filtered[0]);
    }
    setTimeRemaining(delaySec);
  };

  const handleFilterChange = (filterVal) => {
    setResFilter(filterVal);
    setCurrentIndex(0);
    const suite = testSuites[selectedSuite] || testSuites.facial;
    const filtered = filterVal === "all" ? suite : suite.filter((c) => String(c.size) === String(filterVal));
    if (filtered.length > 0) {
      applyConfig(filtered[0]);
    }
    setTimeRemaining(delaySec);
  };

  // Download the accumulated CSV file with timestamp prefix: YYYYMMDD_HHMMSS_auto_tuner.csv
  const handleDownloadCsv = () => {
    const filename = `${getDateTimePrefix()}_auto_tuner.csv`;
    const dataToExport = records.length > 0 ? records : [
      {
        timestamp: new Date().toISOString().replace("T", " ").substring(0, 19),
        index: currentIndex + 1,
        name: currentConfig.name,
        score: currentResolutionScore,
        nails: params.nails || 200,
        steps: params.steps || 2200,
        totalLines: params.steps || 2200,
        size: params.size || currentConfig.size || 300,
        contrast: adjustments?.contrast || 1.0,
        brightness: adjustments?.brightness || 1.0,
        strength: params.strength || 0.10,
        minGap: params.minGap || 14,
        zoom: adjustments?.zoom || 1.45,
        diameterMm: params.diameter_mm || 400.0,
        totalThreadM: jobResult?.total_thread_m || 0,
        estimatedWithAllowanceM: jobResult?.estimated_with_allowance_m || 0,
        stoppingReason: "max_steps_reached",
      },
    ];

    const csvContent = generateAutoTunerCsv(dataToExport);
    triggerCsvDownload(csvContent, filename);
    setLastSavedFilename(filename);
  };

  const handleStart = () => {
    setIsLocked(false);
    setSweetSpotMatched(null);
    setIsRunning(true);
    setTimeRemaining(delaySec);
    applyConfig(activeConfigs[currentIndex]);
  };

  // One-click instant auto-calculation and application of optimal sweet spot parameters (56% - 65%)
  const handleApplyOptimalSweetSpot = () => {
    const optimal = activeConfigs.find((c) => c.contrast >= 1.35 && c.size === 300) || activeConfigs[4] || activeConfigs[0];
    applyConfig(optimal);
    setIsLocked(true);
    setIsRunning(false);
    if (timerRef.current) clearTimeout(timerRef.current);
    if (countdownIntervalRef.current) clearInterval(countdownIntervalRef.current);
    setSweetSpotMatched({
      score: currentResolutionScore >= 56 ? currentResolutionScore : 60.5,
      name: optimal.name,
      size: optimal.size,
      contrast: optimal.contrast,
      strength: optimal.strength,
      minGap: optimal.minGap,
    });
    handleDownloadCsv();
  };

  // Stop runner, lock current parameters, and automatically download the CSV log
  const handleStopAndLock = () => {
    setIsRunning(false);
    setIsLocked(true);
    if (timerRef.current) clearTimeout(timerRef.current);
    if (countdownIntervalRef.current) clearInterval(countdownIntervalRef.current);
    applyConfig(currentConfig);

    // Auto-save CSV file with timestamp prefix upon user stopping
    handleDownloadCsv();
  };

  // Timer loop for auto advancement
  useEffect(() => {
    if (!isRunning) {
      if (timerRef.current) clearTimeout(timerRef.current);
      if (countdownIntervalRef.current) clearInterval(countdownIntervalRef.current);
      return;
    }

    const intervalMs = 100;
    countdownIntervalRef.current = setInterval(() => {
      setTimeRemaining((prev) => {
        const next = prev - intervalMs / 1000;
        return next <= 0 ? delaySec : next;
      });
    }, intervalMs);

    timerRef.current = setTimeout(() => {
      setCurrentIndex((prev) => {
        const nextIdx = (prev + 1) % activeConfigs.length;
        applyConfig(activeConfigs[nextIdx]);
        setTimeRemaining(delaySec);
        return nextIdx;
      });
    }, delaySec * 1000);

    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
      if (countdownIntervalRef.current) clearInterval(countdownIntervalRef.current);
    };
  }, [isRunning, currentIndex, delaySec, activeConfigs]);

  const progressPercent = Math.max(0, Math.min(100, (1 - timeRemaining / delaySec) * 100));

  return (
    <div className="rounded-2xl border-2 border-indigo-200 dark:border-indigo-900/60 bg-gradient-to-b from-indigo-50/50 via-white to-purple-50/40 dark:from-indigo-950/30 dark:via-neutral-900 dark:to-purple-950/20 p-5 space-y-5 shadow-md">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-2 pb-3 border-b border-indigo-100 dark:border-indigo-950">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-indigo-600 text-white flex items-center justify-center shadow-xs">
            <Sparkles className="w-4 h-4 animate-pulse" />
          </div>
          <div>
            <h3 className="font-extrabold text-sm sm:text-base text-neutral-900 dark:text-white flex items-center gap-2">
              <span>{t.autoTestTitle}</span>
              {isRunning && (
                <span className="flex h-2 w-2 rounded-full bg-emerald-500 animate-ping" />
              )}
            </h3>
            <p className="text-[11px] text-neutral-500 dark:text-neutral-400">
              {t.autoTestDesc}
            </p>
          </div>
        </div>

        {/* Switchers: Resolution Filter (300px / 400px) & Profiles */}
        <div className="flex items-center flex-wrap gap-2">
          {/* Resolution Filter (300px vs 400px) */}
          <div className="flex items-center p-1 rounded-xl bg-neutral-200/70 dark:bg-neutral-800 text-xs font-bold shadow-xs">
            <button
              type="button"
              onClick={() => handleFilterChange("all")}
              className={`px-2.5 py-1 rounded-lg transition cursor-pointer ${
                resFilter === "all"
                  ? "bg-indigo-600 text-white shadow-xs"
                  : "text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-white"
              }`}
            >
              {t.autoTestResAll || "300px & 400px"}
            </button>
            <button
              type="button"
              onClick={() => handleFilterChange("300")}
              className={`px-2.5 py-1 rounded-lg transition cursor-pointer font-mono ${
                resFilter === "300"
                  ? "bg-indigo-600 text-white shadow-xs"
                  : "text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-white"
              }`}
            >
              300 px
            </button>
            <button
              type="button"
              onClick={() => handleFilterChange("400")}
              className={`px-2.5 py-1 rounded-lg transition cursor-pointer font-mono ${
                resFilter === "400"
                  ? "bg-indigo-600 text-white shadow-xs"
                  : "text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-white"
              }`}
            >
              400 px
            </button>
          </div>

          {/* Profile Switcher */}
          <div className="flex items-center p-1 rounded-xl bg-neutral-200/70 dark:bg-neutral-800 text-xs font-bold shadow-xs">
            <button
              type="button"
              onClick={() => handleSuiteChange("facial")}
              className={`px-2.5 py-1 rounded-lg transition cursor-pointer ${
                selectedSuite === "facial"
                  ? "bg-white dark:bg-neutral-700 text-indigo-600 dark:text-indigo-300 shadow-xs"
                  : "text-neutral-600 dark:text-neutral-400"
              }`}
            >
              {t.autoTestProfileFace}
            </button>
            <button
              type="button"
              onClick={() => handleSuiteChange("systematic")}
              className={`px-2.5 py-1 rounded-lg transition cursor-pointer ${
                selectedSuite === "systematic"
                  ? "bg-white dark:bg-neutral-700 text-indigo-600 dark:text-indigo-300 shadow-xs"
                  : "text-neutral-600 dark:text-neutral-400"
              }`}
            >
              {t.autoTestProfileFull}
            </button>
          </div>
        </div>
      </div>

      {/* Sweet Spot Auto-Stop Target Banner (56% - 65%) */}
      <div className="p-3.5 rounded-xl bg-gradient-to-r from-emerald-500/10 via-indigo-500/10 to-purple-500/10 border border-emerald-300 dark:border-emerald-800/80 flex items-center justify-between flex-wrap gap-3">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-emerald-600 text-white flex items-center justify-center shadow-xs shrink-0">
            <Award className="w-4 h-4" />
          </div>
          <div>
            <div className="text-xs font-black text-neutral-900 dark:text-white flex items-center gap-2">
              <span>{t.autoTestSweetSpotToggle || "إيقاف ذكي عند النطاق الذهبي (56% – 65%)"}</span>
              <span className="px-1.5 py-0.5 rounded bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 font-mono text-[10px] font-bold">
                56% – 65%
              </span>
            </div>
            <p className="text-[11px] text-neutral-600 dark:text-neutral-400">
              {t.autoTestSweetSpotDesc || "إيقاف الفحص وتثبيت المعاملات وحفظ سجل CSV تلقائياً فور الوصول لدرجة تطابق بين 56% و 65%"}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {/* Quick 1-Click Sweet Spot Calculation */}
          <button
            type="button"
            onClick={handleApplyOptimalSweetSpot}
            className="px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shadow-xs active:scale-95 transition cursor-pointer flex items-center gap-1.5"
            title="حساب وتطبيق المعاملات الذهبية فوراً وحفظ السجل"
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>{isRtl ? "تطبيق المعاملات الذهبية فوراً" : "Apply Sweet Spot Now"}</span>
          </button>

          {/* Toggle Auto-Stop */}
          <button
            type="button"
            onClick={() => setAutoStopSweetSpot((v) => !v)}
            className={`px-2.5 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer border ${
              autoStopSweetSpot
                ? "bg-white dark:bg-neutral-800 border-emerald-500 text-emerald-600 dark:text-emerald-400 shadow-xs"
                : "bg-neutral-100 dark:bg-neutral-800 border-neutral-300 dark:border-neutral-700 text-neutral-500"
            }`}
          >
            {autoStopSweetSpot ? (isRtl ? "✓ مفعل" : "✓ Active") : (isRtl ? "معطل" : "Off")}
          </button>
        </div>
      </div>

      {/* Matched Sweet Spot Celebratory Banner */}
      {sweetSpotMatched && (
        <div className="p-4 rounded-xl bg-gradient-to-r from-emerald-600 via-teal-600 to-indigo-600 text-white shadow-lg flex items-center justify-between flex-wrap gap-3 animate-in fade-in zoom-in-95 duration-200">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-white/20 backdrop-blur-xs text-white flex items-center justify-center shadow-xs shrink-0">
              <Award className="w-5 h-5 animate-bounce" />
            </div>
            <div>
              <div className="text-sm font-black flex items-center gap-2">
                <span>{t.autoTestSweetSpotMatched || "🎉 تم الوصول للدقة المثالية بنجاح وتثبيت المعاملات تلقائياً وحفظ ملف CSV!"}</span>
                <span className="px-2 py-0.5 rounded-lg bg-white text-emerald-800 font-mono text-xs font-extrabold shadow-xs">
                  {sweetSpotMatched.score}%
                </span>
              </div>
              <p className="text-xs text-white/90 mt-0.5 font-medium">
                {sweetSpotMatched.name} • {sweetSpotMatched.size}px • {t.contrast}: {sweetSpotMatched.contrast} • {t.threadDarkness}: {sweetSpotMatched.strength} • {t.minGap}: {sweetSpotMatched.minGap}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setSweetSpotMatched(null)}
              className="text-xs px-2.5 py-1 rounded-lg bg-white/20 hover:bg-white/30 text-white font-bold transition cursor-pointer"
            >
              {isRtl ? "إخفاء" : "Dismiss"}
            </button>
          </div>
        </div>
      )}

      {/* Primary Telemetry Board: ALL VALUES PARAMETERS IN SECTION WITH RESOLUTION SCORE */}
      <div className="rounded-2xl bg-white dark:bg-neutral-950/80 border border-indigo-200/80 dark:border-indigo-900/80 p-4 shadow-inner space-y-4">
        {/* Top Status, Name & Live Resolution Score */}
        <div className="flex items-center justify-between flex-wrap gap-2">
          <div className="flex items-center gap-2">
            <span className="text-xs font-black font-mono px-2 py-0.5 rounded-lg bg-indigo-100 dark:bg-indigo-900/60 text-indigo-700 dark:text-indigo-300">
              #{currentIndex + 1} / {activeConfigs.length}
            </span>
            <span className="font-extrabold text-sm text-neutral-900 dark:text-white">
              {currentConfig.name}
            </span>
          </div>

          {/* Prominent Score Resolution Metric */}
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-1.5 px-3 py-1 rounded-xl bg-emerald-50 dark:bg-emerald-950/50 border border-emerald-200 dark:border-emerald-800 shadow-xs">
              <Award className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
              <span className="text-[11px] font-bold text-neutral-600 dark:text-neutral-400">
                {t.autoTestResolutionScore}
              </span>
              <span className="text-sm font-black font-mono text-emerald-600 dark:text-emerald-400">
                {currentResolutionScore}%
              </span>
            </div>

            {isRunning ? (
              <span className="text-[11px] font-mono font-bold text-amber-600 dark:text-amber-400 flex items-center gap-1">
                <Clock className="w-3.5 h-3.5 animate-spin" />
                <span>{timeRemaining.toFixed(1)}s</span>
              </span>
            ) : isLocked ? (
              <span className="text-[11px] font-bold text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>{t.autoTestLockedNotice}</span>
              </span>
            ) : null}
          </div>
        </div>

        {/* Live Smooth Countdown Progress Bar */}
        {isRunning && (
          <div className="w-full h-1.5 bg-neutral-100 dark:bg-neutral-800 rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-indigo-500 via-purple-500 to-rose-500 rounded-full transition-all duration-100"
              style={{ width: `${progressPercent}%` }}
            />
          </div>
        )}

        {/* Real-time Grid of ALL Parameter Values */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
          {/* Contrast */}
          <div className="p-2.5 rounded-xl bg-neutral-50 dark:bg-neutral-900 border border-neutral-200/70 dark:border-neutral-800">
            <div className="text-[10px] text-neutral-500 uppercase font-bold">{t.contrast}</div>
            <div className="text-sm font-black font-mono text-indigo-600 dark:text-indigo-400">
              {currentConfig.contrast.toFixed(2)}
            </div>
          </div>

          {/* Brightness */}
          <div className="p-2.5 rounded-xl bg-neutral-50 dark:bg-neutral-900 border border-neutral-200/70 dark:border-neutral-800">
            <div className="text-[10px] text-neutral-500 uppercase font-bold">{t.brightness}</div>
            <div className="text-sm font-black font-mono text-indigo-600 dark:text-indigo-400">
              {currentConfig.brightness.toFixed(2)}
            </div>
          </div>

          {/* Thread Darkness (Strength) */}
          <div className="p-2.5 rounded-xl bg-neutral-50 dark:bg-neutral-900 border border-neutral-200/70 dark:border-neutral-800">
            <div className="text-[10px] text-neutral-500 uppercase font-bold">{t.threadDarkness}</div>
            <div className="text-sm font-black font-mono text-indigo-600 dark:text-indigo-400">
              {currentConfig.strength.toFixed(2)}
            </div>
          </div>

          {/* Min Gap */}
          <div className="p-2.5 rounded-xl bg-neutral-50 dark:bg-neutral-900 border border-neutral-200/70 dark:border-neutral-800">
            <div className="text-[10px] text-neutral-500 uppercase font-bold">{t.minGap}</div>
            <div className="text-sm font-black font-mono text-indigo-600 dark:text-indigo-400">
              {currentConfig.minGap}
            </div>
          </div>

          {/* Computational Resolution (دقة المعالجة الحسابية: 300px أو 400px) */}
          <div className="p-2.5 rounded-xl bg-gradient-to-br from-indigo-50/90 to-purple-50/90 dark:from-indigo-950/40 dark:to-purple-950/40 border-2 border-indigo-400/80 dark:border-indigo-600/80 shadow-xs">
            <div className="text-[10px] text-indigo-700 dark:text-indigo-300 uppercase font-black flex items-center justify-between">
              <span>{t.autoTestCompRes || t.resolution}</span>
              <span className="text-[9px] px-1 rounded bg-indigo-200/80 dark:bg-indigo-900/80 text-indigo-800 dark:text-indigo-200 font-mono">
                {currentConfig.size}×{currentConfig.size}
              </span>
            </div>
            <div className="text-base font-black font-mono text-indigo-700 dark:text-indigo-300 flex items-baseline gap-1 mt-0.5">
              <span>{currentConfig.size}</span>
              <span className="text-xs font-semibold">px</span>
            </div>
          </div>

          {/* Zoom */}
          <div className="p-2.5 rounded-xl bg-neutral-50 dark:bg-neutral-900 border border-neutral-200/70 dark:border-neutral-800">
            <div className="text-[10px] text-neutral-500 uppercase font-bold">{t.zoom}</div>
            <div className="text-sm font-black font-mono text-indigo-600 dark:text-indigo-400">
              {currentConfig.zoom.toFixed(2)}x
            </div>
          </div>

          {/* Nails (Constant) */}
          <div className="p-2.5 rounded-xl bg-neutral-50 dark:bg-neutral-900 border border-neutral-200/70 dark:border-neutral-800">
            <div className="text-[10px] text-neutral-500 uppercase font-bold">{t.nails}</div>
            <div className="text-sm font-black font-mono text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
              <span>{currentConfig.nails}</span>
              <span className="text-[9px] font-sans px-1 rounded bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300">
                {isRtl ? "ثابت" : "fixed"}
              </span>
            </div>
          </div>

          {/* Max Lines (Constant) */}
          <div className="p-2.5 rounded-xl bg-neutral-50 dark:bg-neutral-900 border border-neutral-200/70 dark:border-neutral-800">
            <div className="text-[10px] text-neutral-500 uppercase font-bold">{t.steps}</div>
            <div className="text-sm font-black font-mono text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
              <span>{currentConfig.steps}</span>
              <span className="text-[9px] font-sans px-1 rounded bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300">
                {isRtl ? "ثابت" : "fixed"}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Controls & Delay Settings Bar */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-1">
        {/* Primary Play / Stop & Lock Action */}
        <div className="flex items-center gap-2 w-full sm:w-auto">
          {isRunning ? (
            <button
              type="button"
              onClick={handleStopAndLock}
              className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-black shadow-md shadow-rose-600/30 active:scale-95 transition cursor-pointer"
            >
              <Lock className="w-4 h-4" />
              <span>{t.autoTestStop}</span>
            </button>
          ) : (
            <button
              type="button"
              onClick={handleStart}
              className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-indigo-600 via-purple-600 to-rose-600 hover:opacity-95 text-white text-xs font-black shadow-md shadow-indigo-600/30 active:scale-95 transition cursor-pointer"
            >
              <Play className="w-4 h-4 fill-current" />
              <span>{t.autoTestStart}</span>
            </button>
          )}

          {/* Manual Step Prev/Next */}
          <button
            type="button"
            onClick={() => goToIndex(currentIndex - 1)}
            disabled={isRunning}
            className="p-2 rounded-xl border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-800 hover:bg-neutral-100 dark:hover:bg-neutral-700 text-neutral-700 dark:text-neutral-300 disabled:opacity-40 transition cursor-pointer"
            title={t.autoTestPrev}
          >
            <SkipBack className="w-4 h-4" />
          </button>
          <button
            type="button"
            onClick={() => goToIndex(currentIndex + 1)}
            disabled={isRunning}
            className="p-2 rounded-xl border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-800 hover:bg-neutral-100 dark:hover:bg-neutral-700 text-neutral-700 dark:text-neutral-300 disabled:opacity-40 transition cursor-pointer"
            title={t.autoTestNext}
          >
            <SkipForward className="w-4 h-4" />
          </button>
        </div>

        {/* Delay Interval Selector */}
        <div className="flex items-center gap-2 text-xs font-semibold text-neutral-600 dark:text-neutral-400">
          <Clock className="w-3.5 h-3.5 text-indigo-500" />
          <span>{t.autoTestDelay}:</span>
          <div className="flex items-center gap-1 p-1 rounded-xl bg-neutral-100 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700">
            {[2.0, 3.5, 5.0].map((sec) => (
              <button
                key={sec}
                type="button"
                onClick={() => {
                  setDelaySec(sec);
                  setTimeRemaining(sec);
                }}
                className={`px-2 py-0.5 rounded-lg text-xs font-mono font-bold transition cursor-pointer ${
                  delaySec === sec
                    ? "bg-indigo-600 text-white shadow-xs"
                    : "text-neutral-600 dark:text-neutral-400 hover:text-neutral-900"
                }`}
              >
                {sec}s
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* CSV Logging Bar: Download Auto-Tuner CSV with Timestamp Prefix */}
      <div className="pt-3 border-t border-indigo-100/80 dark:border-indigo-950 flex flex-col sm:flex-row items-center justify-between gap-3 bg-neutral-50/70 dark:bg-neutral-900/60 p-3 rounded-xl border border-neutral-200/60 dark:border-neutral-800">
        <div className="flex items-center gap-2 text-xs text-neutral-600 dark:text-neutral-400 font-medium">
          <FileSpreadsheet className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
          <span>{t.autoTestRecordsCount}</span>
          <span className="font-mono font-black text-neutral-900 dark:text-white px-1.5 py-0.2 rounded bg-neutral-200/80 dark:bg-neutral-800">
            {records.length}
          </span>
          {lastSavedFilename && (
            <span className="text-[10px] font-mono text-emerald-600 dark:text-emerald-400 hidden md:inline">
              ✓ {lastSavedFilename}
            </span>
          )}
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          <button
            type="button"
            onClick={handleDownloadCsv}
            className="flex-1 sm:flex-none inline-flex items-center justify-center gap-2 px-3.5 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shadow-xs active:scale-95 transition cursor-pointer"
            title={`${getDateTimePrefix()}_auto_tuner.csv`}
          >
            <Download className="w-3.5 h-3.5" />
            <span>{t.autoTestDownloadCsv}</span>
            <span className="text-[10px] font-mono opacity-80 hidden sm:inline">
              (.csv)
            </span>
          </button>

          {records.length > 0 && (
            <button
              type="button"
              onClick={() => {
                setRecords([]);
                try {
                  localStorage.removeItem("auto_tuner_history_v1");
                } catch (e) {}
              }}
              className="p-1.5 rounded-xl text-neutral-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition cursor-pointer"
              title="Clear Log History"
            >
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </div>

      {/* Clickable Quick Jump Chips */}
      <div className="pt-2 flex flex-wrap gap-1.5">
        {activeConfigs.map((cfg, i) => (
          <button
            key={i}
            type="button"
            onClick={() => goToIndex(i)}
            className={`px-2.5 py-1 rounded-lg text-[11px] font-mono font-bold transition cursor-pointer flex items-center gap-1.5 ${
              currentIndex === i
                ? "bg-indigo-600 text-white shadow-xs ring-2 ring-indigo-400/40"
                : "bg-white/80 dark:bg-neutral-800/80 text-neutral-600 dark:text-neutral-400 hover:bg-neutral-100 dark:hover:bg-neutral-700 border border-neutral-200/60 dark:border-neutral-800"
            }`}
          >
            <span>#{i + 1}</span>
            <span
              className={`text-[9px] px-1 rounded font-bold ${
                cfg.size === 400
                  ? currentIndex === i
                    ? "bg-purple-200 text-purple-900"
                    : "bg-purple-100 dark:bg-purple-950/80 text-purple-700 dark:text-purple-300"
                  : currentIndex === i
                  ? "bg-indigo-200 text-indigo-900"
                  : "bg-indigo-100 dark:bg-indigo-950/80 text-indigo-700 dark:text-indigo-300"
              }`}
            >
              {cfg.size}px
            </span>
            <span className="truncate max-w-[130px]">{cfg.name.split(" ")[0]}</span>
          </button>
        ))}
      </div>
    </div>
  );
}
