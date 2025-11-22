import React from "react";
import { COMPOUNDS as compoundData } from "../../data/compounds";
import Button from "../ui/Button";
import Badge from "../ui/Badge";

const BiomarkerRow = ({ label, value }) => {
  // -3 to +3 scale (Mapped from Emax/EC50 in new model approx)
  const percentage = (value / 100) * 100; // Assuming value is Emax for now
  const isPositive = value > 0;
  const isNegative = value < 0;
  const isNeutral = value === 0;

  let color = "bg-physio-text-tertiary";
  if (isPositive) color = "bg-physio-accent-success";

  // Special handling for "Bad" positives
  if (
    [
      "prolactin",
      "cortisol",
      "liver_toxicity",
      "pip",
      "neurotoxicity",
      "estrogenic_activity",
      "hpta_suppression"
    ].includes(label.toLowerCase())
  ) {
    if (isPositive) color = "bg-physio-accent-critical";
    if (isNegative) color = "bg-physio-accent-success";
  }

  if (
    isNegative &&
    ![
      "prolactin",
      "cortisol",
      "liver_toxicity",
      "pip",
      "neurotoxicity",
      "estrogenic_activity",
      "hpta_suppression"
    ].includes(label.toLowerCase())
  ) {
    color = "bg-physio-accent-primary";
  }

  return (
    <div className="flex items-center gap-3 text-xs">
      <span className="w-24 text-physio-text-secondary uppercase tracking-wider text-[10px]">
        {label}
      </span>
      <div className="flex-1 h-6 bg-physio-bg-core rounded flex items-center relative px-2">
        {/* Center Line */}
        <div className="absolute left-1/2 top-0 bottom-0 w-px bg-physio-border-subtle" />

        {/* Bar */}
        {!isNeutral && (
          <div
            className={`h-2 rounded-full absolute ${color} opacity-80`}
            style={{
              left: isPositive ? "50%" : "auto",
              right: isNegative ? "50%" : "auto",
              width: `${Math.min(50, Math.abs(percentage) / 2)}%`, 
            }}
          />
        )}

        {/* Value Label */}
        <span
          className={`relative z-10 w-full text-center font-mono text-[10px] ${isNeutral ? "text-physio-text-tertiary" : "text-physio-text-primary"}`}
        >
          {value > 0 ? `+${value}` : value}
        </span>
      </div>
    </div>
  );
};

