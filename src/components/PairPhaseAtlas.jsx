import React, { useMemo } from "react";
import { compoundData } from "../data/compoundData";

const clamp = (value, min = 0, max = 1) => Math.min(Math.max(value, min), max);

const hexToRgb = (hex = "#ffffff") => {
  const normalized = hex.replace("#", "");
  const value =
    parseInt(normalized.length === 3 ? normalized.repeat(2) : normalized, 16) ||
    0xffffff;
  return {
    r: (value >> 16) & 255,
    g: (value >> 8) & 255,
    b: value & 255,
  };
};

const colorize = (hex, raw, maxValue) => {
  const { r, g, b } = hexToRgb(hex);
  const normalized = maxValue ? clamp(raw / maxValue, 0, 1) : 0;
  const alpha = 0.18 + normalized * 0.62;
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
};

const DEFAULT_BENEFIT_COLOR = "#fbbf24";
const DEFAULT_RISK_COLOR = "#f97316";

const buildDefaultPhases = (labelA, labelB) => [
  {
    id: "P0",
    a: 0,
    b: 0,
    title: "Baseline",
    summary: `No ${labelA}/${labelB} load. Just your TRT, ancillaries, and lifestyle inputs.`,
  },
  {
    id: "P1",
    a: 0.4,
    b: 0,
    title: `${labelA} moderate`,
    summary: `${labelA} carries the block. This is usually where you already feel most of the benefit.`,
  },
  {
    id: "P2",
    a: 0.8,
    b: 0,
    title: `${labelA} high`,
    summary: `Large jump in ${labelA} dose for marginal benefit. Watch the risk ramp.`,
  },
  {
    id: "P3",
    a: 0.5,
    b: 0.35,
    title: "Balanced ridge",
    summary: `Layer moderate ${labelB} onto mid-${labelA}. Fuller look + better pumps, usually best ROI.`,
  },
  {
    id: "P4",
    a: 0.85,
    b: 0.8,
    title: "Both high",
    summary: `Top of the benefit surface but hugging the risk cliff. Treat as a short, instrumented experiment.`,
  },
];

const resolvePhaseList = ({ pair, labelA, labelB }) => {
  const base = buildDefaultPhases(labelA, labelB);
  const overrides = pair?.phaseAtlas?.phases;
  if (!overrides?.length) {
    return base;
  }
  return overrides.map((phase, idx) => {
    const template = base[idx] || {};
    return {
      id: phase.id || template.id || `P${idx}`,
      a: typeof phase.a === "number" ? phase.a : template.a,
      b: typeof phase.b === "number" ? phase.b : template.b,
      doses: phase.doses,
      title: phase.title || template.title || `Phase ${idx + 1}`,
      summary: phase.summary || template.summary || "",
    };
  });
};

const normalizeValue = (value, [min, max]) => {
  const span = Math.max(max - min, 1);
  return clamp((value - min) / span, 0, 1);
};

const formatDoseRangeLabel = (key, range) => {
  if (!range) return "0–? mg";
  const [min, max] = range;
  return `${Math.round(min)}–${Math.round(max)} mg`;
};

const resolvePhaseCoords = (phase, rangeA, rangeB) => {
  if (phase.doses) {
    const normA =
      phase.doses.a != null ? normalizeValue(phase.doses.a, rangeA) : undefined;
    const normB =
      phase.doses.b != null ? normalizeValue(phase.doses.b, rangeB) : undefined;
    if (typeof normA === "number" || typeof normB === "number") {
      return {
        x: typeof normA === "number" ? normA : clamp(phase.a ?? 0, 0, 1),
        y: typeof normB === "number" ? normB : clamp(phase.b ?? 0, 0, 1),
      };
    }
  }
  return {
    x: clamp(phase.a ?? 0, 0, 1),
    y: clamp(phase.b ?? 0, 0, 1),
  };
};

