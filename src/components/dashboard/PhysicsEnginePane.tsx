import React, { useMemo, useState } from "react";
import {
  Area,
  AreaChart,
  CartesianGrid,
  Line,
  ReferenceLine,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import type { TooltipProps } from "recharts";
import { useStack } from "../../context/StackContext";
import { useCycleRailData } from "./hooks/useCycleRailData";
import { COMPOUNDS } from "../../data/compounds";
import type { ICompoundSchema, IToxicityModel } from "../../types/physio";

const DURATION_OPTIONS = [8, 12, 16, 24];

const CHART_COLORS = {
  genomic: "#4FAE8C",
  mass: "#4C83FF",
  load: "#F06767",
  grid: "#ffffff12",
  axes: "#94A3B8",
  bg: "#11141b",
  panel: "#0f1118",
};

const LEGEND_ITEMS = [
  { label: "Marginal Tissue", color: CHART_COLORS.genomic },
  { label: "Visible Mass Pulse", color: CHART_COLORS.mass },
  { label: "Marginal Systemic", color: CHART_COLORS.load },
];

const formatNumber = (value: number, digits = 1): string => {
  if (!Number.isFinite(value)) return "--";
  return value.toFixed(digits);
};

const getToxicityScore = (model?: IToxicityModel): number => {
  if (!model) return 0;
  if (model.modelType === "Hill_TC50") {
    return model.parameters?.Emax ?? 0;
  }
  return (model.parameters?.coefficient ?? 0) * 100;
};

type PhysicsChartPoint = {
  day: number;
  genomicTissue: number;
  visibleMass: number;
  systemicLoad: number;
  naturalAxis: number;
  netGap: number;
};

const smoothSeries = (series: PhysicsChartPoint[], window = 1): PhysicsChartPoint[] => {
  if (window <= 0 || series.length <= 2) return series;

  const smoothField = (index: number, key: keyof PhysicsChartPoint) => {
    let acc = 0;
    let count = 0;
    for (let offset = -window; offset <= window; offset += 1) {
      const neighbor = series[index + offset];
      if (!neighbor) continue;
      const value = Number(neighbor[key]);
      if (!Number.isFinite(value)) continue;
      acc += value;
      count += 1;
    }
    return count ? acc / count : Number(series[index][key]) || 0;
  };

  return series.map((point, index) => {
    const genomicTissue = smoothField(index, "genomicTissue");
    const visibleMass = smoothField(index, "visibleMass");
    const systemicLoad = smoothField(index, "systemicLoad");
    return {
      ...point,
      genomicTissue,
      visibleMass,
      systemicLoad,
      netGap: genomicTissue - systemicLoad,
    };
  });
};

type CompoundSignature = {
  id: string;
  name: string;
  abbreviation: string;
  color: string;
  classification: string;
  routesLabel: string;
  potency: number;
  toxicity: number;
  myogenesis: number;
  erythropoiesis: number;
  hepaticLoad: number;
  cardiovascularLoad: number;
  isC17aa: boolean;
  is19Nor: boolean;
};

const PhysicsTooltip = ({ active, payload }: TooltipProps<number, string>) => {
  if (!active || !payload || !payload.length) return null;
  const point = payload[0].payload as PhysicsChartPoint;
  const week = Math.floor(point.day / 7);

  return (
    <div className="min-w-[220px] rounded-2xl border border-white/10 bg-[#05060A]/95 p-4 text-xs text-gray-200 backdrop-blur shadow-2xl">
      <div className="mb-3 border-b border-white/5 pb-2">
        <p className="font-mono text-[11px] uppercase tracking-[0.35em] text-gray-500">
          Week {week} · Day {Math.round(point.day)}
        </p>
      </div>
      <ul className="space-y-2">
        <li className="flex items-center justify-between gap-4">
          <span className="flex items-center gap-2 text-emerald-200">
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" /> Marginal Tissue Gain
          </span>
          <span className="font-mono text-white">{formatNumber(point.genomicTissue)}</span>
        </li>
        <li className="flex items-center justify-between gap-4">
          <span className="flex items-center gap-2 text-sky-200">
            <span className="h-1.5 w-1.5 rounded-full bg-sky-400/80" /> Visible Mass Pulse
          </span>
          <span className="font-mono text-white">{formatNumber(point.visibleMass)}</span>
        </li>
        <li className="flex items-center justify-between gap-4">
          <span className="flex items-center gap-2 text-rose-200">
            <span className="h-1.5 w-1.5 rounded-full bg-rose-400" /> Marginal Systemic Hit
          </span>
          <span className="font-mono text-white">{formatNumber(point.systemicLoad)}</span>
        </li>
        <li className="flex items-center justify-between gap-4">
          <span className="flex items-center gap-2 text-amber-200">
            <span className="h-1.5 w-1.5 rounded-full bg-amber-300/80" /> Effect Spread
          </span>
          <span className={`font-mono ${point.netGap >= 0 ? "text-emerald-300" : "text-rose-300"}`}>
            {formatNumber(point.netGap)}
          </span>
        </li>
        <li className="flex items-center justify-between gap-4">
          <span className="flex items-center gap-2 text-indigo-200">
            <span className="h-1.5 w-1.5 rounded-full border border-indigo-300" /> Natural Axis
          </span>
          <span className="font-mono text-white">{formatNumber(point.naturalAxis)}%</span>
        </li>
      </ul>
    </div>
  );
};

const StatChip = ({ label, value, accent }: { label: string; value: string; accent?: string }) => (
  <div className="flex flex-col rounded-xl border border-white/5 bg-white/2 p-4">
    <span className="text-[10px] font-mono uppercase tracking-[0.35em] text-gray-500">{label}</span>
    <span className={`text-xl font-semibold ${accent ?? "text-white"}`}>{value}</span>
  </div>
);

const CompoundCard = ({ signature }: { signature: CompoundSignature }) => (
  <div className="rounded-2xl border border-white/5 bg-[#08090F] p-4 shadow-[0_4px_24px_rgba(0,0,0,0.35)]">
    <div className="flex items-start justify-between gap-3">
      <div>
        <p className="text-sm font-semibold text-white">{signature.name}</p>
        <p className="text-[11px] font-mono uppercase tracking-[0.3em] text-gray-500">{signature.abbreviation}</p>
      </div>
      <span
        className="rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-widest"
        style={{ backgroundColor: `${signature.color}22`, color: signature.color }}
      >
        {signature.classification}
      </span>
    </div>

    <dl className="mt-4 grid grid-cols-2 gap-3 text-xs text-gray-300">
      <div>
        <dt className="text-[10px] uppercase tracking-[0.25em] text-gray-500">Potency</dt>
        <dd className="text-lg text-white">{formatNumber(signature.potency)}</dd>
      </div>
      <div>
        <dt className="text-[10px] uppercase tracking-[0.25em] text-gray-500">Systemic Load</dt>
        <dd className="text-lg text-white">{formatNumber(signature.toxicity)}</dd>
      </div>
      <div>
        <dt className="text-[10px] uppercase tracking-[0.25em] text-gray-500">Myogenesis</dt>
        <dd className="text-lg text-emerald-300">{formatNumber(signature.myogenesis, 0)}</dd>
      </div>
      <div>
        <dt className="text-[10px] uppercase tracking-[0.25em] text-gray-500">Erythropoiesis</dt>
        <dd className="text-lg text-amber-300">{formatNumber(signature.erythropoiesis, 0)}</dd>
      </div>
      <div>
        <dt className="text-[10px] uppercase tracking-[0.25em] text-gray-500">Hepatic Stress</dt>
        <dd className="text-lg text-rose-300">{formatNumber(signature.hepaticLoad, 0)}</dd>
      </div>
      <div>
        <dt className="text-[10px] uppercase tracking-[0.25em] text-gray-500">Cardio Load</dt>
        <dd className="text-lg text-rose-200">{formatNumber(signature.cardiovascularLoad, 0)}</dd>
      </div>
    </dl>

    <div className="mt-4 flex flex-wrap items-center gap-2 text-[10px] font-mono uppercase tracking-[0.3em] text-gray-500">
      <span className="rounded-full border border-white/10 px-2 py-0.5 text-white/70">{signature.routesLabel}</span>
      {signature.isC17aa && (
        <span className="rounded-full border border-rose-500/50 px-2 py-0.5 text-rose-200">C17α</span>
      )}
      {signature.is19Nor && (
        <span className="rounded-full border border-amber-500/50 px-2 py-0.5 text-amber-200">19-Nor</span>
      )}
    </div>
  </div>
);

const buildCompoundSignatures = (stack: Array<any>): CompoundSignature[] => {
  if (!Array.isArray(stack) || !stack.length) return [];
  const seen = new Set<string>();
  const signatures: CompoundSignature[] = [];

  stack.forEach((stackEntry) => {
    const id = stackEntry?.compound || stackEntry?.compoundId;
    if (!id || seen.has(id)) return;
    const schema: ICompoundSchema | undefined = COMPOUNDS[id];
    if (!schema) return;
    seen.add(id);

    const meta = schema.metadata;
    const color = meta.color ?? "#94a3b8";
    const myogenesis = schema.pd?.pathwayModulation?.genomic?.myogenesis?.Emax ?? 0;
    const erythropoiesis = schema.pd?.pathwayModulation?.genomic?.erythropoiesis?.Emax ?? 0;
    const hepaticLoad = getToxicityScore(schema.toxicity?.hepatic);
    const cardiovascularLoad = getToxicityScore(schema.toxicity?.cardiovascular);

    signatures.push({
      id,
      name: meta.name,
      abbreviation: meta.abbreviation,
      color,
      classification: meta.classification,
      routesLabel: meta.administrationRoutes.join(" • "),
      potency: meta.basePotency ?? myogenesis / 100,
      toxicity: meta.baseToxicity ?? hepaticLoad / 100,
      myogenesis,
      erythropoiesis,
      hepaticLoad,
      cardiovascularLoad,
      isC17aa: Boolean(meta.structuralFlags?.isC17aa),
      is19Nor: Boolean(meta.structuralFlags?.is19Nor),
    });
  });

  return signatures;
};

const PhysicsEnginePane: React.FC = () => {
  const { stack, metrics } = useStack();
  const [durationWeeks, setDurationWeeks] = useState<number>(12);
  const { chartData, graphMeta, optimalExit } = useCycleRailData({ stack, metrics, durationWeeks });

  const physicsSeries = useMemo<PhysicsChartPoint[]>(() => {
    if (!chartData?.length) return [];
    const baseSeries = chartData.map((point) => ({
      day: point.day,
      genomicTissue: Number(point.tissueEffect ?? point.anabolic ?? 0),
      visibleMass: Number(point.massEffect ?? point.totalMass ?? point.anabolic ?? 0),
      systemicLoad: Number(point.riskEffect ?? point.toxicity ?? 0),
      naturalAxis: Number(point.naturalScaled ?? 0),
      netGap: Number(point.netGap ?? point.effectGap ?? 0),
    }));
    return smoothSeries(baseSeries, 1);
  }, [chartData]);

  const yDomainMax = useMemo(() => {
    if (!physicsSeries.length) return 100;
    const peak = physicsSeries.reduce((max, point) => {
      return Math.max(
        max,
        point.visibleMass,
        point.systemicLoad,
        point.naturalAxis,
        point.genomicTissue,
      );
    }, 80);
    return Math.max(80, Math.ceil(peak / 5) * 5);
  }, [physicsSeries]);

  const compoundSignatures = useMemo(() => buildCompoundSignatures(stack), [stack]);

  const summaryStats = useMemo(() => {
    if (!physicsSeries.length) return null;
    const peakVisible = physicsSeries.reduce((prev, curr) =>
      curr.visibleMass > prev.visibleMass ? curr : prev,
    physicsSeries[0]);
    const peakTissue = physicsSeries.reduce((prev, curr) =>
      curr.genomicTissue > prev.genomicTissue ? curr : prev,
    physicsSeries[0]);
    const peakLoad = physicsSeries.reduce((prev, curr) =>
      curr.systemicLoad > prev.systemicLoad ? curr : prev,
    physicsSeries[0]);

    return {
      peakVisible,
      peakTissue,
      peakLoad,
      exitWeek: optimalExit ? optimalExit.week : null,
      exitSpread: optimalExit ? optimalExit.netGap : null,
    };
  }, [physicsSeries, optimalExit]);

  if (!stack?.length) {
    return (
      <div className="flex h-full min-h-[320px] items-center justify-center rounded-3xl border border-dashed border-white/10 bg-[#050608]">
        <div className="text-center text-sm text-gray-400">
          <p className="text-lg font-semibold text-white">Physics Engine is idle</p>
          <p>Add at least one compound to the stack to visualize PK → PD trajectories.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4">
      <section
        className="rounded-2xl border border-white/5 bg-[#10131b] p-6 shadow-[0px_20px_60px_rgba(0,0,0,0.35)]"
        style={{ backgroundColor: CHART_COLORS.panel }}
      >
        <header className="flex flex-col gap-4 border-b border-white/5 pb-4 lg:flex-row lg:items-center lg:justify-between">
          <div className="space-y-1">
            <p className="text-[11px] font-semibold uppercase tracking-[0.4em] text-slate-500">Forward Simulator</p>
            <h2 className="text-[17px] font-medium text-white">Stack Physics Timeline</h2>
            <p className="text-[13px] text-slate-400">
              Marginal tissue accrual (green), marginal systemic load (red), and the visible mass pulse (blue) blending tissue + water + glycogen signals.
            </p>
            {graphMeta && (
              <p className="pt-1 text-[11px] font-mono uppercase tracking-[0.3em] text-slate-500">
                Scale Anchor · {graphMeta.scaleLabel} · ≤ {graphMeta.scaleMax?.toLocaleString?.() ?? graphMeta.scaleMax} mgEq
              </p>
            )}
          </div>
          <div className="flex items-center gap-3">
            <div className="flex items-center rounded-lg border border-white/10 bg-white/5 p-1">
              {DURATION_OPTIONS.map((weeks) => (
                <button
                  key={weeks}
                  onClick={() => setDurationWeeks(weeks)}
                  className={`rounded-md px-3 py-1 text-[11px] font-medium transition-colors ${
                    durationWeeks === weeks
                      ? "bg-white/15 text-white shadow-inner"
                      : "text-slate-500 hover:text-slate-300"
                  }`}
                >
                  {weeks} W
                </button>
              ))}
            </div>
          </div>
        </header>

        <div className="mt-6 grid gap-6 lg:grid-cols-[minmax(0,_2.2fr)_minmax(0,_1fr)]">
          <div
            className="relative h-[420px] overflow-hidden rounded-xl border border-white/5"
            style={{ background: CHART_COLORS.bg }}
          >
            <div className="pointer-events-none absolute left-6 top-4 flex flex-wrap gap-4 text-[12px] font-medium text-slate-300">
              {LEGEND_ITEMS.map((item) => (
                <span key={item.label} className="flex items-center gap-2">
                  <span className="h-2 w-2 rounded-full" style={{ backgroundColor: item.color }} />
                  {item.label}
                </span>
              ))}
            </div>
            {physicsSeries.length ? (
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={physicsSeries} margin={{ top: 24, right: 32, bottom: 24, left: 24 }}>
                  <defs>
                    <linearGradient id="genomicFill" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor={CHART_COLORS.genomic} stopOpacity={0.4} />
                      <stop offset="100%" stopColor={CHART_COLORS.genomic} stopOpacity={0.05} />
                    </linearGradient>
                    <linearGradient id="massFill" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor={CHART_COLORS.mass} stopOpacity={0.3} />
                      <stop offset="100%" stopColor={CHART_COLORS.mass} stopOpacity={0.05} />
                    </linearGradient>
                    <linearGradient id="loadFill" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor={CHART_COLORS.load} stopOpacity={0.45} />
                      <stop offset="100%" stopColor={CHART_COLORS.load} stopOpacity={0.08} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid stroke={CHART_COLORS.grid} strokeDasharray="2 4" vertical={false} />
                  <XAxis
                    dataKey="day"
                    type="number"
                    domain={[0, durationWeeks * 7]}
                    tickFormatter={(value) => `W${Math.floor(Number(value) / 7)}`}
                    tick={{ fill: CHART_COLORS.axes, fontSize: 12 }}
                    axisLine={false}
                    tickLine={false}
                  />
                  <YAxis
                    domain={[0, yDomainMax]}
                    tick={{ fill: CHART_COLORS.axes, fontSize: 12 }}
                    label={{
                      value: "Normalized Units",
                      angle: -90,
                      position: "insideLeft",
                      fill: CHART_COLORS.axes,
                      fontSize: 11,
                      offset: 10,
                    }}
                    axisLine={false}
                    tickLine={false}
                  />
                  <Tooltip content={<PhysicsTooltip />} wrapperStyle={{ outline: "none" }} />
                  {optimalExit && (
                    <ReferenceLine
                      x={optimalExit.day}
                      stroke="#F48C8C"
                      strokeDasharray="4 6"
                      label={{
                        value: `Exit · W${optimalExit.week} · risk > tissue`,
                        fill: "#fecdd3",
                        position: "top",
                        fontSize: 12,
                      }}
                    />
                  )}
                  <Area
                    type="monotone"
                    dataKey="visibleMass"
                    stroke={CHART_COLORS.mass}
                    fill="url(#massFill)"
                    strokeWidth={2}
                    animationDuration={180}
                    isAnimationActive
                    dot={false}
                    activeDot={{ r: 4, strokeWidth: 0, fill: CHART_COLORS.mass }}
                    name="Visible Mass Pulse"
                  />
                  <Area
                    type="monotone"
                    dataKey="genomicTissue"
                    stroke={CHART_COLORS.genomic}
                    fill="url(#genomicFill)"
                    strokeWidth={2.5}
                    animationDuration={180}
                    isAnimationActive
                    dot={false}
                    activeDot={{ r: 4, strokeWidth: 0, fill: CHART_COLORS.genomic }}
                    name="Genomic Tissue"
                  />
                  <Area
                    type="monotone"
                    dataKey="systemicLoad"
                    stroke={CHART_COLORS.load}
                    fill="url(#loadFill)"
                    strokeWidth={2}
                    animationDuration={180}
                    isAnimationActive
                    dot={false}
                    activeDot={{ r: 4, strokeWidth: 0, fill: CHART_COLORS.load }}
                    name="Systemic Load"
                  />
                  <Line
                    type="monotone"
                    dataKey="naturalAxis"
                    stroke="#B4C2FF"
                    strokeDasharray="4 4"
                    strokeWidth={1.5}
                    dot={false}
                    name="Natural Axis"
                  />
                </AreaChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex h-full items-center justify-center text-sm text-gray-500">
                Simulation results pending… tweak the stack or rerun to populate the physics timeline.
              </div>
            )}
          </div>

            <div className="flex flex-col gap-4">
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              <StatChip
                label="Peak Tissue Effect"
                value={summaryStats
                  ? `${formatNumber(summaryStats.peakTissue?.genomicTissue ?? 0)} · W${Math.floor((summaryStats.peakTissue?.day ?? 0) / 7)}`
                  : "--"}
                accent="text-emerald-300"
              />
              <StatChip
                label="Visible Mass Pulse"
                value={summaryStats
                  ? `${formatNumber(summaryStats.peakVisible?.visibleMass ?? 0)} · W${Math.floor((summaryStats.peakVisible?.day ?? 0) / 7)}`
                  : "--"}
                accent="text-sky-300"
              />
              <StatChip
                label="Marginal Risk Spike"
                value={summaryStats
                  ? `${formatNumber(summaryStats.peakLoad?.systemicLoad ?? 0)} · W${Math.floor((summaryStats.peakLoad?.day ?? 0) / 7)}`
                  : "--"}
                accent="text-rose-300"
              />
              <StatChip
                label="Optimal Exit Week"
                value={summaryStats && summaryStats.exitWeek !== null ? `W${summaryStats.exitWeek}` : "--"}
                accent="text-amber-300"
              />
              <StatChip
                  label="Effect Spread at Exit"
                value={summaryStats && summaryStats.exitSpread !== null ? `${formatNumber(summaryStats.exitSpread)} units` : "--"}
                accent={summaryStats && summaryStats.exitSpread !== null && summaryStats.exitSpread < 0 ? "text-rose-300" : "text-emerald-300"}
              />
            </div>

            <div className="rounded-2xl border border-white/5 bg-white/2 p-4">
              <p className="text-[11px] font-mono uppercase tracking-[0.35em] text-gray-500">Active Compound Library</p>
              <p className="text-lg font-semibold text-white">
                {compoundSignatures.length} compound{compoundSignatures.length === 1 ? "" : "s"} engaged
              </p>
              <p className="text-sm text-gray-400">
                Pulling PK/PD coefficients directly from the canonical PhysioSim compound graph to keep the simulator evidence-aligned.
              </p>
            </div>
          </div>
        </div>
      </section>

      <section className="linear-panel rounded-3xl border border-white/5 bg-[#030408] p-6">
        <header className="mb-4 flex flex-col gap-2">
          <p className="text-[11px] font-mono uppercase tracking-[0.35em] text-gray-500">Compound Signatures</p>
          <h3 className="text-xl font-semibold text-white">How each molecule is steering the curve</h3>
          <p className="text-sm text-gray-400">
            Potency, tissue targeting, and organ load scores are pulled from the structured compound schema so clinics can defend each lever.
          </p>
        </header>
        {compoundSignatures.length ? (
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {compoundSignatures.map((signature) => (
              <CompoundCard key={signature.id} signature={signature} />
            ))}
          </div>
        ) : (
          <div className="rounded-2xl border border-dashed border-white/10 bg-black/20 p-8 text-center text-sm text-gray-400">
            Simulation data is still warming up — cards populate as soon as the worker completes the first pass.
          </div>
        )}
      </section>
    </div>
  );
};

export default PhysicsEnginePane;
