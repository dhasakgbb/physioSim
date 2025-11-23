import React, { useMemo, useState } from "react";
import { motion } from "framer-motion";

const TOKENS = {
  surface: {
    base: "#05060A",
    card: "#080C13",
    elevated: "#0F1622",
  },
  border: {
    subtle: "rgba(255,255,255,0.06)",
    strong: "rgba(255,255,255,0.12)",
  },
  text: {
    primary: "#F8FAFC",
    muted: "rgba(248,250,252,0.72)",
    faint: "rgba(248,250,252,0.48)",
  },
  accents: {
    primary: "#34D399",
    success: "#10B981",
    warning: "#FBBF24",
    danger: "#F87171",
    info: "#60A5FA",
    neutral: "#94A3B8",
  },
};

const PATHWAY_ORDER = [
  { id: "genomic", name: "GENOMIC" },
  { id: "nonGenomic", name: "NON-GENOMIC" },
  { id: "antiCatabolic", name: "ANTI-CATABOLIC" },
  { id: "estrogenic", name: "ESTROGENIC (E2)" },
  { id: "progestogenic", name: "PROGESTOGENIC" },
  { id: "androgenic", name: "ANDROGENIC (DHT)" },
  { id: "hepaticLoad", name: "HEPATIC LOAD" },
  { id: "renalPressure", name: "RENAL PRESSURE" },
  { id: "hematocrit", name: "HEMATOCRIT" },
  { id: "cnsDrive", name: "CNS DRIVE" },
  { id: "lipidSkew", name: "LIPID SKEW" },
  { id: "nutrientPartitioning", name: "NUTRIENT PART." },
];

const PATHWAY_META = PATHWAY_ORDER.reduce((acc, entry) => {
  acc[entry.id] = entry;
  return acc;
}, {});

const PATHWAY_GROUPS = [
  {
    title: "ANABOLIC DRIVE",
    subtitle: "Primary AR throughput",
    items: ["genomic", "nonGenomic", "antiCatabolic", "nutrientPartitioning"],
  },
  {
    title: "HORMONE FEEDBACK",
    subtitle: "Conversion + antagonism",
    items: ["estrogenic", "progestogenic", "androgenic", "cnsDrive"],
  },
  {
    title: "SYSTEM LOAD",
    subtitle: "Organ + vascular stress",
    items: ["hepaticLoad", "renalPressure", "hematocrit", "lipidSkew"],
  },
];

const clamp = (value, min = 0, max = 100) => Math.min(max, Math.max(min, value));

const hexToRgba = (hex, alpha = 1) => {
  const sanitized = hex.replace("#", "");
  const bigint = parseInt(sanitized, 16);
  const r = (bigint >> 16) & 255;
  const g = (bigint >> 8) & 255;
  const b = bigint & 255;
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
};

const STATUS_ACCENT_MAP = {
  Maximal: TOKENS.accents.success,
  Active: TOKENS.accents.primary,
  Spillover: TOKENS.accents.warning,
  Shielded: TOKENS.accents.success,
  Managed: TOKENS.accents.info,
  Elevated: TOKENS.accents.warning,
  Responsive: TOKENS.accents.info,
  Low: TOKENS.accents.neutral,
  Controlled: TOKENS.accents.info,
  Inactive: TOKENS.accents.neutral,
  Warning: TOKENS.accents.warning,
  Watch: TOKENS.accents.info,
  Stable: TOKENS.accents.neutral,
  Critical: TOKENS.accents.danger,
  High: TOKENS.accents.warning,
  Moderate: TOKENS.accents.info,
  Degrading: TOKENS.accents.danger,
  Efficient: TOKENS.accents.success,
};

const getStatusAccent = (status = "") => STATUS_ACCENT_MAP[status] || TOKENS.accents.info;

