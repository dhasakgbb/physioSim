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

const MechanismMonitor = ({ stack, metrics }) => {
  const loads = useMemo(() => {
    // Use Engine Metrics if available (Single Source of Truth)
    if (metrics?.analytics?.pathwayLoads) {
      return {
        arLoad: metrics.analytics.pathwayLoads.ar_genomic || 0,
        cnsLoad: (metrics.analytics.pathwayLoads.non_genomic || 0) + (metrics.analytics.pathwayLoads.neuro || 0),
        liverLoad: metrics.analytics.pathwayLoads.liver || 0,
      };
    }

    // Fallback (should rarely be reached if Dashboard passes metrics)
    let arLoad = 0; 
    let cnsLoad = 0; 
    let liverLoad = 0; 

    stack.forEach((item) => {
      const meta = compoundData[item.compound];
      if (!meta) return;
      // ... (Fallback logic could be kept or simplified, but for now keeping it minimal or just returning 0 to force metrics usage)
       if (meta.pathway === "ar_genomic") arLoad += item.dose;
       if (meta.pathway === "non_genomic") cnsLoad += item.dose;
       if (meta.type === "oral") liverLoad += item.dose;
    });

    return { arLoad, cnsLoad, liverLoad };
  }, [stack, metrics]);

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
          limit={500} // Calibrated for 12.5x scalar (~2000mg total to hit 100%)
          warning="Receptor competition likely. Diminishing returns."
        />

        <SaturationGauge
          label="CNS / Non-Genomic"
          value={loads.cnsLoad}
          limit={200} // Scaled for 12.5x engine values
          warning="High neurological strain. Toxicity risk."
        />

        <SaturationGauge
          label="Hepatic Capacity"
          value={loads.liverLoad}
          limit={150} // Scaled for 12.5x engine values
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
