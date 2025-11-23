import { COMPOUNDS } from "./compounds";
import type { ICompoundSchema } from "../types/physio";

export type DosePoint = {
  dose: number;
  value: number;
  tier?: string;
  source?: string;
  caveat?: string;
  ci?: number;
};

export interface LegacyCompoundDatum {
  id: string;
  name: string;
  abbreviation: string;
  color: string;
  type: "injectable" | "oral";
  category?: string;
  benefitCurve: DosePoint[];
  riskCurve: DosePoint[];
  methodology: {
    summary: string;
    sources: string[];
  };
}

export const disclaimerText =
  "The information provided by this tool is for educational and harm reduction purposes only. It is not medical advice, diagnosis, or treatment. Anabolic-androgenic steroids (AAS) are controlled substances in many jurisdictions and carry significant health risks. The models used here are theoretical approximations based on pharmacokinetic data and do not account for individual biological variability. Always consult with a qualified healthcare provider before making decisions about your health.";

export const LEGACY_COMPOUND_IDS = [
  "testosterone",
  "npp",
  "trenbolone",
  "eq",
  "masteron",
  "primobolan",
  "dianabol",
  "anadrol",
  "winstrol",
  "anavar",
  "superdrol",
  "halotestin",
  "turinabol",
  "proviron",
  "dhb",
  "ment",
  "arimidex",
  "finasteride",
] as const;

export type LegacyId = (typeof LEGACY_COMPOUND_IDS)[number];

export const LEGACY_TO_CANONICAL: Record<LegacyId, keyof typeof COMPOUNDS> = {
  testosterone: "testosterone",
  npp: "nandrolone",
  trenbolone: "trenbolone",
  eq: "equipoise",
  masteron: "masteron",
  primobolan: "primobolan",
  dianabol: "dianabol",
  anadrol: "anadrol",
  winstrol: "winstrol",
  anavar: "anavar",
  superdrol: "superdrol",
  halotestin: "halotestin",
  turinabol: "turinabol",
  proviron: "proviron",
  dhb: "dhb",
  ment: "ment",
  arimidex: "arimidex",
  finasteride: "finasteride",
};

const DISPLAY_NAME_OVERRIDES: Partial<Record<LegacyId, string>> = {
  npp: "Nandrolone Phenylpropionate (NPP)",
  eq: "Equipoise (Boldenone)",
};

const ABBREVIATION_OVERRIDES: Partial<Record<LegacyId, string>> = {
  npp: "NPP",
  eq: "EQ",
};

const COLOR_OVERRIDES: Partial<Record<LegacyId, string>> = {
  arimidex: "#F472B6",
  finasteride: "#0EA5E9",
};

const DOSE_POINTS = [0, 100, 200, 300, 400, 500, 600] as const;

type CurveSpec = {
  plateauDose: number;
  maxValue: number;
  exponent?: number;
  baseTier?: string;
  highDoseTier?: string;
  ciBase?: number;
  postPlateauSlope?: number;
  overrides?: Record<number, Partial<DosePoint> & { value?: number }>;
};

type CurveOverrides = {
  benefit?: CurveSpec;
  risk?: CurveSpec;
  displayName?: string;
  abbreviation?: string;
};

const DEFAULT_BENEFIT_SPEC: CurveSpec = {
  plateauDose: 450,
  maxValue: 4.2,
  exponent: 1.05,
  baseTier: "Tier 2",
  highDoseTier: "Tier 3",
  ciBase: 0.28,
  postPlateauSlope: 0.05,
};

const DEFAULT_ORAL_BENEFIT_SPEC: CurveSpec = {
  plateauDose: 250,
  maxValue: 3.6,
  exponent: 1.08,
  baseTier: "Tier 2",
  highDoseTier: "Tier 3",
  ciBase: 0.32,
  postPlateauSlope: 0.03,
};

const DEFAULT_RISK_SPEC: CurveSpec = {
  plateauDose: 520,
  maxValue: 5.5,
  exponent: 1.2,
  baseTier: "Tier 2",
  highDoseTier: "Tier 4",
  ciBase: 0.38,
  postPlateauSlope: 0.35,
};

