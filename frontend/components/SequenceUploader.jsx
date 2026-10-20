"use client";

import React, { useState, useRef } from "react";
import {
  FileText,
  UploadCloud,
  ClipboardPaste,
  Sparkles,
  AlertCircle,
  CheckCircle2,
  Sliders,
  Ruler,
  HelpCircle,
  Loader2,
  FileCheck,
} from "lucide-react";
import {
  parseSequenceText,
  computeSequenceResult,
  generateSampleSequence,
} from "../lib/sequenceParser";

export default function SequenceUploader({ onSequenceLoaded, t }) {
  const [tab, setTab] = useState("file"); // "file" | "paste"
  const [isDragging, setIsDragging] = useState(false);
  const [pastedText, setPastedText] = useState("");
  const [parsedData, setParsedData] = useState(null); // { sequence, nailsCount, diameterMm, filename }
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);

  // Editable parameters
  const [nailsOverride, setNailsOverride] = useState(200);
  const [diameterMm, setDiameterMm] = useState(400);
  const [allowancePct, setAllowancePct] = useState(15);

  const fileInputRef = useRef(null);

  // Process raw text through parser
  const processRawText = (text, filename = "sequence.txt") => {
    setError(null);
    try {
      const parsed = parseSequenceText(text);
      const maxNail = Math.max(...parsed.sequence);
      const initialNails =
        parsed.nailsCount ||
        (maxNail <= 200
          ? 200
          : maxNail <= 240
          ? 240
          : maxNail <= 280
          ? 280
          : maxNail <= 300
          ? 300
          : Math.ceil(maxNail / 10) * 10);

      setParsedData({
        sequence: parsed.sequence,
        filename,
      });
      setNailsOverride(initialNails);
      if (parsed.diameterMm) setDiameterMm(parsed.diameterMm);
      if (parsed.allowancePct) setAllowancePct(parsed.allowancePct);
    } catch (err) {
      setParsedData(null);
      setError(err.message || (t.dir === "rtl" ? "تعذر قراءة ملف التسلسل." : "Failed to parse text sequence."));
    }
  };

  // Handle uploaded file
  const handleFile = (file) => {
    if (!file) return;

    if (file.size > 20 * 1024 * 1024) {
      setError(t.dir === "rtl" ? "حجم الملف أكبر من 20 ميجابايت." : "File exceeds 20 MB limit.");
      return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      const text = e.target?.result;
      if (typeof text === "string") {
        processRawText(text, file.name);
      }
    };
    reader.onerror = () => {
      setError(t.dir === "rtl" ? "خطأ أثناء قراءة الملف." : "Error reading file.");
    };
    reader.readAsText(file);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      handleFile(e.dataTransfer.files[0]);
    }
  };

  // Handle paste change
  const handlePasteChange = (val) => {
    setPastedText(val);
    if (val.trim().length > 3) {
      processRawText(val, "pasted_sequence.txt");
    } else {
      setParsedData(null);
      setError(null);
    }
  };

  // Load sample sequence
  const handleLoadSample = () => {
    const sampleSeq = generateSampleSequence(200, 2, 1200);
    const sampleTxt = `# Geometric Mandala String Art\n# Nails: 200\n# Diameter: 400 mm\n` + sampleSeq.join(", ");
    setPastedText(sampleTxt);
    processRawText(sampleTxt, "sample_mandala.txt");
  };

  // Confirm and start preview
  const handleConfirmPreview = async () => {
    if (!parsedData || !parsedData.sequence || parsedData.sequence.length < 2) {
      setError(t.dir === "rtl" ? "يرجى توفير تسلسل مسامير صالح أولاً." : "Please provide a valid sequence first.");
      return;
    }

    setLoading(true);
    setError(null);

    // Compute client-side result immediately for instant responsiveness
    const clientResult = computeSequenceResult({
      sequence: parsedData.sequence,
      nailsCount: parseInt(nailsOverride, 10) || 200,
      diameterMm: parseFloat(diameterMm) || 400.0,
      allowancePct: parseFloat(allowancePct) || 15.0,
      filename: parsedData.filename,
    });

    try {
      // Sync with backend so all export files (PDF, SVG, ZIP) are generated
      const res = await fetch("/api/jobs/import", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          sequence: parsedData.sequence,
          nails_count: parseInt(nailsOverride, 10) || 200,
          diameter_mm: parseFloat(diameterMm) || 400.0,
          allowance_pct: parseFloat(allowancePct) || 15.0,
          filename: parsedData.filename,
        }),
      });

      if (res.ok) {
        const data = await res.json();
        if (data.result) {
          onSequenceLoaded({
            uploadId: `imported_${Date.now()}`,
            filename: parsedData.filename,
            isTextSequence: true,
            jobResult: data.result,
          });
          return;
        }
      }
    } catch {
      // If server unreachable, proceed with local rendering
    } finally {
      setLoading(false);
    }

    // Fallback to client-side result
    onSequenceLoaded({
      uploadId: `imported_${Date.now()}`,
      filename: parsedData.filename,
      isTextSequence: true,
      jobResult: clientResult,
    });
  };

  return (
    <div className="w-full space-y-6">
      {/* Tab Switcher: Upload File vs Paste Text */}
      <div className="flex items-center justify-between border-b border-neutral-200 dark:border-neutral-800 pb-3">
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setTab("file")}
            className={`inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition ${
              tab === "file"
                ? "bg-indigo-600 text-white shadow-sm"
                : "text-neutral-600 dark:text-neutral-400 hover:bg-neutral-100 dark:hover:bg-neutral-800"
            }`}
          >
            <UploadCloud className="w-4 h-4" />
            <span>{t.dir === "rtl" ? "رفع ملف (.txt / .csv / .json)" : "Upload File (.txt / .csv / .json)"}</span>
          </button>

          <button
            type="button"
            onClick={() => setTab("paste")}
            className={`inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition ${
              tab === "paste"
                ? "bg-indigo-600 text-white shadow-sm"
                : "text-neutral-600 dark:text-neutral-400 hover:bg-neutral-100 dark:hover:bg-neutral-800"
            }`}
          >
            <ClipboardPaste className="w-4 h-4" />
            <span>{t.orPasteSequence}</span>
          </button>
        </div>

        {/* Quick sample button */}
        <button
          type="button"
          onClick={handleLoadSample}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold text-indigo-600 dark:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-950/40 border border-indigo-200 dark:border-indigo-900/60 transition"
        >
          <Sparkles className="w-3.5 h-3.5" />
          <span>{t.sampleButton}</span>
        </button>
      </div>

      {/* Tab 1: File Dropzone */}
      {tab === "file" && (
        <div
          onDragOver={(e) => {
            e.preventDefault();
            setIsDragging(true);
          }}
          onDragLeave={() => setIsDragging(false)}
          onDrop={handleDrop}
          onClick={() => fileInputRef.current?.click()}
          className={`relative cursor-pointer rounded-2xl border-2 border-dashed p-8 transition-all flex flex-col items-center justify-center text-center ${
            isDragging
              ? "border-indigo-500 bg-indigo-50/50 dark:bg-indigo-950/20 scale-[0.99]"
              : "border-neutral-300 dark:border-neutral-700 hover:border-neutral-400 dark:hover:border-neutral-600 bg-neutral-50/50 dark:bg-neutral-800/40"
          }`}
        >
          <input
            ref={fileInputRef}
            type="file"
            accept=".txt,.csv,.json,.dat"
            className="hidden"
            onChange={(e) => {
              if (e.target.files && e.target.files.length > 0) {
                handleFile(e.target.files[0]);
              }
            }}
          />

          <div className="w-14 h-14 rounded-full bg-indigo-100 dark:bg-indigo-900/40 flex items-center justify-center text-indigo-600 dark:text-indigo-400 mb-4 shadow-inner">
            <FileText className="w-7 h-7" />
          </div>

          <h3 className="font-semibold text-base text-neutral-800 dark:text-neutral-200 mb-1">
            {t.dragDropTextFile}
          </h3>
          <p className="text-xs text-neutral-500 dark:text-neutral-400 max-w-sm">
            {t.supportedTextFormats}
          </p>
        </div>
      )}

      {/* Tab 2: Direct Paste Textarea */}
      {tab === "paste" && (
        <div className="space-y-2">
          <textarea
            rows={5}
            value={pastedText}
            onChange={(e) => handlePasteChange(e.target.value)}
            placeholder={t.pastePlaceholder}
            className="w-full p-4 rounded-xl font-mono text-xs border border-neutral-300 dark:border-neutral-700 bg-neutral-50 dark:bg-neutral-800/50 text-neutral-900 dark:text-neutral-100 focus:outline-hidden focus:ring-2 focus:ring-indigo-500 transition resize-y"
          />
          <div className="flex items-center justify-between text-[11px] text-neutral-500 dark:text-neutral-400">
            <span>{t.pastePlaceholder}</span>
            {pastedText && <span>{pastedText.length} {t.dir === "rtl" ? "حرف" : "chars"}</span>}
          </div>
        </div>
      )}

      {/* Detected Info & Parameter Tuning Card */}
      {parsedData && (
        <div className="p-5 rounded-2xl bg-indigo-50/50 dark:bg-indigo-950/20 border border-indigo-200 dark:border-indigo-900/50 space-y-4">
          <div className="flex items-center justify-between border-b border-indigo-100 dark:border-indigo-900/40 pb-3">
            <div className="flex items-center gap-2 text-indigo-900 dark:text-indigo-200">
              <FileCheck className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
              <div>
                <h4 className="text-sm font-bold">{parsedData.filename}</h4>
                <p className="text-[11px] text-indigo-700/80 dark:text-indigo-300/80">
                  {t.fileUploadedSuccess}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <span className="text-xs font-mono font-bold bg-indigo-100 dark:bg-indigo-900/60 text-indigo-800 dark:text-indigo-300 px-2.5 py-1 rounded-lg">
                {parsedData.sequence.length - 1} {t.detectedSteps}
              </span>
            </div>
          </div>

          {/* Quick Tuning Inputs */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-bold text-neutral-700 dark:text-neutral-300 mb-1 flex items-center gap-1">
                <span>{t.detectedNails}</span>
              </label>
              <input
                type="number"
                min={Math.max(...parsedData.sequence)}
                max={500}
                value={nailsOverride}
                onChange={(e) => setNailsOverride(Math.max(1, parseInt(e.target.value, 10) || 200))}
                className="w-full px-3 py-2 rounded-xl text-xs font-mono font-bold border border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-800 text-neutral-900 dark:text-neutral-100 focus:ring-2 focus:ring-indigo-500"
              />
              <span className="text-[10px] text-neutral-500 block mt-1">
                {t.dir === "rtl" ? `أعلى مسمار بالتسلسل: ${Math.max(...parsedData.sequence)}` : `Max nail in file: ${Math.max(...parsedData.sequence)}`}
              </span>
            </div>

            <div>
              <label className="block text-xs font-bold text-neutral-700 dark:text-neutral-300 mb-1 flex items-center gap-1">
                <span>{t.boardDiameter}</span>
              </label>
              <input
                type="number"
                min={100}
                max={2000}
                step={10}
                value={diameterMm}
                onChange={(e) => setDiameterMm(parseFloat(e.target.value) || 400)}
                className="w-full px-3 py-2 rounded-xl text-xs font-mono font-bold border border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-800 text-neutral-900 dark:text-neutral-100 focus:ring-2 focus:ring-indigo-500"
              />
              <span className="text-[10px] text-neutral-500 block mt-1">
                {diameterMm / 10} cm
              </span>
            </div>

            <div>
              <label className="block text-xs font-bold text-neutral-700 dark:text-neutral-300 mb-1 flex items-center gap-1">
                <span>{t.allowancePct}</span>
              </label>
              <input
                type="number"
                min={0}
                max={50}
                step={1}
                value={allowancePct}
                onChange={(e) => setAllowancePct(parseFloat(e.target.value) || 15)}
                className="w-full px-3 py-2 rounded-xl text-xs font-mono font-bold border border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-800 text-neutral-900 dark:text-neutral-100 focus:ring-2 focus:ring-indigo-500"
              />
              <span className="text-[10px] text-neutral-500 block mt-1">
                {t.dir === "rtl" ? "احتياطي التفاف الخيط" : "Thread reserve"}
              </span>
            </div>
          </div>

          {/* Action Button: Preview String Art */}
          <button
            type="button"
            onClick={handleConfirmPreview}
            disabled={loading}
            className="w-full flex items-center justify-center gap-2 py-3 px-6 rounded-xl bg-gradient-to-r from-indigo-600 via-purple-600 to-rose-600 hover:opacity-95 text-white font-bold text-sm shadow-md shadow-indigo-600/20 transition cursor-pointer"
          >
            {loading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>{t.parsingFile}</span>
              </>
            ) : (
              <>
                <Sparkles className="w-4 h-4" />
                <span>{t.previewButton}</span>
              </>
            )}
          </button>
        </div>
      )}

      {/* Error alert */}
      {error && (
        <div className="flex items-center gap-2 text-xs text-rose-600 dark:text-rose-400 bg-rose-50 dark:bg-rose-950/30 p-3.5 rounded-xl border border-rose-200 dark:border-rose-900/50">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}
    </div>
  );
}
