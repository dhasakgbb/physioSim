import { DRUG_DRUG_INTERACTIONS } from "./drugDrugInteractions";
import type { IDrugDrugInteraction } from "../types/physio";

export type InteractionRating =
  | "excellent"
  | "good"
  | "compatible"
  | "caution"
  | "dangerous"
  | "forbidden";

export interface InteractionEvidence {
  severity?: IDrugDrugInteraction["metadata"]["severity"];
  source?: string;
  citation?: string;
}

export interface InteractionRecord {
  id: string;
  compounds: [string, string];
  rating: InteractionRating;
  description: string;
  synergy: {
    benefit: number;
    risk: number;
  };
  evidence?: InteractionEvidence;
  tags?: string[];
}

export interface InteractionScore {
  rating: InteractionRating;
  color: string;
  symbol: string;
  label: string;
  benefit: number;
  risk: number;
}

export interface StackSynergy {
  benefitSynergy: number;
  riskSynergy: number;
}

export const heatmapScores: Record<InteractionRating, { color: string; label: string; symbol: string }> = {
  excellent: { color: "#22c55e", label: "Excellent", symbol: "++" },
  good: { color: "#84cc16", label: "Good", symbol: "+" },
  compatible: { color: "#94a3b8", label: "Compatible", symbol: "~" },
  caution: { color: "#fbbf24", label: "Caution", symbol: "!" },
  dangerous: { color: "#f97316", label: "Dangerous", symbol: "!!" },
  forbidden: { color: "#dc2626", label: "Forbidden", symbol: "✕" },
};

type InteractionSeed = {
  id: string;
  compounds: [string, string];
  rating: InteractionRating;
  summary: string;
  benefit?: number;
  risk?: number;
  tags?: string[];
  evidence?: InteractionEvidence;
};

const clamp = (value: number, min: number, max: number): number => {
  if (Number.isNaN(value)) return min;
  return Math.min(max, Math.max(min, value));
};

const normalizeCompoundId = (value: string | null | undefined): string | null => {
  if (!value || typeof value !== "string") return null;
  const trimmed = value.trim().toLowerCase();
  return trimmed.length ? trimmed : null;
};

const toPairKey = (compoundA: string, compoundB: string): string => {
  return [compoundA, compoundB].sort().join("__");
};

const ratingPriority: Record<InteractionRating, number> = {
  forbidden: 6,
  dangerous: 5,
  caution: 4,
  compatible: 3,
  good: 2,
  excellent: 1,
};

const interactionMap = new Map<string, InteractionRecord>();

const registerInteraction = (seed: InteractionSeed): void => {
  const compoundA = normalizeCompoundId(seed.compounds[0]);
  const compoundB = normalizeCompoundId(seed.compounds[1]);
  if (!compoundA || !compoundB || compoundA === compoundB) {
    return;
  }

  const base: InteractionRecord = {
    id: seed.id,
    compounds: [compoundA, compoundB],
    rating: seed.rating,
    description: seed.summary,
    evidence: seed.evidence,
    tags: seed.tags,
    synergy: {
      benefit: clamp(seed.benefit ?? 0, -1, 1),
      risk: clamp(seed.risk ?? 0, 0, 1),
    },
  };

  const key = toPairKey(compoundA, compoundB);
  const existing = interactionMap.get(key);

  if (!existing) {
    interactionMap.set(key, base);
    return;
  }

  const merged: InteractionRecord = {
    ...existing,
    rating:
      ratingPriority[seed.rating] > ratingPriority[existing.rating]
        ? seed.rating
        : existing.rating,
    description: existing.description || base.description,
    evidence: existing.evidence ?? base.evidence,
    tags: Array.from(new Set([...(existing.tags ?? []), ...(base.tags ?? [])])),
    synergy: {
      benefit: clamp(existing.synergy.benefit + base.synergy.benefit, -1, 1),
      risk: clamp(existing.synergy.risk + base.synergy.risk, 0, 1),
    },
  };

  interactionMap.set(key, merged);
};