const CURVE_SPECS: Partial<Record<LegacyId, CurveOverrides>> = {
  testosterone: {
    benefit: {
      plateauDose: 520,
      maxValue: 5,
      exponent: 1.08,
      baseTier: "Tier 1",
      highDoseTier: "Tier 2",
      ciBase: 0.18,
      overrides: {
        100: { value: 0.83, tier: "Tier 1", ci: 0.15 },
        600: { value: 5.0, tier: "Tier 1", ci: 0.18 },
      },
    },
    risk: {
      plateauDose: 600,
      maxValue: 2.4,
      exponent: 1,
      baseTier: "Tier 1",
      highDoseTier: "Tier 2",
      ciBase: 0.2,
      postPlateauSlope: 0.1,
      overrides: {
        600: { value: 2.1, tier: "Tier 1", ci: 0.2 },
      },
    },
  },
  npp: {
    benefit: {
      plateauDose: 280,
      maxValue: 3.45,
      exponent: 1.05,
      baseTier: "Tier 3",
      highDoseTier: "Tier 3",
      ciBase: 0.32,
      overrides: {
        300: { value: 3.0, ci: 0.3 },
        600: { value: 3.45, ci: 0.38 },
      },
    },
    risk: {
      plateauDose: 320,
      maxValue: 3.2,
      exponent: 1.1,
      baseTier: "Tier 3",
      highDoseTier: "Tier 4",
      ciBase: 0.34,
      overrides: {
        200: { value: 1.45, ci: 0.26 },
        300: { value: 1.5, ci: 0.28 },
      },
    },
  },
  trenbolone: {
    benefit: {
      plateauDose: 300,
      maxValue: 4.98,
      exponent: 1.05,
      baseTier: "Tier 4",
      highDoseTier: "Tier 4",
      ciBase: 0.5,
      overrides: {
        300: { value: 4.2, ci: 0.48 },
        400: { value: 4.87, ci: 0.55 },
        500: { value: 4.95, ci: 0.6 },
        600: { value: 4.98, ci: 0.65 },
      },
    },
    risk: {
      plateauDose: 360,
      maxValue: 6.5,
      exponent: 1.25,
      baseTier: "Tier 4",
      highDoseTier: "Tier 4",
      ciBase: 0.62,
      overrides: {
        400: { value: 5.2, ci: 0.65 },
      },
    },
  },
  eq: {
    benefit: {
      plateauDose: 550,
      maxValue: 3.8,
      exponent: 1,
      ciBase: 0.26,
    },
  },
  masteron: {
    benefit: { plateauDose: 350, maxValue: 3, ciBase: 0.25 },
    risk: { plateauDose: 450, maxValue: 3.5, ciBase: 0.32 },
  },
  primobolan: {
    benefit: { plateauDose: 420, maxValue: 3.4, ciBase: 0.24 },
    risk: { plateauDose: 480, maxValue: 2.5, ciBase: 0.28 },
  },
  dianabol: {
    benefit: { plateauDose: 240, maxValue: 4.1, ciBase: 0.34 },
    risk: { plateauDose: 260, maxValue: 5.4, ciBase: 0.42 },
  },
  anadrol: {
    benefit: { plateauDose: 260, maxValue: 4.7, ciBase: 0.36 },
    risk: { plateauDose: 250, maxValue: 6, ciBase: 0.5 },
  },
  winstrol: {
    benefit: { plateauDose: 220, maxValue: 3.2, ciBase: 0.3 },
    risk: { plateauDose: 230, maxValue: 3.6, ciBase: 0.33 },
  },
  anavar: {
    benefit: { plateauDose: 220, maxValue: 3.1, ciBase: 0.27 },
    risk: { plateauDose: 250, maxValue: 2.2, ciBase: 0.25 },
  },
  superdrol: {
    benefit: { plateauDose: 240, maxValue: 4.3, ciBase: 0.35 },
    risk: { plateauDose: 220, maxValue: 6.2, ciBase: 0.55 },
  },
  halotestin: {
    benefit: { plateauDose: 200, maxValue: 2.4, ciBase: 0.32 },
    risk: { plateauDose: 200, maxValue: 5.3, ciBase: 0.5 },
  },
  turinabol: {
    benefit: { plateauDose: 260, maxValue: 3.3, ciBase: 0.3 },
    risk: { plateauDose: 250, maxValue: 3.2, ciBase: 0.34 },
  },
  proviron: {
    benefit: { plateauDose: 180, maxValue: 1.6, ciBase: 0.25 },
    risk: { plateauDose: 200, maxValue: 1.4, ciBase: 0.22 },
  },
  dhb: {
    benefit: { plateauDose: 420, maxValue: 3.8, ciBase: 0.33 },
    risk: { plateauDose: 380, maxValue: 4.7, ciBase: 0.38 },
  },
  ment: {
    benefit: { plateauDose: 320, maxValue: 5.5, ciBase: 0.4 },
    risk: { plateauDose: 320, maxValue: 6.5, ciBase: 0.5 },
  },
  arimidex: {
    benefit: {
      plateauDose: 150,
      maxValue: 2,
      exponent: 1,
      baseTier: "Tier 1",
      highDoseTier: "Tier 2",
      ciBase: 0.2,
    },
    risk: {
      plateauDose: 200,
      maxValue: 1.2,
      exponent: 1,
      baseTier: "Tier 1",
      highDoseTier: "Tier 1",
      ciBase: 0.15,
    },
  },
  finasteride: {
    benefit: {
      plateauDose: 120,
      maxValue: 1.5,
      exponent: 1,
      baseTier: "Tier 1",
      highDoseTier: "Tier 1",
      ciBase: 0.18,
    },
    risk: {
      plateauDose: 180,
      maxValue: 1,
      exponent: 1,
      baseTier: "Tier 1",
      highDoseTier: "Tier 1",
      ciBase: 0.15,
    },
  },
};

