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
  setShowNails,
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
    const radius = center - 35;

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
      (jobResult.nails_px || jobResult.nailsPx || jobResult.nails_count || jobResult.nailsCount) &&
      jobResult.sequence
    ) {
      const nails = jobResult.nails_px || jobResult.nailsPx;
      const sequence = jobResult.sequence;
      const stepsToRender =
        currentStepIndex !== null && currentStepIndex !== undefined
          ? Math.min(currentStepIndex, sequence.length - 1)
          : sequence.length - 1;

      // Scaling from calculation resolution (e.g. 300) to display canvas size
      const resSize = jobResult.size || 300;
      const scale = (radius * 2) / (resSize - 4);
      const resCenter = (resSize - 1) / 2;
      const totalNails = jobResult.nails_count || jobResult.nailsCount || (nails ? nails.length : 200);

      const getCanvasNail = (idx) => {
        if (nails && nails[idx]) {
          const pt = nails[idx];
          const nx = center + (pt[0] - resCenter) * scale;
          const ny = center + (pt[1] - resCenter) * scale;
          return [nx, ny];
        }
        const a = -Math.PI / 2 + idx * ((2 * Math.PI) / totalNails);
        return [center + radius * Math.cos(a), center + radius * Math.sin(a)];
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

      // Precompute canvas nail coordinates to optimize loop performance
      const nailCoords = [];
      for (let i = 0; i < totalNails; i++) {
        nailCoords.push(getCanvasNail(i));
      }

      // Draw all string segments up to stepsToRender with true cumulative alpha blending
      // In string art, overlapping threads compound in darkness (source-over) to create
      // deep blacks and realistic shading across dense areas like hair, eyes, and contours.
      // Realistic thread stroke appearance matching physical black embroidery thread
      const strokeAlpha = 0.22;
      ctx.strokeStyle = `rgba(10, 10, 10, ${strokeAlpha})`;
      ctx.lineWidth = 0.65;

      for (let i = 1; i <= stepsToRender; i++) {
        const p1 = nailCoords[sequence[i - 1] - 1];
        const p2 = nailCoords[sequence[i] - 1];
        if (!p1 || !p2) continue;
        ctx.beginPath();
        ctx.moveTo(p1[0], p1[1]);
        ctx.lineTo(p2[0], p2[1]);
        ctx.stroke();
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
    ctx.strokeStyle = "#cbd5e1";
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.arc(center, center, radius, 0, 2 * Math.PI);
    ctx.stroke();

    // Render numbered nails if enabled
    if (showNails && jobResult.nails_count) {
      const N = jobResult.nails_count;
      const angleStep = (2 * Math.PI) / N;

      const fontSize = Math.max(9, Math.min(13, Math.round(950 / N)));
      ctx.font = `bold ${fontSize}px ui-sans-serif, system-ui, -apple-system, sans-serif`;
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";

      for (let i = 0; i < N; i++) {
        // Nail 1 at top (-pi/2), clockwise
        const a = -Math.PI / 2 + i * angleStep;
        const nx = center + radius * Math.cos(a);
        const ny = center + radius * Math.sin(a);

        // Nail dot
        ctx.fillStyle = "#09090b";
        ctx.beginPath();
        ctx.arc(nx, ny, 1.5, 0, 2 * Math.PI);
        ctx.fill();

        // Number (only render all if zoomed in or reasonable count)
        if (zoom >= 1.3 || N <= 150 || (i + 1) % 5 === 0 || i === 0) {
          const numDist = radius + Math.max(11, fontSize + 3);
          const tx = center + numDist * Math.cos(a);
          const ty = center + numDist * Math.sin(a);
          ctx.fillStyle = "#09090b";
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
    <div className="flex flex-col bg-white dark:bg-neutral-900 rounded-2xl border border-neutral-200 dark:border-neutral-800 overflow-hidden shadow-sm select-none">
      {/* Studio Header Toolbar (Outside canvas, zero overlap) */}
      <div className="flex flex-wrap items-center justify-between gap-3 bg-neutral-50/90 dark:bg-neutral-900/90 backdrop-blur-md px-4 py-3 border-b border-neutral-200 dark:border-neutral-800 z-10">
        <div className="flex flex-wrap items-center gap-2">
          {/* View Mode Buttons (only if source photos exist) */}
          {(targetImg || originalImg) ? (
            <div className="flex items-center gap-1 bg-white dark:bg-neutral-800 p-1 rounded-xl shadow-xs border border-neutral-200/60 dark:border-neutral-700/60">
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
                  className={`px-3 py-1.5 text-xs font-bold rounded-lg transition ${viewMode === mode.id
                      ? "bg-indigo-600 text-white shadow-sm"
                      : "text-neutral-600 dark:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-neutral-700"
                    }`}
                >
                  {mode.label}
                </button>
              ))}
            </div>
          ) : (
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-white dark:bg-neutral-800 border border-neutral-200/60 dark:border-neutral-700/60 shadow-xs">
              <Sparkles className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
              <span className="text-xs font-bold text-neutral-800 dark:text-neutral-200">
                {t.viewStringArt}
              </span>
            </div>
          )}

          {/* Toggle Nails Button */}
          {setShowNails && (
            <button
              onClick={() => setShowNails(!showNails)}
              className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold border transition ${showNails
                  ? "bg-indigo-50 text-indigo-700 border-indigo-200 dark:bg-indigo-950/40 dark:text-indigo-300 dark:border-indigo-900"
                  : "bg-white text-neutral-500 border-neutral-200 dark:bg-neutral-800 dark:text-neutral-400 dark:border-neutral-700"
                }`}
              title={t.toggleNails}
            >
              <Eye className="w-3.5 h-3.5" />
              <span>{t.toggleNails}</span>
            </button>
          )}
        </div>

        {/* Zoom Controls */}
        <div className="flex items-center gap-1 bg-white dark:bg-neutral-800 p-1 rounded-xl shadow-xs border border-neutral-200/60 dark:border-neutral-700/60">
          <button
            onClick={() => handleZoom(0.25)}
            className="p-1.5 text-neutral-600 dark:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-neutral-700 rounded-lg transition"
            title={t.zoomIn}
          >
            <ZoomIn className="w-4 h-4" />
          </button>
          <span className="text-[12px] font-mono px-2 font-black text-neutral-800 dark:text-neutral-100 min-w-[46px] text-center">
            {Math.round(zoom * 100)}%
          </span>
          <button
            onClick={() => handleZoom(-0.25)}
            className="p-1.5 text-neutral-600 dark:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-neutral-700 rounded-lg transition"
            title={t.zoomOut}
          >
            <ZoomOut className="w-4 h-4" />
          </button>
          <button
            onClick={handleResetZoom}
            className="p-1.5 text-neutral-600 dark:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-neutral-700 rounded-lg transition"
            title={t.fitScreen}
          >
            <Maximize2 className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Central Canvas Viewport */}
      <div
        ref={containerRef}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
        className="relative w-full h-[520px] sm:h-[620px] bg-neutral-100/70 dark:bg-neutral-950/70 flex items-center justify-center cursor-grab active:cursor-grabbing overflow-hidden"
      >
        {/* Split comparison slider bar if viewMode === "split" */}
        {viewMode === "split" && (
          <div className="absolute bottom-4 inset-x-8 sm:inset-x-16 z-20 pointer-events-auto bg-white/95 dark:bg-neutral-900/95 backdrop-blur-md px-4 py-2.5 rounded-xl shadow-lg border border-neutral-200 dark:border-neutral-800 flex items-center gap-3">
            <Columns className="w-4 h-4 text-indigo-600 shrink-0" />
            <span className="text-xs font-bold text-neutral-700 dark:text-neutral-300 shrink-0">
              {t.viewSplit}
            </span>
            <input
              type="range"
              min="0"
              max="100"
              value={splitPos}
              onChange={(e) => setSplitPos(parseInt(e.target.value, 10))}
              className="w-full accent-indigo-600 h-2 bg-neutral-200 dark:bg-neutral-700 rounded-lg cursor-pointer"
            />
            <span className="text-xs font-mono font-black text-indigo-600 dark:text-indigo-400 min-w-[36px] text-end">
              {splitPos}%
            </span>
          </div>
        )}

        <canvas
          ref={canvasRef}
          width={800}
          height={800}
          className="max-w-full max-h-full drop-shadow-xl"
        />
      </div>
    </div>
  );
}