const CompoundInspector = ({ compoundKey, onClose }) => {
  const data = compoundData[compoundKey];

  if (!data) return null;

  // Map new schema to flattened biomarkers for display
  const biomarkers = {
    "Anabolic Rating": data.pd.receptorInteractions.AR.Emax,
    "Androgenic Rating": data.pd.receptorInteractions.AR.Kd < 1 ? 100 : 50, // Proxy
    "Estrogenic Activity": data.pd.receptorInteractions.ER_alpha ? data.pd.receptorInteractions.ER_alpha.Emax : 0,
    "HPTA Suppression": data.pd.pathwayModulation.systemic.HPTA_suppression.Emax,
    "Liver Toxicity": data.toxicity.hepatic.parameters.coefficient * 1000, // Scale up
    "Neurotoxicity": data.toxicity.neurotoxicity.parameters.coefficient * 1000,
  };

  return (
    // Changed to FIXED position, h-screen, and high Z-index to float above everything
    <div className="fixed inset-y-0 right-0 w-[450px] bg-physio-bg-core/95 backdrop-blur-xl border-l border-physio-border-strong shadow-2xl z-[100] flex flex-col animate-slide-left">
      {/* Header */}
      <div className="p-6 border-b border-physio-border-subtle flex items-start justify-between bg-physio-bg-core/50 shrink-0">
        <div className="flex items-center gap-4">
          <div
            className="w-12 h-12 rounded-xl flex items-center justify-center text-xl font-bold text-white shadow-lg"
            style={{ backgroundColor: data.metadata.color || '#3B82F6' }}
          >
            {data.metadata.abbreviation}
          </div>
          <div>
            <h2 className="text-xl font-bold text-physio-text-primary">
              {data.metadata.name}
            </h2>
            <div className="flex items-center gap-2 mt-1">
              <Badge variant="neutral" size="sm">
                {data.metadata.classification}
              </Badge>
              <Badge variant="info" size="sm">
                {data.metadata.family}
              </Badge>
            </div>
          </div>
        </div>
        <Button variant="ghost" size="icon" onClick={onClose}>
          ✕
        </Button>
      </div>

      {/* Content Scroll Area - added flex-1 and overflow-y-auto */}
      <div className="flex-1 overflow-y-auto p-6 space-y-8 custom-scrollbar">
        {/* 1. Clinical Clearance & Pharmacology */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-4">
            <h3 className="text-xs font-bold text-physio-text-tertiary uppercase tracking-widest border-b border-physio-border-subtle pb-2">
              Clinical Data
            </h3>
            <div className="grid grid-cols-2 gap-4">
              <div className="p-3 bg-physio-bg-core rounded-lg border border-physio-border-subtle">
                <span className="block text-[10px] text-physio-text-tertiary uppercase">
                  Molecular Wt
                </span>
                <span className="text-lg font-mono text-physio-text-primary">
                  {data.metadata.chemicalProperties.molecularWeight || "N/A"}
                </span>
              </div>
              <div className="p-3 bg-physio-bg-core rounded-lg border border-physio-border-subtle">
                <span className="block text-[10px] text-physio-text-tertiary uppercase">
                  Binding Affinity
                </span>
                <span className="text-lg font-mono text-physio-text-primary capitalize">
                  {data.pd.receptorInteractions.AR.Kd} nM
                </span>
              </div>
            </div>
            <div className="p-3 bg-physio-bg-core rounded-lg border border-physio-border-subtle">
              <span className="block text-[10px] text-physio-text-tertiary uppercase">
                Pathway
              </span>
              <span className="text-sm font-medium text-physio-text-primary">
                {data.pd.receptorInteractions.AR.activityType}
              </span>
            </div>
          </div>

          {/* 2. Biomarker Impact Vector */}
          <div className="space-y-4">
            <h3 className="text-xs font-bold text-physio-text-tertiary uppercase tracking-widest border-b border-physio-border-subtle pb-2">
              Endocrine Impact
            </h3>
            <div className="space-y-2">
              {Object.entries(biomarkers).map(([key, val]) => (
                <BiomarkerRow
                  key={key}
                  label={key}
                  value={val}
                />
              ))}
            </div>
          </div>
        </div>

        {/* 3. Methodology / Description */}
        <div className="space-y-4">
          <h3 className="text-xs font-bold text-physio-text-tertiary uppercase tracking-widest border-b border-physio-border-subtle pb-2">
            Mechanism of Action
          </h3>
          <div className="p-4 bg-physio-bg-highlight/10 rounded-xl border border-physio-border-subtle text-sm text-physio-text-secondary leading-relaxed">
            <p className="mb-2">
              <strong className="text-physio-text-primary">Summary:</strong>{" "}
              {data.clinical?.summary || data.metadata.description || "No summary available."}
            </p>
            <p className="mb-2">
              <strong className="text-physio-text-primary">Benefit:</strong>{" "}
              {data.clinical?.benefitRationale || "N/A"}
            </p>
            <p>
              <strong className="text-physio-text-primary">Risk:</strong>{" "}
              {data.clinical?.riskRationale || "N/A"}
            </p>
          </div>
        </div>

        {/* Padding at bottom */}
        <div className="h-12" />
      </div>

      {/* Footer Actions */}
      <div className="p-6 border-t border-physio-border-subtle bg-physio-bg-core flex justify-end shrink-0">
        <Button variant="primary" onClick={onClose}>
          Close Inspector
        </Button>
      </div>
    </div>
  );
};

export default CompoundInspector;
