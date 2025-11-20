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
import { defaultProfile } from "../../utils/personalization";
import { compoundData } from "../../data/compoundData";
import { COLORS } from "../../utils/theme";
import Slider from "../ui/Slider";

// Scientific / Clinical Dark Theme
const PALETTE = {
  surface: "#0B0C10", // Deepest Background
  surfaceContainer: "#15171E", // Card Background
  surfaceContainerHigh: "#1F2937", // Hover/Active
  primary: COLORS.benefit, // Emerald Green
  secondary: "#06B6D4", // Cyan
  tertiary: "#8B5CF6", // Violet
  error: COLORS.risk, // Red
  outline: "#374151", // Borders
  onSurface: "#F3F4F6", // Primary Text
  onSurfaceVariant: "#9CA3AF", // Secondary Text
};

const ReleaseTooltip = ({ active, payload, label }) => {
  if (!active || !payload || !payload.length) return null;

  return (
    <div className="bg-[#15171E] border border-[#374151] p-4 rounded-xl shadow-xl min-w-[200px] z-50">
      <p className="text-sm font-bold text-[#9CA3AF] mb-2">
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
            <span className="text-xs text-[#9CA3AF] capitalize">
              {entry.name === "total"
                ? "Systemic Load"
                : compoundData[entry.name]?.name || entry.name}
            </span>
          </div>
          <span className="text-xs font-mono font-bold text-[#F3F4F6]">
            {entry.value.toFixed(1)}{" "}
            <span className="text-[9px] text-[#6B7280]">mg</span>
          </span>
        </div>
      ))}
    </div>
  );
};

