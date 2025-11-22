export interface GraphTier {
  threshold: number;
  yMax: number;
  label: string;
}

export declare const GRAPH_TIERS: GraphTier[];

export interface SimulationDefaults {
  DAYS: number;
  STEADY_STATE_WINDOW: number;
  DEPOT_CLEARANCE_THRESHOLD: number;
}

export declare const SIMULATION_DEFAULTS: SimulationDefaults;

export interface ChartColors {
  anabolic: string;
  toxicity: string;
  hpta: string;
  background: string;
}

export declare const CHART_COLORS: ChartColors;
