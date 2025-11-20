import React, { useMemo } from "react";
import {
  ComposedChart,
  LineChart,
  Line,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  ReferenceLine,
  ReferenceArea,
} from "recharts";
import { evaluateStack } from "../../utils/stackEngine";
import { simulateSerum } from "../../utils/pharmacokinetics";
import { getGeneticProfileConfig } from "../../utils/personalization";
import { defaultProfile } from "../../utils/personalization";
import { compoundData } from "../../data/compoundData";
import { COLORS } from "../../utils/theme";
import Slider from "../ui/Slider";

// Scientific / Clinical Dark Theme
const PALETTE = {
  surface: "#09090B",
  surfaceContainer: "#18181B",
  surfaceContainerHigh: "#27272A",
  primary: COLORS.benefit,
  secondary: "#3B82F6",
  tertiary: "#94A3B8",
  error: COLORS.risk,
  outline: "#3F3F46",
  onSurface: "#E4E4E7",
  onSurfaceVariant: "#A1A1AA",
};

const ReleaseTooltip = ({ active, payload, label }) => {
  if (!active || !payload || !payload.length) return null;

  return (
    <div className="bg-[#27272A] border border-[#3F3F46] p-4 rounded-xl shadow-xl min-w-[200px]">
      <p className="text-xs font-bold text-[#A1A1AA] mb-2">
        Day {Math.floor(label)} (Week {Math.floor(label / 7)})
      </p>
      {payload.map((entry) => (
        <div
          key={entry.name}
          className="flex justify-between items-center gap-4 mb-1"
        >
          <div className="flex items-center gap-2">
            <div
              className="w-2 h-2 rounded-full"
              style={{ backgroundColor: entry.color }}
            />
            <span className="text-xs text-[#A1A1AA] capitalize">
              {entry.name === "total"
                ? "Systemic Load"
                : compoundData[entry.name]?.name || entry.name}
            </span>
          </div>
          <span className="text-xs font-mono font-bold text-[#E4E4E7]">
            {entry.value.toFixed(1)}{" "}
            <span className="text-[9px] text-[#71717A]">mg</span>
          </span>
        </div>
      ))}
    </div>
  );
};