const PairPhaseAtlas = ({ pair, surfaceData = [], doseRanges = {} }) => {
  if (!pair) return null;
  const [compoundA, compoundB] = pair.compounds || [];
  if (!compoundA || !compoundB) return null;

  const labelA = compoundData[compoundA]?.abbreviation || compoundA;
  const labelB = compoundData[compoundB]?.abbreviation || compoundB;

  const rangeA = doseRanges[compoundA] ||
    pair.doseRanges?.[compoundA] || [0, 1000];
  const rangeB = doseRanges[compoundB] ||
    pair.doseRanges?.[compoundB] || [0, 1000];

  const phases = useMemo(() => {
    const phaseList = resolvePhaseList({ pair, labelA, labelB });
    return phaseList.map((phase) => {
      const coords = resolvePhaseCoords(phase, rangeA, rangeB);
      const doseA = Math.round(rangeA[0] + coords.x * (rangeA[1] - rangeA[0]));
      const doseB = Math.round(rangeB[0] + coords.y * (rangeB[1] - rangeB[0]));
      return {
        ...phase,
        ...coords,
        doseALabel: `${doseA} mg ${compoundData[compoundA]?.type === "oral" ? "/day" : "/week"}`,
        doseBLabel: `${doseB} mg ${compoundData[compoundB]?.type === "oral" ? "/day" : "/week"}`,
      };
    });
  }, [pair, rangeA, rangeB, labelA, labelB, compoundA, compoundB]);

  const { benefitPoints, riskPoints, maxBenefit, maxRisk } = useMemo(() => {
    const benefit = [];
    const risk = [];
    surfaceData.forEach((point) => {
      const x = normalizeValue(point[compoundA] ?? 0, rangeA);
      const y = normalizeValue(point[compoundB] ?? 0, rangeB);
      benefit.push({ x, y, value: point.benefit ?? 0 });
      risk.push({ x, y, value: point.risk ?? 0 });
    });
    return {
      benefitPoints: benefit,
      riskPoints: risk,
      maxBenefit: benefit.length ? Math.max(...benefit.map((p) => p.value)) : 1,
      maxRisk: risk.length ? Math.max(...risk.map((p) => p.value)) : 1,
    };
  }, [surfaceData, compoundA, compoundB, rangeA, rangeB]);

  const atlasMeta = pair.phaseAtlas || {};
  const title = atlasMeta.title || `${labelA} + ${labelB} Phase Map`;
  const subtitle =
    atlasMeta.subtitle ||
    "Use the normalized ridge to map your real-world experiments.";
  const description =
    atlasMeta.description ||
    `${labelA} vs ${labelB} shown in 0–1 dose space. Map each training block to a phase and log labs accordingly.`;

  return (
    <section className="bg-physio-bg-secondary border border-physio-bg-border rounded-3xl p-5 space-y-4">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
        <div>
          <p className="text-xs uppercase tracking-wide text-physio-text-tertiary">
            {subtitle}
          </p>
          <h3 className="text-xl font-bold text-physio-text-primary">
            {title}
          </h3>
          <p className="text-sm text-physio-text-secondary">{description}</p>
        </div>
        <div className="text-xs text-physio-text-tertiary bg-physio-bg-core border border-physio-bg-border rounded-full px-3 py-1 text-center">
          {labelA}: {formatDoseRangeLabel(compoundA, rangeA)} · {labelB}:{" "}
          {formatDoseRangeLabel(compoundB, rangeB)}
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <PhaseSurface
          title="Benefit surface"
          caption={
            atlasMeta.benefitCaption ||
            "Golden mist = total benefit. Slide along P1 → P3 for the biggest ROI."
          }
          points={benefitPoints}
          maxValue={maxBenefit}
          color={atlasMeta.benefitColor || DEFAULT_BENEFIT_COLOR}
          phases={phases}
          labelA={labelA}
          labelB={labelB}
        />
        <PhaseSurface
          title="Risk surface"
          caption={
            atlasMeta.riskCaption ||
            "Orange flare = cumulative risk. The P4 corner is the cliff—treat it as expensive time."
          }
          points={riskPoints}
          maxValue={maxRisk}
          color={atlasMeta.riskColor || DEFAULT_RISK_COLOR}
          phases={phases}
          labelA={labelA}
          labelB={labelB}
        />
      </div>

      <div className="grid gap-3 md:grid-cols-2">
        {phases.map((phase) => (
          <div
            key={phase.id}
            className="p-4 rounded-2xl border border-physio-bg-border bg-physio-bg-core"
          >
            <div className="flex items-center gap-2">
              <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-physio-error/10 text-physio-error border border-physio-error/30">
                {phase.id}
              </span>
              <h4 className="text-sm font-semibold text-physio-text-primary">
                {phase.title}
              </h4>
            </div>
            <p className="text-xs text-physio-text-secondary mt-2">
              {phase.summary}
            </p>
            <p className="text-xs text-physio-text-tertiary mt-1">
              {labelA}: {phase.doseALabel} · {labelB}: {phase.doseBLabel}
            </p>
          </div>
        ))}
      </div>
      <p className="text-[11px] text-physio-text-tertiary text-center">
        Conceptual only. Normalize your logs into these phases, monitor labs,
        and treat high-phase time as structurally expensive.
      </p>
    </section>
  );
};

const PhaseSurface = ({
  title,
  caption,
  points,
  maxValue,
  color,
  phases,
  labelA,
  labelB,
}) => (
  <div className="bg-physio-bg-core border border-physio-bg-border rounded-2xl p-4 flex flex-col gap-3">
    <div>
      <h4 className="text-sm font-semibold text-physio-text-primary">
        {title}
      </h4>
      <p className="text-xs text-physio-text-tertiary">{caption}</p>
    </div>
    <div className="relative w-full aspect-square bg-gradient-to-br from-physio-bg-secondary to-physio-bg-tertiary rounded-2xl border border-physio-bg-border overflow-hidden">
      {points.map((point, idx) => (
        <span
          key={`point-${title}-${idx}`}
          className="absolute block rounded-full"
          style={{
            width: "10px",
            height: "10px",
            left: `${point.x * 100}%`,
            bottom: `${point.y * 100}%`,
            transform: "translate(-50%, 50%)",
            backgroundColor: colorize(color, point.value, maxValue),
          }}
        />
      ))}
      {phases.map((phase) => (
        <span
          key={phase.id}
          className="absolute flex flex-col items-center text-[10px] font-semibold text-white drop-shadow"
          style={{
            left: `${phase.x * 100}%`,
            bottom: `${phase.y * 100}%`,
            transform: "translate(-50%, 50%)",
          }}
        >
          <span className="w-5 h-5 rounded-full bg-physio-error flex items-center justify-center text-[9px] font-bold">
            {phase.id}
          </span>
        </span>
      ))}
      <span className="absolute inset-x-0 bottom-1 text-[10px] text-center text-physio-text-tertiary">
        {labelA} dose (normalized)
      </span>
      <span className="absolute -left-2 top-1/2 -rotate-90 text-[10px] text-physio-text-tertiary">
        {labelB} dose (normalized)
      </span>
    </div>
  </div>
);

export default PairPhaseAtlas;
