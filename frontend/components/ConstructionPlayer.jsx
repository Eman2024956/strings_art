"use client";

import React, { useState, useEffect, useRef } from "react";
import {
  Play,
  Pause,
  SkipBack,
  SkipForward,
  RotateCcw,
  FastForward,
  BookmarkCheck,
} from "lucide-react";

export default function ConstructionPlayer({
  jobId,
  sequence,
  currentStep,
  setCurrentStep,
  t,
}) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [speed, setSpeed] = useState(5); // steps per second
  const [savedLocally, setSavedLocally] = useState(false);

  const totalSteps = sequence ? sequence.length - 1 : 0;
  const timerRef = useRef(null);
  const currentStepRef = useRef(currentStep);

  useEffect(() => {
    currentStepRef.current = currentStep;
  }, [currentStep]);

  // Restore saved progress from localStorage on mount
  useEffect(() => {
    if (jobId && totalSteps > 0) {
      try {
        const saved = localStorage.getItem(`string_art_step_${jobId}`);
        if (saved) {
          const parsed = parseInt(saved, 10);
          if (!isNaN(parsed) && parsed >= 1 && parsed <= totalSteps && parsed !== currentStepRef.current) {
            setCurrentStep(parsed);
          }
          setSavedLocally(true);
        }
      } catch (e) {
        // Ignore localStorage access errors
      }
    }
  }, [jobId, totalSteps, setCurrentStep]);

  // Save progress whenever step changes
  useEffect(() => {
    if (jobId && currentStep > 0) {
      try {
        localStorage.setItem(`string_art_step_${jobId}`, currentStep.toString());
      } catch (e) {}
    }
  }, [jobId, currentStep]);

  // Handle Play / Pause animation loop cleanly without calling setIsPlaying inside setCurrentStep
  useEffect(() => {
    if (!isPlaying) {
      if (timerRef.current) clearInterval(timerRef.current);
      return;
    }

    const intervalMs = Math.max(20, Math.floor(1000 / speed));
    timerRef.current = setInterval(() => {
      if (currentStepRef.current >= totalSteps) {
        setIsPlaying(false);
        return;
      }
      setCurrentStep((prev) => Math.min(totalSteps, prev + 1));
    }, intervalMs);

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [isPlaying, speed, totalSteps, setCurrentStep]);

  if (!sequence || sequence.length < 2) return null;

  const fromNail = sequence[Math.max(0, currentStep - 1)];
  const toNail = sequence[Math.min(sequence.length - 1, currentStep)];

  const handleSeek = (newStep) => {
    setIsPlaying(false);
    setCurrentStep(Math.max(1, Math.min(totalSteps, newStep)));
  };

  return (
    <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-2xl p-5 shadow-sm space-y-4">
      {/* Header & saved status */}
      <div className="flex items-center justify-between">
        <h3 className="font-bold text-sm text-neutral-900 dark:text-neutral-100 flex items-center gap-2">
          <span>{t.playerTitle}</span>
        </h3>
        {savedLocally && (
          <span className="flex items-center gap-1 text-[11px] text-emerald-600 dark:text-emerald-400 font-medium">
            <BookmarkCheck className="w-3.5 h-3.5" />
            <span>{t.savedProgress}</span>
          </span>
        )}
      </div>

      {/* Active step banner */}
      <div className="bg-gradient-to-r from-indigo-50 via-purple-50 to-rose-50 dark:from-neutral-800 dark:to-neutral-800/80 p-4 rounded-xl border border-indigo-100 dark:border-neutral-700 flex items-center justify-between shadow-sm">
        <div>
          <span className="text-xs uppercase font-bold text-neutral-600 dark:text-neutral-400">
            {t.currentStep}
          </span>
          <div className="text-2xl sm:text-3xl font-black text-neutral-900 dark:text-white font-mono tracking-tight mt-0.5">
            <span className="font-black">{currentStep}</span>
            <span className="text-neutral-400 font-bold mx-1">/</span>
            <span className="font-black text-neutral-700 dark:text-neutral-300">{totalSteps}</span>
          </div>
        </div>
        <div className="text-end">
          <span className="text-xs uppercase font-bold text-neutral-600 dark:text-neutral-400">
            {t.viewStringArt}
          </span>
          <div className="text-2xl sm:text-3xl font-black text-rose-600 dark:text-rose-400 font-mono tracking-wide mt-0.5">
            <span className="font-black text-indigo-600 dark:text-indigo-400">#{fromNail}</span>
            <span className="text-neutral-400 font-bold mx-1.5">➔</span>
            <span className="font-black text-rose-600 dark:text-rose-400">#{toNail}</span>
          </div>
        </div>
      </div>

      {/* Scrubber slider */}
      <div className="space-y-1.5">
        <input
          type="range"
          min="1"
          max={totalSteps}
          value={currentStep}
          onChange={(e) => handleSeek(parseInt(e.target.value, 10))}
          className="w-full accent-indigo-600 h-2 bg-neutral-200 dark:bg-neutral-700 rounded-lg cursor-pointer"
        />
        <div className="flex justify-between text-xs font-black text-neutral-600 dark:text-neutral-400 font-mono px-0.5">
          <span className="font-black">#1</span>
          <span className="font-black">#{totalSteps}</span>
        </div>
      </div>

      {/* Controls Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 pt-1">
        {/* Playback buttons */}
        <div className="flex items-center gap-1.5">
          <button
            onClick={() => handleSeek(1)}
            className="p-2 rounded-lg text-neutral-600 dark:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-neutral-800 transition"
            title={t.resetPlayer}
          >
            <RotateCcw className="w-4 h-4" />
          </button>
          <button
            onClick={() => handleSeek(currentStep - 1)}
            disabled={currentStep <= 1}
            className="p-2 rounded-lg text-neutral-600 dark:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-neutral-800 transition disabled:opacity-40"
            title={t.stepPrev}
          >
            <SkipBack className="w-4 h-4" />
          </button>
          <button
            onClick={() => {
              if (!isPlaying && currentStep >= totalSteps) {
                setCurrentStep(1);
              }
              setIsPlaying(!isPlaying);
            }}
            className="px-4 py-2 rounded-xl bg-indigo-600 text-white font-bold hover:bg-indigo-700 transition flex items-center gap-1.5 shadow-md shadow-indigo-600/20"
          >
            {isPlaying ? (
              <>
                <Pause className="w-4 h-4 fill-white" />
                <span className="text-xs">{t.pause}</span>
              </>
            ) : (
              <>
                <Play className="w-4 h-4 fill-white" />
                <span className="text-xs">{t.play}</span>
              </>
            )}
          </button>
          <button
            onClick={() => handleSeek(currentStep + 1)}
            disabled={currentStep >= totalSteps}
            className="p-2 rounded-lg text-neutral-600 dark:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-neutral-800 transition disabled:opacity-40"
            title={t.stepNext}
          >
            <SkipForward className="w-4 h-4" />
          </button>
          <button
            onClick={() => handleSeek(totalSteps)}
            className="p-2 rounded-lg text-neutral-600 dark:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-neutral-800 transition"
            title={t.jumpEnd}
          >
            <FastForward className="w-4 h-4" />
          </button>
        </div>

        {/* Speed Selector */}
        <div className="flex items-center gap-1 bg-neutral-100 dark:bg-neutral-800 p-1 rounded-lg">
          {[1, 5, 15, 30, 60].map((s) => (
            <button
              key={s}
              onClick={() => setSpeed(s)}
              className={`px-2.5 py-1 text-xs font-black font-mono rounded-md transition ${
                speed === s
                  ? "bg-white dark:bg-neutral-700 text-indigo-600 dark:text-indigo-400 shadow-sm"
                  : "text-neutral-500 hover:text-neutral-800 dark:hover:text-neutral-200"
              }`}
            >
              {s}x
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