const CONTRIBUTOR_COLORS = [
  TOKENS.accents.primary,
  TOKENS.accents.info,
  TOKENS.accents.success,
  TOKENS.accents.warning,
  TOKENS.accents.danger,
  TOKENS.accents.neutral,
];

const OVERFLOW_CHANNELS = [
  { id: "aromatase", label: "AROMATASE", tone: TOKENS.accents.danger },
  { id: "fiveAR", label: "5α-REDUCTASE", tone: TOKENS.accents.warning },
  { id: "progestin", label: "PROGESTIN", tone: TOKENS.accents.neutral },
  { id: "gr", label: "GLUCOCORTICOID", tone: TOKENS.accents.info },
  { id: "residual", label: "RESIDUAL", tone: TOKENS.accents.primary },
];

const PATHWAY_IMPACT = [
  { id: "estrogenic", label: "E2 / Arom" },
  { id: "androgenic", label: "DHT / 5αR" },
  { id: "progestogenic", label: "PR / Progestin" },
  { id: "cnsDrive", label: "CNS Load" },
  { id: "lipidSkew", label: "Lipid Strain" },
];

const getImpactTone = (value = 0) => {
  if (value >= 66) return TOKENS.accents.danger;
  if (value >= 33) return TOKENS.accents.warning;
  return TOKENS.accents.success;
};

