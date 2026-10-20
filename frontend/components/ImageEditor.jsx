"use client";

import React, { useState, useRef, useEffect, useCallback } from "react";
import {
  RotateCw,
  ZoomIn,
  SunMedium,
  Contrast,
  RefreshCw,
  ArrowUp,
  ArrowDown,
  ArrowLeft,
  ArrowRight,
  Move,
  Target,
  Smartphone,
  Maximize2
} from "lucide-react";

export default function ImageEditor({
  upload,
  adjustments,
  setAdjustments,
  t,
}) {
  const [isDragging, setIsDragging] = useState(false);
  const [previewGrayscale, setPreviewGrayscale] = useState(true);
  const [stepSize, setStepSize] = useState(15); // px per step

  const containerRef = useRef(null);
  const activePointersRef = useRef(new Map());
  const dragStartRef = useRef({ panX: 0, panY: 0, x: 0, y: 0 });
  const pinchStartRef = useRef(null);
  const holdTimerRef = useRef(null);
  const holdIntervalRef = useRef(null);

  // Clean up any hold timers on unmount
  useEffect(() => {
    return () => {
      if (holdTimerRef.current) clearTimeout(holdTimerRef.current);
      if (holdIntervalRef.current) clearInterval(holdIntervalRef.current);
    };
  }, []);

  // Boundary safety clamp: Prevents dragging the image so far that the edge detaches from the circle
  const clampPan = useCallback((px, py, currentZoom) => {
    const z = Math.max(1.0, currentZoom || adjustments.zoom || 1.0);
    // Allow panning up to the scaled image boundary
    const maxPan = Math.max(25, Math.round((288 * z - 288) / 2));
    return {
      x: Math.max(-maxPan, Math.min(maxPan, px)),
      y: Math.max(-maxPan, Math.min(maxPan, py)),
    };
  }, [adjustments.zoom]);

  // Multi-directional nudge function with boundary clamping
  const nudge = useCallback((dx, dy) => {
    setAdjustments((prev) => {
      const targetX = prev.panX + dx;
      const targetY = prev.panY + dy;
      const clamped = clampPan(targetX, targetY, prev.zoom);
      return {
        ...prev,
        panX: clamped.x,
        panY: clamped.y,
      };
    });
  }, [setAdjustments, clampPan]);

  // Press & hold support for continuous smooth gliding
  const startContinuousNudge = (dx, dy) => {
    nudge(dx, dy);
    if (holdTimerRef.current) clearTimeout(holdTimerRef.current);
    if (holdIntervalRef.current) clearInterval(holdIntervalRef.current);

    holdTimerRef.current = setTimeout(() => {
      holdIntervalRef.current = setInterval(() => {
        nudge(dx, dy);
      }, 70);
    }, 280);
  };

  const stopContinuousNudge = () => {
    if (holdTimerRef.current) clearTimeout(holdTimerRef.current);
    if (holdIntervalRef.current) clearInterval(holdIntervalRef.current);
  };

  // Center & Fit: perfectly snaps image to center (0,0) and ensures frame coverage
  const handleFitCenter = () => {
    setAdjustments((prev) => ({
      ...prev,
      panX: 0,
      panY: 0,
      zoom: Math.max(1.3, prev.zoom), // Ensures no empty margin at edges
    }));
  };

  // Handle Zoom change with auto-clamping
  const handleZoomChange = (newZoom) => {
    setAdjustments((prev) => {
      const clamped = clampPan(prev.panX, prev.panY, newZoom);
      return {
        ...prev,
        zoom: newZoom,
        panX: clamped.x,
        panY: clamped.y,
      };
    });
  };

  // Unified Pointer Event Handlers (Supports Mouse, Single-finger pan & Two-finger pinch-to-zoom)
  const handlePointerDown = (e) => {
    // Only handle primary button for mouse, or any touch point
    if (e.pointerType === "mouse" && e.button !== 0) return;

    activePointersRef.current.set(e.pointerId, { x: e.clientX, y: e.clientY });

    try {
      e.currentTarget.setPointerCapture(e.pointerId);
    } catch {
      // Ignore if pointer capture fails
    }

    if (activePointersRef.current.size === 1) {
      setIsDragging(true);
      dragStartRef.current = {
        panX: adjustments.panX,
        panY: adjustments.panY,
        x: e.clientX,
        y: e.clientY,
      };
      pinchStartRef.current = null;
    } else if (activePointersRef.current.size === 2) {
      // Start two-finger pinch-to-zoom gesture on mobile
      const pts = Array.from(activePointersRef.current.values());
      const dist = Math.hypot(pts[0].x - pts[1].x, pts[0].y - pts[1].y);
      pinchStartRef.current = {
        dist: dist > 0 ? dist : 1,
        initialZoom: adjustments.zoom,
      };
    }
  };

  const handlePointerMove = (e) => {
    if (!activePointersRef.current.has(e.pointerId)) return;

    activePointersRef.current.set(e.pointerId, { x: e.clientX, y: e.clientY });

    // Single touch / mouse dragging: pan left, right, up, down with boundary clamping
    if (activePointersRef.current.size === 1 && isDragging) {
      const deltaX = e.clientX - dragStartRef.current.x;
      const deltaY = e.clientY - dragStartRef.current.y;
      const targetX = Math.round(dragStartRef.current.panX + deltaX);
      const targetY = Math.round(dragStartRef.current.panY + deltaY);
      const clamped = clampPan(targetX, targetY, adjustments.zoom);

      setAdjustments((prev) => ({
        ...prev,
        panX: clamped.x,
        panY: clamped.y,
      }));
    } else if (activePointersRef.current.size === 2 && pinchStartRef.current) {
      // Two-finger pinch-to-zoom
      const pts = Array.from(activePointersRef.current.values());
      const currentDist = Math.hypot(pts[0].x - pts[1].x, pts[0].y - pts[1].y);
      if (pinchStartRef.current.dist > 5) {
        const factor = currentDist / pinchStartRef.current.dist;
        const newZoom = Math.min(3.0, Math.max(0.6, pinchStartRef.current.initialZoom * factor));
        const zoomVal = parseFloat(newZoom.toFixed(2));
        setAdjustments((prev) => {
          const clamped = clampPan(prev.panX, prev.panY, zoomVal);
          return {
            ...prev,
            zoom: zoomVal,
            panX: clamped.x,
            panY: clamped.y,
          };
        });
      }
    }
  };

  const handlePointerUp = (e) => {
    activePointersRef.current.delete(e.pointerId);

    try {
      if (e.currentTarget.hasPointerCapture(e.pointerId)) {
        e.currentTarget.releasePointerCapture(e.pointerId);
      }
    } catch {
      // Ignore
    }

    if (activePointersRef.current.size === 0) {
      setIsDragging(false);
      pinchStartRef.current = null;
    } else if (activePointersRef.current.size === 1) {
      // If one pointer remains after pinch, reset drag origin to prevent jumps
      const remaining = Array.from(activePointersRef.current.values())[0];
      dragStartRef.current = {
        panX: adjustments.panX,
        panY: adjustments.panY,
        x: remaining.x,
        y: remaining.y,
      };
      pinchStartRef.current = null;
    }
  };

  // Reset all adjustments to default
  const handleReset = () => {
    setAdjustments({
      zoom: 1.35,
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

  const imageUrl = upload.localPreviewUrl || `/api/uploads/${upload.uploadId}/preview`;

  return (
    <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-2xl p-5 shadow-sm transition-colors">
      {/* Header */}
      <div className="flex items-center justify-between mb-4 flex-wrap gap-2">
        <div>
          <h2 className="font-bold text-base text-neutral-900 dark:text-neutral-100 flex items-center gap-2">
            <span>{t.adjustTitle}</span>
            <span className="hidden sm:inline-flex items-center gap-1 text-[10px] font-semibold px-2 py-0.5 rounded-full bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 border border-indigo-200 dark:border-indigo-800">
              <Smartphone className="w-3 h-3" />
              {t.dir === "rtl" ? "تأطير دائري تفاعلي" : "Live Viewfinder"}
            </span>
          </h2>
          <p className="text-xs text-neutral-500 dark:text-neutral-400">
            {t.adjustDesc}
          </p>
        </div>
        <div className="flex items-center gap-2">
          {/* Fit Center Quick Action */}
          <button
            type="button"
            onClick={handleFitCenter}
            className="flex items-center gap-1 text-xs px-2.5 py-1 rounded-md font-bold bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 border border-indigo-200 dark:border-indigo-800/80 hover:bg-indigo-100 dark:hover:bg-indigo-900/60 transition cursor-pointer"
            title={t.dir === "rtl" ? "توسيط واحتواء الصورة في المركز" : "Fit Center & Fill Circle"}
          >
            <Target className="w-3.5 h-3.5" />
            <span>{t.dir === "rtl" ? "توسيط" : "Fit Center"}</span>
          </button>

          <button
            type="button"
            onClick={() => setPreviewGrayscale(!previewGrayscale)}
            className={`text-xs px-2.5 py-1 rounded-md border font-medium transition cursor-pointer ${
              previewGrayscale
                ? "bg-neutral-900 text-white dark:bg-neutral-100 dark:text-neutral-900 border-transparent"
                : "bg-neutral-100 dark:bg-neutral-800 text-neutral-700 dark:text-neutral-300 border-neutral-200 dark:border-neutral-700"
            }`}
          >
            {previewGrayscale ? "Grayscale" : "Color"}
          </button>

          <button
            type="button"
            onClick={handleReset}
            className="p-1.5 text-neutral-500 hover:text-neutral-800 dark:hover:text-neutral-200 rounded-md hover:bg-neutral-100 dark:hover:bg-neutral-800 transition cursor-pointer"
            title={t.resetAdjust}
          >
            <RefreshCw className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Column: Circular Viewport & Directional D-Pad */}
        <div className="lg:col-span-6 flex flex-col items-center">
          {/* Circular Touch / Mouse Viewport (Clean white background matching actual string art canvas board) */}
          <div
            ref={containerRef}
            onPointerDown={handlePointerDown}
            onPointerMove={handlePointerMove}
            onPointerUp={handlePointerUp}
            onPointerCancel={handlePointerUp}
            className={`relative w-64 h-64 sm:w-72 sm:h-72 rounded-full overflow-hidden shadow-2xl border-4 border-dashed transition-colors select-none touch-none ${
              isDragging
                ? "border-indigo-400 bg-white dark:bg-neutral-900 cursor-grabbing ring-4 ring-indigo-500/20"
                : "border-indigo-500/80 bg-white dark:bg-neutral-900 cursor-grab hover:border-indigo-400"
            }`}
            style={{ touchAction: "none" }}
            title={t.panHint || "Drag to move image in any direction"}
          >
            {/* Guidelines & Alignment Crosshairs */}
            <div className="absolute inset-0 pointer-events-none z-10">
              <div className="absolute top-1/2 left-0 right-0 h-[1px] bg-indigo-500/30 -translate-y-1/2" />
              <div className="absolute left-1/2 top-0 bottom-0 w-[1px] bg-indigo-500/30 -translate-x-1/2" />
              {/* Inner focus circle */}
              <div className="absolute inset-8 rounded-full border border-indigo-400/20" />
            </div>

            {/* Transformed Image pinned inside bounds */}
            <img
              src={imageUrl}
              alt="Subject Preview"
              draggable={false}
              className="absolute inset-0 pointer-events-none origin-center max-w-none transition-filter"
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

            {/* Live Pan Offset Floating Badge during Drag */}
            {isDragging && (
              <div className="absolute bottom-3 left-1/2 -translate-x-1/2 z-20 pointer-events-none px-2.5 py-1 rounded-full bg-neutral-900/85 backdrop-blur-md border border-neutral-700 text-[10px] font-mono font-bold text-white shadow-lg flex items-center gap-1.5 animate-pulse">
                <Move className="w-2.5 h-2.5 text-indigo-400" />
                <span>X: {adjustments.panX}px</span>
                <span className="opacity-40">|</span>
                <span>Y: {adjustments.panY}px</span>
              </div>
            )}
          </div>

          {/* Interactive Mobile-Style D-Pad Directional Controls */}
          <div className="mt-4 w-full max-w-xs bg-neutral-50 dark:bg-neutral-800/60 border border-neutral-200 dark:border-neutral-700/70 rounded-2xl p-3 shadow-inner">
            <div className="flex items-center justify-between mb-2 px-1">
              <span className="text-[11px] font-bold text-neutral-700 dark:text-neutral-300 flex items-center gap-1">
                <Smartphone className="w-3 h-3 text-indigo-600 dark:text-indigo-400" />
                {t.positionControls || "تحريك الصورة (نمط الهاتف)"}
              </span>
              <div className="flex items-center gap-1.5 text-[10px] font-mono text-neutral-500 dark:text-neutral-400">
                <span>X:{adjustments.panX}</span>
                <span>Y:{adjustments.panY}</span>
                <button
                  type="button"
                  onClick={handleFitCenter}
                  className="px-1.5 py-0.5 rounded bg-indigo-100 hover:bg-indigo-200 dark:bg-indigo-950 dark:hover:bg-indigo-900 text-indigo-700 dark:text-indigo-300 text-[9px] font-bold transition cursor-pointer"
                  title={t.dir === "rtl" ? "توسيط واحتواء" : "Fit Center"}
                >
                  {t.dir === "rtl" ? "توسيط" : "Center"}
                </button>
              </div>
            </div>

            {/* D-Pad Buttons Grid */}
            <div className="flex items-center justify-center gap-2">
              {/* Step Size Selector */}
              <div className="flex flex-col gap-1">
                <button
                  type="button"
                  onClick={() => setStepSize(5)}
                  className={`text-[9px] px-1.5 py-1 rounded font-bold border transition cursor-pointer ${
                    stepSize === 5
                      ? "bg-indigo-600 text-white border-indigo-600"
                      : "bg-white dark:bg-neutral-800 text-neutral-600 dark:text-neutral-300 border-neutral-200 dark:border-neutral-700 hover:bg-neutral-100"
                  }`}
                  title="5px step (دقيق)"
                >
                  5px
                </button>
                <button
                  type="button"
                  onClick={() => setStepSize(15)}
                  className={`text-[9px] px-1.5 py-1 rounded font-bold border transition cursor-pointer ${
                    stepSize === 15
                      ? "bg-indigo-600 text-white border-indigo-600"
                      : "bg-white dark:bg-neutral-800 text-neutral-600 dark:text-neutral-300 border-neutral-200 dark:border-neutral-700 hover:bg-neutral-100"
                  }`}
                  title="15px step (قياسي)"
                >
                  15px
                </button>
              </div>

              {/* D-Pad Cross */}
              <div className="grid grid-cols-3 gap-1.5 w-36 h-36 p-1 bg-white dark:bg-neutral-900 rounded-xl border border-neutral-200 dark:border-neutral-700/80 shadow-sm place-items-center">
                {/* Empty Top-Left */}
                <div />

                {/* UP Button */}
                <button
                  type="button"
                  onMouseDown={() => startContinuousNudge(0, -stepSize)}
                  onMouseUp={stopContinuousNudge}
                  onMouseLeave={stopContinuousNudge}
                  onTouchStart={() => startContinuousNudge(0, -stepSize)}
                  onTouchEnd={stopContinuousNudge}
                  className="w-10 h-10 rounded-lg flex items-center justify-center bg-neutral-100 dark:bg-neutral-800 hover:bg-indigo-50 dark:hover:bg-indigo-950/40 text-neutral-700 dark:text-neutral-200 hover:text-indigo-600 dark:hover:text-indigo-400 active:scale-95 transition shadow-sm border border-neutral-200 dark:border-neutral-700 cursor-pointer"
                  title={t.moveUp || "تحريك لأعلى"}
                  aria-label="Move Up"
                >
                  <ArrowUp className="w-4 h-4" />
                </button>

                {/* Empty Top-Right */}
                <div />

                {/* LEFT Button */}
                <button
                  type="button"
                  onMouseDown={() => startContinuousNudge(-stepSize, 0)}
                  onMouseUp={stopContinuousNudge}
                  onMouseLeave={stopContinuousNudge}
                  onTouchStart={() => startContinuousNudge(-stepSize, 0)}
                  onTouchEnd={stopContinuousNudge}
                  className="w-10 h-10 rounded-lg flex items-center justify-center bg-neutral-100 dark:bg-neutral-800 hover:bg-indigo-50 dark:hover:bg-indigo-950/40 text-neutral-700 dark:text-neutral-200 hover:text-indigo-600 dark:hover:text-indigo-400 active:scale-95 transition shadow-sm border border-neutral-200 dark:border-neutral-700 cursor-pointer"
                  title={t.moveLeft || "تحريك لليسار"}
                  aria-label="Move Left"
                >
                  <ArrowLeft className="w-4 h-4" />
                </button>

                {/* CENTER Target Button (Fit Center) */}
                <button
                  type="button"
                  onClick={handleFitCenter}
                  className="w-10 h-10 rounded-lg flex items-center justify-center bg-indigo-50 dark:bg-indigo-950/60 hover:bg-indigo-100 dark:hover:bg-indigo-900/60 text-indigo-600 dark:text-indigo-300 active:scale-95 transition shadow-sm border border-indigo-200 dark:border-indigo-800/80 font-bold cursor-pointer"
                  title={t.dir === "rtl" ? "توسيط واحتواء الصورة" : "Fit Center"}
                  aria-label="Fit Center"
                >
                  <Target className="w-4 h-4" />
                </button>

                {/* RIGHT Button */}
                <button
                  type="button"
                  onMouseDown={() => startContinuousNudge(stepSize, 0)}
                  onMouseUp={stopContinuousNudge}
                  onMouseLeave={stopContinuousNudge}
                  onTouchStart={() => startContinuousNudge(stepSize, 0)}
                  onTouchEnd={stopContinuousNudge}
                  className="w-10 h-10 rounded-lg flex items-center justify-center bg-neutral-100 dark:bg-neutral-800 hover:bg-indigo-50 dark:hover:bg-indigo-950/40 text-neutral-700 dark:text-neutral-200 hover:text-indigo-600 dark:hover:text-indigo-400 active:scale-95 transition shadow-sm border border-neutral-200 dark:border-neutral-700 cursor-pointer"
                  title={t.moveRight || "تحريك لليمين"}
                  aria-label="Move Right"
                >
                  <ArrowRight className="w-4 h-4" />
                </button>

                {/* Empty Bottom-Left */}
                <div />

                {/* DOWN Button */}
                <button
                  type="button"
                  onMouseDown={() => startContinuousNudge(0, stepSize)}
                  onMouseUp={stopContinuousNudge}
                  onMouseLeave={stopContinuousNudge}
                  onTouchStart={() => startContinuousNudge(0, stepSize)}
                  onTouchEnd={stopContinuousNudge}
                  className="w-10 h-10 rounded-lg flex items-center justify-center bg-neutral-100 dark:bg-neutral-800 hover:bg-indigo-50 dark:hover:bg-indigo-950/40 text-neutral-700 dark:text-neutral-200 hover:text-indigo-600 dark:hover:text-indigo-400 active:scale-95 transition shadow-sm border border-neutral-200 dark:border-neutral-700 cursor-pointer"
                  title={t.moveDown || "تحريك لأسفل"}
                  aria-label="Move Down"
                >
                  <ArrowDown className="w-4 h-4" />
                </button>

                {/* Empty Bottom-Right */}
                <div />
              </div>
            </div>

            <p className="text-[10px] text-neutral-400 dark:text-neutral-500 mt-2 text-center">
              {t.dir === "rtl"
                ? "💡 اضغط 'توسيط' لإعادة الصورة إلى المركز فوراً دون فراغات."
                : "💡 Click 'Center' to instantly snap image to center with no margins."}
            </p>
          </div>

          <div className="mt-3 text-[11px] leading-relaxed p-2.5 rounded-xl bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-900/50 text-amber-800 dark:text-amber-300 w-full max-w-sm">
            {t.dir === "rtl"
              ? "💡 نصيحة التوسيط: استخدم زر 'توسيط' لتثبيت الوجه في المركز، واضبط التكبير بين (1.3x - 1.5x) لملء الدائرة بالكامل دون إظهار حواف فارغة."
              : "💡 Fit Center Tip: Click 'Fit Center' to lock the face in the circle, and keep zoom between 1.3x–1.5x to fill the frame completely."}
          </div>
        </div>

        {/* Right Column: Controls Sliders Panel */}
        <div className="lg:col-span-6 space-y-4">
          {/* Zoom */}
          <div className="p-3 bg-neutral-50 dark:bg-neutral-800/40 rounded-xl border border-neutral-200/80 dark:border-neutral-800">
            <div className="flex justify-between text-xs font-semibold text-neutral-700 dark:text-neutral-300 mb-1.5">
              <span className="flex items-center gap-1.5">
                <ZoomIn className="w-3.5 h-3.5 text-neutral-500" />
                {t.zoom}
              </span>
              <span className="font-mono font-black text-indigo-600 dark:text-indigo-400">
                {adjustments.zoom.toFixed(2)}x
              </span>
            </div>
            <input
              type="range"
              min="0.6"
              max="3.0"
              step="0.05"
              value={adjustments.zoom}
              onChange={(e) => handleZoomChange(parseFloat(e.target.value))}
              className="w-full accent-indigo-600 h-1.5 bg-neutral-200 dark:bg-neutral-700 rounded-lg cursor-pointer"
            />
            <div className="flex justify-between text-[10px] text-neutral-400 mt-1">
              <span>0.6x (كامل الصورة)</span>
              <span>1.35x (توسيط الوجه)</span>
              <span>3.0x (تفاصيل مجهرية)</span>
            </div>
          </div>

          {/* Rotation */}
          <div className="p-3 bg-neutral-50 dark:bg-neutral-800/40 rounded-xl border border-neutral-200/80 dark:border-neutral-800">
            <div className="flex justify-between items-center text-xs font-semibold text-neutral-700 dark:text-neutral-300 mb-1.5">
              <span className="flex items-center gap-1.5">
                <RotateCw className="w-3.5 h-3.5 text-neutral-500" />
                {t.rotation}
              </span>
              <div className="flex items-center gap-2">
                <span className="font-mono font-black text-indigo-600 dark:text-indigo-400">
                  {adjustments.rotation}°
                </span>
                <button
                  type="button"
                  onClick={handleRotate90}
                  className="px-2 py-0.5 text-[10px] font-bold bg-neutral-200/70 dark:bg-neutral-700 hover:bg-neutral-300 dark:hover:bg-neutral-600 rounded border border-neutral-300 dark:border-neutral-600 transition cursor-pointer"
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
          <div className="p-3 bg-neutral-50 dark:bg-neutral-800/40 rounded-xl border border-neutral-200/80 dark:border-neutral-800">
            <div className="flex justify-between text-xs font-semibold text-neutral-700 dark:text-neutral-300 mb-1.5">
              <span className="flex items-center gap-1.5">
                <SunMedium className="w-3.5 h-3.5 text-neutral-500" />
                {t.brightness}
              </span>
              <span className="font-mono font-black text-indigo-600 dark:text-indigo-400">
                {adjustments.brightness.toFixed(2)}
              </span>
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
          <div className="p-3 bg-neutral-50 dark:bg-neutral-800/40 rounded-xl border border-neutral-200/80 dark:border-neutral-800">
            <div className="flex justify-between text-xs font-semibold text-neutral-700 dark:text-neutral-300 mb-1.5">
              <span className="flex items-center gap-1.5">
                <Contrast className="w-3.5 h-3.5 text-neutral-500" />
                {t.contrast}
              </span>
              <span className="font-mono font-black text-indigo-600 dark:text-indigo-400">
                {adjustments.contrast.toFixed(2)}
              </span>
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
            <p className="text-[10px] text-neutral-400 mt-1">
              {t.dir === "rtl"
                ? "نصيحة: تباين 1.30 – 1.45 يعطي ملامح بارزة وسواداً ناصعاً للأعين والشعر."
                : "Tip: Contrast 1.30 – 1.45 yields deep contours and rich eye/hair definition."}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
