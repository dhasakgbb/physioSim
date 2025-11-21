import React, { useMemo } from "react";
import {
  Area,
  AreaChart,
  CartesianGrid,
  ReferenceArea,
  ReferenceLine,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { useStack } from "../../context/StackContext";
import { evaluateStack } from "../../utils/stackEngine";
import { defaultProfile } from "../../utils/personalization";
import { compoundData } from "../../data/compoundData";
import { COLORS } from "../../utils/theme";

const PALETTE = {
  surface: "#050505",
  card: "#111214",
  outline: "#3F3F46",
  benefit: COLORS.benefit,
  risk: COLORS.risk,
  caution: "#F59E0B",
  info: "#38BDF8",
};

const ZONES = {
  adaptive: {
    label: "Therapeutic Band",
    fill: "rgba(16,185,129,0.08)",
    stroke: "rgba(16,185,129,0.35)",
    text: "#10B981",
  },
  diminishing: {
    label: "Diminishing Returns",
    fill: "rgba(251,191,36,0.08)",
    stroke: "rgba(251,146,60,0.35)",
    text: "#fbbf24",
  },
  critical: {
    label: "Critical Overload",
    fill: "rgba(248,113,113,0.08)",
    stroke: "rgba(239,68,68,0.4)",
    text: "#ef4444",
  },
};

const SCALAR_STEPS = 40;

const logisticWindow = (value, tension = 1) => {
  const clamped = Math.max(0, Math.min(value, 1));
  const exponent = (clamped - 0.5) * 8 * tension;
  return 1 / (1 + Math.exp(-exponent));
};

const createBioScale = (rawMax, displayCeiling) => {
  if (!rawMax || rawMax <= 0) return () => 0;
  const ceiling = Math.max(displayCeiling || rawMax, rawMax * 0.6);
  const baseline = logisticWindow(0, 1.1);
  const range = logisticWindow(1, 1.1) - baseline;
  const tension = rawMax > ceiling ? 1.35 : 0.9;
  return (value) => {
    const normalized = Math.max(0, Math.min(value / rawMax, 1));
    const shaped = logisticWindow(normalized, tension);
    return ((shaped - baseline) / range) * ceiling;
  };
};

const safeNumber = (value, fallback = 0) => (Number.isFinite(value) ? value : fallback);

const offsetToPercent = (value) => {
  const clamped = Math.max(0, Math.min(value, 1));
  return `${(clamped * 100).toFixed(2)}%`;
};

const zoneForLoad = (mgEq, crossover, critical) => {
  if (critical && mgEq >= critical) return "critical";
  if (crossover && mgEq >= crossover) return "diminishing";
  return "adaptive";
};

const formatMetric = (value) => {
  if (value === 0) return "0";
  if (Math.abs(value) < 1) return value.toFixed(2);
  if (Math.abs(value) < 10) return value.toFixed(1);
  return value.toFixed(0);
};

const CustomTooltip = ({ active, payload, crossover, critical }) => {
  if (!active || !payload || !payload.length) return null;
  const point = payload[0].payload;
  const zone = ZONES[zoneForLoad(point.mgEq, crossover, critical)];
  const penaltyPct = Math.max(0, (1 - (point.saturationPenalty || 1)) * 100);
  const netPositive = point.netDisplay >= 0;

  return (
    <div
      className="min-w-[240px] rounded-2xl border p-4 shadow-2xl backdrop-blur-xl"
      style={{
        backgroundColor: "rgba(8,8,12,0.9)",
        borderColor: zone.stroke,
      }}
    >
      <div className="mb-3 flex items-center justify-between">
        <div>
          <p className="text-[10px] uppercase tracking-[0.4em] text-[#6b7280]">Load</p>
          <p className="text-xl font-bold text-white">{Math.round(point.mgEq)} mgEq</p>
        </div>
        <div
          className="rounded-full px-3 py-1 text-[10px] font-semibold uppercase"
          style={{
            color: zone.text,
            backgroundColor: zone.fill,
            border: `1px solid ${zone.stroke}`,
          }}
        >
          {zone.label}
        </div>
      </div>

      <div className="space-y-2 border-t border-white/5 pt-3">
        <div className="flex items-center justify-between">
          <span className="text-xs text-emerald-300">Benefit Signal</span>
          <span className="font-mono text-sm text-white">{formatMetric(point.rawBenefit)}</span>
        </div>
        <div className="flex items-center justify-between">
          <span className="text-xs text-rose-300">Systemic Cost</span>
          <span className="font-mono text-sm text-white">{formatMetric(point.rawRisk)}</span>
        </div>
        <div className="flex items-center justify-between border-t border-white/5 pt-2">
          <span className="text-xs text-[#a1a1aa]">Net Efficiency</span>
          <span className={`font-mono text-sm font-semibold ${netPositive ? "text-emerald-300" : "text-rose-300"}`}>
            {netPositive ? "+" : ""}
            {formatMetric(point.netDisplay)}
          </span>
        </div>
      </div>

      {penaltyPct > 0 && (
        <p className="mt-3 text-[10px] text-[#9ca3af]">
          Receptor squeeze detected: -{penaltyPct.toFixed(0)}% headroom
        </p>
      )}
    </div>
  );
};

const useDebouncedCallback = (callback, delay = 50) => {
  const timeoutRef = React.useRef(null);

  const debounced = React.useCallback((...args) => {
    if (!callback) return;
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }
    timeoutRef.current = setTimeout(() => callback(...args), delay);
  }, [callback, delay]);

  React.useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  return debounced;
};

