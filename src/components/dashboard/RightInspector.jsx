import React, { useMemo } from "react";

const DEFAULT_LABS = {
  hdl: 60, // Healthy baseline: strong HDL
  ldl: 90, // Near-optimal LDL
  ast: 22, // Typical reference AST
  alt: 24, // Typical reference ALT
  estradiol: 24, // Neutral E2 midpoint
};

const LAB_BLUEPRINT = [
  { id: "hdl", label: "HDL (Good)", unit: "mg/dL", min: 40, max: 100, inverse: true },
  { id: "ldl", label: "LDL (Bad)", unit: "mg/dL", min: 0, max: 100 },
  { id: "ast", label: "Liver (AST)", unit: "U/L", min: 0, max: 40 },
  { id: "alt", label: "Liver (ALT)", unit: "U/L", min: 0, max: 40 },
  { id: "estradiol", label: "Estradiol", unit: "pg/mL", min: 20, max: 40 },
];

export const RightInspector = ({ metrics, steadyStateMetrics, scrubbedPoint = null }) => {
  const totals = steadyStateMetrics?.totals || metrics?.totals || {
    netScore: 0,
    totalRisk: 0,
  };

  const { netScore = 0, totalRisk = 0 } = totals;

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
      <div className="p-5">
        <div className="mb-4 flex items-center justify-between">
          <h3 className="text-[10px] font-bold uppercase tracking-widest text-gray-500">
            Projected Labs (Steady State)
          </h3>
          {scrubLabel && (
            <span className="text-[10px] font-bold text-indigo-300 px-2 py-0.5 rounded-full bg-indigo-500/10 border border-indigo-500/30">
              {scrubLabel}
            </span>
          )}
        </div>
        <div className="space-y-3 pr-1">
          {vitalsData.map((vital) => (
            <BulletChart key={vital.id} data={vital} />
          ))}
        </div>
      </div>
    </div>
  );
};

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

  const rangeLabel = Number.isFinite(min) && Number.isFinite(max)
    ? `${min}-${max} ${data.unit}`
    : data.unit;

  return (
    <div className="grid h-8 grid-cols-[minmax(0,1fr)_72px_48px] items-center gap-3 min-w-0">
      <div className="min-w-0 leading-tight">
        <p className="text-[11px] font-medium text-gray-300 truncate whitespace-nowrap" title={data.label}>
          {data.label}
        </p>
        <p className="text-[9px] text-gray-500 truncate whitespace-nowrap" title={rangeLabel || data.label}>
          {rangeLabel}
        </p>
      </div>

      <div className="relative h-1 w-full rounded-full bg-white/10 overflow-hidden">
        <div
          className="absolute top-[-2px] bottom-[-2px] w-px bg-gray-600/70 z-10"
          style={{ left: `${markerPosition}%` }}
        />
        <div
          className={`absolute left-0 top-0 h-full rounded-full bg-gradient-to-r ${gradientClass} transition-all duration-500 ease-out`}
          style={{ width: `${fillPercent}%` }}
        />
        {(isDanger || isHot) && (
          <div
            className="pointer-events-none absolute top-[-2px] right-0 h-[8px] w-3 bg-rose-400/50 blur-lg opacity-70"
            aria-hidden
          />
        )}
      </div>

      <span
        className={`text-left font-mono text-xs tabular-nums pl-1 ${
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
