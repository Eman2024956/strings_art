"use client";

import React, { useRef, useEffect, useState, useCallback } from "react";
import {
  ZoomIn,
  ZoomOut,
  Maximize2,
  Eye,
  Layers,
  Sparkles,
  Columns,
} from "lucide-react";

export default function StudioCanvas({
  jobResult,
  uploadId,
  currentStepIndex,
  showNails = true,
  viewMode = "string_art",
  setViewMode,
  t,
}) {
  const containerRef = useRef(null);
  const canvasRef = useRef(null);

  // Zoom & Pan state
  const [zoom, setZoom] = useState(1.0);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [isPanning, setIsPanning] = useState(false);
  const [startPan, setStartPan] = useState({ x: 0, y: 0 });
  const [splitPos, setSplitPos] = useState(50); // percentage for split comparison

  const [targetImg, setTargetImg] = useState(null);
  const [originalImg, setOriginalImg] = useState(null);

  // Load target & original images when job completes
  useEffect(() => {
    if (jobResult?.job_id) {
      const img = new Image();
      img.src = `/api/jobs/${jobResult.job_id}/downloads/target.png`;
      img.onload = () => setTargetImg(img);
    }
    if (uploadId) {
      const orig = new Image();
      orig.src = `/api/uploads/${uploadId}/preview`;
      orig.onload = () => setOriginalImg(orig);
    }
  }, [jobResult, uploadId]);

  // Redraw canvas
  const draw = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas || !jobResult) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const width = canvas.width;
    const height = canvas.height;
    ctx.clearRect(0, 0, width, height);

    // Save context for pan/zoom
    ctx.save();
    ctx.translate(width / 2 + pan.x, height / 2 + pan.y);
    ctx.scale(zoom, zoom);
    ctx.translate(-width / 2, -height / 2);

    const center = width / 2;
    const radius = center - 20;

    // Background circle
    ctx.fillStyle = "#ffffff";
    ctx.beginPath();
    ctx.arc(center, center, radius, 0, 2 * Math.PI);
    ctx.fill();

    // Draw images if in Target, Original, or Overlay view
    if ((viewMode === "target" || viewMode === "overlay") && targetImg) {
      ctx.save();
      ctx.beginPath();
      ctx.arc(center, center, radius, 0, 2 * Math.PI);
      ctx.clip();
      ctx.globalAlpha = viewMode === "overlay" ? 0.45 : 1.0;
      ctx.drawImage(targetImg, center - radius, center - radius, radius * 2, radius * 2);
      ctx.restore();
    } else if (viewMode === "original" && originalImg) {
      ctx.save();
      ctx.beginPath();
      ctx.arc(center, center, radius, 0, 2 * Math.PI);
      ctx.clip();
      ctx.drawImage(originalImg, center - radius, center - radius, radius * 2, radius * 2);
      ctx.restore();
    }

    // Draw String Art lines (in string_art, overlay, or split modes)
    if (
      (viewMode === "string_art" || viewMode === "overlay" || viewMode === "split") &&
      jobResult.nails_px &&
      jobResult.sequence
    ) {
      const nails = jobResult.nails_px;
      const sequence = jobResult.sequence;
      const stepsToRender =
        currentStepIndex !== null && currentStepIndex !== undefined
          ? Math.min(currentStepIndex, sequence.length - 1)
          : sequence.length - 1;

      // Scaling from calculation resolution (e.g. 300) to display canvas size
      const resSize = jobResult.size || 300;
      const scale = (radius * 2) / (resSize - 4);
      const resCenter = (resSize - 1) / 2;

      const getCanvasNail = (idx) => {
        const pt = nails[idx];
        if (!pt) return [center, center];
        const nx = center + (pt[0] - resCenter) * scale;
        const ny = center + (pt[1] - resCenter) * scale;
        return [nx, ny];
      };

      // Clip for split mode
      if (viewMode === "split") {
        ctx.save();
        ctx.beginPath();
        const splitX = (splitPos / 100) * width;
        ctx.rect(0, 0, splitX, height);
        ctx.clip();
        if (targetImg) {
          ctx.beginPath();
          ctx.arc(center, center, radius, 0, 2 * Math.PI);
          ctx.clip();
          ctx.drawImage(targetImg, center - radius, center - radius, radius * 2, radius * 2);
        }
        ctx.restore();

        ctx.save();
        ctx.beginPath();
        const splitRight = (splitPos / 100) * width;
        ctx.rect(splitRight, 0, width - splitRight, height);
        ctx.clip();
      }

      // Draw all string segments up to stepsToRender
      ctx.beginPath();
      ctx.strokeStyle = "rgba(10, 10, 10, 0.16)";
      ctx.lineWidth = 0.65;

      for (let i = 1; i <= stepsToRender; i++) {
        const fromNail = sequence[i - 1] - 1;
        const toNail = sequence[i] - 1;
        const p1 = getCanvasNail(fromNail);
        const p2 = getCanvasNail(toNail);
        ctx.moveTo(p1[0], p1[1]);
        ctx.lineTo(p2[0], p2[1]);
      }
      ctx.stroke();

      // Highlight the active segment if player is at a specific step
      if (
        currentStepIndex !== null &&
        currentStepIndex !== undefined &&
        currentStepIndex > 0 &&
        currentStepIndex < sequence.length
      ) {
        const activeFrom = sequence[currentStepIndex - 1] - 1;
        const activeTo = sequence[currentStepIndex] - 1;
        const p1 = getCanvasNail(activeFrom);
        const p2 = getCanvasNail(activeTo);

        ctx.beginPath();
        ctx.strokeStyle = "#e11d48"; // vibrant rose
        ctx.lineWidth = 2.0;
        ctx.moveTo(p1[0], p1[1]);
        ctx.lineTo(p2[0], p2[1]);
        ctx.stroke();

        // Pulsing active nail markers
        ctx.fillStyle = "#e11d48";
        ctx.beginPath();
        ctx.arc(p2[0], p2[1], 4.5, 0, 2 * Math.PI);
        ctx.fill();

        ctx.fillStyle = "#4f46e5";
        ctx.beginPath();
        ctx.arc(p1[0], p1[1], 4, 0, 2 * Math.PI);
        ctx.fill();
      }

      if (viewMode === "split") {
        ctx.restore();
        // Draw split divider line
        const splitX = (splitPos / 100) * width;
        ctx.strokeStyle = "#4f46e5";
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.moveTo(splitX, 0);
        ctx.lineTo(splitX, height);
        ctx.stroke();
      }
    }

    // Outer guideline ring
    ctx.strokeStyle = "#d4d4d8";
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.arc(center, center, radius, 0, 2 * Math.PI);
    ctx.stroke();

    // Render numbered nails if enabled
    if (showNails && jobResult.nails_count) {
      const N = jobResult.nails_count;
      const angleStep = (2 * Math.PI) / N;

      ctx.font = `${Math.max(7, Math.min(10, 800 / N))}px sans-serif`;
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";

      for (let i = 0; i < N; i++) {
        // Nail 1 at top (-pi/2), clockwise
        const a = -Math.PI / 2 + i * angleStep;
        const nx = center + radius * Math.cos(a);
        const ny = center + radius * Math.sin(a);

        // Nail dot
        ctx.fillStyle = "#18181b";
        ctx.beginPath();
        ctx.arc(nx, ny, 1.2, 0, 2 * Math.PI);
        ctx.fill();

        // Number (only render all if zoomed in or reasonable count)
        if (zoom >= 1.4 || N <= 150 || (i + 1) % 5 === 0 || i === 0) {
          const tx = center + (radius + 10) * Math.cos(a);
          const ty = center + (radius + 10) * Math.sin(a);
          ctx.fillStyle = i === 0 ? "#e11d48" : "#71717a";
          ctx.fillText(`${i + 1}`, tx, ty);
        }
      }
    }

    ctx.restore();
  }, [
    jobResult,
    viewMode,
    zoom,
    pan,
    splitPos,
    currentStepIndex,
    showNails,
    targetImg,
    originalImg,
  ]);

  useEffect(() => {
    draw();
  }, [draw]);

  // Pan interactions
  const handleMouseDown = (e) => {
    setIsPanning(true);
    setStartPan({ x: e.clientX - pan.x, y: e.clientY - pan.y });
  };

  const handleMouseMove = (e) => {
    if (!isPanning) return;
    setPan({ x: e.clientX - startPan.x, y: e.clientY - startPan.y });
  };

  const handleMouseUp = () => setIsPanning(false);

  // Zoom controls
  const handleZoom = (delta) => {
    setZoom((z) => Math.max(0.4, Math.min(6.0, z + delta)));
  };

  const handleResetZoom = () => {
    setZoom(1.0);
    setPan({ x: 0, y: 0 });
  };

  return (
    <div className="relative flex flex-col bg-neutral-100 dark:bg-neutral-950 rounded-2xl border border-neutral-200 dark:border-neutral-800 overflow-hidden shadow-inner select-none">
      {/* Top toolbar */}
      <div className="absolute top-3 inset-x-3 z-20 flex flex-wrap items-center justify-between gap-2 pointer-events-none">
        {/* View Mode Buttons */}
        <div className="flex items-center gap-1 bg-white/90 dark:bg-neutral-900/90 backdrop-blur-md p-1 rounded-xl shadow-md border border-neutral-200/80 dark:border-neutral-800 pointer-events-auto">
          {[
            { id: "string_art", label: t.viewStringArt },
            { id: "target", label: t.viewTarget },
            { id: "original", label: t.viewOriginal },
            { id: "split", label: t.viewSplit },
            { id: "overlay", label: t.viewOverlay },
          ].map((mode) => (
            <button
              key={mode.id}
              onClick={() => setViewMode(mode.id)}
              className={`px-2.5 py-1 text-xs font-semibold rounded-lg transition ${
                viewMode === mode.id
                  ? "bg-indigo-600 text-white shadow-sm"
                  : "text-neutral-600 dark:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-neutral-800"
              }`}
            >
              {mode.label}
            </button>
          ))}
        </div>

        {/* Zoom Controls */}
        <div className="flex items-center gap-1 bg-white/90 dark:bg-neutral-900/90 backdrop-blur-md p-1 rounded-xl shadow-md border border-neutral-200/80 dark:border-neutral-800 pointer-events-auto">
          <button
            onClick={() => handleZoom(0.25)}
            className="p-1.5 text-neutral-600 dark:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-neutral-800 rounded-lg transition"
            title={t.zoomIn}
          >
            <ZoomIn className="w-4 h-4" />
          </button>
          <span className="text-[11px] font-mono px-1 font-semibold text-neutral-600 dark:text-neutral-300">
            {Math.round(zoom * 100)}%
          </span>
          <button
            onClick={() => handleZoom(-0.25)}
            className="p-1.5 text-neutral-600 dark:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-neutral-800 rounded-lg transition"
            title={t.zoomOut}
          >
            <ZoomOut className="w-4 h-4" />
          </button>
          <button
            onClick={handleResetZoom}
            className="p-1.5 text-neutral-600 dark:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-neutral-800 rounded-lg transition"
            title={t.fitScreen}
          >
            <Maximize2 className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Split comparison slider bar if viewMode === "split" */}
      {viewMode === "split" && (
        <div className="absolute bottom-4 inset-x-12 z-20 pointer-events-auto bg-white/90 dark:bg-neutral-900/90 backdrop-blur-md px-4 py-2 rounded-xl shadow-lg border border-neutral-200 dark:border-neutral-800 flex items-center gap-3">
          <Columns className="w-4 h-4 text-indigo-600" />
          <span className="text-xs font-medium text-neutral-600 dark:text-neutral-300">
            {t.viewSplit}
          </span>
          <input
            type="range"
            min="0"
            max="100"
            value={splitPos}
            onChange={(e) => setSplitPos(parseInt(e.target.value, 10))}
            className="w-full accent-indigo-600 h-1.5 bg-neutral-200 dark:bg-neutral-700 rounded cursor-pointer"
          />
        </div>
      )}

      {/* Central Canvas Container */}
      <div
        ref={containerRef}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
        className="w-full h-[520px] sm:h-[620px] flex items-center justify-center cursor-grab active:cursor-grabbing overflow-hidden"
      >
        <canvas
          ref={canvasRef}
          width={700}
          height={700}
          className="max-w-full max-h-full drop-shadow-2xl"
        />
      </div>
    </div>
  );
}