const baseInteractionSeeds: InteractionSeed[] = [
  {
    id: "testosterone_npp_synergy",
    compounds: ["testosterone", "npp"],
    rating: "good",
    summary: "Classic mass stack—testosterone drives genomic growth while NPP adds joint relief and fullness.",
    benefit: 0.32,
    risk: 0.18,
    tags: ["mass", "joint"],
  },
  {
    id: "testosterone_trenbolone_vector",
    compounds: ["testosterone", "trenbolone"],
    rating: "caution",
    summary: "Aggressive recomposition stack with high androgen load and notable systemic stress.",
    benefit: 0.26,
    risk: 0.45,
    tags: ["recomp"],
  },
  {
    id: "testosterone_eq_endurance",
    compounds: ["testosterone", "eq"],
    rating: "excellent",
    summary: "Endurance-friendly pairing balancing RBC production with stable anabolic signal.",
    benefit: 0.34,
    risk: 0.12,
    tags: ["endurance"],
  },
  {
    id: "testosterone_masteron_dry",
    compounds: ["testosterone", "masteron"],
    rating: "good",
    summary: "Dry cosmetic stack where Masteron hardens the presentation of a moderate Test base.",
    benefit: 0.28,
    risk: 0.1,
    tags: ["cosmetic"],
  },
  {
    id: "testosterone_primobolan_quality",
    compounds: ["testosterone", "primobolan"],
    rating: "good",
    summary: "High-quality lean mass pairing emphasizing controllable toxicity and steady accrual.",
    benefit: 0.24,
    risk: 0.08,
    tags: ["lean_mass"],
  },
  {
    id: "testosterone_dhb_strength",
    compounds: ["testosterone", "dhb"],
    rating: "caution",
    summary: "High-octane strength protocol; DHB amplifies aggression but spikes hematocrit and BP.",
    benefit: 0.21,
    risk: 0.38,
    tags: ["strength"],
  },
  {
    id: "testosterone_ment_extreme",
    compounds: ["testosterone", "ment"],
    rating: "dangerous",
    summary: "Extreme bulking stack; Ment layers profound suppression over a heavy androgen base.",
    benefit: 0.3,
    risk: 0.6,
    tags: ["extreme"],
  },
  {
    id: "testosterone_eq_masteron_trim",
    compounds: ["eq", "masteron"],
    rating: "good",
    summary: "Balanced cosmetic stack blending EQ endurance with Masteron dryness.",
    benefit: 0.22,
    risk: 0.09,
    tags: ["cosmetic"],
  },
  {
    id: "testosterone_primobolan_masteron_quality",
    compounds: ["masteron", "primobolan"],
    rating: "compatible",
    summary: "Two dry DHT derivatives—excellent for polish with minimal systemic drag.",
    benefit: 0.18,
    risk: 0.05,
    tags: ["dryness"],
  },
  {
    id: "trenbolone_npp_progestin",
    compounds: ["trenbolone", "npp"],
    rating: "dangerous",
    summary: "Dual progestins sharply elevate prolactin risk and neuro load.",
    benefit: 0.12,
    risk: 0.55,
    tags: ["progestin"],
  },
  {
    id: "trenbolone_masteron_stage",
    compounds: ["trenbolone", "masteron"],
    rating: "caution",
    summary: "Stage-prep stack with immense hardness but notable CNS strain.",
    benefit: 0.2,
    risk: 0.4,
    tags: ["stage"],
  },
];

const severityToRating = (
  severity: IDrugDrugInteraction["metadata"]["severity"],
  risk: number,
): InteractionRating => {
  switch (severity) {
    case "Critical":
      return risk >= 0.5 ? "forbidden" : "dangerous";
    case "Warning":
      return "caution";
    default:
      return "compatible";
  }
};

const ddiSeeds: InteractionSeed[] = DRUG_DRUG_INTERACTIONS.map((interaction) => {
  const toxicityMultiplier = interaction.effects.toxicity?.multiplier ?? 1.2;
  const risk = clamp(toxicityMultiplier - 1, 0.1, 1);
  const benefit = interaction.effects.pd ? clamp(interaction.effects.pd.multiplier - 1, -1, 1) : 0;

  return {
    id: interaction.id,
    compounds: interaction.compounds,
    rating: severityToRating(interaction.metadata.severity, risk),
    summary: interaction.metadata.mechanism,
    benefit,
    risk,
    tags: ["ddi"],
    evidence: {
      severity: interaction.metadata.severity,
      source: interaction.metadata.provenance.source,
      citation: interaction.metadata.provenance.citation,
    },
  };
});

[...baseInteractionSeeds, ...ddiSeeds].forEach(registerInteraction);

export const interactionMatrix = Object.fromEntries(
  interactionMap.entries(),
) as Record<string, InteractionRecord>;

export const getInteraction = (
  compoundA?: string | null,
  compoundB?: string | null,
): InteractionRecord | null => {
  const normalizedA = normalizeCompoundId(compoundA);
  const normalizedB = normalizeCompoundId(compoundB);

  if (!normalizedA || !normalizedB || normalizedA === normalizedB) {
    return null;
  }

  const key = toPairKey(normalizedA, normalizedB);
  return interactionMap.get(key) ?? null;
};

export const getInteractionScore = (
  compoundA?: string | null,
  compoundB?: string | null,
): InteractionScore => {
  const interaction = getInteraction(compoundA, compoundB);
  const rating = interaction?.rating ?? "compatible";
  const palette = heatmapScores[rating];

  return {
    rating,
    color: palette.color,
    symbol: palette.symbol,
    label: palette.label,
    benefit: interaction?.synergy.benefit ?? 0,
    risk: interaction?.synergy.risk ?? 0,
  };
};

export const calculateStackSynergy = (stack: Array<string | null | undefined>): StackSynergy => {
  if (!Array.isArray(stack) || stack.length < 2) {
    return { benefitSynergy: 0, riskSynergy: 0 };
  }

  const ids = stack
    .map((compound) => normalizeCompoundId(compound))
    .filter((compound): compound is string => Boolean(compound));

  let benefit = 0;
  let risk = 0;

  for (let i = 0; i < ids.length; i += 1) {
    for (let j = i + 1; j < ids.length; j += 1) {
      const interaction = getInteraction(ids[i], ids[j]);
      if (interaction) {
        benefit += interaction.synergy.benefit;
        risk += interaction.synergy.risk;
      }
    }
  }

  return {
    benefitSynergy: Number(benefit.toFixed(2)),
    riskSynergy: Number(risk.toFixed(2)),
  };
};

export const getCompoundInteractions = (compound?: string | null): Record<string, InteractionRecord> => {
  const normalized = normalizeCompoundId(compound);
  if (!normalized) return {};

  const entries: [string, InteractionRecord][] = [];

  interactionMap.forEach((record) => {
    if (record.compounds.includes(normalized)) {
      const other = record.compounds.find((id) => id !== normalized) ?? normalized;
      entries.push([other, record]);
    }
  });

  return Object.fromEntries(entries);
};