const GradientDefs = React.memo(({ netGradientStops }) => (
  <defs>
    <linearGradient id="benefitArea" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0%" stopColor={PALETTE.benefit} stopOpacity={0.6} />
      <stop offset="100%" stopColor={PALETTE.benefit} stopOpacity={0} />
    </linearGradient>
    <linearGradient id="riskArea" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0%" stopColor={PALETTE.risk} stopOpacity={0.6} />
      <stop offset="100%" stopColor={PALETTE.risk} stopOpacity={0} />
    </linearGradient>
    <linearGradient id="positiveGap" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0%" stopColor="#22C55E" stopOpacity={0.6} />
      <stop offset="100%" stopColor="#22C55E" stopOpacity={0} />
    </linearGradient>
    <linearGradient id="negativeGap" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0%" stopColor="#F43F5E" stopOpacity={0.6} />
      <stop offset="100%" stopColor="#F43F5E" stopOpacity={0} />
    </linearGradient>
    {netGradientStops && (
      <linearGradient id="netThermalGradient" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%" stopColor="#34D399" />
        <stop offset={offsetToPercent(netGradientStops.safe)} stopColor="#10B981" />
        <stop offset={offsetToPercent(netGradientStops.safe)} stopColor="#F59E0B" />
        <stop offset={offsetToPercent(netGradientStops.strain)} stopColor="#F59E0B" />
        <stop offset={offsetToPercent(netGradientStops.strain)} stopColor="#FB923C" />
        <stop offset={offsetToPercent(netGradientStops.critical)} stopColor="#FB923C" />
        <stop offset={offsetToPercent(netGradientStops.critical)} stopColor="#E11D48" />
        <stop offset="100%" stopColor="#E11D48" />
      </linearGradient>
    )}
  </defs>
));

