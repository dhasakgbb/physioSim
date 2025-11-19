import React, { useMemo } from "react";
import Card from "../ui/Card";
import { compoundData } from "../../data/compoundData";

const MarkerRow = ({
  label,
  value,
  unit,
  description,
  goodDirection = "high",
}) => {
  // Normalize value (-5 to +5 range logic for visualization)
  const width = Math.min(Math.abs(value) * 20, 100);
  const isPositive = value > 0;

  // Color Logic
  let color = "bg-physio-text-tertiary"; // Neutral
  if (label === "SHBG") {
    // Lower is usually "Better" for free test, but too low is bad?
    // Let's simplify: Lower SHBG = Green (Free Hormones)
    color = value < 0 ? "bg-physio-accent-mint" : "bg-physio-accent-warning";
  } else if (label === "IGF-1") {
    color =
      value > 0 ? "bg-physio-accent-success" : "bg-physio-accent-critical";
  } else if (label === "Cortisol") {
    // Suppression is good (Anti-catabolic)
    color = value < 0 ? "bg-physio-accent-cyan" : "bg-physio-text-secondary";
  } else if (
    label === "RBC" ||
    label === "Prolactin" ||
    label === "Neurotoxicity"
  ) {
    // Elevation is Bad
    color = value > 0 ? "bg-physio-accent-critical" : "bg-physio-text-tertiary";
  }

  return (
    <div className="group relative cursor-help">
      <div className="flex justify-between items-end mb-1">
        <span className="text-xs font-bold text-physio-text-secondary uppercase tracking-wider">
          {label}
        </span>
        <span className="text-xs font-mono text-physio-text-primary">
          {value > 0 ? "+" : ""}
          {value} <span className="text-physio-text-tertiary">{unit}</span>
        </span>
      </div>

      {/* The Bar - Center Origin */}
      <div className="relative h-1.5 bg-physio-bg-core rounded-full overflow-hidden border border-physio-border-subtle flex items-center">
        <div className="absolute left-1/2 w-px h-full bg-physio-border-strong z-10" />{" "}
        {/* Zero Line */}
        <div
          className={`h-full rounded-full transition-all duration-500 ${color}`}
          style={{
            width: `${width / 2}%`,
            marginLeft: isPositive ? "50%" : `calc(50% - ${width / 2}%)`,
          }}
        />
      </div>

      {/* Hover Tooltip describing the nuance */}
      <div className="absolute bottom-full left-0 mb-2 w-48 p-2 bg-physio-bg-surface border border-physio-border-strong rounded-lg shadow-xl opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity z-50">
        <p className="text-xs text-physio-text-secondary leading-tight">
          {description}
        </p>
      </div>
    </div>
  );
};

const BiomarkerMatrix = ({ stack }) => {
  const totals = useMemo(() => {
    const t = {
      shbg: 0,
      igf1: 0,
      cortisol: 0,
      rbc: 0,
      prolactin: 0,
      neurotoxicity: 0,
    };

    stack.forEach((item) => {
      const meta = compoundData[item.compound];
      const impact = meta.biomarkers || {};

      // Weight by dose intensity (roughly)
      const intensity = Math.min(
        item.dose / (meta.type === "oral" ? 50 : 400),
        1.5,
      );

      t.shbg += (impact.shbg || 0) * intensity;
      t.igf1 += (impact.igf1 || 0) * intensity;
      t.cortisol += (impact.cortisol || 0) * intensity;
      t.rbc += (impact.rbc || 0) * intensity;
      t.prolactin += (impact.prolactin || 0) * intensity;
      t.neurotoxicity += (impact.neurotoxicity || 0) * intensity;
    });

    return t;
  }, [stack]);

  return (
    <Card variant="highlight" className="bg-opacity-20 p-4 space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-xs font-bold text-physio-text-primary flex items-center gap-2">
          <span className="text-base">🧬</span> Signaling Cascade
        </h3>
        <span className="text-xs text-physio-text-tertiary uppercase tracking-widest">
          Net Impact
        </span>
      </div>

      <div className="space-y-3">
        <MarkerRow
          label="SHBG"
          value={Number(totals.shbg.toFixed(1))}
          unit="Binding"
          description="Sex Hormone Binding Globulin. Lower levels free up more Testosterone for muscle growth."
        />
        <MarkerRow
          label="IGF-1"
          value={Number(totals.igf1.toFixed(1))}
          unit="Output"
          description="Insulin-like Growth Factor 1. Primary driver of nutrient shuttling and hyperplasia."
        />
        <MarkerRow
          label="Cortisol"
          value={Number(totals.cortisol.toFixed(1))}
          unit="Catabolism"
          description="Stress hormone. Negative values mean 'Anti-Catabolic' (muscle preservation)."
        />
        <MarkerRow
          label="Prolactin"
          value={Number(totals.prolactin.toFixed(1))}
          unit="Serum"
          description="Associated with 19-nors (Tren/NPP). High levels cause sexual dysfunction and mood issues."
        />
        <MarkerRow
          label="RBC"
          value={Number(totals.rbc.toFixed(1))}
          unit="Viscosity"
          description="Red Blood Cell count. Increases endurance/pumps, but thickens blood (stroke risk)."
        />
        <MarkerRow
          label="Neurotoxicity"
          value={Number(totals.neurotoxicity.toFixed(1))}
          unit="Risk"
          description="Neurodegenerative risk accumulation (Amyloid beta/Dopamine disruption)."
        />
      </div>

      {totals.neurotoxicity > 5 && (
        <div className="p-2 mt-2 bg-physio-accent-critical/10 border border-physio-accent-critical/30 rounded text-xs text-physio-accent-critical flex items-center gap-2">
          <span>🧠</span>
          <strong>Neurodegenerative Risk: High</strong>
        </div>
      )}
    </Card>
  );
};

export default BiomarkerMatrix;
