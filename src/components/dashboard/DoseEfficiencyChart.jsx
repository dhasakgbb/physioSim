import React, { useState, useMemo, useRef, useCallback, useEffect } from "react";
import {
  CartesianGrid,
  ComposedChart,
  Area,
  Line,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
  ReferenceLine,
} from "recharts";
import { useStack } from "../../context/StackContext";
import { COMPOUNDS as compoundData } from "../../data/compounds";
import { getDDIForStack } from "../../data/drugDrugInteractions";
import { simulationService } from "../../engine/SimulationService";

const CHART_MARGIN = { top: 10, right: 20, bottom: 0, left: 20 };

const DURATION_OPTIONS = [8, 12, 16, 24];

const useDebouncedCallback = (callback, delay = 60) => {
  const timeoutRef = useRef(null);

  const debounced = useCallback((...args) => {
    if (!callback) return;
    if (timeoutRef.current) window.clearTimeout(timeoutRef.current);
    timeoutRef.current = window.setTimeout(() => callback(...args), delay);
  }, [callback, delay]);

  useEffect(() => () => {
    if (timeoutRef.current) window.clearTimeout(timeoutRef.current);
  }, []);

  return debounced;
};

const formatNumber = (value) => {
  if (!Number.isFinite(value)) return "--";
  return value.toFixed(1);
};

const CustomTooltip = ({ active, payload }) => {
  if (!active || !payload?.length) return null;
  const point = payload[0]?.payload;

  return (
    <div className="min-w-[180px] rounded-2xl border border-white/10 bg-[#05060A]/95 p-4 text-xs text-gray-200 backdrop-blur shadow-2xl">
      <div className="mb-2 border-b border-white/5 pb-2">
        <p className="font-mono text-[11px] uppercase tracking-[0.35em] text-gray-500">
          Week {Math.floor(point.day / 7)} <span className="text-gray-700">Day {Math.round(point.day)}</span>
        </p>
      </div>
      <div className="space-y-1">
        <div className="flex items-center justify-between gap-4">
          <span className="flex items-center gap-1 text-cyan-200">
            <span className="h-1.5 w-1.5 rounded-full bg-cyan-300" /> Anabolic
          </span>
          <span className="font-mono text-white">{formatNumber(point.anabolic)}</span>
        </div>
        <div className="flex items-center justify-between gap-4">
          <span className="flex items-center gap-1 text-rose-200">
            <span className="h-1.5 w-1.5 rounded-full bg-rose-300" /> Toxicity
          </span>
          <span className="font-mono text-white">{formatNumber(point.toxicity)}</span>
        </div>
        <div className="flex items-center justify-between gap-4">
          <span className="flex items-center gap-1 text-gray-300">
            <span className="h-1.5 w-1.5 rounded-full bg-white/50" /> Viability Floor
          </span>
          <span className="font-mono text-white">{formatNumber(point.viabilityLower)}</span>
        </div>
        <div className="flex items-center justify-between gap-4">
          <span className="flex items-center gap-1 text-amber-200">
            <span className="h-1.5 w-1.5 rounded-full bg-amber-300" /> Risk Index
          </span>
          <span className="font-mono text-white">{formatNumber((point.riskRatio || 0) * 100)}%</span>
        </div>
        <div className="mt-2 flex items-center justify-between gap-4 border-t border-white/5 pt-2">
          <span className="text-[10px] uppercase tracking-[0.35em] text-gray-500">Net Gap</span>
          <span className={`font-mono ${point.netGap >= 0 ? "text-emerald-300" : "text-rose-300"}`}>
            {formatNumber(point.netGap)}
          </span>
        </div>
      </div>
    </div>
  );
};