const ActiveSchematic = ({
  geneticCapacity,
  saturationMetrics,
  receptorState,
  serumLevels,
}) => {
  const [showDetails, setShowDetails] = useState(false);
  const receptorCapacity = receptorState?.capacity || geneticCapacity || 100;
  const totalBound = receptorState?.boundPct ?? saturationMetrics?.saturation ?? 0;
  const totalSpillover = receptorState?.spilloverPct ?? saturationMetrics?.spillover ?? 0;
  
  // Route spillover to pathways
  const cnsLoad = totalSpillover * 0.4;
  const retentionLoad = totalSpillover * 0.25;
  const hepaticLoad = totalSpillover * 0.35 * 1.5;
  const estrogenicLoad = totalSpillover * 0.15;
  const renalLoad = totalSpillover * 0.2;
  const hematocritLoad = totalSpillover * 0.18;
  const lipidLoad = totalSpillover * 0.3;
  const nutrientPartLoad = totalBound * 0.5;
  
  // Saturation State
  const genomicPct = Math.min(100, receptorCapacity > 0 ? (totalBound / receptorCapacity) * 100 : totalBound);
  const spilloverPct = Math.min(150, receptorCapacity > 0 ? (totalSpillover / receptorCapacity) * 100 : totalSpillover);

  // Adaptation Phase
  const adaptationPhase = receptorState?.adaptationPhase || saturationMetrics?.adaptationPhase || 1;
  const isHardCap = receptorState?.isHardCap || saturationMetrics?.isHardCap || false;
  
  const phaseInfo = useMemo(() => {
    if (isHardCap) return { name: "CEILING", color: TOKENS.accents.danger, desc: "Hard Cap" };
    if (adaptationPhase === 3) return { name: "STRAIN", color: TOKENS.accents.warning, desc: "Diminishing Returns" };
    if (adaptationPhase === 2) return { name: "SURGE", color: TOKENS.accents.primary, desc: "Peak Adaptation" };
    return { name: "BASELINE", color: TOKENS.accents.neutral, desc: "Standard Response" };
  }, [adaptationPhase, isHardCap]);

  const contributors = receptorState?.contributors ?? [];
  const liveContributors = receptorState?.currentContributors?.length
    ? receptorState.currentContributors
    : contributors;

  const boundSegments = useMemo(() => {
    if (!liveContributors.length || receptorCapacity <= 0) return [];
    return liveContributors
      .filter((contributor) => contributor.occupancyPct > 0.2)
      .map((contributor, idx) => {
        const widthPct = clamp((contributor.occupancyPct / receptorCapacity) * 100, 0, 100);
        return {
          id: contributor.compoundId,
          label: contributor.name,
          occupancy: contributor.occupancyPct,
          spillover: contributor.spilloverPct,
          widthPct,
          color: contributor.color || CONTRIBUTOR_COLORS[idx % CONTRIBUTOR_COLORS.length],
        };
      });
  }, [contributors, receptorCapacity]);

  const dominantLigands = boundSegments.slice(0, 4);

  const overflowRouting = useMemo(() => {
    const totals = {
      aromatase: 0,
      fiveAR: 0,
      progestin: 0,
      gr: 0,
      residual: 0,
    };

    liveContributors.forEach((contributor) => {
      const overflow = contributor.overflow || {};
      totals.aromatase += overflow.aromatase || 0;
      totals.fiveAR += overflow.fiveAR || 0;
      totals.progestin += overflow.progestin || 0;
      totals.gr += overflow.gr || 0;
      totals.residual += overflow.residual || 0;
    });

    const base = totalSpillover > 0
      ? totalSpillover
      : Object.values(totals).reduce((sum, value) => sum + value, 0);

    const percents = Object.entries(totals).reduce((acc, [key, value]) => {
      acc[key] = base > 0 ? clamp((value / base) * 100, 0, 150) : 0;
      return acc;
    }, {});

    return { totals, percents };
  }, [liveContributors, totalSpillover]);

  const overflowCards = OVERFLOW_CHANNELS.map((channel) => ({
    ...channel,
    value: overflowRouting.totals[channel.id] || 0,
    pct: overflowRouting.percents[channel.id] || 0,
  }));

  const routingSegments = useMemo(() => {
    const base = Math.max(totalBound + totalSpillover, 0.0001);
    const spillSegments = overflowCards.map((channel) => {
      const derivedValue = totalSpillover > 0
        ? (channel.pct / 100) * totalSpillover
        : channel.value;
      return {
        id: channel.id,
        label: channel.label,
        value: Math.max(derivedValue, 0),
        tone: channel.tone,
      };
    });

    const segments = [
      {
        id: "ar",
        label: "AR",
        value: Math.max(totalBound, 0),
        tone: TOKENS.accents.primary,
      },
      ...spillSegments,
    ].filter((segment) => segment.value > 0.1);

    const total = segments.reduce((sum, segment) => sum + segment.value, 0) || base;
    return segments.map((segment) => ({
      ...segment,
      widthPct: clamp((segment.value / total) * 100, 0, 100),
    }));
  }, [overflowCards, totalBound, totalSpillover]);

  const fallbackPathwayMetrics = useMemo(() => {
    const metrics = {};
    PATHWAY_ORDER.forEach((item) => {
      switch (item.id) {
        case "genomic":
          metrics[item.id] = {
            value: Math.min(150, genomicPct),
            status: genomicPct > 80 ? "Maximal" : genomicPct > 50 ? "Active" : "Low",
          };
          break;
        case "nonGenomic":
          metrics[item.id] = {
            value: Math.min(150, spilloverPct),
            status: spilloverPct > 80 ? "Spillover" : spilloverPct > 30 ? "Active" : "Low",
          };
          break;
        case "antiCatabolic":
          metrics[item.id] = {
            value: Math.min(150, (retentionLoad / 50) * 100),
            status: retentionLoad > 30 ? "Active" : "Low",
          };
          break;
        case "estrogenic":
          metrics[item.id] = {
            value: Math.min(150, (estrogenicLoad / 30) * 100),
            status: estrogenicLoad > 15 ? "Elevated" : "Controlled",
          };
          break;
        case "progestogenic":
          metrics[item.id] = { value: 10, status: "Inactive" };
          break;
        case "androgenic":
          metrics[item.id] = { value: 65, status: "Elevated" };
          break;
        case "hepaticLoad":
          metrics[item.id] = {
            value: Math.min(150, (hepaticLoad / 50) * 100),
            status: hepaticLoad > 30 ? "Warning" : "Stable",
          };
          break;
        case "renalPressure":
          metrics[item.id] = {
            value: Math.min(150, (renalLoad / 40) * 100),
            status: renalLoad > 20 ? "Watch" : "Stable",
          };
          break;
        case "hematocrit":
          metrics[item.id] = {
            value: Math.min(150, (hematocritLoad / 40) * 100),
            status: hematocritLoad > 20 ? "Watch" : "Normal",
          };
          break;
        case "cnsDrive":
          metrics[item.id] = {
            value: Math.min(150, (cnsLoad / 50) * 100),
            status: cnsLoad > 30 ? "High" : "Moderate",
          };
          break;
        case "lipidSkew":
          metrics[item.id] = {
            value: Math.min(150, (lipidLoad / 50) * 100),
            status: lipidLoad > 30 ? "Degrading" : "Stable",
          };
          break;
        case "nutrientPartitioning":
        default:
          metrics[item.id] = {
            value: Math.min(150, (nutrientPartLoad / 100) * 100),
            status: nutrientPartLoad > 50 ? "Efficient" : "Low",
          };
      }
    });
    return metrics;
  }, [genomicPct, spilloverPct, retentionLoad, estrogenicLoad, hepaticLoad, renalLoad, hematocritLoad, cnsLoad, lipidLoad, nutrientPartLoad]);

  const groupedPathways = useMemo(() => {
    const source = serumLevels?.pathways;
    return PATHWAY_GROUPS.map((group) => ({
      title: group.title,
      subtitle: group.subtitle,
      cards: group.items.map((id) => {
        const meta = PATHWAY_META[id] || { name: id.toUpperCase() };
        const metric = source?.[id] || fallbackPathwayMetrics[id] || { value: 0, status: "Low" };
        const accent = getStatusAccent(metric.status);
        return {
          id,
          name: meta.name,
          value: metric.value,
          status: metric.status,
          accent,
        };
      }),
    }));
  }, [serumLevels, fallbackPathwayMetrics]);

  const primaryLigand = dominantLigands[0];
  const boundVsFree = {
    bound: clamp(totalBound, 0, 150),
    free: clamp(100 - totalBound, 0, 100),
  };

  const pathwayImpact = PATHWAY_IMPACT.map((entry) => {
    const metric = serumLevels?.pathways?.[entry.id] || fallbackPathwayMetrics[entry.id] || { value: 0 };
    const normalized = clamp(metric.value, 0, 150);
    const value = Math.round((normalized / 150) * 100);
    return {
      id: entry.id,
      label: entry.label,
      value,
      tone: getImpactTone(value),
    };
  });

  return (
    <div
      className="w-full h-full overflow-y-auto"
      style={{ backgroundColor: TOKENS.surface.base }}
    >
      <div className="max-w-[1480px] mx-auto px-6 py-6 font-['Space_Grotesk',sans-serif]">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          <div className="lg:col-span-5 flex flex-col gap-4">
            <section
              className="rounded-[24px] border p-6 flex flex-col gap-5"
              style={{
                backgroundColor: TOKENS.surface.elevated,
                borderColor: TOKENS.border.strong,
              }}
            >
              <header className="flex items-center justify-between">
                <div>
                  <p className="text-[11px] uppercase tracking-[0.35em]" style={{ color: TOKENS.text.faint }}>
                    AR Saturation
                  </p>
                  <p className="text-[12px]" style={{ color: TOKENS.text.muted }}>
                    Ceiling {Math.round(receptorCapacity)}%
                  </p>
                </div>
                <div className="flex items-center gap-3">
                  <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: phaseInfo.color }} />
                  <p className="text-[11px] uppercase tracking-[0.3em]" style={{ color: TOKENS.text.muted }}>
                    {phaseInfo.name}
                  </p>
                </div>
              </header>

              <div className="flex items-baseline justify-between">
                <p className="text-[56px] leading-none font-semibold" style={{ color: TOKENS.text.primary }}>
                  {Math.round(totalBound)}%
                </p>
                <div className="text-right">
                  <p className="text-[11px] uppercase tracking-[0.25em]" style={{ color: TOKENS.text.faint }}>
                    Spillover
                  </p>
                  <p className="text-[20px] font-semibold" style={{ color: TOKENS.text.primary }}>
                    {Math.round(totalSpillover)}%
                  </p>
                </div>
              </div>

              <div className="space-y-2">
                <HeroDetailRow
                  label="Ligand"
                  value={primaryLigand ? `${primaryLigand.label} (${Math.round(primaryLigand.occupancy)}%)` : "No dominant ligand"}
                />
                <HeroDetailRow
                  label="Bound vs Free"
                  value={`${Math.round(boundVsFree.bound)}% bound · ${Math.round(boundVsFree.free)}% free`}
                />
                <HeroDetailRow
                  label="Spillover"
                  value={`${Math.round(totalSpillover)}% routed to other pathways`}
                />
              </div>
            </section>

            <section
              className="rounded-[24px] border p-6 flex flex-col gap-4"
              style={{
                backgroundColor: TOKENS.surface.card,
                borderColor: TOKENS.border.subtle,
              }}
            >
              <div className="flex items-center justify-between">
                <p className="text-[11px] uppercase tracking-[0.3em]" style={{ color: TOKENS.text.muted }}>
                  Routing
                </p>
                <p className="text-[11px]" style={{ color: TOKENS.text.faint }}>
                  Total flow {Math.round(totalBound + totalSpillover)}%
                </p>
              </div>
              <RoutingBar segments={routingSegments} />
              <div className="grid grid-cols-2 gap-2 text-[11px]" style={{ color: TOKENS.text.faint }}>
                {routingSegments.map((segment) => (
                  <div key={segment.id} className="flex items-center gap-2">
                    <span className="w-2 h-2 rounded-sm" style={{ backgroundColor: segment.tone }} />
                    <p className="truncate">
                      {segment.label} · {Math.round(segment.widthPct)}%
                    </p>
                  </div>
                ))}
              </div>
            </section>
          </div>

          <div className="lg:col-span-7 flex flex-col gap-4">
            <section
              className="rounded-[24px] border p-6 flex flex-col gap-5"
              style={{
                backgroundColor: TOKENS.surface.elevated,
                borderColor: TOKENS.border.strong,
              }}
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-[11px] uppercase tracking-[0.35em]" style={{ color: TOKENS.text.muted }}>
                    Pathway Impact
                  </p>
                  <p className="text-[12px]" style={{ color: TOKENS.text.faint }}>
                    Relative load vs baseline
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setShowDetails((prev) => !prev)}
                  className="text-[11px] uppercase tracking-[0.3em]"
                  style={{ color: TOKENS.text.primary }}
                >
                  Details {showDetails ? "▴" : "▾"}
                </button>
              </div>
              <div className="space-y-3">
                {pathwayImpact.map((pathway) => (
                  <ImpactRow key={pathway.id} pathway={pathway} />
                ))}
              </div>
            </section>

            {showDetails && (
              <div className="flex flex-col gap-4">
                {groupedPathways.map((group, groupIdx) => (
                  <section
                    key={group.title}
                    className="rounded-[24px] border p-5 flex flex-col gap-4"
                    style={{
                      backgroundColor: TOKENS.surface.card,
                      borderColor: TOKENS.border.subtle,
                    }}
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-[11px] uppercase tracking-[0.3em]" style={{ color: TOKENS.text.muted }}>
                          {group.title}
                        </p>
                        <p className="text-[11px]" style={{ color: TOKENS.text.faint }}>
                          {group.subtitle}
                        </p>
                      </div>
                      <StatusChip label={groupIdx === 0 ? "Primary" : "Secondary"} tone={groupIdx === 0 ? TOKENS.accents.primary : TOKENS.accents.neutral} />
                    </div>
                    <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
                      {group.cards.map((card, cardIdx) => (
                        <PathwayCard
                          key={card.id}
                          {...card}
                          delay={(groupIdx * 0.08) + cardIdx * 0.03}
                        />
                      ))}
                    </div>
                  </section>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

const HeroDetailRow = ({ label, value }) => (
  <div className="flex items-center justify-between text-[12px]" style={{ color: TOKENS.text.muted }}>
    <p className="uppercase tracking-[0.25em] text-[10px]" style={{ color: TOKENS.text.faint }}>
      {label}
    </p>
    <p className="text-[13px]" style={{ color: TOKENS.text.primary }}>
      {value}
    </p>
  </div>
);

const RoutingBar = ({ segments }) => (
  <div
    className="h-6 rounded-full overflow-hidden flex"
    style={{ border: `1px solid ${TOKENS.border.subtle}`, backgroundColor: TOKENS.surface.base }}
  >
    {segments.length ? (
      segments.map((segment) => (
        <motion.div
          key={segment.id}
          className="h-full"
          style={{ backgroundColor: segment.tone }}
          initial={{ width: 0 }}
          animate={{ width: `${segment.widthPct}%` }}
          transition={{ duration: 0.8, ease: "easeOut" }}
        />
      ))
    ) : (
      <div className="flex-1 flex items-center justify-center text-[11px] uppercase tracking-[0.3em]" style={{ color: TOKENS.text.faint }}>
        Idle
      </div>
    )}
  </div>
);

const ImpactRow = ({ pathway }) => (
  <div className="flex items-center gap-4">
    <div className="w-28 text-[12px] font-medium" style={{ color: TOKENS.text.primary }}>
      {pathway.label}
    </div>
    <div className="flex-1 h-2 rounded-full overflow-hidden" style={{ backgroundColor: "rgba(148,163,184,0.2)" }}>
      <motion.div
        className="h-full"
        style={{ backgroundColor: pathway.tone }}
        initial={{ width: 0 }}
        animate={{ width: `${pathway.value}%` }}
        transition={{ duration: 0.7, ease: "easeOut" }}
      />
    </div>
    <p className="w-12 text-right text-[12px] font-semibold" style={{ color: TOKENS.text.primary }}>
      +{pathway.value}%
    </p>
  </div>
);

const StatusChip = ({ label, tone }) => (
  <span
    className="inline-flex items-center justify-center rounded-full px-3 py-1 text-[10px] uppercase tracking-[0.3em]"
    style={{
      color: tone,
      backgroundColor: hexToRgba(tone, 0.15),
      border: `1px solid ${hexToRgba(tone, 0.35)}`,
    }}
  >
    {label}
  </span>
);

const PathwayCard = ({ name, value, status, accent, delay }) => (
  <motion.div
    className="rounded-2xl border p-3 flex flex-col gap-2"
    style={{ borderColor: TOKENS.border.subtle, backgroundColor: TOKENS.surface.base }}
    initial={{ opacity: 0, y: 8 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ duration: 0.4, delay }}
  >
    <div className="flex items-center justify-between text-[10px] uppercase tracking-[0.25em]" style={{ color: TOKENS.text.muted }}>
      <span className="truncate">{name}</span>
      <span style={{ color: TOKENS.text.primary }}>{Math.round(value)}%</span>
    </div>
    <div className="h-1.5 rounded-full overflow-hidden" style={{ backgroundColor: "rgba(255,255,255,0.08)" }}>
      <motion.div
        className="h-full rounded-full"
        style={{ backgroundColor: accent }}
        initial={{ width: 0 }}
        animate={{ width: `${Math.min(100, (value / 150) * 100)}%` }}
        transition={{ duration: 0.8, delay, ease: "easeOut" }}
      />
    </div>
    <StatusChip label={status} tone={accent} />
  </motion.div>
);

export default ActiveSchematic;
