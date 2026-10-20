"use client";

import React from "react";
import {
  Sparkles,
  FileText,
  PlayCircle,
  Printer,
  Ruler,
  Archive,
  ArrowRight,
  ArrowLeft,
  CheckCircle,
  Layers,
  Cpu,
  Scissors,
  Hammer,
} from "lucide-react";

export default function ServicesSection({ t }) {
  const isRtl = t.dir === "rtl";
  const ArrowIcon = isRtl ? ArrowLeft : ArrowRight;

  const services = [
    {
      icon: Cpu,
      title: t.service1Title,
      desc: t.service1Desc,
      gradient: "from-indigo-500 to-purple-600",
      tag: isRtl ? "خوارزمية ذكية" : "AI Algorithmic",
    },
    {
      icon: FileText,
      title: t.service2Title,
      desc: t.service2Desc,
      gradient: "from-purple-500 to-rose-600",
      tag: isRtl ? "ملفات نصية" : "TXT / CSV / JSON",
    },
    {
      icon: PlayCircle,
      title: t.service3Title,
      desc: t.service3Desc,
      gradient: "from-rose-500 to-amber-600",
      tag: isRtl ? "مشغل تفاعلي" : "Live Step Player",
    },
    {
      icon: Printer,
      title: t.service4Title,
      desc: t.service4Desc,
      gradient: "from-emerald-500 to-teal-600",
      tag: isRtl ? "طباعة 1:1 و A4" : "1:1 Scale & Tiled",
    },
    {
      icon: Ruler,
      title: t.service5Title,
      desc: t.service5Desc,
      gradient: "from-cyan-500 to-blue-600",
      tag: isRtl ? "حساب بالأمتار" : "Precise Meterage",
    },
    {
      icon: Archive,
      title: t.service6Title,
      desc: t.service6Desc,
      gradient: "from-amber-500 to-orange-600",
      tag: isRtl ? "حزمة متكاملة" : "All-in-One ZIP",
    },
  ];

  const steps = [
    {
      num: "01",
      title: t.how1Title,
      desc: t.how1Desc,
      icon: Layers,
    },
    {
      num: "02",
      title: t.how2Title,
      desc: t.how2Desc,
      icon: Scissors,
    },
    {
      num: "03",
      title: t.how3Title,
      desc: t.how3Desc,
      icon: Sparkles,
    },
    {
      num: "04",
      title: t.how4Title,
      desc: t.how4Desc,
      icon: Hammer,
    },
  ];

  return (
    <section id="services-overview" className="py-16 sm:py-20 border-b border-neutral-200/70 dark:border-neutral-800/70">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 space-y-20">
        {/* Section 1: Services Cards */}
        <div className="space-y-12">
          <div className="text-center max-w-3xl mx-auto space-y-3">
            <span className="text-xs uppercase font-extrabold tracking-widest text-indigo-600 dark:text-indigo-400">
              {isRtl ? "حلول وخدمات استوديو الخيوط" : "Core Studio Solutions"}
            </span>
            <h2 className="text-2xl sm:text-4xl font-black text-neutral-900 dark:text-white tracking-tight">
              {t.servicesSectionTitle}
            </h2>
            <p className="text-xs sm:text-sm text-neutral-500 dark:text-neutral-400 leading-relaxed">
              {t.servicesSectionSubtitle}
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {services.map((item, idx) => {
              const Icon = item.icon;
              return (
                <div
                  key={idx}
                  className="group relative p-6 rounded-3xl bg-white dark:bg-neutral-900 border border-neutral-200/80 dark:border-neutral-800 shadow-sm hover:shadow-xl hover:border-indigo-300 dark:hover:border-indigo-700/60 transition-all duration-300 flex flex-col justify-between"
                >
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <div
                        className={`w-12 h-12 rounded-2xl bg-gradient-to-tr ${item.gradient} flex items-center justify-center text-white shadow-md shadow-indigo-600/20 group-hover:scale-110 transition`}
                      >
                        <Icon className="w-6 h-6" />
                      </div>
                      <span className="text-[10px] font-mono font-bold px-2.5 py-1 rounded-full bg-neutral-100 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-300 border border-neutral-200/60 dark:border-neutral-700/60">
                        {item.tag}
                      </span>
                    </div>

                    <h3 className="text-base font-bold text-neutral-900 dark:text-white group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition">
                      {item.title}
                    </h3>

                    <p className="text-xs text-neutral-500 dark:text-neutral-400 leading-relaxed">
                      {item.desc}
                    </p>
                  </div>

                  <div className="pt-5 mt-4 border-t border-neutral-100 dark:border-neutral-800/80 flex items-center gap-1 text-xs font-bold text-indigo-600 dark:text-indigo-400">
                    <span>{isRtl ? "متاح في الاستوديو" : "Included in Studio"}</span>
                    <CheckCircle className="w-3.5 h-3.5 text-emerald-500" />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Section 2: How It Works Steps */}
        <div id="how-it-works" className="space-y-12">
          <div className="text-center max-w-2xl mx-auto space-y-3">
            <span className="text-xs uppercase font-extrabold tracking-widest text-purple-600 dark:text-purple-400">
              {isRtl ? "خطوات التنفيذ البسيطة" : "Workflow"}
            </span>
            <h2 className="text-2xl sm:text-4xl font-black text-neutral-900 dark:text-white tracking-tight">
              {t.howTitle}
            </h2>
            <p className="text-xs sm:text-sm text-neutral-500 dark:text-neutral-400">
              {t.howSubtitle}
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {steps.map((st, i) => {
              const StIcon = st.icon;
              return (
                <div
                  key={i}
                  className="relative p-6 rounded-3xl bg-neutral-50/80 dark:bg-neutral-900/40 border border-neutral-200/70 dark:border-neutral-800/70 space-y-3 flex flex-col justify-between"
                >
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-3xl font-black font-mono text-neutral-300 dark:text-neutral-700">
                        {st.num}
                      </span>
                      <div className="w-9 h-9 rounded-xl bg-indigo-50 dark:bg-indigo-950/40 text-indigo-600 dark:text-indigo-400 flex items-center justify-center">
                        <StIcon className="w-4 h-4" />
                      </div>
                    </div>
                    <h4 className="font-bold text-sm text-neutral-900 dark:text-white">
                      {st.title}
                    </h4>
                    <p className="text-xs text-neutral-500 dark:text-neutral-400 leading-relaxed">
                      {st.desc}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </section>
  );
}