const CustomTooltip = ({ active, payload, label, crossover, critical }) => {
  if (!active || !payload || !payload.length) return null;

  const data = payload[0].payload;
  const isProfitable = data.net > 0;
  const isSaturated = data.saturation > 0.85;
  
  // Zone Detection
  const isCritical = critical !== null && data.mgEq >= critical;
  const isDiminishing = !isCritical && crossover !== null && data.mgEq >= crossover;
  
  const penaltyPct = Math.round(
    (1 - data.benefit / (data.benefit / (data.saturationPenalty || 1))) * 100,
  );

  return (
    <div
      className={`backdrop-blur-md border p-4 rounded-xl shadow-xl min-w-[240px] transition-colors duration-300 ${
        isCritical
          ? "bg-[#EF4444]/10 border-[#EF4444]/50"
          : isDiminishing
            ? "bg-[#F59E0B]/10 border-[#F59E0B]/50"
            : "bg-[#27272A]/95 border-[#3F3F46]"
      }`}
    >
      <p className="text-xs uppercase tracking-widest text-[#A1A1AA] mb-2">
        Anabolic Load:{" "}
        <span className="text-[#E4E4E7] font-bold">{Math.round(data.mgEq)} mgEq</span>
      </p>

      {isCritical ? (
        <div className="mb-3 p-2 bg-[#EF4444]/20 rounded border border-[#EF4444]/30">
          <div className="flex items-center gap-2 mb-1">
            <span className="text-lg">🛑</span>
            <span className="text-xs font-bold text-[#EF4444] uppercase tracking-wider">
              Critical Overload
            </span>
          </div>
          <p className="text-xs text-[#E4E4E7] leading-tight">
            Toxicity significantly exceeds benefit. Immediate reduction recommended.
          </p>
        </div>
      ) : isDiminishing ? (
        <div className="mb-3 p-2 bg-[#F59E0B]/20 rounded border border-[#F59E0B]/30">
          <div className="flex items-center gap-2 mb-1">
            <span className="text-lg">⚠️</span>
            <span className="text-xs font-bold text-[#F59E0B] uppercase tracking-wider">
              Diminishing Returns
            </span>
          </div>
          <p className="text-xs text-[#E4E4E7] leading-tight">
            Risk is outpacing benefit. Efficiency is negative, but gains are still possible.
          </p>
        </div>
      ) : (
        <div className="space-y-2">
          <div className="flex justify-between items-center">
            <span className="text-xs text-[#10B981] font-medium">
              Anabolic Signal
            </span>
            <span className="text-sm font-mono font-bold text-[#E4E4E7]">
              {data.benefit.toFixed(2)}
            </span>
          </div>

          {/* THE POSITIVE REINFORCEMENT */}
          {data.nonGenomicBenefit > 0.5 && (
            <div className="pl-2 border-l-2 border-[#06B6D4]/50 my-1">
              <div className="flex justify-between items-center">
                <span className="text-[9px] text-[#71717A]">
                  ↳ Receptor Load
                </span>
                <span className="text-[9px] font-mono text-[#A1A1AA]">
                  {(data.benefit - data.nonGenomicBenefit).toFixed(2)}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-[9px] text-[#06B6D4] font-bold">
                  ↳ Pathway Bypass
                </span>
                <span className="text-[9px] font-mono text-[#06B6D4]">
                  +{data.nonGenomicBenefit.toFixed(2)}
                </span>
              </div>
            </div>
          )}

          <div className="flex justify-between items-center">
            <span className="text-xs text-[#EF4444] font-medium">
              Systemic Cost
            </span>
            <span className="text-sm font-mono font-bold text-[#E4E4E7]">
              {data.risk.toFixed(2)}
            </span>
          </div>
          <div className="h-px bg-[#3F3F46]/50 my-1" />
          <div className="flex justify-between items-center">
            <span className="text-xs text-[#A1A1AA]">Net Efficiency</span>
            <span
              className={`text-sm font-mono font-bold ${
                isProfitable ? "text-[#10B981]" : "text-[#EF4444]"
              }`}
            >
              {data.net > 0 ? "+" : ""}
              {data.net.toFixed(2)}
            </span>
          </div>
        </div>
      )}

      {isSaturated && !isCritical && (
        <div className="mt-3 py-1.5 px-2 bg-[#22C55E]/10 border border-[#22C55E]/25 rounded text-[10px] text-[#A1A1AA] flex items-start gap-1.5">
          <span className="text-xs mt-0.5">ℹ️</span>
          <span className="leading-tight">
            AR Upregulation Active.
            <br />
            <span className="text-[#71717A]">
              Gains are still increasing, but efficiency is dropping. Risk is
              compounding faster than growth.
            </span>
          </span>
        </div>
      )}

      {data.saturationPenalty < 0.9 && (
        <div className="mt-1 text-[10px] text-[#71717A]">
          Potential wasted: -{penaltyPct}% (Receptor Saturation)
        </div>
      )}
    </div>
  );
};

const NetEffectChart = ({
  stack,
  userProfile = defaultProfile,
  durationWeeks = 12,
  setDurationWeeks,
  title,
  simple = false,
  onTimeScrub, // Callback for playhead position changes
}) => {
  const [playheadPosition, setPlayheadPosition] = React.useState(null);
  const [isDragging, setIsDragging] = React.useState(false);
  const chartRef = React.useRef(null);

  // Handle playhead interactions
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

  const updatePlayheadPosition = (event) => {
    if (!chartRef.current) return;

    const rect = chartRef.current.getBoundingClientRect();
    const x = event.clientX - rect.left;
    const chartWidth = rect.width - 40; // Account for margins
    const relativeX = Math.max(0, Math.min(1, x / chartWidth));

    // Convert to mgEq value
    const maxMgEq = data.length > 0 ? Math.max(...data.map(d => d.mgEq)) : 1000;
    const mgEqPosition = relativeX * maxMgEq;

    setPlayheadPosition(mgEqPosition);

    // Call the callback to update Virtual Phlebotomist
    if (onTimeScrub) {
      // Find the closest data point
      const closestPoint = data.reduce((closest, point) => {
        return Math.abs(point.mgEq - mgEqPosition) < Math.abs(closest.mgEq - mgEqPosition)
          ? point
          : closest;
      });
      onTimeScrub(closestPoint);
    }
  };

  React.useEffect(() => {
    if (isDragging) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
      document.addEventListener('touchmove', handleMouseMove);
      document.addEventListener('touchend', handleMouseUp);
    }

    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
      document.removeEventListener('touchmove', handleMouseMove);
      document.removeEventListener('touchend', handleMouseUp);
    };
  }, [isDragging]);
  // 1. Generate Projection Data (Dose Response)
  const { data, crossover, critical, currentMgEq } = useMemo(() => {
    if (stack.length === 0) return { data: [], crossover: null, currentMgEq: 0 };

    // Calculate Current Total mgEq (100% Baseline)
    let baselineMgEq = 0;
    stack.forEach((item) => {
      const meta = compoundData[item.compound];
      // Weighting Logic: Very High = 3, High = 1.5, Moderate/Other = 1
      const weight =
        meta.bindingAffinity === "very_high"
          ? 3
          : meta.bindingAffinity === "high"
            ? 1.5
            : 1;
      baselineMgEq += item.dose * weight;
    });

    // Define X-Axis Range: 0 to 1.5x Current Load
    // If baseline is 0 (shouldn't happen with active stack), default to 1000
    const maxMgEq = baselineMgEq > 0 ? baselineMgEq * 1.5 : 1000;
    const stepSize = maxMgEq / 30; // Generate ~30 points for smooth curve

    const points = [];
    let foundCrossover = null;
    let foundCritical = null;

    // Sweep from 0 to maxMgEq
    for (let mgEq = 0; mgEq <= maxMgEq; mgEq += stepSize) {
      // Calculate scalar relative to baseline
      // If baseline is 1000, and current mgEq is 500, scalar is 0.5
      const scalar = baselineMgEq > 0 ? mgEq / baselineMgEq : 0;
      const percent = scalar * 100; // Keep percent for internal logic if needed

      // Calculate hypothetical stack at this scalar
      const hypotheticalStack = stack.map((s) => ({
        ...s,
        dose: s.dose * scalar,
      }));

      // Run the Engine
      // FIXED DURATION: We use 12 weeks as the standard "Steady State" reference
      // This ensures the efficiency curve doesn't shift when the user changes the time slider
      const result = evaluateStack({
        stackInput: hypotheticalStack,
        profile: userProfile,
        durationWeeks: 12, 
      });

      // Calculate Saturation % for this point (Visual only)
      const saturation = Math.min(mgEq / 1500, 1); // 1500 mgEq is arbitrary saturation point
      
      const benefit = result.totals.totalBenefit;
      const risk = result.totals.totalRisk;

      // Detect Zones
      // 1. Diminishing Returns: Risk exceeds Benefit (Efficiency < 0)
      if (foundCrossover === null && mgEq > 100 && risk > benefit) {
        foundCrossover = mgEq;
      }

      // 2. Critical Overload: Risk exceeds Benefit by 30% (Significant toxicity)
      if (foundCritical === null && mgEq > 100 && risk > benefit * 1.3) {
        foundCritical = mgEq;
      }

      points.push({
        mgEq, // New X-Axis Key
        percent, // Kept for reference
        benefit: result.totals.totalBenefit,
        risk: result.totals.totalRisk,
        net: result.totals.netScore,
        saturation,
        saturationPenalty: result.totals.saturationPenalty,
        genomicBenefit: result.totals.genomicBenefit || 0,
        nonGenomicBenefit: result.totals.nonGenomicBenefit || 0,
      });
    }
    return { 
      data: points, 
      crossover: foundCrossover, 
      critical: foundCritical,
      currentMgEq: baselineMgEq 
    };
  }, [stack, userProfile]); // Removed durationWeeks dependency

  // 2. Generate Release Profile Data (Time Based)
  const { metabolismMultiplier } = getGeneticProfileConfig(userProfile);

  const releaseData = useMemo(() => {
    if (stack.length === 0) return [];
    return simulateSerum(stack, durationWeeks, { metabolismMultiplier });
  }, [stack, durationWeeks, metabolismMultiplier]);

  const serumTicks = useMemo(() => {
    if (!releaseData.length) return [0, 100];
    const maxVal = Math.max(...releaseData.map((d) => d.total));
    const stops = [0, 10, 50, 100, 250, 500, 1000, 1500, 2000, 3000];
    const cutoff = stops.findIndex((s) => s >= maxVal * 1.1); // 10% headroom
    return cutoff === -1 ? stops : stops.slice(0, cutoff + 1);
  }, [releaseData]);

  // 3. Generate Time Evolution Data (Benefit vs Risk over Time)
  const evolutionData = useMemo(() => {
    if (stack.length === 0 || releaseData.length === 0) return [];

    // Get Steady State Baseline (The "100%" point from Dose Response)
    // We can re-run evaluateStack once for the base case to be sure
    const baseResult = evaluateStack({
      stackInput: stack,
      profile: userProfile,
      durationWeeks, // This calculates the FINAL risk state
    });

    const steadyStateBenefit = baseResult.totals.totalBenefit;
    // We need the "Base Risk" BEFORE time penalties to scale it correctly over time
    // evaluateStack returns the final risk including time penalties.
    // Let's reverse-engineer the base risk or just use the rawRiskSum if exposed.
    // Actually, let's just use the totalRisk and assume it scales.
    // Better: The engine applies time penalty at the end.
    // Let's approximate: Risk(t) = BaseRisk * Load(t) * TimeFactor(t)
    // We can get BaseRisk from the 100% point in `data` if we look at it, but that also has time penalty?
    // Let's just use the ratio approach.

    const totalWeeklyDose = stack.reduce((sum, item) => {
      const isOral =
        item.compound === "dianabol" ||
        item.compound === "anadrol" ||
        item.compound === "winstrol" ||
        item.compound === "anavar" ||
        item.compound === "turinabol" ||
        item.compound === "proviron" ||
        item.compound === "halotestin" ||
        item.compound === "superdrol";
      return sum + (isOral ? item.dose * 7 : item.dose);
    }, 0);

    // Downsample releaseData to daily points for the chart
    const dailyPoints = [];
    for (let i = 0; i < releaseData.length; i += 6) {
      // Every 24h (4h * 6)
      const point = releaseData[i];
      const week = point.day / 7;

      // Load Ratio: How much "stuff" is active vs the weekly dose
      // Note: Serum levels can exceed weekly dose due to accumulation (half-life > 7 days)
      // This is exactly what we want to capture.
      const loadRatio = totalWeeklyDose > 0 ? point.total / totalWeeklyDose : 0;

      // Time Penalty (The "Toxicity Avalanche")
      // Matches stackEngine logic: > 8 weeks = exponential risk
      const timePenalty = week > 8 ? Math.pow(week / 8, 1.5) : 1.0;

      // Calculate Instantaneous Values
      // We use the steady state benefit/risk (which includes some penalties)
      // and scale them by the load ratio.
      // We then apply the DYNAMIC time penalty on top of the risk.
      // Note: baseResult.totals.totalRisk ALREADY includes the penalty for the FULL duration.
      // We want to show the evolution. So we should probably strip the penalty first?
      // Or just assume BaseRisk = Risk / FinalTimePenalty.

      const finalTimePenalty =
        durationWeeks > 8 ? Math.pow(durationWeeks / 8, 1.5) : 1.0;
      const rawRisk = baseResult.totals.totalRisk / finalTimePenalty;

      dailyPoints.push({
        day: point.day,
        week: week,
        benefit: steadyStateBenefit * loadRatio,
        risk: rawRisk * loadRatio * timePenalty,
        loadRatio,
      });
    }
    return dailyPoints;
  }, [stack, releaseData, userProfile, durationWeeks]);

  // Determine Current Risk State (at Current Dose)
  const currentRisk = useMemo(() => {
    if (!data.length) return 0;
    // Find closest point to currentMgEq
    const closest = data.reduce((prev, curr) => {
      return Math.abs(curr.mgEq - currentMgEq) < Math.abs(prev.mgEq - currentMgEq)
        ? curr
        : prev;
    });
    return closest ? closest.risk : 0;
  }, [data, currentMgEq]);

  const isDangerZone = currentRisk > 8.0; // Threshold for visual alarm

  if (stack.length === 0) {
    return (
      <div
        className="absolute inset-0 flex items-center justify-center bg-[#09090B]"
        data-testid="net-chart"
      >
        <div className="text-center opacity-60">
          <div className="text-6xl mb-4 grayscale opacity-50">🧬</div>
          <h3 className="text-lg font-bold text-[#E4E4E7] mb-2">
            No Active Compounds
          </h3>
          <p className="text-sm text-[#A1A1AA] mb-6 max-w-xs mx-auto">
            Deploy a compound from the Tactical Dropdown in the Active Mixture rail to initiate the sim.
          </p>
          <button
            onClick={() => {
              const selector = document.querySelector(
                "[data-compound-selector]",
              );
              if (selector) {
                selector.scrollIntoView({ behavior: "smooth", block: "center" });
              }
              window.dispatchEvent(new CustomEvent("highlight-selector"));
              window.dispatchEvent(new CustomEvent("open-stack-drawer"));
            }}
            className="px-6 py-2.5 bg-white text-black font-bold rounded-full hover:bg-zinc-200 transition-all active:scale-95 flex items-center gap-2 mx-auto shadow-lg"
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
      className="absolute inset-0 w-full h-full flex flex-col bg-[#09090B] p-4 gap-4 overflow-y-auto"
      data-testid="net-chart"
    >
      {/* TOP SECTION: Dose Response (Static) */}
      <div className="flex-1 min-h-[300px] bg-[#27272A] rounded-2xl shadow-lg border border-[#3F3F46]/30 relative overflow-hidden">
        <div className="absolute top-4 left-6 z-10 flex flex-wrap items-baseline gap-3 pr-6">
          <h3 className="text-sm font-bold text-[#E4E4E7] tracking-wide">
            {title || "Dose Efficiency"}
          </h3>
          <span className="text-[11px] text-[#A1A1AA] font-medium tracking-[0.15em]">
            Benefit vs Risk - Steady State
          </span>
        </div>

        <ResponsiveContainer
          width="100%"
          height="100%"
          ref={chartRef}
          onMouseDown={handleMouseDown}
          style={{ cursor: isDragging ? 'grabbing' : 'grab' }}
        >
          <ComposedChart
            data={data}
            margin={{ top: 40, right: 20, left: -20, bottom: 10 }}
          >
            <defs>
              <linearGradient id="benefitFill" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor={PALETTE.primary} stopOpacity={0.2} />
                <stop offset="95%" stopColor={PALETTE.primary} stopOpacity={0} />
              </linearGradient>
              <linearGradient id="riskFill" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor={PALETTE.error} stopOpacity={0.25} />
                <stop offset="95%" stopColor={PALETTE.error} stopOpacity={0} />
              </linearGradient>
              <pattern
                id="wastedPattern"
                patternUnits="userSpaceOnUse"
                width="8"
                height="8"
                patternTransform="rotate(45)"
              >
                <rect
                  width="4"
                  height="8"
                  transform="translate(0,0)"
                  fill={PALETTE.error}
                  opacity="0.1"
                />
              </pattern>
              <pattern
                id="diminishingPattern"
                patternUnits="userSpaceOnUse"
                width="8"
                height="8"
                patternTransform="rotate(45)"
              >
                <rect
                  width="4"
                  height="8"
                  transform="translate(0,0)"
                  fill="#F59E0B"
                  opacity="0.1"
                />
              </pattern>
            </defs>

            <CartesianGrid
              strokeDasharray="3 3"
              stroke={PALETTE.outline}
              opacity={0.1}
              vertical={false}
            />

            <XAxis
              dataKey="mgEq"
              type="number"
              domain={[0, "dataMax"]}
              tickFormatter={(val) => `${Math.round(val)}`}
              stroke={PALETTE.outline}
              tick={{ fill: "#A1A1AA", fontSize: 11 }}
              tickLine={false}
              axisLine={false}
              dy={5}
              label={{ 
                value: "Effective Anabolic Load (mgEq)", 
                position: "insideBottom", 
                offset: -5,
                fill: "#52525B",
                fontSize: 10
              }}
            />
            <YAxis hide domain={[0, (dataMax) => Math.max(dataMax, 6)]} />

            <Tooltip
              content={<CustomTooltip crossover={crossover} critical={critical} />}
              cursor={{
                stroke: isDangerZone ? PALETTE.error : PALETTE.primary,
                strokeWidth: 1,
                strokeDasharray: "3 3",
              }}
            />

            {/* Diminishing Returns Zone (Amber) */}
            {crossover !== null && (
              <ReferenceArea
                x1={crossover}
                x2={critical || "dataMax"}
                fill="url(#diminishingPattern)"
                opacity={1}
              />
            )}

            {/* Critical Overload Zone (Red) */}
            {critical !== null && (
              <ReferenceArea
                x1={critical}
                x2="dataMax"
                fill="url(#wastedPattern)"
                opacity={1}
              />
            )}

            {/* Interactive Playhead */}
            {playheadPosition !== null && (
              <ReferenceLine
                x={playheadPosition}
                stroke="#3B82F6"
                strokeWidth={2}
                strokeDasharray="none"
                label={{
                  value: `${Math.round(playheadPosition)} mgEq`,
                  position: "topRight",
                  fill: "#3B82F6",
                  fontSize: 10,
                  offset: 10
                }}
              />
            )}

            <Area
              type="monotone"
              dataKey="risk"
              stroke="none"
              fill="url(#riskFill)"
              isAnimationActive={false}
            />
            <Area
              type="monotone"
              dataKey="benefit"
              stroke="none"
              fill="url(#benefitFill)"
              isAnimationActive={false}
            />

            <Line
              type="monotone"
              dataKey="benefit"
              stroke={PALETTE.primary}
              strokeWidth={3}
              dot={false}
              name="Benefit"
              isAnimationActive={false}
            />
            <Line
              type="monotone"
              dataKey="risk"
              stroke={PALETTE.error}
              strokeWidth={3}
              strokeDasharray="5 5"
              dot={false}
              name="Risk"
              isAnimationActive={false}
            />

            <ReferenceLine
              x={currentMgEq}
              stroke={isDangerZone ? PALETTE.error : PALETTE.primary}
              strokeWidth={isDangerZone ? 2 : 1}
              strokeDasharray="3 3"
              strokeOpacity={0.8}
              label={({ viewBox }) => {
                const x = viewBox.x;
                const y = viewBox.height - 10; // Position near bottom
                return (
                  <g transform={`translate(${x},${y})`}>
                    <rect
                      x={-45}
                      y={-10}
                      width={90}
                      height={20}
                      rx={10}
                      fill={isDangerZone ? "#450A0A" : "#064E3B"}
                      stroke={isDangerZone ? "#7F1D1D" : "#059669"}
                      strokeWidth={1}
                    />
                    <text
                      x={0}
                      y={3}
                      textAnchor="middle"
                      fill={isDangerZone ? "#EF4444" : "#10B981"}
                      fontSize={9}
                      fontWeight="bold"
                    >
                      CURRENT DOSE
                    </text>
                  </g>
                );
              }}
            />
          </ComposedChart>
        </ResponsiveContainer>

        {/* Floating Labels */}
        <div className="absolute top-4 right-6 flex flex-col items-end gap-1 pointer-events-none">
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-bold text-[#10B981] uppercase tracking-wider">
              Anabolic Output
            </span>
            <div className="w-2 h-2 bg-[#10B981] rounded-full" />
          </div>
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-bold text-[#EF4444] uppercase tracking-wider">
              Systemic Load
            </span>
            <div className="w-2 h-2 bg-[#EF4444] rounded-full" />
          </div>
        </div>
      </div>

      {/* CONTROL BAR: Divider & Slider - Hidden in Simple Mode */}
      {!simple && (
        <div className="contents">

        <div className="flex items-center gap-6 bg-[#27272A] p-4 rounded-xl shadow-md border border-[#3F3F46]/30">
        <div className="flex items-center gap-3 min-w-max">
          <div className="p-2 bg-[#10B981]/10 rounded-lg text-[#10B981]">
            ⏱️
          </div>
          <div>
            <h4 className="text-xs font-bold text-[#E4E4E7] uppercase tracking-wider">
              Temporal Analysis
            </h4>
            <p className="text-[10px] text-[#A1A1AA]">
              Simulate accumulation & organ stress over time
            </p>
          </div>
        </div>

        <div className="h-8 w-px bg-[#3F3F46]/30 mx-2" />

        <div className="flex-1">
          <Slider
            label="Cycle Duration"
            value={durationWeeks}
            min={4}
            max={24}
            step={1}
            unit="weeks"
            onChange={setDurationWeeks}
            markers={[
              { value: 8, label: "Standard", tone: "accent" },
              { value: 16, label: "Extended", tone: "warning" },
              { value: 20, label: "Extreme", tone: "error" },
            ]}
          />
        </div>
      </div>

      {/* BOTTOM SECTION: Time-Based Charts */}
      <div className="flex-1 flex flex-col gap-4 min-h-[400px]">
        {/* Serum Release */}
        <div className="flex-1 bg-[#27272A] rounded-2xl shadow-lg border border-[#3F3F46]/30 relative overflow-hidden">
          <div className="absolute top-4 left-6 z-10 flex flex-wrap items-baseline gap-3 pr-6">
            <h3 className="text-sm font-bold text-[#E4E4E7] tracking-wide">
              Serum Release
            </h3>
            <span className="text-[11px] text-[#A1A1AA] font-medium tracking-[0.15em]">
              Pharmacokinetics & Active Half-Lives
            </span>
          </div>

          <ResponsiveContainer width="100%" height="100%">
            <LineChart
              data={releaseData}
              margin={{ top: 40, right: 20, left: 20, bottom: 10 }}
            >
              <CartesianGrid
                strokeDasharray="3 3"
                stroke={PALETTE.outline}
                opacity={0.1}
                vertical={false}
              />
              <XAxis
                dataKey="day"
                type="number"
                domain={[0, durationWeeks * 7]}
                tickFormatter={(val) => {
                  const week = Math.floor(val / 7);
                  return val % 7 === 0 ? `W${week}` : "";
                }}
                ticks={Array.from(
                  { length: durationWeeks + 1 },
                  (_, i) => i * 7,
                )}
                stroke={PALETTE.outline}
                fontSize={10}
                tickLine={false}
                axisLine={false}
                dy={5}
                interval={0}
              />
              <YAxis
                scale="sqrt"
                domain={[0, "auto"]}
                ticks={serumTicks}
                stroke={PALETTE.outline}
                tick={{ fill: "#A1A1AA", fontSize: 11 }}
                tickLine={false}
                axisLine={false}
                tickFormatter={(val) => `${val}mg`}
                width={40}
              />
              <Tooltip content={<ReleaseTooltip />} />

              <Area
                type="monotone"
                dataKey="total"
                stroke="none"
                fill={PALETTE.primary}
                fillOpacity={0.05}
              />

              {stack.map((item) => (
                <Line
                  key={item.compound}
                  type="monotone"
                  dataKey={item.compound}
                  stroke={compoundData[item.compound]?.color || "#fff"}
                  strokeWidth={2}
                  dot={false}
                  activeDot={{ r: 4 }}
                />
              ))}
            </LineChart>
          </ResponsiveContainer>
        </div>

        {/* Cycle Evolution */}
        <div className="flex-1 bg-[#27272A] rounded-2xl shadow-lg border border-[#3F3F46]/30 relative overflow-hidden">
          <div className="absolute top-4 left-6 z-10 flex flex-wrap items-baseline gap-3 pr-6">
            <h3 className="text-sm font-bold text-[#E4E4E7] tracking-wide">
              Cycle Evolution
            </h3>
            <span className="text-[11px] text-[#A1A1AA] font-medium tracking-[0.15em]">
              Benefit vs Risk Accumulation
            </span>
          </div>

          <ResponsiveContainer width="100%" height="100%">
            <LineChart
              data={evolutionData}
              margin={{ top: 40, right: 20, left: 20, bottom: 10 }}
            >
              <CartesianGrid
                strokeDasharray="3 3"
                stroke={PALETTE.outline}
                opacity={0.1}
                vertical={false}
              />
              <XAxis
                dataKey="day"
                type="number"
                domain={[0, durationWeeks * 7]}
                tickFormatter={(val) => {
                  const week = Math.floor(val / 7);
                  return val % 7 === 0 ? `W${week}` : "";
                }}
                ticks={Array.from(
                  { length: durationWeeks + 1 },
                  (_, i) => i * 7,
                )}
                stroke={PALETTE.outline}
                fontSize={10}
                tickLine={false}
                axisLine={false}
                dy={5}
                interval={0}
              />
              <YAxis hide />
              <Tooltip
                content={({ active, payload, label }) => {
                  if (!active || !payload || !payload.length) return null;
                  return (
                    <div className="bg-[#27272A] border border-[#3F3F46] p-3 rounded-xl shadow-xl">
                      <p className="text-xs font-bold text-[#A1A1AA] mb-2">
                        Day {Math.floor(label)} (Week {Math.floor(label / 7)})
                      </p>
                      {payload.map((entry) => (
                        <div
                          key={entry.name}
                          className="flex justify-between gap-4 text-xs"
                        >
                          <span style={{ color: entry.color }}>
                            {entry.name}
                          </span>
                          <span className="font-mono font-bold text-[#E4E4E7]">
                            {entry.value.toFixed(2)}
                          </span>
                        </div>
                      ))}
                    </div>
                  );
                }}
              />

              <Line
                type="monotone"
                dataKey="benefit"
                stroke={PALETTE.primary}
                strokeWidth={2}
                dot={false}
                name="Anabolic Power"
              />
              <Line
                type="monotone"
                dataKey="risk"
                stroke={PALETTE.error}
                strokeWidth={2}
                dot={false}
                name="Systemic Risk"
              />

              <ReferenceLine
                x={8 * 7}
                stroke={PALETTE.error}
                strokeDasharray="3 3"
                opacity={0.5}
                label={{
                  value: "Risk Escalation",
                  position: "insideTopRight",
                  fill: PALETTE.error,
                  fontSize: 10,
                }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  )}

    </div>
  );
};

export default NetEffectChart;

