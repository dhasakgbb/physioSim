import React, { useMemo } from "react";

const DEFAULT_LABS = {
  hdl: 60,
  ldl: 90,
  ast: 22,
  alt: 24,
  estradiol: 24,
  hematocrit: 45,
  creatinine: 1.0,
  egfr: 95,
};

const LAB_BLUEPRINT = [
  {
    id: "hdl",
    label: "HDL (Good)",
    unit: "mg/dL",
    min: 40,
    max: 100,
    inverse: true,
    thresholds: { criticalLow: 30, warningLow: 45 },
  },
  {
    id: "ldl",
    label: "LDL (Bad)",
    unit: "mg/dL",
    min: 0,
    max: 100,
    thresholds: { warningHigh: 130, criticalHigh: 160 },
  },
  {
    id: "ast",
    label: "Liver (AST)",
    unit: "U/L",
    min: 0,
    max: 40,
    thresholds: { warningHigh: 40, criticalHigh: 80 },
  },
  {
    id: "alt",
    label: "Liver (ALT)",
    unit: "U/L",
    min: 0,
    max: 40,
    thresholds: { warningHigh: 40, criticalHigh: 80 },
  },
  {
    id: "estradiol",
    label: "Estradiol",
    unit: "pg/mL",
    min: 20,
    max: 40,
    thresholds: {
      warningHigh: 50,
      criticalHigh: 80,
      warningLow: 15,
      criticalLow: 10,
    },
  },
  {
    id: "hematocrit",
    label: "Hematocrit",
    unit: "%",
    min: 38,
    max: 52,
    thresholds: { warningHigh: 50, criticalHigh: 55 },
  },
  {
    id: "creatinine",
    label: "Creatinine",
    unit: "mg/dL",
    min: 0.6,
    max: 1.2,
    thresholds: { warningHigh: 1.3, criticalHigh: 1.6 },
  },
  {
    id: "egfr",
    label: "eGFR",
    unit: "mL/min",
    min: 60,
    max: 120,
    inverse: true,
    thresholds: { warningLow: 60, criticalLow: 45 },
  },
];