const DoseEfficiencyChart = ({ onTimeScrub }) => {
  const { stack, userProfile } = useStack();
  const [durationWeeks, setDurationWeeks] = useState(12);
  const [chartData, setChartData] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  // Determine active DDI rules for the current stack
  const activeCompoundIds = useMemo(() => {
    if (!stack) return [];
    return Array.from(new Set(stack.map(s => s.compoundId || s.compound)));
  }, [stack]);
  const activeInteractions = useMemo(() => getDDIForStack(activeCompoundIds), [activeCompoundIds]);
  // C17‑aa oral stacking badge (any combination of ≥2 C17 oral steroids)
  const c17OralCount = useMemo(() => {
    return activeCompoundIds.filter(id => {
      const meta = compoundData[id]?.metadata;
      return meta?.structuralFlags?.isC17aa && meta?.administrationRoutes?.includes('Oral');
    }).length;
  }, [activeCompoundIds]);
  const showC17OralBadge = c17OralCount >= 2;
  
  const [playheadPosition, setPlayheadPosition] = useState(null);
  const [isDragging, setIsDragging] = useState(false);
  const chartRef = useRef(null);
  const debouncedScrub = useDebouncedCallback(onTimeScrub, 75);

  React.useEffect(() => {
    let isMounted = true;
    if (!stack || stack.length === 0) {
      setChartData([]);
      return;
    }

    const fetchData = async () => {
      setIsLoading(true);
      try {
        const activeCompounds = stack.map(s => compoundData[s.compoundId || s.compound]).filter(Boolean);
        const currentStack = stack.map(s => ({ 
            compoundId: s.compoundId || s.compound, 
            dose: Number(s.dose || 0), 
            frequency: Number(s.frequency || 3.5) 
        }));

        const result = await simulationService.runStackSimulation(
            currentStack,
            activeCompounds,
            durationWeeks * 7,
            userProfile?.bodyweight || 85
        );

        if (isMounted && result.aggregate && result.aggregate.totalAnabolicLoad) {
            // Process data
            // The engine returns hourly points. We want daily points for the chart.
            const { totalAnabolicLoad, totalToxicity } = result.aggregate;
            
            const rawPoints = totalAnabolicLoad
              .map((load, index) => {
                    // Data is in 6-hour intervals (from store resolution)
                    // We want daily points. 24 hours / 6 hours = 4 points per day.
                    if (index % 4 !== 0) return null;
                    
                    const day = index / 4; // Convert index to days
                    // Calculate total toxicity at this point
                    const hepatic = totalToxicity.hepatic[index] || 0;
                    const renal = totalToxicity.renal[index] || 0;
                    const cv = totalToxicity.cardiovascular[index] || 0;
                    const lipid = totalToxicity.lipid_metabolism[index] || 0;
                    const neuro = totalToxicity.neurotoxicity[index] || 0;

                    const organSum = hepatic + renal + cv + lipid + neuro;
                    
                    return {
                      day,
                      anabolic: load,
                      toxicityRaw: organSum,
                    };
                })
                .filter(Boolean); // Remove nulls

                const maxAnabolic = rawPoints.reduce((max, point) => Math.max(max, point.anabolic || 0), 0);
                const maxToxicityRaw = rawPoints.reduce((max, point) => Math.max(max, point.toxicityRaw || 0), 0);
                const targetRange = Math.max(10, maxAnabolic || 10);
                const toxicityScale = maxToxicityRaw > 0 ? targetRange / maxToxicityRaw : 1;
                const scaledPoints = rawPoints.map(point => ({
                  ...point,
                  toxicity: point.toxicityRaw * toxicityScale
                }));

                // Apply a trailing average so users see organ stress accumulation instead of the raw saw-tooth signal
                const TOXICITY_WINDOW_DAYS = 7;
                const TOXICITY_BAND_GAIN = 1.35;
                const MIN_BAND_THICKNESS = 0.75;
                const smoothed = scaledPoints.map((point, idx, arr) => {
                  const start = Math.max(0, idx - TOXICITY_WINDOW_DAYS + 1);
                  const window = arr.slice(start, idx + 1);
                  const avgTox = window.reduce((sum, entry) => sum + entry.toxicity, 0) / window.length;
                  const scaledToxicity = avgTox * TOXICITY_BAND_GAIN;
                  const effectiveAnabolic = Math.max(0, point.anabolic || 0);
                  const bandHeight = Math.min(effectiveAnabolic, Math.max(MIN_BAND_THICKNESS, scaledToxicity));
                  const viabilityLower = Math.max(0, effectiveAnabolic - bandHeight);
                  const viabilityUpper = viabilityLower + bandHeight;
                  return {
                    ...point,
                    toxicityRaw: point.toxicityRaw,
                    toxicity: avgTox,
                    netGap: point.anabolic - avgTox,
                    viabilityLower,
                    bandHeight,
                    viabilityUpper,
                    riskRatio: (bandHeight && point.anabolic) ? Math.min(1.25, bandHeight / (point.anabolic || 1)) : 0
                  };
                });

                setChartData(smoothed);
        } else {
             // Handle case where simulation returns no data
             console.warn("Simulation returned no aggregate data");
             setChartData([]);
        }
      } catch (err) {
        console.error("Simulation failed", err);
      } finally {
        if (isMounted) setIsLoading(false);
      }
    };

    fetchData();
    return () => { isMounted = false; };
  }, [stack, durationWeeks, userProfile]);

  // Calculate Max Y for domain
  const yMax = useMemo(() => {
    if (!chartData.length) return 100;
    let max = 0;
    chartData.forEach((p) => {
      max = Math.max(max, p.anabolic, p.toxicity);
    });
    return Math.max(10, max * 1.1);
  }, [chartData]);

  // Scrubbing Logic
  const updatePlayheadPosition = (event) => {
    if (!chartRef.current) return;
    const clientX =
      event?.clientX ??
      event?.touches?.[0]?.clientX ??
      event?.changedTouches?.[0]?.clientX;
    if (typeof clientX !== "number") return;

    const rect = chartRef.current.getBoundingClientRect();
    const x = clientX - rect.left;
    const chartWidth = rect.width - 40; // Account for margins (left 20, right 20)
    const relativeX = Math.max(0, Math.min(1, x / chartWidth));
    
    const maxDay = durationWeeks * 7;
    const dayPosition = relativeX * maxDay;

    setPlayheadPosition(dayPosition);

    if (onTimeScrub && chartData.length) {
      const closest = chartData.reduce((acc, point) =>
        Math.abs(point.day - dayPosition) < Math.abs(acc.day - dayPosition) ? point : acc,
      );
      debouncedScrub(closest);
    }
  };

  const handleMouseDown = (event) => {
    if (!chartRef.current) return;
    setIsDragging(true);
    updatePlayheadPosition(event);
  };

  const handleMouseMove = (event) => {
    if (isDragging) updatePlayheadPosition(event);
  };

  const handleMouseUp = () => setIsDragging(false);

  useEffect(() => {
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
      <div className="flex h-full items-center justify-center rounded-3xl border border-dashed border-white/10 bg-[#050608]">
        <div className="text-center text-sm text-gray-400">
          <p className="text-lg font-semibold text-white">Awaiting Compounds</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-full flex-col overflow-hidden rounded-2xl border border-white/5 bg-[#050608]">
        <header className="flex flex-col border-b border-white/5 px-6 py-4 space-y-2">
          <div className="flex items-start justify-between">
            <div className="flex flex-col gap-1">
              <h3 className="text-base font-semibold text-white">
                Dose Efficiency
              </h3>
              <p className="text-xs text-gray-500">
                Projected anabolic signal vs systemic toxicity over time.
              </p>
            </div>
            <div className="flex items-center gap-4">
              {/* Duration Selector */}
              <div className="flex items-center rounded-lg bg-white/5 p-1">
                {DURATION_OPTIONS.map((weeks) => (
                  <button
                    key={weeks}
                    onClick={() => setDurationWeeks(weeks)}
                    className={`rounded-md px-3 py-1 text-[10px] font-medium transition-colors ${
                      durationWeeks === weeks
                        ? "bg-white/10 text-white shadow-sm"
                        : "text-gray-500 hover:text-gray-300"
                    }`}
                  >
                    {weeks}W
                  </button>
                ))}
              </div>
            </div>
          </div>
          {/* DDI Interaction Badges */}
          {activeInteractions.length > 0 && (
            <div className="flex flex-wrap gap-2 mt-1">
              {activeInteractions.map((ddi) => (
                <span
                  key={ddi.id}
                  className="px-2 py-0.5 text-xs rounded bg-indigo-600/30 text-indigo-200 border border-indigo-500"
                  title={ddi.metadata?.mechanism || ''}
                >
                  {ddi.compounds.join(' + ')}
                </span>
              ))}
            </div>
          )}
          {/* C17 oral stacking badge */}
          {showC17OralBadge && (
            <div className="flex flex-wrap gap-2 mt-1">
              <span className="px-2 py-0.5 text-xs rounded bg-red-600/30 text-red-200 border border-red-500" title="Multiple C17‑aa oral steroids increase hepatotoxic risk">
                C17‑Oral Stack
              </span>
            </div>
          )}
          <div className="flex items-center gap-4 mt-2">
            <div className="flex items-center gap-3 text-[10px] font-mono uppercase tracking-[0.3em] text-gray-400">
              <span className="flex items-center gap-1">
                <span className="h-1.5 w-1.5 rounded-full bg-cyan-500 shadow-[0_0_6px_rgba(6,182,212,0.6)]" />
                Anabolic Signal
              </span>
              <span className="h-px w-6 bg-white/10" />
              <span className="flex items-center gap-1">
                <span className="h-1.5 w-1.5 rounded-full bg-rose-400/70" />
                Viability Band
              </span>
            </div>
          </div>
        </header>

      <div className="relative flex-1 bg-gradient-to-b from-[#07090F] to-[#030305]" ref={chartRef}>
        <ResponsiveContainer 
            width="100%" 
            height="100%"
            onMouseDown={handleMouseDown}
            onTouchStart={handleMouseDown}
            style={{ cursor: isDragging ? "grabbing" : "grab" }}
        >
          <ComposedChart
            data={chartData}
            margin={CHART_MARGIN}
          >
            <defs>
              <linearGradient id="viabilityBand" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#f43f5e" stopOpacity={0.35} />
                <stop offset="100%" stopColor="#f43f5e" stopOpacity={0.05} />
              </linearGradient>
              <linearGradient id="anabolicStroke" x1="0" y1="0" x2="1" y2="0">
                <stop offset="0%" stopColor="#06b6d4" />
                <stop offset="100%" stopColor="#22d3ee" />
              </linearGradient>
            </defs>
            <CartesianGrid stroke="#333" strokeDasharray="3 3" opacity={0.15} vertical={false} />
            <XAxis
              dataKey="day"
              type="number"
              domain={[0, durationWeeks * 7]}
              axisLine={false}
              tickLine={false}
              tick={{ fill: "#6b7280", fontSize: 10 }}
              tickFormatter={(day) => `W${Math.floor(day / 7)}`}
              interval="preserveStartEnd"
              minTickGap={30}
            />
            <YAxis 
                hide 
                domain={[0, yMax]} 
            />
            
            <Tooltip
              cursor={{ stroke: "#ffffff", strokeDasharray: "3 3", opacity: 0.3 }}
              content={<CustomTooltip />}
            />

            <Area
              type="monotone"
              dataKey="viabilityLower"
              stackId="band"
              stroke="none"
              fill="transparent"
              isAnimationActive={false}
            />
            <Area
              type="monotone"
              dataKey="bandHeight"
              stackId="band"
              stroke="none"
              fill="url(#viabilityBand)"
              fillOpacity={0.9}
              isAnimationActive={true}
            />

            <Line
              type="monotone"
              dataKey="anabolic"
              stroke="url(#anabolicStroke)"
              strokeWidth={2.5}
              dot={false}
              strokeOpacity={1}
              activeDot={{ r: 4, fill: "#22d3ee", strokeWidth: 0 }}
              animationDuration={1000}
            />

            {playheadPosition !== null && (
              <ReferenceLine
                x={playheadPosition}
                stroke="#3B82F6"
                strokeWidth={1.5}
                label={{
                  value: `Day ${Math.round(playheadPosition)}`,
                  position: "insideTopRight",
                  fill: "#60A5FA",
                  fontSize: 10,
                }}
              />
            )}
          </ComposedChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};

export default DoseEfficiencyChart;
