"use client";

import React, { useState, useRef } from "react";
import { UploadCloud, Image as ImageIcon, AlertCircle, Loader2 } from "lucide-react";

export default function UploadZone({ onUploadSuccess, t }) {
  const [isDragging, setIsDragging] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const fileInputRef = useRef(null);

  const handleFiles = async (files) => {
    if (!files || files.length === 0) return;
    const file = files[0];

    // File validation
    if (file.name.toLowerCase().endsWith(".svg") || file.type.includes("svg")) {
      setError(t.dir === "rtl" ? "ملفات SVG غير مسموح بها لأسباب أمنية." : "SVG files are not permitted.");
      return;
    }

    const validTypes = ["image/jpeg", "image/png", "image/webp"];
    if (!validTypes.includes(file.type)) {
      setError(t.dir === "rtl" ? "يرجى اختيار صورة بتنسيق JPG أو PNG أو WebP." : "Please select a JPG, PNG, or WebP image.");
      return;
    }

    if (file.size > 15 * 1024 * 1024) {
      setError(t.dir === "rtl" ? "حجم الصورة أكبر من 15 ميجابايت." : "Image exceeds 15 MB.");
      return;
    }

    setError(null);
    setLoading(true);

    try {
      const formData = new FormData();
      formData.append("file", file);

      const res = await fetch("/api/uploads", {
        method: "POST",
        body: formData,
        credentials: "include",
      });

      if (!res.ok) {
        const errJson = await res.json().catch(() => ({}));
        throw new Error(errJson.detail || "Failed to upload image.");
      }

      const data = await res.json();
      onUploadSuccess({
        uploadId: data.upload_id,
        filename: data.filename,
        width: data.width,
        height: data.height,
        fileObject: file,
      });
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files) {
      handleFiles(e.dataTransfer.files);
    }
  };

  return (
    <div className="w-full">
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
          accept=".jpg,.jpeg,.png,.webp"
          className="hidden"
          onChange={(e) => handleFiles(e.target.files)}
        />

        <div className="w-14 h-14 rounded-full bg-indigo-100 dark:bg-indigo-900/40 flex items-center justify-center text-indigo-600 dark:text-indigo-400 mb-4 shadow-inner">
          {loading ? (
            <Loader2 className="w-7 h-7 animate-spin" />
          ) : (
            <UploadCloud className="w-7 h-7" />
          )}
        </div>

        <h3 className="font-semibold text-base text-neutral-800 dark:text-neutral-200 mb-1">
          {loading ? t.uploading : t.dragDropText}
        </h3>
        <p className="text-xs text-neutral-500 dark:text-neutral-400">
          {t.supportedFormats}
        </p>

        {error && (
          <div className="mt-4 flex items-center gap-2 text-xs text-rose-600 dark:text-rose-400 bg-rose-50 dark:bg-rose-950/30 px-3 py-1.5 rounded-lg border border-rose-200 dark:border-rose-900/50">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}
      </div>
    </div>
  );
}