const CustomTooltip = ({ active, payload, label, crossover }) => {
  if (!active || !payload || !payload.length) return null;

  const data = payload[0].payload;
  const isProfitable = data.net > 0;
  const isSaturated = data.saturation > 0.85;
  const isWasted = crossover !== null && data.percent > crossover;
  const penaltyPct = Math.round(
    (1 - data.benefit / (data.benefit / (data.saturationPenalty || 1))) * 100,
  );

  return (
    <div
      className={`backdrop-blur-md border p-4 rounded-xl shadow-xl min-w-[240px] transition-colors duration-300 z-50 ${
        isWasted
          ? "bg-[#EF4444]/10 border-[#EF4444]/50"
          : "bg-[#15171E]/95 border-[#374151]"
      }`}
    >
      <p className="text-xs uppercase tracking-widest text-[#9CA3AF] mb-2">
        Stack Intensity:{" "}
        <span className="text-[#F3F4F6] font-bold">{label}%</span>
      </p>

      {isWasted ? (
        <div className="mb-3 p-2 bg-[#EF4444]/20 rounded border border-[#EF4444]/30">
          <div className="flex items-center gap-2 mb-1">
            <span className="text-lg">🛑</span>
            <span className="text-xs font-bold text-[#EF4444] uppercase tracking-wider">
              Wasted Zone
            </span>
          </div>
          <p className="text-xs text-[#F3F4F6] leading-tight">
            Every mg added here reduces net growth. Risk exceeds benefit.
          </p>
        </div>
      ) : (
        <div className="space-y-2">
          <div className="flex justify-between items-center">
            <span className="text-xs text-[#10B981] font-medium">
              Anabolic Signal
            </span>
            <span className="text-sm font-mono font-bold text-[#F3F4F6]">
              {data.benefit.toFixed(2)}
            </span>
          </div>

          {/* THE POSITIVE REINFORCEMENT */}
          {data.nonGenomicBenefit > 0.5 && (
            <div className="pl-2 border-l-2 border-[#06B6D4]/50 my-1">
              <div className="flex justify-between items-center">
                <span className="text-[9px] text-[#6B7280]">
                  ↳ Receptor Load
                </span>
                <span className="text-[9px] font-mono text-[#9CA3AF]">
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
            <span className="text-sm font-mono font-bold text-[#F3F4F6]">
              {data.risk.toFixed(2)}
            </span>
          </div>
          <div className="h-px bg-[#374151]/50 my-1" />
          <div className="flex justify-between items-center">
            <span className="text-xs text-[#9CA3AF]">Net Efficiency</span>
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

      {isSaturated && !isWasted && (
        <div className="mt-3 py-1.5 px-2 bg-[#10B981]/10 border border-[#10B981]/20 rounded text-[10px] text-[#9CA3AF] flex items-start gap-1.5">
          <span className="text-xs mt-0.5">ℹ️</span>
          <span className="leading-tight">
            AR Upregulation Active.
            <br />
            <span className="text-[#6B7280]">
              Gains are still increasing, but efficiency is dropping. Risk is
              compounding faster than growth.
            </span>
          </span>
        </div>
      )}

      {data.saturationPenalty < 0.9 && (
        <div className="mt-1 text-[10px] text-[#6B7280]">
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
}) => {
  // 1. Generate Projection Data (Dose Response)
  const { data, crossover, maxNetPercent } = useMemo(() => {
    if (stack.length === 0) return { data: [], crossover: null, maxNetPercent: 0 };

    const points = [];
    let foundCrossover = null;
    let maxNet = -Infinity;
    let maxNetP = 0;

    // Sweep from 0% to 150% Intensity
    for (let percent = 0; percent <= 150; percent += 5) {
      const scalar = percent / 100;

      // Calculate hypothetical stack at this scalar
      const hypotheticalStack = stack.map((s) => ({
        ...s,
        dose: s.dose * scalar,
      }));

      // Run the Engine
      const result = evaluateStack({
        stackInput: hypotheticalStack,
        profile: userProfile,
        durationWeeks,
      });

      // Calculate Saturation % for this point
      let currentARLoad = 0;
      hypotheticalStack.forEach((item) => {
        const meta = compoundData[item.compound];
        if (meta?.pathway === "ar_genomic") {
          const weight =
            meta.bindingAffinity === "very_high"
              ? 3
              : meta.bindingAffinity === "high"
                ? 1.5
                : 1;
          currentARLoad += item.dose * weight;
        }
      });

      const saturation = Math.min(currentARLoad / 1500, 1);
      const benefit = result.totals.totalBenefit;
      const risk = result.totals.totalRisk;
      const net = result.totals.netScore;

      if (net > maxNet) {
        maxNet = net;
        maxNetP = percent;
      }

      // Detect Crossover (Risk > Benefit)
      // We look for the first point where Risk exceeds Benefit significantly (to avoid noise at 0)
      if (foundCrossover === null && percent > 10 && risk > benefit) {
        foundCrossover = percent;
      }

      points.push({
        percent,
        benefit: result.totals.totalBenefit,
        risk: result.totals.totalRisk,
        net: result.totals.netScore,
        saturation,
        saturationPenalty: result.totals.saturationPenalty,
        genomicBenefit: result.totals.genomicBenefit || 0,
        nonGenomicBenefit: result.totals.nonGenomicBenefit || 0,
      });
    }
    return { data: points, crossover: foundCrossover, maxNetPercent: maxNetP };
  }, [stack, userProfile, durationWeeks]);

  // 2. Generate Release Profile Data (Time Based)
  const releaseData = useMemo(() => {
    if (stack.length === 0) return [];
    return simulateSerum(stack, durationWeeks);
  }, [stack, durationWeeks]);

  const serumTicks = useMemo(() => {
    if (!releaseData.length) return [0, 100];
    const maxVal = Math.max(...releaseData.map((d) => d.total));
    // Log scale ticks
    return [1, 10, 50, 100, 250, 500, 1000, 2000, 5000].filter(t => t <= maxVal * 1.5);
  }, [releaseData]);

  // 3. Generate Time Evolution Data (Benefit vs Risk over Time)
  const evolutionData = useMemo(() => {
    if (stack.length === 0 || releaseData.length === 0) return [];

    // Get Steady State Baseline (The "100%" point from Dose Response)
    const baseResult = evaluateStack({
      stackInput: stack,
      profile: userProfile,
      durationWeeks, // This calculates the FINAL risk state
    });

    const steadyStateBenefit = baseResult.totals.totalBenefit;

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
      const loadRatio = totalWeeklyDose > 0 ? point.total / totalWeeklyDose : 0;

      // Time Penalty (The "Toxicity Avalanche")
      // Matches stackEngine logic: > 8 weeks = exponential risk
      const timePenalty = week > 8 ? Math.pow(week / 8, 1.5) : 1.0;

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

  // Determine Current Risk State (at 100%)
  const currentRisk = useMemo(() => {
    const currentPoint = data.find((d) => d.percent === 100);
    return currentPoint ? currentPoint.risk : 0;
  }, [data]);

  const isDangerZone = currentRisk > 8.0; // Threshold for visual alarm

  if (stack.length === 0) {
    return (
      <div className="absolute inset-0 flex items-center justify-center bg-[#0B0C10]">
        <div className="text-center opacity-60">
          <div className="text-6xl mb-4 grayscale opacity-50">🧬</div>
          <h3 className="text-lg font-bold text-[#F3F4F6] mb-2">
            No Active Compounds
          </h3>
          <p className="text-sm text-[#9CA3AF] mb-6 max-w-xs mx-auto">
            Select a compound from the library below to begin your simulation.
          </p>
          <button
            onClick={() => {
              document
                .querySelector("footer")
                ?.scrollIntoView({ behavior: "smooth" });
              window.dispatchEvent(new CustomEvent("highlight-library"));
            }}
            className="px-6 py-2.5 bg-[#10B981] text-[#0B0C10] font-bold rounded-full hover:bg-[#34D399] transition-all active:scale-95 flex items-center gap-2 mx-auto shadow-lg"
          >
            <span className="text-xl leading-none">+</span>
            Add Compound
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="absolute inset-0 w-full h-full flex flex-col bg-[#0B0C10] p-4 gap-4 overflow-y-auto">
      {/* TOP SECTION: Dose Efficiency (Reimagined) */}
      <div className="flex-1 min-h-[300px] bg-[#15171E] rounded-2xl shadow-lg border border-[#374151]/20 relative overflow-hidden">
        <div className="absolute top-4 left-6 z-10">
          <h3 className="text-sm font-bold text-[#F3F4F6] tracking-wide">
            Dose Efficiency
          </h3>
          <p className="text-[10px] text-[#9CA3AF]">
            Net Efficiency (Benefit - Risk) vs Intensity
          </p>
        </div>

        <ResponsiveContainer width="100%" height="100%">
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
              <linearGradient id="netFill" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor={PALETTE.secondary} stopOpacity={0.3} />
                <stop offset="95%" stopColor={PALETTE.secondary} stopOpacity={0} />
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
            </defs>

            <CartesianGrid
              strokeDasharray="3 3"
              stroke={PALETTE.outline}
              opacity={0.1}
              vertical={false}
            />

            <XAxis
              dataKey="percent"
              type="number"
              domain={[0, 150]}
              tickFormatter={(val) => `${val}%`}
              stroke={PALETTE.outline}
              tick={{ fill: "#9CA3AF", fontSize: 12 }}
              tickLine={false}
              axisLine={false}
              dy={5}
            />
            <YAxis hide domain={[0, (dataMax) => Math.max(dataMax, 6)]} />

            <Tooltip
              content={<CustomTooltip crossover={crossover} />}
              cursor={{
                stroke: isDangerZone ? PALETTE.error : PALETTE.primary,
                strokeWidth: 1,
                strokeDasharray: "3 3",
              }}
            />

            {/* Highlight Optimal Zone */}
            <ReferenceArea
              x1={maxNetPercent - 10}
              x2={maxNetPercent + 10}
              fill={PALETTE.secondary}
              fillOpacity={0.05}
            />

            {crossover !== null && (
              <ReferenceArea
                x1={crossover}
                x2={150}
                fill="url(#wastedPattern)"
                opacity={1}
              />
            )}

            {/* Background Context Lines */}
            <Line
              type="monotone"
              dataKey="benefit"
              stroke={PALETTE.primary}
              strokeWidth={1}
              strokeOpacity={0.4}
              dot={false}
              name="Benefit"
              isAnimationActive={false}
            />
            <Line
              type="monotone"
              dataKey="risk"
              stroke={PALETTE.error}
              strokeWidth={1}
              strokeOpacity={0.4}
              strokeDasharray="5 5"
              dot={false}
              name="Risk"
              isAnimationActive={false}
            />

            {/* The Main Event: Net Efficiency */}
            <Area
              type="monotone"
              dataKey="net"
              stroke={PALETTE.secondary}
              strokeWidth={3}
              fill="url(#netFill)"
              name="Net Efficiency"
              isAnimationActive={false}
            />

            <ReferenceLine
              x={100}
              stroke={isDangerZone ? PALETTE.error : PALETTE.primary}
              strokeWidth={isDangerZone ? 2 : 1}
              strokeDasharray="3 3"
              strokeOpacity={0.8}
            >
              <div />
            </ReferenceLine>
          </ComposedChart>
        </ResponsiveContainer>

        {/* Floating Labels */}
        <div className="absolute top-4 right-6 flex flex-col items-end gap-1 pointer-events-none">
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-bold text-[#06B6D4] uppercase tracking-wider">
              Net Efficiency
            </span>
            <div className="w-2 h-2 bg-[#06B6D4] rounded-full" />
          </div>
          <div className="flex items-center gap-2 opacity-50">
            <span className="text-[10px] font-bold text-[#10B981] uppercase tracking-wider">
              Benefit
            </span>
            <div className="w-2 h-2 bg-[#10B981] rounded-full" />
          </div>
          <div className="flex items-center gap-2 opacity-50">
            <span className="text-[10px] font-bold text-[#EF4444] uppercase tracking-wider">
              Risk
            </span>
            <div className="w-2 h-2 bg-[#EF4444] rounded-full" />
          </div>
        </div>

        <div className="absolute bottom-6 left-2/3 -translate-x-1/2 pointer-events-none">
          <span
            className={`text-[9px] font-bold px-3 py-1 rounded-full border transition-colors duration-300 shadow-sm ${
              isDangerZone
                ? "text-[#EF4444] bg-[#450A0A] border-[#7F1D1D]"
                : "text-[#10B981] bg-[#064E3B] border-[#059669]"
            }`}
          >
            CURRENT DOSE
          </span>
        </div>
      </div>

      {/* CONTROL BAR: Divider & Slider */}
      <div className="flex items-center gap-6 bg-[#1F2937] p-4 rounded-xl shadow-md border border-[#374151]/20">
        <div className="flex items-center gap-3 min-w-max">
          <div className="p-2 bg-[#10B981]/10 rounded-lg text-[#10B981]">
            ⏱️
          </div>
          <div>
            <h4 className="text-xs font-bold text-[#F3F4F6] uppercase tracking-wider">
              Temporal Analysis
            </h4>
            <p className="text-[10px] text-[#9CA3AF]">
              Simulate accumulation & organ stress over time
            </p>
          </div>
        </div>

        <div className="h-8 w-px bg-[#374151]/30 mx-2" />

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
        <div className="flex-1 bg-[#15171E] rounded-2xl shadow-lg border border-[#374151]/20 relative overflow-hidden">
          <div className="absolute top-4 left-6 z-10">
            <h3 className="text-sm font-bold text-[#F3F4F6] tracking-wide">
              Serum Release
            </h3>
            <p className="text-[10px] text-[#9CA3AF]">
              Pharmacokinetics & Active Half-Lives (Log Scale)
            </p>
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
                fontSize={12}
                tickLine={false}
                axisLine={false}
                dy={5}
                interval={0}
              />
              <YAxis
                scale="log"
                domain={['auto', 'auto']}
                ticks={serumTicks}
                stroke={PALETTE.outline}
                tick={{ fill: "#9CA3AF", fontSize: 12 }}
                tickLine={false}
                axisLine={false}
                tickFormatter={(val) => `${val}mg`}
                width={50}
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
        <div className="flex-1 bg-[#15171E] rounded-2xl shadow-lg border border-[#374151]/20 relative overflow-hidden">
          <div className="absolute top-4 left-6 z-10">
            <h3 className="text-sm font-bold text-[#F3F4F6] tracking-wide">
              Cycle Evolution
            </h3>
            <p className="text-[10px] text-[#9CA3AF]">
              Benefit vs Risk Accumulation
            </p>
          </div>

          <ResponsiveContainer width="100%" height="100%">
            <LineChart
              data={evolutionData}
              margin={{ top: 40, right: 20, left: 20, bottom: 10 }}
            >
              <defs>
                <linearGradient id="riskZoneGradient" x1="0" y1="0" x2="1" y2="0">
                  <stop offset="0%" stopColor={PALETTE.error} stopOpacity={0.05} />
                  <stop offset="100%" stopColor={PALETTE.error} stopOpacity={0.2} />
                </linearGradient>
              </defs>
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
                fontSize={12}
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
                    <div className="bg-[#1F2937] border border-[#374151] p-3 rounded-xl shadow-xl z-50">
                      <p className="text-xs font-bold text-[#9CA3AF] mb-2">
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
                          <span className="font-mono font-bold text-[#F3F4F6]">
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

              {/* Risk Escalation Zone */}
              <ReferenceArea
                x1={8 * 7}
                x2={durationWeeks * 7}
                fill="url(#riskZoneGradient)"
                opacity={1}
              />
              
              <ReferenceLine
                x={8 * 7}
                stroke={PALETTE.error}
                strokeDasharray="3 3"
                opacity={0.8}
                label={{
                  value: "RISK ESCALATION",
                  position: "insideTopRight",
                  fill: PALETTE.error,
                  fontSize: 10,
                  fontWeight: "bold",
                  dy: -10,
                }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
};

export default NetEffectChart;
