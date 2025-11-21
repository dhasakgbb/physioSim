// @ts-nocheck
import React, { useMemo } from "react";
import { ResponsiveContainer, BarChart, Bar, XAxis, LabelList } from "recharts";
import DoseEfficiencyChart from "./DoseEfficiencyChart";
import { useSystemLoad } from "../../hooks/useSystemLoad";
import { useProjectedGains } from "../../hooks/useProjectedGains";
import type { ProjectedVectorMetric } from "../../hooks/useProjectedGains";

type CenterPaneProps = {
  onTimeScrub?: (point: unknown) => void;
};

type LoadRowProps = {
  id: string;
  label: string;
  percent: number;
  level: "stable" | "elevated" | "critical";
  gradient: string;
};

const LEVEL_META = {
  stable: {
    label: "Balanced",
    text: "text-emerald-300",
  },
  elevated: {
    label: "Elevated",
    text: "text-amber-300",
  },
  critical: {
    label: "Critical",
    text: "text-rose-300",
  },
} as const;

const LoadRow: React.FC<LoadRowProps> = ({ label, percent, level, gradient }) => {
  const meta = LEVEL_META[level];
  const width = Math.max(percent, 6);

  return (
    <div className="space-y-1.5">
      <div className="flex items-center justify-between gap-2 text-[11px] leading-tight">
        <p className="truncate font-medium text-gray-100" title={label}>
          {label}
        </p>
        <p className={`w-12 text-right font-mono text-xs tabular-nums leading-tight ${meta.text}`}>
          {percent}%
        </p>
      </div>
      <div className="h-1.5 w-full overflow-hidden rounded-full bg-white/5">
        <div
          className={`h-full rounded-full bg-gradient-to-r ${gradient}`}
          style={{ width: `${Math.min(width, 100)}%` }}
        />
      </div>
    </div>
  );
};

const ProjectedGainsCard: React.FC<{ vectors: ProjectedVectorMetric[]; netScore: number }> = ({ vectors, netScore }) => (
  <div className="rounded-xl border border-white/5 bg-[#0C0C0C] p-5 flex flex-col h-full">
    <div className="flex items-baseline justify-between gap-3">
      <div>
        <h4 className="text-[10px] font-bold uppercase tracking-widest text-gray-500">Projected Gains</h4>
        <p className="text-[9px] text-gray-500">Vector intensity forecast</p>
      </div>
      <div className="flex flex-col items-end text-right">
        <div className="text-3xl font-mono text-white leading-none tabular-nums">
          {Number.isFinite(netScore) ? netScore.toFixed(1) : "--"}
        </div>
        <p className="mt-1 text-[10px] font-bold tracking-wider uppercase text-emerald-400">Net Score</p>
      </div>
    </div>

    <div className="mt-4 flex-1 space-y-3">
      {vectors.map((vector) => (
        <div key={vector.key} className="space-y-1">
          <div className="flex items-center justify-between text-[11px] text-gray-300">
            <span className="truncate">{vector.title}</span>
            <span className="font-mono text-xs text-gray-100 tabular-nums">
              {vector.intensity.toFixed(1)} / 10
            </span>
          </div>
          <div className="h-1.5 w-full overflow-hidden rounded-full bg-white/5">
            <div
              className="h-full rounded-full bg-gradient-to-r from-cyan-500 via-indigo-400 to-indigo-500"
              style={{ width: `${Math.min((vector.intensity / 11) * 100, 100)}%` }}
            />
          </div>
        </div>
      ))}
      {!vectors.length && (
        <p className="text-center text-[11px] text-gray-500">Awaiting stack inputs</p>
      )}
    </div>
  </div>
);

