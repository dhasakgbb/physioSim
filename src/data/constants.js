// --- LEGACY / UI CONSTANTS ---
// (Kept to ensure existing UI components don't break)

export const DEFAULT_HILL_PARAMS = {
  D50: 300,
  N: 2,
};

export const MAX_SCORE_CLAMP = 15;
export const DEFAULT_EVIDENCE_WEIGHT = 0.5;
export const DEFAULT_MAX_DOSE = 1000;

export const TABS = {
  INJECTABLES: "injectables",
  ORALS: "orals",
  INTERACTIONS: "interactions",
  STACK: "stack",
};

export const VIEW_MODES = {
  BENEFIT: "benefit",
  RISK: "risk",
  EFFICIENCY: "efficiency",
  UNCERTAINTY: "uncertainty",
};

export const COMPOUND_TYPES = {
  INJECTABLE: "injectable",
  ORAL: "oral",
};

export const DIMENSION_TYPES = {
  BENEFIT: "benefit",
  RISK: "risk",
};

export const DONATION_WALLET_ADDRESS =
  "bc1qshtrmt2ft78ld3f6faqel5qqx0640yyx2qn340";


// --- NEW SIMULATION ENGINE CONSTANTS ---
// (Used by computeCycleRailSeries to scale Cycle Physics visuals)

// GRAPH SCALING TIERS (The "Snap" Logic)
// Determines Y-Axis max based on the user's peak load (mgEq)
export const GRAPH_TIERS = [
  { threshold: 200, yMax: 250, label: "Therapeutic" },
  { threshold: 600, yMax: 750, label: "Sports" },
  { threshold: 1500, yMax: 2000, label: "Bodybuilding" },
  { threshold: Infinity, yMax: 4000, label: "Monster" },
];