const extractSources = (schema: ICompoundSchema): string[] => {
  const provenanceEntries = schema.provenance
    ? Object.values(schema.provenance)
    : [];
  const citations = provenanceEntries
    .map((entry) => entry?.citation)
    .filter((citation): citation is string => Boolean(citation));

  const unique = Array.from(new Set(citations));
  if (unique.length) {
    return unique.slice(0, 4);
  }
  return ["PhysioSim Evidence Graph"];
};

const generateCurve = (
  spec: CurveSpec,
  kind: "benefit" | "risk",
): DosePoint[] => {
  return DOSE_POINTS.map((dose) => {
    if (dose === 0) {
      return {
        dose,
        value: 0,
        tier: spec.baseTier ?? "Tier 2",
        ci: Number((spec.ciBase ?? 0.3).toFixed(2)),
      };
    }

    const override = spec.overrides?.[dose];
    const normalized = Math.min(dose / spec.plateauDose, 1);
    let value = override?.value;

    if (value === undefined) {
      const shaped = Math.pow(normalized, spec.exponent ?? 1);
      const plateauValue = shaped * spec.maxValue;
      const bonus = dose > spec.plateauDose
        ? ((dose - spec.plateauDose) / 100) * (spec.postPlateauSlope ?? 0)
        : 0;
      value = Number((plateauValue + bonus).toFixed(2));
    }

    const baseCi = spec.ciBase ?? 0.3;
    const ci = override?.ci
      ?? Number(
        (
          kind === "benefit"
            ? Math.max(0.05, baseCi * (1 - normalized * 0.6))
            : Math.min(1, baseCi * (normalized * 1.1 + 0.25))
        ).toFixed(2),
      );

    return {
      dose,
      value,
      tier:
        override?.tier
        ?? (dose >= 400 ? spec.highDoseTier ?? spec.baseTier ?? "Tier 3" : spec.baseTier ?? "Tier 2"),
      ci,
      source: override?.source,
      caveat: override?.caveat,
    };
  });
};

const mergeCurveSpec = (base: CurveSpec, override?: CurveSpec): CurveSpec => {
  if (!override) {
    return { ...base, overrides: base.overrides ? { ...base.overrides } : undefined };
  }

  return {
    ...base,
    ...override,
    overrides: {
      ...(base.overrides ?? {}),
      ...(override.overrides ?? {}),
    },
  };
};

const resolveBenefitSpec = (legacyId: LegacyId, type: "injectable" | "oral"): CurveSpec => {
  const base = type === "oral" ? DEFAULT_ORAL_BENEFIT_SPEC : DEFAULT_BENEFIT_SPEC;
  const override = CURVE_SPECS[legacyId]?.benefit;
  return mergeCurveSpec(base, override);
};

const resolveRiskSpec = (legacyId: LegacyId): CurveSpec => {
  const override = CURVE_SPECS[legacyId]?.risk;
  return mergeCurveSpec(DEFAULT_RISK_SPEC, override);
};

const buildCompoundDatum = (legacyId: LegacyId): [LegacyId, LegacyCompoundDatum] => {
  const canonicalId = LEGACY_TO_CANONICAL[legacyId];
  const schema = COMPOUNDS[canonicalId];

  if (!schema) {
    throw new Error(`Missing compound schema for ${legacyId} (${canonicalId})`);
  }

  const type: "injectable" | "oral" = schema.metadata.administrationRoutes.includes("Oral")
    ? "oral"
    : "injectable";

  const benefitSpec = resolveBenefitSpec(legacyId, type);
  const riskSpec = resolveRiskSpec(legacyId);
  const benefitCurve = generateCurve(benefitSpec, "benefit");
  const riskCurve = generateCurve(riskSpec, "risk");

  const summary = schema.clinical?.summary ?? schema.metadata.description ?? "Derived from PhysioSim PK/PD library.";

  return [legacyId, {
    id: legacyId,
    name: CURVE_SPECS[legacyId]?.displayName ?? DISPLAY_NAME_OVERRIDES[legacyId] ?? schema.metadata.name,
    abbreviation:
      CURVE_SPECS[legacyId]?.abbreviation
      ?? ABBREVIATION_OVERRIDES[legacyId]
      ?? schema.metadata.abbreviation
      ?? schema.metadata.name.slice(0, 3).toUpperCase(),
    color: COLOR_OVERRIDES[legacyId] ?? schema.metadata.color ?? "#94a3b8",
    type,
    category: schema.metadata.family,
    benefitCurve,
    riskCurve,
    methodology: {
      summary,
      sources: extractSources(schema),
    },
  }];
};

export const compoundData: Record<LegacyId, LegacyCompoundDatum> = Object.fromEntries(
  LEGACY_COMPOUND_IDS.map(buildCompoundDatum),
) as Record<LegacyId, LegacyCompoundDatum>;