const NetEffectChart = ({ onTimeScrub, title = "Dose Efficiency" }) => {
  const { stack, userProfile } = useStack();
  const profile = userProfile || defaultProfile;

  const [playheadPosition, setPlayheadPosition] = React.useState(null);
  const [isDragging, setIsDragging] = React.useState(false);
  const chartRef = React.useRef(null);
  const sweepCacheRef = React.useRef(new Map());

  const debouncedScrub = useDebouncedCallback(onTimeScrub, 60);

  const { weightedStack, baselineMgEq } = useMemo(() => {
    if (!stack.length) return { weightedStack: [], baselineMgEq: 0 };
    let baseline = 0;
    const enriched = stack.map((item) => {
      const meta = compoundData[item.compound];
      const weight =
        meta?.bindingAffinity === "very_high"
          ? 3
          : meta?.bindingAffinity === "high"
            ? 1.5
            : 1;
      baseline += item.dose * weight;
      return { ...item, weight };
    });
    return { weightedStack: enriched, baselineMgEq: baseline };
  }, [stack]);

  const stackSignature = useMemo(() => {
    if (!weightedStack.length) return "empty";
    return weightedStack
      .map(({ compound, dose, weight, frequency, ester }) =>
        [compound, dose, weight, frequency ?? "", ester ?? ""].join(":"),
      )
      .join("|");
  }, [weightedStack]);

  const profileSignature = useMemo(() => {
    return JSON.stringify({
      curveScales: profile?.curveScales,
      labMode: profile?.labMode,
      genetics: profile?.genetics,
    });
  }, [profile]);

  const sweepKey = useMemo(() => `${stackSignature}|${profileSignature}|${SCALAR_STEPS}`, [stackSignature, profileSignature]);

  const sweepResult = useMemo(() => {
    if (!weightedStack.length) {
      return {
        data: [],
        crossover: null,
        critical: null,
        currentMgEq: 0,
        maxMgEq: 1000,
      };
    }

    const cache = sweepCacheRef.current;
    if (cache.has(sweepKey)) {
      return cache.get(sweepKey);
    }

    const projectedMax = baselineMgEq > 0 ? baselineMgEq * 1.5 : 1000;
    const stepSize = projectedMax / SCALAR_STEPS;

    const points = [];
    let foundCrossover = null;
    let foundCritical = null;

    for (let mgEq = 0; mgEq <= projectedMax; mgEq += stepSize) {
      const scalar = baselineMgEq > 0 ? mgEq / baselineMgEq : 0;
      const hypotheticalStack = weightedStack.map((compound) => ({
        ...compound,
        dose: compound.dose * scalar,
      }));

      const result = evaluateStack({
        stackInput: hypotheticalStack,
        profile,
        durationWeeks: 12,
      });

      const benefit = result.totals.totalBenefit;
      const risk = result.totals.totalRisk;

      if (foundCrossover === null && mgEq > 100 && risk > benefit) {
        foundCrossover = mgEq;
      }

      if (foundCritical === null && mgEq > 100 && risk > benefit * 1.3) {
        foundCritical = mgEq;
      }

      points.push({
        mgEq,
        benefit,
        risk,
        net: result.totals.netScore,
        saturation: Math.min(mgEq / 1500, 1),
        saturationPenalty: result.totals.saturationPenalty,
        genomicBenefit: result.totals.genomicBenefit || 0,
        nonGenomicBenefit: result.totals.nonGenomicBenefit || 0,
      });
    }

    const sanitizedPoints = points
      .filter((point) => Number.isFinite(point.benefit) && Number.isFinite(point.risk))
      .sort((a, b) => a.mgEq - b.mgEq);

    const resultPayload = {
      data: sanitizedPoints,
      crossover: foundCrossover,
      critical: foundCritical,
      currentMgEq: baselineMgEq,
      maxMgEq: projectedMax,
    };

    cache.set(sweepKey, resultPayload);
    return resultPayload;
  }, [baselineMgEq, weightedStack, profile, sweepKey]);

  const { data, crossover, critical, currentMgEq, maxMgEq } = sweepResult;

  const { visualData, chartData, chartYMax } = useMemo(() => {
    if (!data.length) {
      return { visualData: [], chartData: [], chartYMax: 100 };
    }

    let rawBenefitMax = 1;
    let rawRiskMax = 1;
    data.forEach((point) => {
      rawBenefitMax = Math.max(rawBenefitMax, point.benefit);
      rawRiskMax = Math.max(rawRiskMax, point.risk);
    });

    const displayBenefitCeiling = Math.min(Math.max(rawBenefitMax, 60), 120);
    const displayRiskCeiling = Math.min(
      Math.max(rawRiskMax, displayBenefitCeiling * 1.2),
      displayBenefitCeiling * 2,
    );
    const scaleBenefit = createBioScale(rawBenefitMax, displayBenefitCeiling);
    const scaleRisk = createBioScale(rawRiskMax, displayRiskCeiling);

    let lastBenefit = 0;
    let lastRisk = 0;
    let maxDisplay = 0;
    const processed = [];
    const deduped = [];
    const seen = new Set();

    data.forEach((point) => {
      const scaledBenefit = safeNumber(scaleBenefit(point.benefit), lastBenefit);
      const scaledRisk = safeNumber(scaleRisk(point.risk), lastRisk);
      lastBenefit = scaledBenefit;
      lastRisk = scaledRisk;

      const benefit = scaledBenefit;
      const risk = scaledRisk;
      const positiveGap = Math.max(benefit - risk, 0);
      const negativeGap = Math.max(risk - benefit, 0);
      const enrichedPoint = {
        ...point,
        rawBenefit: point.benefit,
        rawRisk: point.risk,
        benefit,
        risk,
        positiveGap,
        negativeGap,
        netDisplay: benefit - risk,
      };
      processed.push(enrichedPoint);
      maxDisplay = Math.max(maxDisplay, benefit, risk);

      if (!seen.has(point.mgEq)) {
        seen.add(point.mgEq);
        deduped.push({
          ...enrichedPoint,
          benefit: safeNumber(benefit, 0),
          risk: safeNumber(risk, 0),
          positiveGap: Math.max(positiveGap, 0),
          negativeGap: Math.max(negativeGap, 0),
          netDisplay: safeNumber(enrichedPoint.netDisplay, 0),
        });
      }
    });

    return {
      visualData: processed,
      chartData: deduped,
      chartYMax: Math.max(60, maxDisplay * 1.1),
    };
  }, [data]);

  const contextualCeiling = Math.max(chartYMax * 1.05, 80);

  const netGradientStops = useMemo(() => {
    if (!chartYMax) return null;
    return {
      safe: 0.35,
      strain: 0.65,
      critical: 0.9,
    };
  }, [chartYMax]);

  const therapeuticLimit = useMemo(() => {
    if (!maxMgEq) return 0;
    return Math.max(maxMgEq * 0.25, maxMgEq * 0.2);
  }, [maxMgEq]);

  const diminishingLimit = useMemo(() => {
    if (!maxMgEq) return 0;
    const proposed = Math.max(maxMgEq * 0.65, therapeuticLimit + maxMgEq * 0.1);
    return Math.min(proposed, maxMgEq);
  }, [maxMgEq, therapeuticLimit]);

  const currentRisk = useMemo(() => {
    if (!visualData.length) return 0;
    const closest = visualData.reduce((prev, curr) =>
      Math.abs(curr.mgEq - currentMgEq) < Math.abs(prev.mgEq - currentMgEq) ? curr : prev,
    );
    return closest ? closest.rawRisk : 0;
  }, [visualData, currentMgEq]);

  const isDangerZone = currentRisk > 8;

  const updatePlayheadPosition = (event) => {
    if (!chartRef.current) return;

    const clientX =
      event?.clientX ??
      event?.touches?.[0]?.clientX ??
      event?.changedTouches?.[0]?.clientX;
    if (typeof clientX !== "number") return;

    const rect = chartRef.current.getBoundingClientRect();
    const x = clientX - rect.left;
    const chartWidth = Math.max(rect.width - 40, 1);
    const relativeX = Math.max(0, Math.min(1, x / chartWidth));
    const mgEqPosition = relativeX * maxMgEq;

    setPlayheadPosition(mgEqPosition);

    if (onTimeScrub && visualData.length) {
      const closestPoint = visualData.reduce((closest, point) =>
        Math.abs(point.mgEq - mgEqPosition) < Math.abs(closest.mgEq - mgEqPosition)
          ? point
          : closest,
      );
      debouncedScrub(closestPoint);
    }
  };

  const handleMouseDown = (event) => {
    if (!chartRef.current) return;
    setIsDragging(true);
    updatePlayheadPosition(event);
  };

  const handleMouseMove = (event) => {
    if (isDragging) {
      updatePlayheadPosition(event);
    }
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  React.useEffect(() => {
    if (isDragging) {
      document.addEventListener("mousemove", handleMouseMove);
      document.addEventListener("mouseup", handleMouseUp);
      document.addEventListener("touchmove", handleMouseMove);
      document.addEventListener("touchend", handleMouseUp);
    }
    return () => {
      document.removeEventListener("mousemove", handleMouseMove);
      document.removeEventListener("mouseup", handleMouseUp);
      document.removeEventListener("touchmove", handleMouseMove);
      document.removeEventListener("touchend", handleMouseUp);
    };
  }, [isDragging]);

  if (!stack.length) {
    return (
      <div className="flex h-full w-full items-center justify-center rounded-3xl border border-white/5 bg-[#060608]">
        <div className="text-center opacity-60">
          <div className="mb-4 text-6xl grayscale opacity-50">🧬</div>
          <h3 className="mb-2 text-lg font-bold text-white">No Active Compounds</h3>
          <p className="mb-6 text-sm text-[#A1A1AA]">
            Deploy a compound from the Tactical Dropdown in the Active Mixture rail to initiate the sim.
          </p>
          <button
            onClick={() => {
              const selector = document.querySelector("[data-compound-selector]");
              if (selector) {
                selector.scrollIntoView({ behavior: "smooth", block: "center" });
              }
              window.dispatchEvent(new CustomEvent("highlight-selector"));
              window.dispatchEvent(new CustomEvent("open-stack-drawer"));
            }}
            className="mx-auto flex items-center gap-2 rounded-full bg-white px-6 py-2.5 font-bold text-black shadow-lg transition-all hover:bg-zinc-200 active:scale-95"
          >
            <span className="text-xl leading-none">+</span>
            Add Compound
          </button>
        </div>
      </div>
    );
  }

  return (
    <div
      className="relative flex h-full w-full flex-col overflow-hidden rounded-3xl border border-white/5 bg-gradient-to-b from-[#0b0b11] via-[#09090c] to-[#050506] p-4 shadow-[0_0_80px_rgba(0,0,0,0.45)]"
      data-testid="net-chart"
    >
      <div className="relative z-20 mb-4 flex flex-wrap items-start justify-between gap-4">
        <div className="flex flex-col gap-1">
          <h3 className="text-sm font-bold tracking-wide text-white">{title}</h3>
          <span className="text-[11px] font-semibold uppercase tracking-[0.35em] text-[#9ca3af]">
            Benefit vs Risk
          </span>
        </div>
        <div className="flex flex-wrap items-center gap-4 text-[10px] uppercase tracking-[0.35em] text-[#9ca3af]">
          <div className="flex items-center gap-2">
            <span className="h-2 w-2 rounded-full" style={{ backgroundColor: PALETTE.benefit }} />
            <span>Anabolic Signal</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="h-2 w-2 rounded-full" style={{ backgroundColor: PALETTE.risk }} />
            <span>Systemic Cost</span>
          </div>
        </div>
      </div>

      <div ref={chartRef} className="flex-1 min-h-0">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart
            data={chartData}
            margin={{ top: 60, right: 40, left: -10, bottom: 20 }}
            onMouseDown={handleMouseDown}
            onTouchStart={handleMouseDown}
            style={{ cursor: isDragging ? "grabbing" : "grab" }}
          >
            <GradientDefs netGradientStops={netGradientStops} />

            <ReferenceArea x1={0} x2={therapeuticLimit} y1={0} y2={contextualCeiling} fill={ZONES.adaptive.fill} stroke="none" />
            <ReferenceArea x1={therapeuticLimit} x2={diminishingLimit} y1={0} y2={contextualCeiling} fill={ZONES.diminishing.fill} stroke="none" />
            <ReferenceArea x1={diminishingLimit} x2={maxMgEq} y1={0} y2={contextualCeiling} fill={ZONES.critical.fill} stroke="none" />

            <CartesianGrid stroke={PALETTE.outline} strokeDasharray="3 3" opacity={0.1} vertical={false} />

            <XAxis dataKey="mgEq" type="number" domain={[0, maxMgEq]} tick={false} axisLine={false} tickLine={false} />
            <YAxis hide domain={[0, (dataMax) => (Number.isFinite(dataMax) ? dataMax * 1.1 : contextualCeiling)]} />

            <Tooltip
              cursor={{
                stroke: isDangerZone ? PALETTE.risk : PALETTE.benefit,
                strokeWidth: 1,
                strokeDasharray: "3 3",
              }}
              content={<CustomTooltip crossover={crossover} critical={critical} />}
            />

            <Area type="linear" dataKey="risk" stroke="none" fill="url(#riskArea)" />
            <Area type="linear" dataKey="benefit" stroke="none" fill="url(#benefitArea)" />
            <Area type="linear" dataKey="positiveGap" stroke="none" fill="url(#positiveGap)" />
            <Area type="linear" dataKey="negativeGap" stroke="none" fill="url(#negativeGap)" />

            <ReferenceLine
              x={currentMgEq}
              stroke={isDangerZone ? PALETTE.risk : PALETTE.benefit}
              strokeWidth={isDangerZone ? 2 : 1}
              strokeDasharray="3 3"
              label={({ viewBox }) => {
                const x = viewBox.x;
                const y = viewBox.height - 10;
                return (
                  <g transform={`translate(${x},${y})`}>
                    <rect
                      x={-45}
                      y={-10}
                      width={90}
                      height={20}
                      rx={10}
                      fill={isDangerZone ? "#451a1f" : "#064E3B"}
                      stroke={isDangerZone ? "#7f1d1d" : "#059669"}
                      strokeWidth={1}
                    />
                    <text
                      x={0}
                      y={3}
                      textAnchor="middle"
                      fill={isDangerZone ? "#F87171" : "#34D399"}
                      fontSize={9}
                      fontWeight="bold"
                    >
                      CURRENT DOSE
                    </text>
                  </g>
                );
              }}
            />

            {netGradientStops && (
              <Area
                type="linear"
                dataKey="netDisplay"
                stroke="url(#netThermalGradient)"
                strokeWidth={3}
                fill="none"
                dot={false}
                isAnimationActive={false}
              />
            )}

            {playheadPosition !== null && (
              <ReferenceLine
                x={playheadPosition}
                stroke={PALETTE.info}
                strokeWidth={1.5}
                strokeDasharray="4 4"
                label={{
                  value: `${Math.round(playheadPosition)} mgEq`,
                  position: "insideTopRight",
                  fill: PALETTE.info,
                  fontSize: 10,
                }}
              />
            )}
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};

export default NetEffectChart;

