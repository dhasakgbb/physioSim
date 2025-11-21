import React, { useMemo } from "react";

const DEFAULT_LABS = {
  hdl: 45,
  ldl: 115,
  ast: 32,
  alt: 35,
  estradiol: 28,
};

const LAB_BLUEPRINT = [
  { id: "hdl", label: "HDL (Good)", unit: "mg/dL", min: 40, max: 100, inverse: true },
  { id: "ldl", label: "LDL (Bad)", unit: "mg/dL", min: 0, max: 100 },
  { id: "ast", label: "Liver (AST)", unit: "U/L", min: 0, max: 40 },
  { id: "alt", label: "Liver (ALT)", unit: "U/L", min: 0, max: 40 },
  { id: "estradiol", label: "Estradiol", unit: "pg/mL", min: 20, max: 40 },
];

const SATURATION_LIMITS = {
  androgen: 500,
  nonGenomic: 200,
  hepatic: 150,
};

const clampPercent = (value, limit) => {
  if (!limit || limit <= 0) return 0;
  return Math.min(100, Math.round((value / limit) * 100));
};

export const RightInspector = ({ metrics, steadyStateMetrics, scrubbedPoint = null }) => {
  const totals = steadyStateMetrics?.totals || metrics?.totals || {
    netScore: 0,
    totalRisk: 0,
  };

  const { netScore = 0, totalRisk = 0 } = totals;

  const saturationRows = useMemo(() => {
    const pathwayLoads = metrics?.analytics?.pathwayLoads || {};
    return [
      {
        id: "ar",
        label: "Androgen (AR)",
        percent: clampPercent(pathwayLoads.ar_genomic || 0, SATURATION_LIMITS.androgen),
        color: "bg-indigo-500",
      },
      {
        id: "nonGenomic",
        label: "Non-Genomic",
        percent: clampPercent(
          (pathwayLoads.non_genomic || 0) + (pathwayLoads.neuro || 0),
          SATURATION_LIMITS.nonGenomic,
        ),
        color: "bg-purple-500",
      },
      {
        id: "hepatic",
        label: "Hepatic Load",
        percent: clampPercent(pathwayLoads.liver || 0, SATURATION_LIMITS.hepatic),
        color: "bg-orange-500",
      },
    ];
  }, [metrics]);

  const vitalsData = useMemo(() => {
    const labs = {
      ...DEFAULT_LABS,
      ...(metrics?.analytics?.projectedLabs || {}),
    };

    return LAB_BLUEPRINT.map((item) => ({
      ...item,
      value: Number(labs[item.id] ?? 0),
    }));
  }, [metrics]);

  const scrubLabel = useMemo(() => {
    if (!scrubbedPoint) return null;
    if (scrubbedPoint.day !== undefined) {
      return `Day ${Math.round(scrubbedPoint.day)}`;
    }
    if (scrubbedPoint.mgEq !== undefined) {
      return `${Math.round(scrubbedPoint.mgEq)} mgEq`;
    }
    return null;
  }, [scrubbedPoint]);

  return (
    <div className="flex flex-col h-full bg-[#0F1115] border-l border-white/5 overflow-y-auto scrollbar-hide">
      <div className="p-4 border-b border-white/5">
        <h3 className="text-[10px] font-bold uppercase tracking-widest text-gray-500 mb-4">
          Receptor Saturation
        </h3>
        {saturationRows.map((row) => (
          <SaturationRow key={row.id} label={row.label} percent={row.percent} color={row.color} />
        ))}
      </div>

      <div className="p-4">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-[10px] font-bold uppercase tracking-widest text-gray-500">
            Projected Labs (Week 12)
          </h3>
          {scrubLabel && (
            <span className="text-[10px] font-bold text-indigo-300 px-2 py-0.5 rounded-full bg-indigo-500/10 border border-indigo-500/30">
              {scrubLabel}
            </span>
          )}
        </div>
        <div className="space-y-5">
          {vitalsData.map((vital) => (
            <BulletChart key={vital.id} data={vital} />
          ))}
        </div>
      </div>
    </div>
  );
};

const SaturationRow = ({ label, percent, color }) => (
  <div className="mb-3 last:mb-0">
    <div className="flex justify-between text-xs mb-1.5">
      <span className="text-gray-400">{label}</span>
      <span className="font-mono text-gray-300">{percent}%</span>
    </div>
    <div className="h-1 w-full bg-white/5 rounded-full overflow-hidden">
      <div className={`h-full rounded-full ${color}`} style={{ width: `${percent}%` }} />
    </div>
  </div>
);

const BulletChart = ({ data }) => {
  const { value, max, min, inverse } = data;
  const isHigh = !inverse && value > max;
  const isLow = inverse && value < min;
  const isDanger = isHigh || isLow;

  const spanMax = max * 1.5;
  const fillPercent = Math.min(100, (value / spanMax) * 100);
  const markerPosition = (max / spanMax) * 100;
  const gradientClass = getThermalGradient(fillPercent);
  const isHot = fillPercent >= 80;

  return (
    <div className="grid grid-cols-[80px_1fr_50px] gap-3 items-center group">
      <span className="text-xs font-medium text-gray-400 group-hover:text-gray-200 transition-colors truncate">
        {data.label}
      </span>

      <div className="relative h-1.5 w-full bg-white/10 rounded-full overflow-hidden">
        <div
          className="absolute top-[-2px] bottom-[-2px] w-0.5 bg-gray-600 z-10"
          style={{ left: `${markerPosition}%` }}
        />
        <div
          className={`absolute left-0 top-0 h-full rounded-full bg-gradient-to-r ${gradientClass} transition-all duration-500 ease-out`}
          style={{ width: `${fillPercent}%` }}
        />
        {(isDanger || isHot) && (
          <div
            className="absolute top-0 right-0 h-full w-6 bg-rose-400/50 blur-lg opacity-70 pointer-events-none"
            aria-hidden
          />
        )}
      </div>

      <span
        className={`text-right font-mono text-xs ${
          isDanger || isHot ? "text-rose-400" : "text-gray-300"
        }`}
      >
        {Number.isFinite(value) ? value.toFixed(value >= 100 ? 0 : 1) : "--"}
      </span>
    </div>
  );
};

const getThermalGradient = (percentage) => {
  if (percentage < 50) {
    return "from-emerald-500 via-teal-400 to-emerald-300";
  }
  if (percentage < 75) {
    return "from-emerald-300 via-amber-300 to-amber-400";
  }
  return "from-amber-400 via-orange-500 to-rose-500";
};

export default RightInspector;
