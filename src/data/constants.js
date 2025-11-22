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
// (Required for KineticSimulator and Cycle Evolution Graph)

// 1. GRAPH SCALING TIERS (The "Snap" Logic)
// Used to determine the Y-Axis Max based on the user's peak load (mgEq)
export const GRAPH_TIERS = [
  { threshold: 200, yMax: 250, label: 'Therapeutic' },
  { threshold: 600, yMax: 750, label: 'Sports' },
  { threshold: 1500, yMax: 2000, label: 'Bodybuilding' },
  { threshold: Infinity, yMax: 4000, label: 'Monster' }
];

// 2. SIMULATION BOUNDARIES
export const SIMULATION_DEFAULTS = {
  DAYS: 120, // 16 Weeks standard view
  STEADY_STATE_WINDOW: 7, // Last 7 days used for average calculations
  DEPOT_CLEARANCE_THRESHOLD: 0.05 // mg remaining to consider "cleared"
};

// 3. VISUAL PALETTE (For Graph Lines)
export const CHART_COLORS = {
  anabolic: '#10B981', // Emerald 500 (Benefit/Signal)
  toxicity: '#EF4444', // Red 500 (Risk/Drag)
  hpta: '#3B82F6',     // Blue 500 (Natural T / HPTA Status)
  background: '#18181B' // Zinc 900
};