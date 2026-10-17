"use client";

import React, { useState } from "react";
import { Sliders, Sparkles, Info, Play, CheckCircle2 } from "lucide-react";

export default function ParametersPanel({
  params,
  setParams,
  onStartGeneration,
  isGenerating,
  t,
}) {
  const [activePreset, setActivePreset] = useState("balanced");

  const applyPreset = (presetKey) => {
    setActivePreset(presetKey);
    if (presetKey === "fast") {
      setParams((p) => ({
        ...p,
        nails: 100,
        steps: 800,
        size: 200,
        minGap: 8,
        strength: 0.14,
      }));
    } else if (presetKey === "balanced") {
      setParams((p) => ({
        ...p,
        nails: 200,
        steps: 3000,
        size: 300,
        minGap: 10,
        strength: 0.12,
      }));
    } else if (presetKey === "masterpiece") {
      setParams((p) => ({
        ...p,
        nails: 280,
        steps: 4500,
        size: 400,
        minGap: 12,
        strength: 0.10,
      }));
    }
  };

  const handleCustomChange = (updater) => {
    setActivePreset("custom");
    setParams(updater);
  };

  return (
    <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-2xl p-5 shadow-sm space-y-6">
      {/* Title */}
      <div className="flex items-center justify-between border-b border-neutral-100 dark:border-neutral-800 pb-3">
        <div className="flex items-center gap-2">
          <Sliders className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
          <h2 className="font-bold text-base text-neutral-900 dark:text-neutral-100">
            {t.paramTitle}
          </h2>
        </div>
      </div>

      {/* Presets buttons */}
      <div>
        <label className="block text-xs font-semibold uppercase tracking-wider text-neutral-500 mb-2">
          {t.presetTitle}
        </label>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
          {[
            { key: "fast", label: t.presetFast, desc: "Fast draft" },
            { key: "balanced", label: t.presetBalanced, desc: "Recommended" },
            { key: "masterpiece", label: t.presetMasterpiece, desc: "Ultra detail" },
          ].map((preset) => (
            <button
              key={preset.key}
              onClick={() => applyPreset(preset.key)}
              className={`p-3 rounded-xl border text-start transition flex flex-col justify-between ${
                activePreset === preset.key
                  ? "border-indigo-600 bg-indigo-50/50 dark:bg-indigo-950/30 text-indigo-900 dark:text-indigo-200 ring-2 ring-indigo-500/20"
                  : "border-neutral-200 dark:border-neutral-800 hover:border-neutral-300 dark:hover:border-neutral-700 bg-neutral-50/40 dark:bg-neutral-800/40 text-neutral-700 dark:text-neutral-300"
              }`}
            >
              <div className="flex items-center justify-between w-full mb-1">
                <span className="font-semibold text-xs">{preset.desc}</span>
                {activePreset === preset.key && (
                  <CheckCircle2 className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
                )}
              </div>
              <span className="text-[11px] text-neutral-500 dark:text-neutral-400">
                {preset.label}
              </span>
            </button>
          ))}
        </div>
      </div>

      {/* Core Parameters Controls */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Nails Count */}
        <div className="bg-neutral-50/50 dark:bg-neutral-800/30 p-3.5 rounded-xl border border-neutral-100 dark:border-neutral-800">
          <div className="flex justify-between items-center text-xs font-semibold text-neutral-800 dark:text-neutral-200 mb-1">
            <span>{t.nails}</span>
            <span className="font-mono text-indigo-600 dark:text-indigo-400 font-bold">
              {params.nails}
            </span>
          </div>
          <p className="text-[11px] text-neutral-500 dark:text-neutral-400 mb-2">
            {t.nailsHelp}
          </p>
          <input
            type="range"
            min="50"
            max="400"
            step="10"
            value={params.nails}
            onChange={(e) =>
              handleCustomChange((p) => ({
                ...p,
                nails: parseInt(e.target.value, 10),
              }))
            }
            className="w-full accent-indigo-600 h-1.5 bg-neutral-200 dark:bg-neutral-700 rounded-lg cursor-pointer"
          />
        </div>

        {/* Steps / Thread Segments */}
        <div className="bg-neutral-50/50 dark:bg-neutral-800/30 p-3.5 rounded-xl border border-neutral-100 dark:border-neutral-800">
          <div className="flex justify-between items-center text-xs font-semibold text-neutral-800 dark:text-neutral-200 mb-1">
            <span>{t.steps}</span>
            <span className="font-mono text-indigo-600 dark:text-indigo-400 font-bold">
              {params.steps}
            </span>
          </div>
          <p className="text-[11px] text-neutral-500 dark:text-neutral-400 mb-2">
            {t.stepsHelp}
          </p>
          <input
            type="range"
            min="100"
            max="8000"
            step="100"
            value={params.steps}
            onChange={(e) =>
              handleCustomChange((p) => ({
                ...p,
                steps: parseInt(e.target.value, 10),
              }))
            }
            className="w-full accent-indigo-600 h-1.5 bg-neutral-200 dark:bg-neutral-700 rounded-lg cursor-pointer"
          />
        </div>

        {/* Board Diameter mm */}
        <div className="bg-neutral-50/50 dark:bg-neutral-800/30 p-3.5 rounded-xl border border-neutral-100 dark:border-neutral-800">
          <div className="flex justify-between items-center text-xs font-semibold text-neutral-800 dark:text-neutral-200 mb-1">
            <span>{t.boardDiameter}</span>
            <span className="font-mono text-indigo-600 dark:text-indigo-400 font-bold">
              {params.diameter_mm} mm
            </span>
          </div>
          <p className="text-[11px] text-neutral-500 dark:text-neutral-400 mb-2">
            {t.boardDiameterHelp}
          </p>
          <input
            type="range"
            min="100"
            max="1200"
            step="20"
            value={params.diameter_mm}
            onChange={(e) =>
              handleCustomChange((p) => ({
                ...p,
                diameter_mm: parseFloat(e.target.value),
              }))
            }
            className="w-full accent-indigo-600 h-1.5 bg-neutral-200 dark:bg-neutral-700 rounded-lg cursor-pointer"
          />
        </div>

        {/* Resolution */}
        <div className="bg-neutral-50/50 dark:bg-neutral-800/30 p-3.5 rounded-xl border border-neutral-100 dark:border-neutral-800">
          <div className="flex justify-between items-center text-xs font-semibold text-neutral-800 dark:text-neutral-200 mb-1">
            <span>{t.resolution}</span>
            <span className="font-mono text-indigo-600 dark:text-indigo-400 font-bold">
              {params.size} px
            </span>
          </div>
          <p className="text-[11px] text-neutral-500 dark:text-neutral-400 mb-2">
            {t.resolutionHelp}
          </p>
          <div className="grid grid-cols-3 gap-2">
            {[200, 300, 400].map((res) => (
              <button
                key={res}
                type="button"
                onClick={() =>
                  handleCustomChange((p) => ({ ...p, size: res }))
                }
                className={`py-1 text-xs rounded-lg border font-medium transition ${
                  params.size === res
                    ? "bg-indigo-600 text-white border-indigo-600"
                    : "bg-white dark:bg-neutral-900 text-neutral-700 dark:text-neutral-300 border-neutral-300 dark:border-neutral-700"
                }`}
              >
                {res} px
              </button>
            ))}
          </div>
        </div>

        {/* Thread Darkness / Strength */}
        <div className="bg-neutral-50/50 dark:bg-neutral-800/30 p-3.5 rounded-xl border border-neutral-100 dark:border-neutral-800 md:col-span-2">
          <div className="flex justify-between items-center text-xs font-semibold text-neutral-800 dark:text-neutral-200 mb-1">
            <span>{t.threadDarkness}</span>
            <span className="font-mono text-indigo-600 dark:text-indigo-400 font-bold">
              {params.strength.toFixed(2)}
            </span>
          </div>
          <div className="flex items-start gap-1.5 text-[11px] text-amber-600 dark:text-amber-400/90 mb-2.5">
            <Info className="w-3.5 h-3.5 shrink-0 mt-0.5" />
            <span>{t.threadDarknessHelp}</span>
          </div>
          <input
            type="range"
            min="0.02"
            max="0.30"
            step="0.01"
            value={params.strength}
            onChange={(e) =>
              handleCustomChange((p) => ({
                ...p,
                strength: parseFloat(e.target.value),
              }))
            }
            className="w-full accent-indigo-600 h-1.5 bg-neutral-200 dark:bg-neutral-700 rounded-lg cursor-pointer"
          />
        </div>

        {/* Min Gap & Start Nail & Allowance */}
        <div className="bg-neutral-50/50 dark:bg-neutral-800/30 p-3.5 rounded-xl border border-neutral-100 dark:border-neutral-800">
          <div className="flex justify-between items-center text-xs font-semibold text-neutral-800 dark:text-neutral-200 mb-1">
            <span>{t.minGap}</span>
            <span className="font-mono text-indigo-600 dark:text-indigo-400 font-bold">
              {params.minGap}
            </span>
          </div>
          <p className="text-[11px] text-neutral-500 dark:text-neutral-400 mb-2">
            {t.minGapHelp}
          </p>
          <input
            type="range"
            min="2"
            max={Math.floor(params.nails / 2)}
            step="1"
            value={params.minGap}
            onChange={(e) =>
              handleCustomChange((p) => ({
                ...p,
                minGap: parseInt(e.target.value, 10),
              }))
            }
            className="w-full accent-indigo-600 h-1.5 bg-neutral-200 dark:bg-neutral-700 rounded-lg cursor-pointer"
          />
        </div>

        <div className="bg-neutral-50/50 dark:bg-neutral-800/30 p-3.5 rounded-xl border border-neutral-100 dark:border-neutral-800">
          <div className="flex justify-between items-center text-xs font-semibold text-neutral-800 dark:text-neutral-200 mb-1">
            <span>{t.allowancePct}</span>
            <span className="font-mono text-indigo-600 dark:text-indigo-400 font-bold">
              +{params.allowancePct}%
            </span>
          </div>
          <p className="text-[11px] text-neutral-500 dark:text-neutral-400 mb-2">
            {t.allowanceHelp}
          </p>
          <input
            type="range"
            min="0"
            max="40"
            step="5"
            value={params.allowancePct}
            onChange={(e) =>
              handleCustomChange((p) => ({
                ...p,
                allowancePct: parseFloat(e.target.value),
              }))
            }
            className="w-full accent-indigo-600 h-1.5 bg-neutral-200 dark:bg-neutral-700 rounded-lg cursor-pointer"
          />
        </div>
      </div>

      {/* Start Button */}
      <button
        onClick={onStartGeneration}
        disabled={isGenerating}
        className="w-full py-4 rounded-xl bg-gradient-to-r from-indigo-600 via-indigo-700 to-rose-600 text-white font-bold text-base shadow-lg shadow-indigo-600/30 hover:opacity-95 active:scale-[0.99] transition disabled:opacity-50 disabled:pointer-events-none flex items-center justify-center gap-2"
      >
        <Sparkles className="w-5 h-5" />
        <span>{t.generateButton}</span>
      </button>
    </div>
  );
}
