"use client";

import React, { useState, useRef, useEffect } from "react";
import { RotateCw, ZoomIn, SunMedium, Contrast, RefreshCw } from "lucide-react";

export default function ImageEditor({
  upload,
  adjustments,
  setAdjustments,
  t,
}) {
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [previewGrayscale, setPreviewGrayscale] = useState(true);

  const containerRef = useRef(null);

  // Handle Pan
  const handleMouseDown = (e) => {
    setIsDragging(true);
    setDragStart({
      x: e.clientX - adjustments.panX,
      y: e.clientY - adjustments.panY,
    });
  };

  const handleMouseMove = (e) => {
    if (!isDragging) return;
    setAdjustments((prev) => ({
      ...prev,
      panX: e.clientX - dragStart.x,
      panY: e.clientY - dragStart.y,
    }));
  };

  const handleMouseUp = () => setIsDragging(false);

  // Reset to default
  const handleReset = () => {
    setAdjustments({
      zoom: 1.0,
      rotation: 0,
      brightness: 1.0,
      contrast: 1.0,
      panX: 0,
      panY: 0,
    });
  };

  // Rotate 90 degrees clockwise
  const handleRotate90 = () => {
    setAdjustments((prev) => ({
      ...prev,
      rotation: (prev.rotation + 90) % 360,
    }));
  };

  const imageUrl = `/api/uploads/${upload.uploadId}/preview`;

  return (
    <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-2xl p-5 shadow-sm">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h2 className="font-bold text-base text-neutral-900 dark:text-neutral-100">
            {t.adjustTitle}
          </h2>
          <p className="text-xs text-neutral-500 dark:text-neutral-400">
            {t.adjustDesc}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setPreviewGrayscale(!previewGrayscale)}
            className={`text-xs px-2.5 py-1 rounded-md border font-medium transition ${
              previewGrayscale
                ? "bg-neutral-900 text-white dark:bg-neutral-100 dark:text-neutral-900 border-transparent"
                : "bg-neutral-100 dark:bg-neutral-800 text-neutral-700 dark:text-neutral-300 border-neutral-200 dark:border-neutral-700"
            }`}
          >
            {previewGrayscale ? "Grayscale" : "Color"}
          </button>
          <button
            onClick={handleReset}
            className="p-1.5 text-neutral-500 hover:text-neutral-800 dark:hover:text-neutral-200 rounded-md hover:bg-neutral-100 dark:hover:bg-neutral-800 transition"
            title={t.resetAdjust}
          >
            <RefreshCw className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-center">
        {/* Circular Viewport */}
        <div className="md:col-span-6 flex flex-col items-center">
          <div
            ref={containerRef}
            onMouseDown={handleMouseDown}
            onMouseMove={handleMouseMove}
            onMouseUp={handleMouseUp}
            onMouseLeave={handleMouseUp}
            className="relative w-64 h-64 sm:w-72 sm:h-72 rounded-full overflow-hidden shadow-2xl border-4 border-dashed border-indigo-500/80 bg-neutral-950 cursor-grab active:cursor-grabbing select-none"
          >
            {/* Guidelines */}
            <div className="absolute inset-0 pointer-events-none z-10">
              <div className="absolute top-1/2 left-0 right-0 h-[1px] bg-indigo-500/30 -translate-y-1/2" />
              <div className="absolute left-1/2 top-0 bottom-0 w-[1px] bg-indigo-500/30 -translate-x-1/2" />
              {/* Inner focus circle */}
              <div className="absolute inset-8 rounded-full border border-indigo-400/20" />
            </div>

            {/* Transformed Image */}
            <img
              src={imageUrl}
              alt="Subject Preview"
              draggable={false}
              className="absolute pointer-events-none origin-center max-w-none transition-filter"
              style={{
                width: "100%",
                height: "100%",
                objectFit: "cover",
                transform: `translate(${adjustments.panX}px, ${adjustments.panY}px) scale(${adjustments.zoom}) rotate(${adjustments.rotation}deg)`,
                filter: `
                  ${previewGrayscale ? "grayscale(100%)" : "grayscale(0%)"}
                  brightness(${adjustments.brightness})
                  contrast(${adjustments.contrast})
                `,
              }}
            />
          </div>
          <p className="text-[11px] text-neutral-400 mt-2 text-center">
            {t.dir === "rtl" ? "اسحب داخل الدائرة للتحريك" : "Drag inside circle to position subject"}
          </p>
        </div>

        {/* Controls Slider Panel */}
        <div className="md:col-span-6 space-y-4">
          {/* Zoom */}
          <div>
            <div className="flex justify-between text-xs font-medium text-neutral-700 dark:text-neutral-300 mb-1">
              <span className="flex items-center gap-1.5">
                <ZoomIn className="w-3.5 h-3.5 text-neutral-500" />
                {t.zoom}
              </span>
              <span>{adjustments.zoom.toFixed(2)}x</span>
            </div>
            <input
              type="range"
              min="0.6"
              max="3.0"
              step="0.05"
              value={adjustments.zoom}
              onChange={(e) =>
                setAdjustments((p) => ({ ...p, zoom: parseFloat(e.target.value) }))
              }
              className="w-full accent-indigo-600 h-1.5 bg-neutral-200 dark:bg-neutral-700 rounded-lg cursor-pointer"
            />
          </div>

          {/* Rotation */}
          <div>
            <div className="flex justify-between items-center text-xs font-medium text-neutral-700 dark:text-neutral-300 mb-1">
              <span className="flex items-center gap-1.5">
                <RotateCw className="w-3.5 h-3.5 text-neutral-500" />
                {t.rotation}
              </span>
              <div className="flex items-center gap-2">
                <span>{adjustments.rotation}°</span>
                <button
                  onClick={handleRotate90}
                  className="px-2 py-0.5 text-[10px] bg-neutral-100 dark:bg-neutral-800 hover:bg-neutral-200 dark:hover:bg-neutral-700 rounded border border-neutral-300 dark:border-neutral-700"
                >
                  {t.rotate90}
                </button>
              </div>
            </div>
            <input
              type="range"
              min="-180"
              max="180"
              step="1"
              value={adjustments.rotation}
              onChange={(e) =>
                setAdjustments((p) => ({ ...p, rotation: parseInt(e.target.value, 10) }))
              }
              className="w-full accent-indigo-600 h-1.5 bg-neutral-200 dark:bg-neutral-700 rounded-lg cursor-pointer"
            />
          </div>

          {/* Brightness */}
          <div>
            <div className="flex justify-between text-xs font-medium text-neutral-700 dark:text-neutral-300 mb-1">
              <span className="flex items-center gap-1.5">
                <SunMedium className="w-3.5 h-3.5 text-neutral-500" />
                {t.brightness}
              </span>
              <span>{adjustments.brightness.toFixed(2)}</span>
            </div>
            <input
              type="range"
              min="0.5"
              max="2.0"
              step="0.05"
              value={adjustments.brightness}
              onChange={(e) =>
                setAdjustments((p) => ({ ...p, brightness: parseFloat(e.target.value) }))
              }
              className="w-full accent-indigo-600 h-1.5 bg-neutral-200 dark:bg-neutral-700 rounded-lg cursor-pointer"
            />
          </div>

          {/* Contrast */}
          <div>
            <div className="flex justify-between text-xs font-medium text-neutral-700 dark:text-neutral-300 mb-1">
              <span className="flex items-center gap-1.5">
                <Contrast className="w-3.5 h-3.5 text-neutral-500" />
                {t.contrast}
              </span>
              <span>{adjustments.contrast.toFixed(2)}</span>
            </div>
            <input
              type="range"
              min="0.5"
              max="2.2"
              step="0.05"
              value={adjustments.contrast}
              onChange={(e) =>
                setAdjustments((p) => ({ ...p, contrast: parseFloat(e.target.value) }))
              }
              className="w-full accent-indigo-600 h-1.5 bg-neutral-200 dark:bg-neutral-700 rounded-lg cursor-pointer"
            />
          </div>
        </div>
      </div>
    </div>
  );
}
