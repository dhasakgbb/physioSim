import React, { useMemo } from "react";
import { compoundData } from "../../data/compoundData";

const SaturationGauge = ({ label, value, limit, warning }) => {
  const percent = Math.min((value / limit) * 100, 100);
  const isOverloaded = value > limit;

  return (
    <div className="mb-6">
      <div className="flex justify-between items-end mb-2">
        <span className="text-sm font-medium text-physio-text-secondary">
          {label}
        </span>
        <span
          className={`text-sm font-bold font-mono ${isOverloaded ? "text-physio-accent-critical" : "text-physio-text-primary"}`}
        >
          {Math.round(percent)}%
        </span>
      </div>
      <div className="h-2 bg-physio-bg-core rounded-full overflow-hidden border border-physio-border-subtle">
        <div
          className={`h-full transition-all duration-500 ${isOverloaded ? "bg-physio-accent-critical" : "bg-physio-accent-primary"}`}
          style={{ width: `${percent}%` }}
        />
      </div>
      {isOverloaded && (
        <p className="text-xs text-physio-accent-critical mt-2 flex items-center gap-1.5 font-medium">
          <span className="material-symbols-rounded text-sm">warning</span>{" "}
          {warning}
        </p>
      )}
    </div>
  );
};

const MechanismMonitor = ({ stack }) => {
  const loads = useMemo(() => {
    let arLoad = 0; // Genomic Load (weighted mg)
    let cnsLoad = 0; // Non-Genomic Load (mg)
    let liverLoad = 0; // Hepatic Load (mg)

    stack.forEach((item) => {
      const meta = compoundData[item.compound];
      if (!meta) return;

      // AR Saturation Logic (Scientific Weighting)
      if (meta.pathway === "ar_genomic") {
        let affinityWeight = 1.0; // Baseline (Testosterone)

        // Adjust for binding affinity constants (RBA)
        if (meta.bindingAffinity === "low") affinityWeight = 0.5;
        if (meta.bindingAffinity === "moderate") affinityWeight = 0.8;
        if (meta.bindingAffinity === "high") affinityWeight = 1.25; // NPP
        if (meta.bindingAffinity === "very_high") affinityWeight = 3.0; // Tren/Proviron

        arLoad += item.dose * affinityWeight;
      }

      // CNS/Non-Genomic Logic
      if (meta.pathway === "non_genomic") {
        cnsLoad += item.dose;
      }

      // Hepatic proxy (C17-aa orals)
      if (meta.type === "oral" && meta.category !== "support") {
        liverLoad += item.dose;
      }
    });

    return { arLoad, cnsLoad, liverLoad };
  }, [stack]);

  return (
    <div className="space-y-6">
      <div className="p-5 bg-physio-bg-highlight/30 rounded-2xl hud-bracket">
        <h3 className="text-sm font-bold text-physio-text-primary mb-4 flex items-center gap-2">
          <span className="w-2 h-2 bg-physio-accent-secondary rounded-full animate-pulse"></span>
          Pathway Saturation Analysis
        </h3>

        <SaturationGauge
          label="Androgen Receptor (AR)"
          value={loads.arLoad}
          limit={1200}
          warning="Receptor competition likely. Diminishing returns."
        />

        <SaturationGauge
          label="CNS / Non-Genomic"
          value={loads.cnsLoad}
          limit={150}
          warning="High neurological strain. Toxicity risk."
        />

        <SaturationGauge
          label="Hepatic Capacity"
          value={loads.liverLoad}
          limit={80}
          warning="Liver enzyme stress critical."
        />
      </div>

      {/* Dynamic Insight */}
      {loads.arLoad > 1000 && loads.cnsLoad < 50 && (
        <div className="text-sm text-physio-text-secondary bg-physio-bg-core p-4 rounded-lg border-l-2 border-physio-accent-primary">
          <strong>Optimization Tip:</strong> Your{" "}
          <strong>AR pathway is saturated</strong>. Adding more injectables
          yields little benefit. Consider a{" "}
          <strong>Non-Genomic addition</strong> for synergy, rather than more
          Test/Primo.
        </div>
      )}
    </div>
  );
};

export default MechanismMonitor;
