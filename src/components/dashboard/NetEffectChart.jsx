import React from "react";
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

const SCALAR_STEPS = 60;
const BINDING_WEIGHTS = {
  very_high: 2.8,
  high: 1.6,
  moderate: 1.2,
};

const ZONE_FILLS = {
  safe: "rgba(16,185,129,0.07)",
  strain: "rgba(251,191,36,0.08)",
  critical: "rgba(248,113,113,0.08)",
};

const clamp = (value, min = 0, max = 1) => Math.min(Math.max(value, min), max);

const useDebouncedCallback = (callback, delay = 60) => {
  const timerRef = React.useRef(null);

  React.useEffect(() => () => {
    if (timerRef.current) clearTimeout(timerRef.current);
  }, []);

  return React.useCallback(
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

const getBindingWeight = (meta) => BINDING_WEIGHTS[meta?.bindingAffinity] || 1;

const buildSweep = (stack, profile) => {
  if (!stack.length) {
    return {
      data: [],
      baselineMgEq: 0,
      maxMgEq: 0,
      chartMax: 50,
      sweetSpot: null,
      dangerPoint: null,
    };
  }

  const prepared = stack.map((entry) => {
    const meta = compoundData[entry.compound] || {};
    const weight = getBindingWeight(meta);
    return { original: entry, weight };
  });

  const baselineMgEq = prepared.reduce(
    (total, item) => total + (item.original.dose || 0) * item.weight,
    0,
  );

  const maxMgEq = baselineMgEq > 0 ? baselineMgEq * 1.65 : 600;
  const stepSize = maxMgEq / SCALAR_STEPS;

  const dataPoints = [];
  let sweetSpot = null;
  let dangerPoint = null;

  for (let i = 0; i <= SCALAR_STEPS; i += 1) {
    const mgEq = Math.min(maxMgEq, i * stepSize);
    const scalar = baselineMgEq ? mgEq / baselineMgEq : 0;

    const sweepStack = prepared.map(({ original }) => ({
      ...original,
      dose: (original.dose || 0) * scalar,
    }));

    const result = evaluateStack({ stackInput: sweepStack, profile, durationWeeks: 12 });
    const benefit = Number(result.totals.totalBenefit || 0);
    const risk = Number(result.totals.totalRisk || 0);
    const net = Number(result.totals.netScore || 0);

    if (!Number.isFinite(benefit) || !Number.isFinite(risk)) continue;

    const positiveGap = Math.max(benefit - risk, 0);
    const negativeGap = Math.max(risk - benefit, 0);
    const zone = risk > benefit * 1.3 ? "critical" : risk > benefit ? "strain" : "safe";

    const point = {
      mgEq,
      benefit,
      risk,
      net,
      positiveGap,
      negativeGap,
      zone,
      saturationPenalty: result.totals.saturationPenalty,
      toxicityMultiplier: result.totals.toxicityMultiplier,
    };

    dataPoints.push(point);

    if (!sweetSpot || point.net > sweetSpot.net) {
      sweetSpot = point;
    }

    if (!dangerPoint && zone === "critical") {
      dangerPoint = point;
    }
  }

  const chartMax = dataPoints.reduce(
    (acc, item) => Math.max(acc, item.benefit, item.risk),
    40,
  ) * 1.12;

  return {
    data: dataPoints,
    baselineMgEq,
    maxMgEq,
    chartMax,
    sweetSpot,
    dangerPoint,
  };
};

const RidgeTooltip = ({ active, payload }) => {
  if (!active || !payload?.length) return null;
  const point = payload[0].payload;
  return (
    <div className="min-w-[220px] rounded-2xl border border-white/10 bg-[#050609]/95 p-4 text-sm shadow-2xl">
      <p className="text-xs uppercase tracking-[0.3em] text-gray-500">Load</p>
      <p className="text-2xl font-bold text-white">{Math.round(point.mgEq)} mgEq</p>
      <div className="mt-3 space-y-1 border-t border-white/10 pt-3 text-xs font-mono">
        <div className="flex justify-between text-emerald-300">
          <span>Benefit</span>
          <span>{formatNumber(point.benefit)}</span>
        </div>
        <div className="flex justify-between text-rose-300">
          <span>Risk</span>
          <span>{formatNumber(point.risk)}</span>
        </div>
        <div className="flex justify-between border-t border-white/5 pt-2 text-white">
          <span>Net</span>
          <span className={point.net >= 0 ? "text-emerald-300" : "text-rose-300"}>
            {point.net >= 0 ? "+" : ""}
            {formatNumber(point.net)}
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
  const [hoverPoint, setHoverPoint] = React.useState(null);

  const sweep = React.useMemo(() => buildSweep(stack, profile), [stack, profile]);

  const therapeuticBand = sweep.maxMgEq * 0.35;
  const strainBand = sweep.maxMgEq * 0.7;

  const handleCursor = React.useCallback((state) => {
    if (!state?.isTooltipActive) {
      setHoverPoint(null);
      return;
    }
    const nextPoint = state?.activePayload?.[0]?.payload;
    if (!nextPoint) return;
    setHoverPoint(nextPoint);
    debouncedScrub(nextPoint);
  }, [debouncedScrub]);

  if (!stack.length) {
    return (
      <div className="flex h-full items-center justify-center rounded-3xl border border-dashed border-white/10 bg-[#050608]">
        <div className="text-center text-sm text-gray-400">
          <p className="text-lg font-semibold text-white">Load a stack to generate the ridge.</p>
          <p className="mt-2 text-xs uppercase tracking-[0.4em]">Awaiting compounds</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-full flex-col overflow-hidden rounded-2xl border border-white/5 bg-[#050608]">
      <header className="flex items-start justify-between border-b border-white/5 px-6 py-4">
        <div className="flex flex-col gap-1">
          <h3 className="text-base font-semibold text-white">Dose Efficiency</h3>
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
          {sweep.sweetSpot && (
            <div className="rounded-full border border-sky-400/40 bg-sky-400/10 px-4 py-1 text-[11px] font-semibold uppercase tracking-[0.3em] text-sky-200">
              Sweet Spot · {Math.round(sweep.sweetSpot.mgEq)} mgEq
            </div>
          )}
        </div>
      </header>

      <div className="flex-1 bg-gradient-to-b from-[#07090F] to-[#030305]">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart
            data={sweep.data}
            onMouseMove={handleCursor}
            onMouseLeave={() => setHoverPoint(null)}
            margin={{ top: 30, right: 24, left: 0, bottom: 12 }}
          >
            <defs>
              <linearGradient id="ridgeBenefit" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#06b6d4" stopOpacity={0.9} />
                <stop offset="50%" stopColor="#06b6d4" stopOpacity={0.45} />
                <stop offset="95%" stopColor="#06b6d4" stopOpacity={0.2} />
              </linearGradient>
              <linearGradient id="ridgeRisk" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#f43f5e" stopOpacity={0.9} />
                <stop offset="55%" stopColor="#f43f5e" stopOpacity={0.45} />
                <stop offset="95%" stopColor="#f43f5e" stopOpacity={0.2} />
              </linearGradient>
            </defs>

            <ReferenceArea x1={0} x2={therapeuticBand} y1={0} y2={sweep.chartMax} fill={ZONE_FILLS.safe} />
            <ReferenceArea x1={therapeuticBand} x2={strainBand} y1={0} y2={sweep.chartMax} fill={ZONE_FILLS.strain} />
            <ReferenceArea x1={strainBand} x2={sweep.maxMgEq} y1={0} y2={sweep.chartMax} fill={ZONE_FILLS.critical} />

            <CartesianGrid stroke="#1f1f28" strokeDasharray="2 6" opacity={0.35} vertical={false} />
            <XAxis
              type="number"
              domain={[0, sweep.maxMgEq]}
              axisLine={false}
              tickLine={false}
              tickFormatter={(value) => `${Math.round(value / 50) * 50}`}
              tick={{ fill: "#6b7280", fontSize: 10 }}
            />
            <YAxis hide domain={[0, "dataMax + 20"]} allowDataOverflow />

            <Tooltip cursor={{ stroke: "#ffffff", strokeDasharray: "3 3" }} content={<RidgeTooltip />} />

            <Area
              type="monotone"
              dataKey="risk"
              stroke="#f87171"
              strokeWidth={3}
              fill="url(#ridgeRisk)"
              style={{ filter: "drop-shadow(0 0 6px rgba(244,63,94,0.35))" }}
            />
            <Area
              type="monotone"
              dataKey="benefit"
              stroke="#34d399"
              strokeWidth={3}
              fill="url(#ridgeBenefit)"
              style={{ filter: "drop-shadow(0 0 6px rgba(6,182,212,0.5))" }}
            />

            <Area
              type="monotone"
              dataKey="positiveGap"
              stroke="none"
              fill="rgba(52,211,153,0.25)"
            />
            <Area
              type="monotone"
              dataKey="negativeGap"
              stroke="none"
              fill="rgba(248,113,113,0.2)"
            />

            <ReferenceLine
              x={sweep.baselineMgEq}
              stroke="#22d3ee"
              strokeDasharray="4 4"
              strokeWidth={1.5}
              label={{
                value: "Current Stack",
                position: "insideTopRight",
                fill: "#22d3ee",
                fontSize: 10,
              }}
            />

            {sweep.sweetSpot && (
              <ReferenceLine
                x={sweep.sweetSpot.mgEq}
                stroke="#818cf8"
                strokeDasharray="3 6"
                label={{
                  value: `Peak Net +${formatNumber(sweep.sweetSpot.net)}`,
                  position: "insideBottomLeft",
                  fill: "#c7d2fe",
                  fontSize: 10,
                }}
              />
            )}

            {hoverPoint && (
              <ReferenceLine
                x={hoverPoint.mgEq}
                stroke="#fde68a"
                strokeDasharray="2 4"
                label={{
                  value: `${Math.round(hoverPoint.mgEq)} mgEq`,
                  position: "insideTopLeft",
                  fill: "#fde68a",
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

