import type { LucideIcon } from "lucide-react";
import { Activity, Droplet, Flame, Brain, ShieldAlert } from "lucide-react";

export type PathwayMetricKey =
  | "myogenesis"
  | "erythropoiesis"
  | "lipolysis"
  | "cns_activation"
  | "hpta_suppression";

export type FlowPolarity = "benefit" | "risk";

export interface PathwayFlowNodeConfig {
  id: string;
  title: string;
  subtitle: string;
  metricKey: PathwayMetricKey;
  gradient: string;
  accent: string;
  scale: number;
  polarity?: FlowPolarity;
  icon: LucideIcon;
}

export const PATHWAY_FLOW_CONFIG: PathwayFlowNodeConfig[] = [
  {
    id: "genomic-drive",
    title: "Genomic Drive",
    subtitle: "Contractile Blueprint",
    metricKey: "myogenesis",
    gradient: "from-indigo-500 via-sky-500 to-emerald-400",
    accent: "text-sky-200",
    scale: 120,
    icon: Activity,
  },
  {
    id: "oxygen-delivery",
    title: "Oxygen Logistics",
    subtitle: "Erythropoiesis",
    metricKey: "erythropoiesis",
    gradient: "from-rose-500 via-amber-400 to-yellow-300",
    accent: "text-amber-200",
    scale: 90,
    icon: Droplet,
  },
  {
    id: "metabolic-flux",
    title: "Metabolic Flux",
    subtitle: "Nutrient Partitioning",
    metricKey: "lipolysis",
    gradient: "from-emerald-400 via-lime-300 to-yellow-200",
    accent: "text-emerald-200",
    scale: 80,
    icon: Flame,
  },
  {
    id: "cns-drive",
    title: "CNS Drive",
    subtitle: "Non-Genomic",
    metricKey: "cns_activation",
    gradient: "from-purple-500 via-fuchsia-500 to-pink-400",
    accent: "text-fuchsia-200",
    scale: 75,
    icon: Brain,
  },
  {
    id: "axis-suppression",
    title: "Axis Suppression",
    subtitle: "HPTA Feedback",
    metricKey: "hpta_suppression",
    gradient: "from-amber-600 via-orange-500 to-rose-500",
    accent: "text-rose-200",
    scale: 110,
    polarity: "risk",
    icon: ShieldAlert,
  },
];
