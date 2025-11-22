import React, { useState, useMemo, useRef, useCallback, useEffect, memo } from "react";
import {
  CartesianGrid,
  ComposedChart,
  Area,
  Line,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
  ReferenceArea,
  ReferenceDot,
  ReferenceLine,
} from "recharts";
import { useStack } from "../../context/StackContext";
import { useCycleRailData } from "./hooks/useCycleRailData";

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

const formatPercent = (value) => {
  if (!Number.isFinite(value)) return "--";
  return `${(value * 100).toFixed(0)}%`;
};

const formatEfficiency = (value) => {
  if (!Number.isFinite(value)) return "--";
  const pct = value * 100;
  if (Math.abs(pct) >= 100) return `${pct.toFixed(0)}% / mg`;
  return `${pct.toFixed(1)}% / mg`;
};

const CustomTooltip = ({ active, payload }) => {
  if (!active || !payload?.length) return null;
  const point = payload[0]?.payload;
  const week = Math.floor(point.day / 7);

  return (
    <div className="min-w-[200px] rounded-2xl border border-white/10 bg-[#05060A]/95 p-4 text-xs text-gray-200 backdrop-blur shadow-2xl">
      <div className="mb-2 border-b border-white/5 pb-2">
        <p className="font-mono text-[11px] uppercase tracking-[0.35em] text-gray-500">
          Week {week} <span className="text-gray-600">Day {Math.round(point.day)}</span>
        </p>
      </div>
      <div className="space-y-2">
        <div className="flex items-center justify-between gap-4">
          <span className="flex items-center gap-1 text-emerald-200">
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-300" /> Anabolic Momentum
          </span>
          <span className="font-mono text-white">{formatNumber(point.anabolic)}</span>
        </div>
        <div className="flex items-center justify-between gap-4">
          <span className="flex items-center gap-1 text-rose-200">
            <span className="h-1.5 w-1.5 rounded-full bg-rose-400" /> Systemic Load
          </span>
          <span className="font-mono text-white">{formatNumber(point.toxicity)}</span>
        </div>
        <div className="flex items-center justify-between gap-4">
          <span className="flex items-center gap-1 text-amber-200">
            <span className="h-1.5 w-1.5 rounded-full bg-amber-300" /> Load Ratio
          </span>
          <span className="font-mono text-white">{formatPercent(point.riskRatio)}</span>
        </div>
        <div className="flex items-center justify-between gap-4">
          <span className="flex items-center gap-1 text-sky-200">
            <span className="h-1.5 w-1.5 rounded-full border border-sky-300" /> Natural Axis
          </span>
          <span className="font-mono text-white">{formatNumber(point.naturalPercent)}%</span>
        </div>
        <div className="flex items-center justify-between gap-4">
          <span className="flex items-center gap-1 text-emerald-100">
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-300/50" /> Dose Efficiency
          </span>
          <span className="font-mono text-white">{formatEfficiency(point.doseEfficiency)}</span>
        </div>
        <div className="flex items-center justify-between gap-4 border-t border-white/5 pt-2">
          <span className="text-[10px] uppercase tracking-[0.35em] text-gray-500">Net Spread</span>
          <span className={`font-mono ${point.netGap >= 0 ? "text-emerald-300" : "text-rose-300"}`}>
            {formatNumber(point.netGap)}
          </span>
        </div>
      </div>
    </div>
  );
};

