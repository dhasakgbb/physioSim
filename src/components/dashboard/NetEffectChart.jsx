import React, { useEffect, useState, useMemo, useRef, useCallback } from "react";
import {
  CartesianGrid,
  ComposedChart,
  Line,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { useStack } from "../../context/StackContext";
import { defaultProfile } from "../../utils/personalization";
import { simulationService } from "../../engine/SimulationService";
import { COMPOUNDS as compoundMap } from "../../data/compounds";

const SCALAR_STEPS = 100; // Reduced slightly for perf, worker is fast though
const NEGATIVE_WINDOW = 0.65;
const POSITIVE_WINDOW = 0.85;
const CHART_MARGIN = { top: 10, right: 20, bottom: 0, left: 20 };
const LABEL_GUARD = 72;

const useDebouncedCallback = (callback, delay = 60) => {
  const timerRef = useRef(null);

  useEffect(() => () => {
    if (timerRef.current) clearTimeout(timerRef.current);
  }, []);

  return useCallback(
    (value) => {
      if (!callback) return;
      if (timerRef.current) clearTimeout(timerRef.current);
      timerRef.current = setTimeout(() => callback(value), delay);
    },
    [callback, delay],
  );
};

const formatNumber = (value) => {
  if (!Number.isFinite(value)) return "--";
  if (Math.abs(value) >= 10) return value.toFixed(0);
  return value.toFixed(1);
};

const formatDelta = (value, withUnit = true) => {
  if (!Number.isFinite(value)) return "--";
  const rounded = Math.round(value);
  const prefix = rounded > 0 ? "+" : "";
  return `${prefix}${rounded}${withUnit ? "%" : ""}`;
};

const tooltipStyle = {
  zIndex: 40,
  pointerEvents: "auto",
  boxShadow: "0 25px 55px rgba(0,0,0,0.45)",
};

const EfficiencyTooltip = ({ active, payload }) => {
  if (!active || !payload?.length) return null;
  const point = payload[0]?.payload;
  if (!point) return null;

  return (
    <div
      className="min-w-[180px] rounded-2xl border border-white/10 bg-[#05060A]/95 p-4 text-xs text-gray-200 backdrop-blur"
      style={tooltipStyle}
    >
      <div className="mb-2 space-y-1 border-b border-white/5 pb-2">
        <p className="font-mono text-[11px] uppercase tracking-[0.35em] text-gray-500">
          Δ Stack <span className="pl-2 text-white">{formatDelta(point.deltaPercent)}</span>
        </p>
        <p className="text-[11px] text-gray-400">
          Dose <span className="pl-2 font-mono text-sm text-gray-100">{Math.round(point.mgEq)} mgEq</span>
        </p>
      </div>
      <div className="space-y-1">
        <div className="flex items-center justify-between gap-4">
          <span className="flex items-center gap-1 text-cyan-200">
            <span className="h-1.5 w-1.5 rounded-full bg-cyan-300" /> Benefit
          </span>
          <span className="font-mono text-white">{formatNumber(point.benefit)}</span>
        </div>
        <div className="flex items-center justify-between gap-4">
          <span className="flex items-center gap-1 text-rose-200">
            <span className="h-1.5 w-1.5 rounded-full bg-rose-300" /> Risk
          </span>
          <span className="font-mono text-white">{formatNumber(point.risk)}</span>
        </div>
        <div className="mt-2 flex items-center justify-between gap-4 border-t border-white/5 pt-2">
          <span className="text-[10px] uppercase tracking-[0.35em] text-gray-500">Gap</span>
          <span className={`font-mono ${point.netGap >= 0 ? "text-emerald-300" : "text-rose-300"}`}>
            {formatNumber(point.netGap)}
          </span>
        </div>
      </div>
    </div>
  );
};

const NetEffectChart = ({ onTimeScrub }) => {
  const { stack, userProfile } = useStack();
  const profile = userProfile || defaultProfile;
  const debouncedScrub = useDebouncedCallback(onTimeScrub);
  const [hoverMeta, setHoverMeta] = useState(null);
  const chartRef = useRef(null);
  const [chartSize, setChartSize] = useState({ width: 0, height: 0 });

  // Async State
  const [sweepData, setSweepData] = useState({ points: [], sweetSpot: null });
  const [isLoading, setIsLoading] = useState(false);

  // Fetch Sweep Data
  useEffect(() => {
    let isMounted = true;

    const runAsyncSweep = async () => {
      if (!stack.length) {
        setSweepData({ points: [], sweetSpot: null });
        return;
      }

      setIsLoading(true);
      try {
        // Prepare payload
        const activeCompounds = stack.map(s => compoundMap[s.compoundId]).filter(Boolean);
        const baseStack = stack.map(s => ({ compoundId: s.compoundId, dose: s.dose }));
        
        // Generate scalars
        const span = NEGATIVE_WINDOW + POSITIVE_WINDOW;
        const stepSize = span / SCALAR_STEPS;
        const scalars = [];
        for (let i = 0; i <= SCALAR_STEPS; i++) {
            const offset = -NEGATIVE_WINDOW + i * stepSize;
            scalars.push(Math.max(0, 1 + offset));
        }

        const result = await simulationService.runSweep({
          baseStack,
          compounds: activeCompounds,
          scalars,
          userProfile: profile
        });

        if (isMounted) {
          // Post-process points to add deltaPercent for the chart
          const processedPoints = result.points.map((p, idx) => {
             const offset = -NEGATIVE_WINDOW + idx * stepSize;
             return {
                 ...p,
                 deltaPercent: offset * 100
             };
          });

          // Find sweet spot with deltaPercent
          let sweetSpot = null;
          if (result.sweetSpot) {
              sweetSpot = processedPoints.find(p => Math.abs(p.scalar - result.sweetSpot.scalar) < 0.001);
          }

          setSweepData({
            points: processedPoints,
            sweetSpot
          });
        }
      } catch (err) {
        console.error("Sweep failed", err);
      } finally {
        if (isMounted) setIsLoading(false);
      }
    };

    const timer = setTimeout(runAsyncSweep, 50); // Debounce slightly to avoid rapid updates
    return () => {
        isMounted = false;
        clearTimeout(timer);
    };
  }, [stack, profile]);

  const currentPoint = useMemo(() => {
    if (!sweepData.points.length) return null;
    // Find point closest to scalar 1.0 (delta 0)
    return sweepData.points.find((p) => Math.abs(p.deltaPercent) < 1) || sweepData.points[Math.floor(sweepData.points.length / 2)];
  }, [sweepData]);

  // Chart Domain Helpers
  const domain = useMemo(() => [-NEGATIVE_WINDOW * 100, POSITIVE_WINDOW * 100], []);
  const yDomain = useMemo(() => {
      if (!sweepData.points.length) return [0, 100];
      let max = 0;
      sweepData.points.forEach(p => {
          max = Math.max(max, p.benefit, p.risk);
      });
      return [0, max * 1.1];
  }, [sweepData]);

  useMemo(() => {
    if (!chartRef.current) return undefined;
    const observer = new ResizeObserver((entries) => {
      const entry = entries[0];
      if (!entry?.contentRect) return;
      setChartSize({
        width: entry.contentRect.width,
        height: entry.contentRect.height,
      });
    });
    observer.observe(chartRef.current);
    return () => observer.disconnect();
  }, []);

  const projectX = useCallback(
    (deltaPercent) => {
      if (!chartSize.width || !domain) return 0;
      const [domainMin, domainMax] = domain;
      if (domainMax === domainMin) return CHART_MARGIN.left;
      const usableWidth = Math.max(chartSize.width - (CHART_MARGIN.left + CHART_MARGIN.right), 0);
      const ratio = (deltaPercent - domainMin) / (domainMax - domainMin);
      const clamped = Math.min(Math.max(ratio, 0), 1);
      return CHART_MARGIN.left + clamped * usableWidth;
    },
    [chartSize.width, domain],
  );

  const computeLabelShift = useCallback(
    (x, padding = LABEL_GUARD) => {
      if (!chartSize.width) return 0;
      const safePadding = Math.min(padding, chartSize.width / 2);
      const min = safePadding;
      const max = chartSize.width - safePadding;
      if (x < min) return min - x;
      if (x > max) return max - x;
      return 0;
    },
    [chartSize.width],
  );

  const clampOverlayX = useCallback(
    (value) => {
      if (!Number.isFinite(value)) return 0;
      if (!chartSize.width) return Math.max(value, 0);
      const max = chartSize.width;
      return Math.min(Math.max(value, 0), max);
    },
    [chartSize.width],
  );

  const handleCursor = useCallback((state) => {
    if (!state?.isTooltipActive) {
      setHoverMeta(null);
      return;
    }
    const nextPoint = state?.activePayload?.[0]?.payload;
    if (!nextPoint) return;
    const projectedX = projectX(nextPoint.deltaPercent);
    setHoverMeta({
      point: nextPoint,
      x: clampOverlayX(projectedX),
    });
    debouncedScrub(nextPoint);
  }, [clampOverlayX, debouncedScrub, projectX]);

  if (!stack.length) {
    return (
      <div className="flex h-full items-center justify-center rounded-3xl border border-dashed border-white/10 bg-[#050608]">
        <div className="text-center text-sm text-gray-400">
          <p className="text-lg font-semibold text-white">Awaiting Compounds</p>
        </div>
      </div>
    );
  }

  const currentLineX = currentPoint ? projectX(currentPoint.deltaPercent) : null;
  const peakLineX = sweepData.sweetSpot ? projectX(sweepData.sweetSpot.deltaPercent) : null;
  const safeCurrentLineX = currentLineX != null ? clampOverlayX(currentLineX) : null;
  const safePeakLineX = peakLineX != null ? clampOverlayX(peakLineX) : null;

  return (
    <div className="flex h-full flex-col overflow-hidden rounded-2xl border border-white/5 bg-[#050608]">
      <header className="flex items-start justify-between border-b border-white/5 px-6 py-4">
        <div className="flex flex-col gap-1">
          <h3 className="text-base font-semibold text-white">
            Dose Efficiency
            {isLoading && <span className="ml-2 text-xs text-gray-500 animate-pulse">(Calculating...)</span>}
          </h3>
          <p className="text-xs text-gray-500">Explore the distance between anabolic signal and systemic cost.</p>
        </div>
        <div className="flex flex-col items-end gap-3">
          <div className="flex items-center gap-3 text-[10px] font-mono uppercase tracking-[0.3em] text-gray-400">
            <span className="flex items-center gap-1">
              <span className="h-1.5 w-1.5 rounded-full bg-cyan-500 shadow-[0_0_6px_rgba(6,182,212,0.6)]" />
              <span>Anabolic</span>
            </span>
            <span className="h-px w-6 bg-white/10" />
            <span className="flex items-center gap-1">
              <span className="h-1.5 w-1.5 rounded-full bg-rose-600/70" />
              <span>Toxicity</span>
            </span>
          </div>
          {sweepData.sweetSpot && (
            <div className="rounded-full border border-sky-400/40 bg-sky-400/10 px-4 py-1 text-[11px] font-semibold uppercase tracking-[0.3em] text-sky-200">
              Sweet Spot · {Math.round(sweepData.sweetSpot.mgEq)} mgEq
            </div>
          )}
        </div>
      </header>

      {currentPoint && (
        <div className="grid grid-cols-3 gap-4 border-b border-white/5 px-6 py-3 text-xs">
          <div>
            <p className="text-[10px] uppercase tracking-[0.35em] text-gray-500">Anabolic</p>
            <p className="font-mono text-lg text-cyan-200">{formatNumber(currentPoint.benefit)}</p>
          </div>
          <div>
            <p className="text-[10px] uppercase tracking-[0.35em] text-gray-500">Toxicity</p>
            <p className="font-mono text-lg text-rose-200">{formatNumber(currentPoint.risk)}</p>
          </div>
          <div>
            <p className="text-[10px] uppercase tracking-[0.35em] text-gray-500">Net Gap</p>
            <p className={`font-mono text-lg ${currentPoint.netGap >= 0 ? "text-emerald-300" : "text-rose-300"}`}>
              {formatNumber(currentPoint.netGap)}
            </p>
          </div>
        </div>
      )}

      <div ref={chartRef} className="relative flex-1 bg-gradient-to-b from-[#07090F] to-[#030305]">
        <ResponsiveContainer width="100%" height="100%">
          <ComposedChart
            data={sweepData.points}
            onMouseMove={handleCursor}
            onMouseLeave={() => setHoverMeta(null)}
            margin={CHART_MARGIN}
          >
            <CartesianGrid stroke="#333" strokeDasharray="3 3" opacity={0.55} />
            <XAxis
              type="number"
              dataKey="deltaPercent"
              domain={domain}
              axisLine={false}
              tickLine={false}
              padding={{ left: 20, right: 20 }}
              label={{
                value: "Stack Delta (%)",
                position: "insideBottomRight",
                offset: -5,
                fill: "#4b5563",
                fontSize: 10,
              }}
              tickFormatter={(value) => (value === 0 ? "Current" : formatDelta(value, true))}
              tick={{ fill: "#6b7280", fontSize: 10 }}
            />
            <YAxis hide domain={yDomain} allowDataOverflow />

            <Tooltip
              cursor={{ stroke: "#ffffff", strokeDasharray: "3 3" }}
              content={<EfficiencyTooltip />}
            />

            <Line
              type="basis"
              dataKey="risk"
              stroke="#f43f5e"
              strokeWidth={3}
              dot={false}
              strokeOpacity={1}
              strokeLinecap="round"
              strokeLinejoin="round"
              isAnimationActive
              animationDuration={320}
            />
            <Line
              type="basis"
              dataKey="benefit"
              stroke="#22d3ee"
              strokeWidth={3}
              dot={false}
              strokeOpacity={1}
              strokeLinecap="round"
              strokeLinejoin="round"
              isAnimationActive
              animationDuration={320}
            />
          </ComposedChart>
        </ResponsiveContainer>

        <div className="pointer-events-none absolute inset-0 z-10" aria-hidden>
          {currentPoint && safeCurrentLineX != null && (
            <div
              className="absolute inset-y-10 w-[2px] bg-gradient-to-b from-transparent via-cyan-400/70 to-transparent"
              style={{
                left: safeCurrentLineX,
                transition: "left 280ms ease",
              }}
            >
              <span
                className="absolute -top-7 whitespace-nowrap rounded-full border border-cyan-400/40 bg-cyan-400/10 px-3 py-0.5 text-[10px] font-semibold uppercase tracking-[0.3em] text-cyan-100"
                style={{
                  transform: `translate(calc(-50% + ${computeLabelShift(safeCurrentLineX)}px), 0)`,
                }}
              >
                Current Stack
              </span>
            </div>
          )}

          {sweepData.sweetSpot && safePeakLineX != null && (
            <div
              className="absolute inset-y-10 w-[2px] bg-gradient-to-b from-transparent via-indigo-400/70 to-transparent"
              style={{
                left: safePeakLineX,
                transition: "left 320ms ease",
              }}
            >
              <span
                className="absolute bottom-8 whitespace-nowrap rounded-full border border-indigo-400/40 bg-indigo-500/10 px-3 py-0.5 text-[10px] font-semibold uppercase tracking-[0.3em] text-indigo-100"
                style={{
                  transform: `translate(calc(-50% + ${computeLabelShift(safePeakLineX)}px), 0)`,
                }}
              >
                Peak Gap {formatNumber(sweepData.sweetSpot.netGap)}
              </span>
            </div>
          )}

          {hoverMeta?.point && (
            <>
              <div
                className="absolute inset-y-10 w-px bg-gradient-to-b from-transparent via-amber-200/80 to-transparent"
                style={{
                  left: hoverMeta.x,
                  transition: "left 60ms ease",
                }}
              />
              <div
                className="absolute top-8 whitespace-nowrap rounded-full border border-amber-200/40 bg-amber-200/15 px-2.5 py-0.5 text-[10px] font-semibold uppercase tracking-[0.3em] text-amber-50 shadow-lg"
                style={{
                  left: hoverMeta.x,
                  transition: "left 60ms ease",
                  transform: `translate(calc(-50% + ${computeLabelShift(hoverMeta.x)}px), 0)`,
                }}
              >
                {formatDelta(hoverMeta.point.deltaPercent)}
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default NetEffectChart;