export const RightInspector = ({
  metrics,
  steadyStateMetrics,
  scrubbedPoint = null,
}) => {
  const totals = steadyStateMetrics?.totals ||
    metrics?.totals || {
      netScore: 0,
      totalRisk: 0,
    };

  const { netScore = 0, totalRisk = 0 } = totals;
  
  // Determine which data source to use (Scrubbed vs Steady State)
  const activeLabsWidget = useMemo(() => {
    // 1. If scrubbing, calculate instantaneous values from raw simulation data
    if (scrubbedPoint && metrics?._raw?.aggregate?.totalToxicity) {
      const day = scrubbedPoint.day ?? 0;
      // timePoints are in 6-hour intervals: [0, 6, 12, 18, 24, 30, ...]
      // So day 0 = index 0, day 1 = index 4 (24/6), day 2 = index 8, etc.
      // Convert days to 6-hour intervals: 1 day = 4 intervals (24/6)
      const index = Math.min(
        Math.round(day * 4), 
        (metrics._raw.aggregate.totalToxicity.hepatic?.length || 1) - 1
      );

      const tox = metrics._raw.aggregate.totalToxicity;
      
      // Calculate instantaneous toxicity sum at this time point
      const instantToxicity = 
        (tox.hepatic[index] || 0) +
        (tox.renal[index] || 0) +
        (tox.cardiovascular[index] || 0) +
        (tox.lipid_metabolism[index] || 0) +
        (tox.neurotoxicity[index] || 0);

      // Replicate the logic from StackContext but with instantaneous values
      // TODO: Make this more specific (e.g. AST uses hepatic only)
      return {
        hdl: { value: 60 - (instantToxicity * 0.5), status: 'normal' },
        ldl: { value: 90 + (instantToxicity * 0.5), status: 'normal' },
        ast: { value: 22 + (instantToxicity * 0.2), status: 'normal' },
        alt: { value: 24 + (instantToxicity * 0.2), status: 'normal' },
        estradiol: { value: 24 + (instantToxicity * 0.1), status: 'normal' }, // Placeholder
        hematocrit: { value: 45 + (instantToxicity * 0.05), status: 'normal' },
        creatinine: { value: 1.0 + (instantToxicity * 0.01), status: 'normal' },
        egfr: { value: 95 - (instantToxicity * 0.5), status: 'normal' }
      };
    }

    // 2. Fallback to steady state metrics passed from parent
    return metrics?.analytics?.labsWidget;
  }, [scrubbedPoint, metrics]);

  const vitalsData = useMemo(() => {
    const fallback = {
      ...DEFAULT_LABS,
      ...(metrics?.analytics?.projectedLabs || {}),
    };

    return LAB_BLUEPRINT.map((item) => {
      const widgetEntry =
        activeLabsWidget?.[item.id] ||
        (item.id === "estradiol" ? activeLabsWidget?.e2 : undefined);
      const numericValue = Number(
        widgetEntry?.value ?? fallback[item.id] ?? DEFAULT_LABS[item.id] ?? 0
      );
      return {
        ...item,
        value: numericValue,
        status: widgetEntry?.status || null,
      };
    });
  }, [metrics, activeLabsWidget]);



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
  const { value, max, min } = data;
  const spanMax = max * 1.5;
  const fillPercent = Math.min(100, (value / spanMax) * 100);
  const markerPosition = (max / spanMax) * 100;

  const severity =
    mapStatusToSeverity(data.status) || getLabSeverity(value, data);
  const gradientClass = getGradientForSeverity(severity, fillPercent);
  const isDanger = severity === "critical" || severity === "warning";

  const rangeLabel =
    Number.isFinite(min) && Number.isFinite(max)
      ? `${min}-${max} ${data.unit}`
      : data.unit;

  return (
    <div className="grid h-8 grid-cols-[minmax(0,1fr)_72px_48px] items-center gap-3 min-w-0">
      <div className="min-w-0 leading-tight">
        <p
          className="text-[11px] font-medium text-gray-300 truncate whitespace-nowrap"
          title={data.label}
        >
          {data.label}
        </p>
        <p
          className="text-[9px] text-gray-500 truncate whitespace-nowrap"
          title={rangeLabel || data.label}
        >
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
        {isDanger && (
          <div
            className="pointer-events-none absolute top-[-2px] right-0 h-[8px] w-3 bg-rose-400/50 blur-lg opacity-70"
            aria-hidden
          />
        )}
      </div>

      <span
        className={`text-left font-mono text-xs tabular-nums pl-1 ${
          isDanger ? "text-rose-400" : "text-gray-300"
        }`}
      >
        {Number.isFinite(value) ? value.toFixed(value >= 100 ? 0 : 1) : "--"}
      </span>
    </div>
  );
};

const getLabSeverity = (value, data) => {
  const { thresholds = {}, inverse, min, max } = data;
  const { criticalLow, warningLow, warningHigh, criticalHigh } = thresholds;

  if (criticalLow !== undefined && value < criticalLow) return "critical";
  if (criticalHigh !== undefined && value > criticalHigh) return "critical";
  if (warningLow !== undefined && value < warningLow) return "warning";
  if (warningHigh !== undefined && value > warningHigh) return "warning";

  if (inverse && min !== undefined && value < min) return "warning";
  if (!inverse && max !== undefined && value > max) return "warning";

  return "normal";
};

const mapStatusToSeverity = (status) => {
  if (!status) return null;
  if (status === "critical") return "critical";
  if (status === "bad") return "warning";
  return "normal";
};

const getGradientForSeverity = (severity, percentage) => {
  if (severity === "critical") {
    return "from-rose-500 via-red-500 to-red-600";
  }
  if (severity === "warning") {
    return "from-amber-400 via-orange-400 to-amber-500";
  }
  if (percentage > 90) {
    return "from-emerald-300 via-amber-200 to-amber-300";
  }
  return "from-emerald-500 via-teal-400 to-emerald-300";
};

export default RightInspector;
