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
  Legend,
} from "recharts";
import { evaluateStack } from "../../utils/stackEngine";
import { simulateSerum } from "../../utils/pharmacokinetics";
import { defaultProfile } from "../../utils/personalization";
import { compoundData } from "../../data/compoundData";
import { COLORS } from "../../utils/theme";
import Slider from "../ui/Slider";

// TensorBoard / Google Cloud Console Theme
const PALETTE = {
  surface: COLORS.bgSurface,
  grid: COLORS.grid,
  primary: COLORS.benefit, // Cornflower Blue
  secondary: COLORS.accentCyan,
  tertiary: COLORS.accentSecondary,
  error: COLORS.risk, // Light Red
  warning: COLORS.accentWarning, // Yellow
  textPrimary: COLORS.textPrimary,
  textSecondary: COLORS.textSecondary,
};

const ChartHeader = ({ title, subtitle, legendItems }) => (
  <div className="flex items-center justify-between px-4 py-3 border-b border-physio-border-subtle bg-physio-bg-surface">
    <div>
      <h3 className="text-xs font-bold text-physio-text-primary uppercase tracking-wider">
        {title}
      </h3>
      {subtitle && (
        <p className="text-[10px] text-physio-text-secondary mt-0.5">
          {subtitle}
        </p>
      )}
    </div>
    {legendItems && (
      <div className="flex items-center gap-4">
        {legendItems.map((item) => (
          <div key={item.label} className="flex items-center gap-1.5">
            <div
              className={`w-2 h-2 rounded-full ${item.shape === "line" ? "h-0.5 w-3" : ""}`}
              style={{ backgroundColor: item.color }}
            />
            <span className="text-[10px] font-medium text-physio-text-secondary">
              {item.label}
            </span>
          </div>
        ))}
      </div>
    )}
  </div>
);

const ReleaseTooltip = ({ active, payload, label }) => {
  if (!active || !payload || !payload.length) return null;

  return (
    <div className="bg-physio-bg-core border border-physio-border-subtle p-3 rounded shadow-xl min-w-[180px] z-50">
      <p className="text-xs font-bold text-physio-text-secondary mb-2 border-b border-physio-border-subtle pb-1">
        Day {Math.floor(label)} (Week {Math.floor(label / 7)})
      </p>
      {payload.map((entry) => (
        <div
          key={entry.name}
          className="flex justify-between items-center gap-4 mb-1"
        >
          <div className="flex items-center gap-2">
            <div
              className="w-1.5 h-1.5 rounded-full"
              style={{ backgroundColor: entry.color }}
            />
            <span className="text-[10px] text-physio-text-secondary capitalize">
              {entry.name === "total"
                ? "Systemic Load"
                : compoundData[entry.name]?.name || entry.name}
            </span>
          </div>
          <span className="text-[10px] font-mono font-bold text-physio-text-primary">
            {entry.value.toFixed(1)}{" "}
            <span className="text-[9px] text-physio-text-tertiary">mg</span>
          </span>
        </div>
      ))}
    </div>
  );
};

