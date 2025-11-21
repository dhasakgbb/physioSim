import React, { useMemo } from "react";
import { defaultProfile } from "../../utils/personalization";

const clamp = (value, min = 0, max = 100) => Math.min(Math.max(value, min), max);

const METRIC_CONFIG = [
  {
    id: "mass",
    label: "Hypertrophy",
    bio: "Nitrogen Flux",
    accent: "#34D399",
    limit: 320,
    base: 42,
    getLoad: ({ pathwayLoads, totals }) =>
      (pathwayLoads.ar_genomic || 0) + (totals.genomicBenefit || 0) * 3,
  },
  {
    id: "strength",
    label: "Strength",
    bio: "Neural Drive",
    accent: "#818CF8",
    limit: 260,
    base: 40,
    getLoad: ({ pathwayLoads }) =>
      (pathwayLoads.non_genomic || 0) + (pathwayLoads.neuro || 0),
  },
  {
    id: "endurance",
    label: "Endurance",
    bio: "RBC / Cardio",
    accent: "#38BDF8",
    limit: 220,
    base: 48,
    getLoad: ({ pathwayLoads }) => pathwayLoads.heart || 0,
  },
  {
    id: "collagen",
    label: "Collagen",
    bio: "Tendon Shield",
    accent: "#FBBF24",
    limit: 160,
    base: 35,
    getLoad: ({ pathwayLoads }) => pathwayLoads.cortisol || 0,
  },
  {
    id: "lipolysis",
    label: "Lipolysis",
    bio: "Metabolism",
    accent: "#F472B6",
    limit: 200,
    base: 38,
    getLoad: ({ pathwayLoads, totals }) =>
      (pathwayLoads.shbg || 0) + (totals.nonGenomicBenefit || 0) * 2,
  },
];

const deriveBase = (config, profile) => {
  if (!profile) return config.base;
  if (config.id === "strength" && profile.trainingStyle === "powerlifting") {
    return config.base + 10;
  }
  if (config.id === "endurance" && profile.trainingStyle === "crossfit") {
    return config.base + 8;
  }
  if (config.id === "lipolysis" && profile.dietState === "cutting") {
    return config.base + 6;
  }
  return config.base;
};

export const PerformanceEqualizer = ({ metrics, profile = defaultProfile }) => {
  const pathwayLoads = metrics?.analytics?.pathwayLoads || {};
  const totals = metrics?.totals || {};

  const projectorData = useMemo(() => {
    return METRIC_CONFIG.map((config) => {
      const rawLoad = config.getLoad({ pathwayLoads, totals }) || 0;
      const normalized = clamp(rawLoad / config.limit, 0, 1);
      const baseHeight = clamp(deriveBase(config, profile), 18, 70);
      const boostHeight = clamp(normalized * 70, 0, 80);
      const totalHeight = baseHeight + boostHeight;
      const isSupra = totalHeight > 100;
      return {
        ...config,
        baseHeight,
        boostHeight: Math.max(Math.min(totalHeight, 120) - baseHeight, 2),
        isSupra,
        signal: normalized,
        totalHeight,
      };
    });
  }, [pathwayLoads, totals, profile]);

  return (
    <div className="flex h-full w-full flex-col rounded-3xl border border-white/5 bg-gradient-to-b from-[#0d0f14] to-[#050608] p-5 shadow-inner shadow-black/40">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <p className="text-[10px] font-bold uppercase tracking-[0.45em] text-emerald-400">Phenotype Projector</p>
          <p className="text-[9px] uppercase tracking-[0.3em] text-gray-500">Projected Capabilities</p>
        </div>
        <div className="flex items-center gap-2 rounded-full border border-emerald-500/20 bg-emerald-500/10 px-2 py-1">
          <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
          <span className="text-[10px] font-mono text-emerald-300">Enhanced</span>
        </div>
      </div>

      <div className="relative flex flex-1 items-end gap-3">
        <div className="pointer-events-none absolute top-[32%] left-0 right-0 z-10 flex flex-col items-end text-[8px] font-mono uppercase tracking-widest text-gray-500">
          <div className="h-px w-full border-t border-dashed border-white/20" />
          <span className="mt-1">Genetic Limit</span>
        </div>

        {projectorData.map((metric) => {
          const gradientId = `phenotype-${metric.id}`;
          return (
            <div key={metric.id} className="flex h-full w-full flex-col items-center gap-2">
              <svg className="hidden">
                <defs>
                  <linearGradient id={gradientId} x1="0" x2="0" y1="0" y2="1">
                    <stop offset="0%" stopColor="#ffffff" stopOpacity="0.15" />
                    <stop offset="100%" stopColor={metric.accent} stopOpacity="0.85" />
                  </linearGradient>
                </defs>
              </svg>
              <div className="relative flex h-full w-full flex-col justify-end overflow-hidden rounded-md bg-white/5">
                <div
                  className="w-full border-t border-white/10 bg-gradient-to-b from-white/10 to-white/0"
                  style={{ height: `${metric.baseHeight}%` }}
                />
                <div
                  className="relative w-full border-t border-white/10 shadow-[0_0_10px_rgba(255,255,255,0.12)]"
                  style={{
                    height: `${metric.boostHeight}%`,
                    backgroundImage: `linear-gradient(180deg, ${metric.accent} 0%, rgba(5,6,8,0.2) 110%)`,
                  }}
                >
                  <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_0%,rgba(255,255,255,0.35),transparent_55%)] opacity-70" />
                  {metric.isSupra && (
                    <div className="absolute top-2 right-2 rounded-full border border-white/30 bg-white/10 px-1.5 py-0.5 text-[8px] font-semibold uppercase tracking-wide text-white">
                      Supra
                    </div>
                  )}
                </div>
              </div>
              <div className="text-center">
                <p className={`text-[11px] font-semibold tracking-wide ${metric.isSupra ? "text-indigo-300" : "text-gray-200"}`}>
                  {metric.label}
                </p>
                <p className="text-[8px] font-mono uppercase tracking-tight text-gray-500">{metric.bio}</p>
                <p className="text-[9px] font-mono text-gray-400">
                  +{Math.round(metric.signal * 60)} pts
                </p>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default PerformanceEqualizer;
