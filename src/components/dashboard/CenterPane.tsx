// @ts-nocheck
import React, { useMemo } from "react";
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
      <div className="flex items-center justify-between gap-3 text-[11px]">
        <p className="truncate font-medium text-gray-100" title={label}>
          {label}
        </p>
        <p className={`font-mono text-sm tabular-nums leading-tight ${meta.text}`}>{percent}%</p>
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
      <div className="text-right">
        <div className="font-mono text-3xl font-light leading-none tracking-tight text-white tabular-nums">
          {Number.isFinite(netScore) ? netScore.toFixed(1) : "--"}
        </div>
        <p className="mt-1 text-right text-[9px] uppercase tracking-widest text-emerald-300">Net Score</p>
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
        <p className="text-[9px] text-gray-500">Organ stress telemetry</p>
      </div>
      <div className="text-right">
        <div className="font-mono text-3xl font-light leading-none tracking-tight text-white tabular-nums">
          {systemIndex}%
        </div>
        <p className={`mt-1 text-right text-[9px] uppercase tracking-widest ${systemLevelMeta.text}`}>
          {systemLevelMeta.label}
        </p>
      </div>
    </div>

    <p className="mt-3 text-[10px] uppercase tracking-widest text-gray-500">
      {dominantCategory ? `Dominant pressure: ${dominantCategory}` : "Awaiting stack inputs"}
    </p>

    <div className="mt-4 flex-1 space-y-3">
      {categories.map((category) => (
        <LoadRow key={category.id} {...category} />
      ))}
    </div>
  </div>
);

const ActiveHalfLifeCard: React.FC = () => (
  <div className="rounded-xl border border-white/5 bg-[#0C0C0C] p-5 flex flex-col h-full">
    <h4 className="mb-4 text-[10px] font-bold uppercase tracking-widest text-gray-500">Active Half-Life</h4>
    <div className="flex flex-1 items-end justify-between gap-1">
      <div className="group relative h-[30%] w-1/3 rounded-t-sm bg-gradient-to-t from-rose-500/20 to-rose-500">
        <div className="absolute -top-4 w-full text-center text-[9px] text-gray-500 opacity-0 transition-opacity group-hover:opacity-100">8h</div>
      </div>
      <div className="group relative h-[80%] w-1/3 rounded-t-sm bg-gradient-to-t from-indigo-500/20 to-indigo-500">
        <div className="absolute -top-4 w-full text-center text-[9px] text-gray-500 opacity-0 transition-opacity group-hover:opacity-100">4.5d</div>
      </div>
      <div className="relative h-[10%] w-1/3 rounded-t-sm border-t border-white/10 bg-white/5" />
    </div>
    <div className="mt-2 flex justify-between text-[9px] font-mono text-gray-500 tabular-nums">
      <span>Now</span>
      <span>2 Wks</span>
      <span>4 Wks</span>
    </div>
  </div>
);

export const CenterPane: React.FC<CenterPaneProps> = ({ onTimeScrub }) => {
  const { categories, systemIndex, systemLevel, dominantCategory } = useSystemLoad();
  const { vectors, netScore } = useProjectedGains();

  const systemLevelMeta = useMemo(() => LEVEL_META[systemLevel], [systemLevel]);

  return (
    <div className="flex flex-col gap-4 w-full">
      <section className="shrink-0 h-[450px] w-full min-h-0">
        <div className="h-full min-h-0">
          <DoseEfficiencyChart onTimeScrub={onTimeScrub} />
        </div>
      </section>

      <section className="shrink-0 h-[280px] grid grid-cols-1 gap-4 md:grid-cols-3">
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