const CustomTooltip = ({ active, payload, label, crossover }) => {
  if (!active || !payload || !payload.length) return null;

  const data = payload[0].payload;
  const isWasted = crossover !== null && data.percent > crossover;

  return (
    <div
      className={`backdrop-blur-md border p-3 rounded shadow-xl min-w-[200px] z-50 ${
        isWasted
          ? "bg-physio-accent-critical/10 border-physio-accent-critical/30"
          : "bg-physio-bg-core/95 border-physio-border-subtle"
      }`}
    >
      <div className="flex justify-between items-center mb-2 border-b border-physio-border-subtle pb-1">
        <span className="text-[10px] uppercase tracking-widest text-physio-text-secondary">
          Intensity
        </span>
        <span className="text-xs font-mono font-bold text-physio-text-primary">{label}%</span>
      </div>

      {isWasted ? (
        <div className="mb-2 text-[10px] text-physio-accent-critical font-bold flex items-center gap-1">
          <span>⚠️</span> Diminishing Returns
        </div>
      ) : (
        <div className="space-y-1">
          <div className="flex justify-between items-center">
            <span className="text-[10px] text-physio-accent-primary">Benefit</span>
            <span className="text-xs font-mono font-bold text-physio-text-primary">
              {data.benefit.toFixed(2)}
            </span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-[10px] text-physio-accent-critical">Risk</span>
            <span className="text-xs font-mono font-bold text-physio-text-primary">
              {data.risk.toFixed(2)}
            </span>
          </div>
          <div className="h-px bg-physio-border-subtle my-1" />
          <div className="flex justify-between items-center">
            <span className="text-[10px] text-physio-text-secondary">Net Efficiency</span>
            <span
              className={`text-xs font-mono font-bold ${
                data.net > 0 ? "text-physio-accent-success" : "text-physio-accent-critical"
              }`}
            >
              {data.net > 0 ? "+" : ""}
              {data.net.toFixed(2)}
            </span>
          </div>
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

  const currentRisk = useMemo(() => {
    const currentPoint = data.find((d) => d.percent === 100);
    return currentPoint ? currentPoint.risk : 0;
  }, [data]);

  const isDangerZone = currentRisk > 8.0;

  if (stack.length === 0) {
    return (
      <div className="absolute inset-0 flex items-center justify-center bg-physio-bg-core">
        <div className="text-center opacity-60">
          <div className="text-4xl mb-4 grayscale opacity-50">🧬</div>
          <h3 className="text-sm font-bold text-physio-text-primary mb-2">
            No Active Compounds
          </h3>
          <p className="text-xs text-physio-text-secondary mb-6 max-w-xs mx-auto">
            Select a compound from the library below to begin your simulation.
          </p>
          <button
            onClick={() => {
              document
                .querySelector("footer")
                ?.scrollIntoView({ behavior: "smooth" });
              window.dispatchEvent(new CustomEvent("highlight-library"));
            }}
            className="px-4 py-2 bg-physio-accent-primary text-physio-bg-core font-bold rounded hover:bg-physio-accent-primary/90 transition-all text-xs"
          >
            + Add Compound
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="absolute inset-0 w-full h-full flex flex-col bg-physio-bg-core p-2 gap-2 overflow-y-auto">
      {/* TOP SECTION: Dose Efficiency */}
      <div className="flex-1 min-h-[300px] bg-physio-bg-surface border border-physio-border-subtle flex flex-col">
        <ChartHeader 
          title="Dose Efficiency" 
          subtitle="Net Efficiency (Benefit - Risk) vs Intensity"
          legendItems={[
            { label: "Benefit", color: PALETTE.primary, shape: "line" },
            { label: "Risk", color: PALETTE.error, shape: "line" },
            { label: "Net Eff.", color: PALETTE.secondary, shape: "area" },
          ]}
        />
        <div className="flex-1 min-h-0 relative">
          <ResponsiveContainer width="100%" height="100%">
            <ComposedChart
              data={data}
              margin={{ top: 20, right: 20, left: -20, bottom: 0 }}
            >
              <defs>
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
                stroke={PALETTE.grid}
                opacity={0.5}
                vertical={true}
                horizontal={true}
              />

              <XAxis
                dataKey="percent"
                type="number"
                domain={[0, 150]}
                tickFormatter={(val) => `${val}%`}
                stroke={PALETTE.grid}
                tick={{ fill: PALETTE.textSecondary, fontSize: 10, fontFamily: 'Roboto Mono' }}
                tickLine={false}
                axisLine={false}
                dy={5}
              />
              <YAxis 
                hide={false} 
                domain={[0, (dataMax) => Math.max(dataMax, 6)]} 
                stroke={PALETTE.grid}
                tick={{ fill: PALETTE.textSecondary, fontSize: 10, fontFamily: 'Roboto Mono' }}
                tickLine={false}
                axisLine={false}
                width={30}
              />

              <Tooltip
                content={<CustomTooltip crossover={crossover} />}
                cursor={{
                  stroke: PALETTE.textSecondary,
                  strokeWidth: 1,
                  strokeDasharray: "3 3",
                }}
              />

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

              <Line
                type="monotone"
                dataKey="benefit"
                stroke={PALETTE.primary}
                strokeWidth={1.5}
                dot={false}
                isAnimationActive={false}
              />
              <Line
                type="monotone"
                dataKey="risk"
                stroke={PALETTE.error}
                strokeWidth={1.5}
                strokeDasharray="3 3"
                dot={false}
                isAnimationActive={false}
              />

              <Area
                type="monotone"
                dataKey="net"
                stroke={PALETTE.secondary}
                strokeWidth={2}
                fill="url(#netFill)"
                isAnimationActive={false}
              />

              <ReferenceLine
                x={100}
                stroke={isDangerZone ? PALETTE.error : PALETTE.primary}
                strokeWidth={1}
                strokeDasharray="3 3"
              />
            </ComposedChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* CONTROL BAR */}
      <div className="flex items-center gap-4 bg-physio-bg-surface px-4 py-2 border border-physio-border-subtle">
        <div className="flex items-center gap-2 min-w-max">
          <span className="text-lg">⏱️</span>
          <div>
            <h4 className="text-[10px] font-bold text-physio-text-primary uppercase tracking-wider">
              Temporal Analysis
            </h4>
          </div>
        </div>

        <div className="h-6 w-px bg-physio-border-subtle mx-2" />

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
              { value: 8, label: "Std", tone: "accent" },
              { value: 16, label: "Ext", tone: "warning" },
              { value: 20, label: "Max", tone: "error" },
            ]}
          />
        </div>
      </div>

      {/* BOTTOM SECTION: Time-Based Charts */}
      <div className="flex-1 flex flex-col md:flex-row gap-2 min-h-[250px]">
        {/* Serum Release */}
        <div className="flex-1 bg-physio-bg-surface border border-physio-border-subtle flex flex-col">
          <ChartHeader 
            title="Serum Release" 
            subtitle="Pharmacokinetics (Log Scale)"
          />
          <div className="flex-1 min-h-0">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart
                data={releaseData}
                margin={{ top: 20, right: 20, left: 0, bottom: 0 }}
              >
                <CartesianGrid
                  strokeDasharray="3 3"
                  stroke={PALETTE.grid}
                  opacity={0.5}
                  vertical={true}
                  horizontal={true}
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
                  stroke={PALETTE.grid}
                  tick={{ fill: PALETTE.textSecondary, fontSize: 10, fontFamily: 'Roboto Mono' }}
                  tickLine={false}
                  axisLine={false}
                  dy={5}
                  interval={0}
                />
                <YAxis
                  scale="log"
                  domain={['auto', 'auto']}
                  ticks={serumTicks}
                  stroke={PALETTE.grid}
                  tick={{ fill: PALETTE.textSecondary, fontSize: 10, fontFamily: 'Roboto Mono' }}
                  tickLine={false}
                  axisLine={false}
                  tickFormatter={(val) => `${val}`}
                  width={40}
                />
                <Tooltip content={<ReleaseTooltip />} cursor={{ stroke: PALETTE.textSecondary, strokeWidth: 1 }} />

                <Area
                  type="monotone"
                  dataKey="total"
                  stroke="none"
                  fill={PALETTE.primary}
                  fillOpacity={0.1}
                />

                {stack.map((item) => (
                  <Line
                    key={item.compound}
                    type="monotone"
                    dataKey={item.compound}
                    stroke={compoundData[item.compound]?.color || "#fff"}
                    strokeWidth={1.5}
                    dot={false}
                    activeDot={{ r: 3 }}
                  />
                ))}
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Cycle Evolution */}
        <div className="flex-1 bg-physio-bg-surface border border-physio-border-subtle flex flex-col">
          <ChartHeader 
            title="Cycle Evolution" 
            subtitle="Benefit vs Risk Accumulation"
            legendItems={[
              { label: "Anabolic", color: PALETTE.primary, shape: "line" },
              { label: "Systemic", color: PALETTE.error, shape: "line" },
            ]}
          />
          <div className="flex-1 min-h-0">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart
                data={evolutionData}
                margin={{ top: 20, right: 20, left: 0, bottom: 0 }}
              >
                <defs>
                  <linearGradient id="riskZoneGradient" x1="0" y1="0" x2="1" y2="0">
                    <stop offset="0%" stopColor={PALETTE.error} stopOpacity={0.05} />
                    <stop offset="100%" stopColor={PALETTE.error} stopOpacity={0.2} />
                  </linearGradient>
                </defs>
                <CartesianGrid
                  strokeDasharray="3 3"
                  stroke={PALETTE.grid}
                  opacity={0.5}
                  vertical={true}
                  horizontal={true}
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
                  stroke={PALETTE.grid}
                  tick={{ fill: PALETTE.textSecondary, fontSize: 10, fontFamily: 'Roboto Mono' }}
                  tickLine={false}
                  axisLine={false}
                  dy={5}
                  interval={0}
                />
                <YAxis hide />
                <Tooltip
                  cursor={{ stroke: PALETTE.textSecondary, strokeWidth: 1 }}
                  content={({ active, payload, label }) => {
                    if (!active || !payload || !payload.length) return null;
                    return (
                      <div className="bg-physio-bg-core border border-physio-border-subtle p-3 rounded shadow-xl z-50">
                        <p className="text-xs font-bold text-physio-text-secondary mb-2">
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
                            <span className="font-mono font-bold text-physio-text-primary">
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

                <ReferenceArea
                  x1={8 * 7}
                  x2={durationWeeks * 7}
                  fill="url(#riskZoneGradient)"
                  opacity={1}
                />
                
                <ReferenceLine
                  x={8 * 7}
                  stroke={PALETTE.warning}
                  strokeDasharray="3 3"
                  opacity={0.5}
                  label={{
                    value: "RISK ESCALATION",
                    position: "insideTopRight",
                    fill: PALETTE.warning,
                    fontSize: 9,
                    fontWeight: "bold",
                    dy: -10,
                  }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );
};

export default NetEffectChart;