const DoseEfficiencyChartBase = ({ onTimeScrub }) => {
  const { stack, metrics } = useStack();
  const [durationWeeks, setDurationWeeks] = useState(8);
  
  const [playheadPosition, setPlayheadPosition] = useState(null);
  const [isDragging, setIsDragging] = useState(false);
  const chartRef = useRef(null);
  const debouncedScrub = useDebouncedCallback(onTimeScrub, 75);
  const initialScrubKey = useRef(null);

  const {
    chartData,
    graphMeta,
    optimalExit,
    activeInteractions,
    showC17OralBadge,
    stackSignature,
  } = useCycleRailData({ stack, metrics, durationWeeks });

  // Calculate Max Y for domain
  const yMax = useMemo(() => {
    if (!chartData.length) return 100;
    let max = 0;
    chartData.forEach((p) => {
      const a = Number.isFinite(p.anabolic) ? p.anabolic : 0;
      const t = Number.isFinite(p.toxicity) ? p.toxicity : 0;
      const nat = Number.isFinite(p.naturalScaled) ? p.naturalScaled : 0;
      max = Math.max(max, a, t, nat);
    });
    return Math.max(80, max * 1.05);
  }, [chartData]);

  useEffect(() => {
    if (!chartData.length) {
      setPlayheadPosition(null);
      initialScrubKey.current = null;
      return;
    }
    if (!optimalExit) return;

    const signature = `${stackSignature}-${durationWeeks}-${optimalExit.day.toFixed(2)}`;
    if (initialScrubKey.current === signature) return;
    initialScrubKey.current = signature;
    setPlayheadPosition(optimalExit.day);
    if (onTimeScrub) {
      onTimeScrub(optimalExit);
    }
  }, [chartData, optimalExit, onTimeScrub, stackSignature, durationWeeks]);

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
          <div className="flex items-start justify-between gap-4">
            <div className="flex flex-col gap-1">
              <h3 className="text-base font-semibold text-white">
                Optimized Evolution Rail
              </h3>
              <p className="text-xs text-gray-500">
                Phased progression: Genomic tissue (keepable) vs. Total mass (volumized). Exit before toxicity crossover.
              </p>
              {graphMeta && (
                <p className="text-[10px] font-mono uppercase tracking-[0.3em] text-gray-600">
                  Scale Anchor: {graphMeta.scaleLabel} · ≤ {graphMeta.scaleMax?.toLocaleString?.() || graphMeta.scaleMax} mgEq
                </p>
              )}
            </div>
            <div className="flex items-center gap-4">
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
          {(optimalExit || activeInteractions.length > 0 || showC17OralBadge) && (
            <div className="flex flex-wrap items-center gap-3 text-[11px] text-gray-300">
              {optimalExit && (
                <div className="flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-1 font-mono text-[10px] uppercase tracking-[0.2em] text-white">
                  <span className="text-emerald-300">Optimal Exit</span>
                  <span>W{optimalExit.week}</span>
                  <span className="text-gray-500">·</span>
                  <span className={optimalExit.netGap >= 0 ? "text-emerald-300" : "text-rose-300"}>
                    {formatNumber(optimalExit.netGap)} spread
                  </span>
                  <span className="text-gray-500">·</span>
                  <span className="text-amber-200">{formatPercent(optimalExit.riskRatio)}</span>
                </div>
              )}
              {activeInteractions.length > 0 && (
                <div className="flex flex-wrap gap-2">
                  {activeInteractions.map((ddi) => (
                    <span
                      key={ddi.id}
                      className="px-2 py-0.5 text-[10px] rounded bg-indigo-600/30 text-indigo-200 border border-indigo-500"
                      title={ddi.metadata?.mechanism || ''}
                    >
                      {ddi.compounds.join(' + ')}
                    </span>
                  ))}
                </div>
              )}
              {showC17OralBadge && (
                <span className="px-2 py-0.5 text-[10px] rounded bg-red-600/30 text-red-200 border border-red-500" title="Multiple C17‑aa oral steroids increase hepatotoxic risk">
                  C17‑Oral Stack
                </span>
              )}
            </div>
          )}
          <div className="flex items-center gap-4 mt-2 text-[10px] font-mono uppercase tracking-[0.25em] text-gray-400">
            <span className="flex items-center gap-1">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 shadow-[0_0_6px_rgba(16,185,129,0.6)]" />
              Genomic Tissue (Keepable)
            </span>
            <span className="h-px w-6 bg-white/10" />
            <span className="flex items-center gap-1">
              <span className="h-1.5 w-1.5 rounded-full" style={{ border: "1px dashed #5E6AD2", backgroundColor: "transparent" }} />
              Total Mass (Volumized)
            </span>
            <span className="h-px w-6 bg-white/10" />
            <span className="flex items-center gap-1">
              <span className="h-1.5 w-1.5 rounded-full bg-rose-400/80" />
              Systemic Load
            </span>
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
              <linearGradient id="momentumFill" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#10b981" stopOpacity={0.4} />
                <stop offset="100%" stopColor="#10b981" stopOpacity={0.05} />
              </linearGradient>
              <linearGradient id="loadFill" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#f43f5e" stopOpacity={0.45} />
                <stop offset="100%" stopColor="#f43f5e" stopOpacity={0.05} />
              </linearGradient>
              <linearGradient id="volumizationFill" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#5E6AD2" stopOpacity={0.5} />
                <stop offset="100%" stopColor="#5E6AD2" stopOpacity={0.05} />
              </linearGradient>
              <linearGradient id="momentumStroke" x1="0" y1="0" x2="1" y2="0">
                <stop offset="0%" stopColor="#14b8a6" />
                <stop offset="100%" stopColor="#34d399" />
              </linearGradient>
            </defs>
            
            {/* PHASE ZONE ANNOTATIONS */}
            {/* Phase 1: Hyper-Volumization (Weeks 0-4) */}
            <ReferenceArea
              x1={0}
              x2={28}
              fill="#5E6AD2"
              fillOpacity={0.02}
              stroke={false}
            />
            {/* Phase 2: Tissue Accretion (Weeks 4-8) */}
            <ReferenceArea
              x1={28}
              x2={56}
              fill="#10b981"
              fillOpacity={0.02}
              stroke={false}
            />
            {/* Phase 3: Toxicity Crossover (Week 8+) */}
            {optimalExit && (
              <ReferenceArea
                x1={optimalExit.day}
                x2={durationWeeks * 7}
                fill="#f43f5e"
                fillOpacity={0.03}
                stroke={false}
              />
            )}
            
            {/* Phase Labels */}
            <text x="3%" y="15" fill="#6B7280" fontSize="9" fontFamily="monospace" textAnchor="start">
              PHASE 1: HYPER-VOLUMIZATION
            </text>
            <text x="3%" y="27" fill="#6B7280" fontSize="8" fontFamily="monospace" textAnchor="start" opacity="0.7">
              High ROI (Glycogen/Nitrogen)
            </text>
            
            <text x="35%" y="15" fill="#6B7280" fontSize="9" fontFamily="monospace" textAnchor="start">
              PHASE 2: TISSUE ACCRETION
            </text>
            <text x="35%" y="27" fill="#6B7280" fontSize="8" fontFamily="monospace" textAnchor="start" opacity="0.7">
              Stable Genomic Growth
            </text>
            
            {optimalExit && (
              <>
                <text x="70%" y="15" fill="#EF4444" fontSize="9" fontFamily="monospace" textAnchor="start">
                  PHASE 3: TOXICITY CROSSOVER
                </text>
                <text x="70%" y="27" fill="#EF4444" fontSize="8" fontFamily="monospace" textAnchor="start" opacity="0.7">
                  Negative Returns
                </text>
              </>
            )}
            
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
              dataKey="efficiencyLowFill"
              stackId="roi"
              stroke="none"
              fill="#71717a"
              fillOpacity={0.05}
              isAnimationActive={false}
            />
            <Area
              type="monotone"
              dataKey="efficiencyMediumFill"
              stackId="roi"
              stroke="none"
              fill="#fbbf24"
              fillOpacity={0.06}
              isAnimationActive={false}
            />
            <Area
              type="monotone"
              dataKey="efficiencyHighFill"
              stackId="roi"
              stroke="none"
              fill="#34d399"
              fillOpacity={0.08}
              isAnimationActive={false}
            />
            {optimalExit && (
              <ReferenceArea
                x1={optimalExit.day}
                x2={durationWeeks * 7}
                fill="#f43f5e"
                fillOpacity={0.06}
                stroke={false}
              />
            )}

            <Area
              type="monotone"
              dataKey="toxicity"
              stroke="#fb7185"
              strokeWidth={2.2}
              fill="url(#loadFill)"
              fillOpacity={0.85}
              dot={false}
              isAnimationActive={false}
            />


            {/* TOTAL MASS (Volumized) - shows kickstart spike */}
            <Line
              type="monotone"
              dataKey="totalMass"
              stroke="#5E6AD2"
              strokeWidth={2.5}
              strokeDasharray="6 4"
              dot={false}
              isAnimationActive={true}
            />

            <Area
              type="monotone"
              dataKey="anabolic"
              stroke="url(#momentumStroke)"
              strokeWidth={2.8}
              fill="url(#momentumFill)"
              fillOpacity={0.6}
              dot={false}
              isAnimationActive={true}
            />

            <Line
              type="monotone"
              dataKey="naturalScaled"
              stroke="#38bdf8"
              strokeWidth={1.6}
              strokeDasharray="5 4"
              dot={false}
              isAnimationActive={false}
            />

            {optimalExit && (
              <ReferenceLine
                x={optimalExit.day}
                stroke="#f97316"
                strokeDasharray="4 3"
                strokeWidth={1.25}
                label={{
                  value: `Optimal Exit · W${optimalExit.week}`,
                  position: "insideTopLeft",
                  fill: "#fbbf24",
                  fontSize: 10,
                }}
              />
            )}

            {optimalExit && (
              <ReferenceDot
                x={optimalExit.day}
                y={optimalExit.anabolic}
                r={4}
                fill="#ffffff"
                stroke="#14b8a6"
                strokeWidth={2}
              />
            )}

            {playheadPosition !== null && (
              <ReferenceLine
                x={playheadPosition}
                stroke="#3B82F6"
                strokeWidth={1.5}
                label={{
                  value: `EXIT VECTOR · W${Math.floor(playheadPosition / 7)}`,
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

export default memo(DoseEfficiencyChartBase);
