import React from "react";
import { ArrowUpRight, ArrowDownRight } from "lucide-react";
import {
  usePathwayFlowData,
  type FlowNodeDatum,
  type FlowConnectorDatum,
} from "./hooks/usePathwayFlowData";

const SummaryStat = ({
  label,
  value,
  suffix,
  detail,
  accent,
}: {
  label: string;
  value: string;
  suffix?: string;
  detail: string;
  accent?: string;
}) => (
  <div className="rounded-2xl border border-white/5 bg-white/5 px-4 py-3 shadow-inner shadow-black/30">
    <p className="text-[11px] font-semibold uppercase tracking-[0.3em] text-white/60">
      {label}
    </p>
    <div className="mt-3 flex items-baseline gap-1 text-2xl font-semibold text-white">
      <span className={accent}>{value}</span>
      {suffix ? <span className="text-base text-white/60">{suffix}</span> : null}
    </div>
    <p className="mt-1 text-xs text-white/60">{detail}</p>
  </div>
);

const FlowNodeCard = ({ node }: { node: FlowNodeDatum }) => {
  const Icon = node.icon;
  const deltaPositive = node.delta >= 0;
  const deltaValue = Math.abs(node.delta).toFixed(1);

  return (
    <div className="flex min-w-[200px] flex-1 flex-col rounded-2xl border border-white/5 bg-[#0f141d]/80 px-4 py-4 backdrop-blur">
      <div className="flex items-center gap-3">
        <div
          className={`flex h-11 w-11 items-center justify-center rounded-xl bg-gradient-to-br ${node.gradient} text-white shadow-lg shadow-black/40`}
        >
          <Icon size={20} strokeWidth={2} />
        </div>
        <div>
          <p className={`text-[11px] uppercase tracking-[0.3em] ${node.accent}`}>
            {node.subtitle}
          </p>
          <p className="text-base font-semibold text-white">{node.title}</p>
        </div>
      </div>
      <div className="mt-4">
        <div className="flex items-center justify-between text-sm text-white/70">
          <span>{node.status}</span>
          <span className="font-mono text-lg text-white">{node.percent}%</span>
        </div>
        <div className="mt-2 h-2.5 w-full rounded-full bg-white/10">
          <div
            className="h-full rounded-full bg-gradient-to-r from-white/70 via-white to-transparent"
            style={{
              width: `${Math.min(node.percent, 130)}%`,
              opacity: node.polarity === "risk" ? 0.9 : 1,
            }}
          />
        </div>
        <p className="mt-3 flex items-center gap-1 text-xs text-white/70">
          {deltaPositive ? (
            <ArrowUpRight size={14} className="text-emerald-300" />
          ) : (
            <ArrowDownRight size={14} className="text-rose-300" />
          )}
          <span className="font-mono">
            {deltaPositive ? "+" : "-"}
            {deltaValue}
            <span className="text-white/50"> AU</span>
          </span>
        </p>
      </div>
    </div>
  );
};

const FlowConnector = ({ connector }: { connector: FlowConnectorDatum }) => {
  const palette =
    connector.polarity === "risk"
      ? "from-amber-500 via-rose-500 to-amber-500"
      : "from-sky-400 via-emerald-400 to-sky-400";
  const opacity = Math.max(0.25, connector.intensity / 140);
  const duration = Math.max(1.2, 3 - connector.intensity / 60);

  return (
    <div className="hidden h-full min-w-[48px] items-center justify-center md:flex">
      <div
        className={`h-1.5 w-full rounded-full bg-gradient-to-r ${palette}`}
        style={{
          opacity,
          backgroundSize: "200% 100%",
          animation: `flow-pulse ${duration}s linear infinite`,
          boxShadow: `0 0 14px rgba(56, 189, 248, ${opacity})`,
        }}
      />
    </div>
  );
};