const SystemLoadCard: React.FC<{
  systemIndex: number;
  systemLevelMeta: typeof LEVEL_META["stable"];
  dominantCategory?: string;
  categories: LoadRowProps[];
}> = ({ systemIndex, systemLevelMeta, dominantCategory, categories }) => (
  <div className="rounded-xl border border-white/5 bg-[#0C0C0C] p-5 flex flex-col h-full">
    <div className="flex items-baseline justify-between gap-4">
      <div>
        <h4 className="text-[10px] font-bold uppercase tracking-widest text-gray-500">System Load</h4>
        <p className="text-[9px] uppercase tracking-widest text-gray-500 mt-1">
          {dominantCategory ? `Dominant pressure: ${dominantCategory}` : "Awaiting stack inputs"}
        </p>
      </div>
      <div className="flex flex-col items-end text-right">
        <div className="text-3xl font-mono text-white leading-none tabular-nums">
          {systemIndex}%
        </div>
        <p className={`mt-1 text-[10px] font-bold tracking-wider uppercase ${systemLevelMeta.text}`}>
          {systemLevelMeta.label}
        </p>
      </div>
    </div>
    <div className="mt-4 flex-1 space-y-3">
      {categories.map((category) => (
        <LoadRow key={category.id} {...category} />
      ))}
    </div>
  </div>
);

const HALF_LIFE_SERIES = [
  { label: "Now", duration: 8, display: "8h" },
  { label: "2 Wks", duration: 108, display: "4.5d" },
  { label: "4 Wks", duration: 24, display: "1d" },
];

const ActiveHalfLifeCard: React.FC = () => (
  <div className="rounded-xl border border-white/5 bg-[#0C0C0C] p-5 flex flex-col h-full">
    <div className="flex items-center justify-between">
      <h4 className="text-[10px] font-bold uppercase tracking-widest text-gray-500">Active Half-Life</h4>
      <p className="text-[9px] uppercase tracking-[0.4em] text-gray-500">t½</p>
    </div>
    <div className="mt-2 flex-1 min-h-[150px]">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={HALF_LIFE_SERIES} barSize={32} margin={{ left: 8, right: 8, top: 12, bottom: 0 }}>
          <defs>
            <linearGradient id="halfLifeGradient" x1="0" y1="1" x2="0" y2="0">
              <stop offset="0%" stopColor="rgba(59,130,246,0.2)" />
              <stop offset="100%" stopColor="rgba(129,140,248,0.95)" />
            </linearGradient>
          </defs>
          <XAxis
            dataKey="label"
            axisLine={false}
            tickLine={false}
            tick={{ fill: "#525252", fontSize: 10, fontFamily: "var(--font-mono)", letterSpacing: "0.08em" }}
            tickMargin={8}
          />
          <Bar dataKey="duration" radius={[8, 8, 0, 0]} fill="url(#halfLifeGradient)">
            <LabelList
              dataKey="display"
              position="top"
              fill="#A5B4FC"
              fontSize={11}
              fontFamily="var(--font-mono)"
              letterSpacing="0.2em"
            />
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
    <p className="mt-3 text-[10px] uppercase tracking-[0.3em] text-gray-500">Normalized elimination curve</p>
  </div>
);

export const CenterPane: React.FC<CenterPaneProps> = ({ onTimeScrub }) => {
  const { categories, systemIndex, systemLevel, dominantCategory } = useSystemLoad();
  const { vectors, netScore } = useProjectedGains();

  const systemLevelMeta = useMemo(() => LEVEL_META[systemLevel], [systemLevel]);

  return (
    <div className="flex flex-col gap-3 w-full">
      <section className="shrink-0 h-[350px] w-full min-h-0">
        <div className="h-full min-h-0">
          <DoseEfficiencyChart onTimeScrub={onTimeScrub} />
        </div>
      </section>

      <section className="shrink-0 h-[260px] grid grid-cols-1 gap-4 md:grid-cols-3">
        <ProjectedGainsCard vectors={vectors} netScore={netScore} />
        <SystemLoadCard
          systemIndex={systemIndex}
          systemLevelMeta={systemLevelMeta}
          dominantCategory={dominantCategory?.label}
          categories={categories}
        />
        <ActiveHalfLifeCard />
      </section>
    </div>
  );
};

export default CenterPane;