const PathwayInsight = ({ node }: { node: FlowNodeDatum }) => (
  <div className="rounded-2xl border border-white/5 bg-[#0d1118]/90 p-4">
    <div className="flex items-center justify-between">
      <p className="text-sm font-semibold text-white">{node.title}</p>
      <span
        className={`rounded-full px-3 py-1 text-[11px] font-mono ${
          node.polarity === "risk"
            ? "bg-rose-500/15 text-rose-200"
            : "bg-emerald-500/10 text-emerald-200"
        }`}
      >
        {node.percent}%
      </span>
    </div>
    <p className="mt-1 text-xs uppercase tracking-[0.3em] text-white/40">
      {node.subtitle}
    </p>
    <p className="mt-3 text-sm text-white/70">
      {node.polarity === "risk"
        ? "Higher values accelerate endocrine blowback."
        : "Signal strength flowing into downstream tissues."}
    </p>
    <div className="mt-3 h-1.5 rounded-full bg-white/10">
      <div
        className={`h-full rounded-full bg-gradient-to-r ${node.gradient}`}
        style={{ width: `${Math.min(node.percent, 130)}%` }}
      />
    </div>
  </div>
);

const EmptyState = () => (
  <div className="flex h-full flex-col items-center justify-center rounded-3xl border border-dashed border-white/10 bg-black/20 py-16 text-center">
    <p className="text-sm font-semibold text-white">No active stack detected</p>
    <p className="mt-2 max-w-xs text-sm text-white/60">
      Add compounds to your stack to visualize how androgen drive propagates
      through each physiologic pathway.
    </p>
  </div>
);

interface LinearPathwayFlowProps {
  onTimeScrub?: (point: unknown) => void;
}

const LinearPathwayFlow: React.FC<LinearPathwayFlowProps> = () => {
  const { nodes, connectors, androgenStatus, isEmpty } = usePathwayFlowData();

  if (isEmpty) {
    return <EmptyState />;
  }

  const saturationLabel = androgenStatus.saturation >= 95
    ? "Fully saturated"
    : androgenStatus.saturation >= 70
      ? "Operating ceiling"
      : "Within adaptive bandwidth";

  const trendPositive = androgenStatus.trend >= 0;
  const trendMagnitude = Math.abs(androgenStatus.trend).toFixed(1);

  return (
    <section
      data-testid="linear-pathway-flow"
      className="rounded-3xl border border-white/5 bg-gradient-to-b from-[#0b0f16] via-[#0c111b] to-[#080a10] p-6 shadow-[0_25px_80px_rgba(0,0,0,0.45)]"
    >
      <header className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-[0.4em] text-white/40">
            Serum Replacement Rail
          </p>
          <h2 className="text-2xl font-semibold text-white">Linear Pathway Flow</h2>
          <p className="mt-1 max-w-2xl text-sm text-white/60">
            Fixed mechanistic lanes showing how AR drive, hematology, metabolic flux
            and endocrine drag interlock. Animated connectors pulse with the current
            signal strength.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <span className="rounded-full border border-white/10 px-3 py-1 text-[11px] uppercase tracking-[0.3em] text-white/70">
            {saturationLabel}
          </span>
        </div>
      </header>

      <div className="mt-6 grid gap-4 md:grid-cols-3">
        <SummaryStat
          label="AR Occupancy"
          value={androgenStatus.occupancy.toFixed(0)}
          suffix="%"
          detail="Average receptor engagement across the stack"
          accent="text-sky-200"
        />
        <SummaryStat
          label="Axis Resilience"
          value={androgenStatus.naturalAxis.toFixed(0)}
          suffix="%"
          detail="Natural production remaining after suppression"
          accent="text-emerald-200"
        />
        <SummaryStat
          label="Delivered Load"
          value={Math.round(androgenStatus.totalLoad).toLocaleString()}
          suffix=" mgEq/day"
          detail={`Trend ${trendPositive ? "+" : "-"}${trendMagnitude} mgEq/day`}
          accent="text-amber-200"
        />
      </div>

      <div className="mt-8 flex flex-col gap-6">
        <div className="rounded-2xl border border-white/5 bg-black/20 p-4">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-stretch lg:gap-3">
            {nodes.map((node, index) => (
              <React.Fragment key={node.id}>
                <FlowNodeCard node={node} />
                {index < connectors.length ? (
                  <FlowConnector connector={connectors[index]} />
                ) : null}
              </React.Fragment>
            ))}
          </div>
        </div>
        <div className="grid gap-4 md:grid-cols-2">
          {nodes.map((node) => (
            <PathwayInsight node={node} key={`${node.id}-detail`} />
          ))}
        </div>
      </div>
    </section>
  );
};

export default LinearPathwayFlow;
