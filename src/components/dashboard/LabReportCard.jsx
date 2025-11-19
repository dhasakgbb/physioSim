import React, { useMemo } from 'react';
import { compoundData } from '../../data/compoundData';

const LabReportCard = ({ stack }) => {
  // Calculate predicted lab values based on stack
  const labValues = useMemo(() => {
    let hdl = 50; // Baseline mg/dL
    let ldl = 100; // Baseline mg/dL
    let hematocrit = 45; // Baseline %
    let ast = 25; // Baseline U/L
    let alt = 25; // Baseline U/L
    let creatinine = 1.0; // Baseline mg/dL

    stack.forEach(item => {
      const meta = compoundData[item.compound];
      const dose = item.dose;

      // HDL Decline (all AAS suppress HDL)
      if (meta.type === 'injectable') {
        hdl -= dose * 0.02; // ~2% per 100mg
      } else if (meta.type === 'oral') {
        hdl -= dose * 0.5; // Orals hit harder
      }

      // LDL Increase
      if (meta.type === 'oral') {
        ldl += dose * 0.3;
      } else {
        ldl += dose * 0.01;
      }

      // Hematocrit (RBC boost)
      if (meta.biomarkers?.rbc > 0) {
        hematocrit += meta.biomarkers.rbc * (dose / 500) * 2; // Scale by dose
      }

      // Liver Enzymes (Orals)
      if (meta.type === 'oral') {
        ast += dose * 0.8;
        alt += dose * 1.0;
      }

      // Creatinine (Kidney stress - mainly Tren, high doses)
      if (meta.code === 'trenbolone') {
        creatinine += dose * 0.0008;
      }
    });

    // Clamp values to realistic ranges
    hdl = Math.max(20, Math.min(hdl, 60));
    ldl = Math.min(ldl, 200);
    hematocrit = Math.min(hematocrit, 58);
    ast = Math.min(ast, 150);
    alt = Math.min(alt, 150);
    creatinine = Math.min(creatinine, 2.0);

    return { hdl, ldl, hematocrit, ast, alt, creatinine };
  }, [stack]);

  const getStatus = (value, ranges) => {
    if (value >= ranges.critical) return { color: 'text-physio-accent-critical', bg: 'bg-physio-accent-critical/10', label: 'CRITICAL' };
    if (value >= ranges.warning) return { color: 'text-physio-accent-warning', bg: 'bg-physio-accent-warning/10', label: 'WARNING' };
    return { color: 'text-physio-accent-success', bg: 'bg-physio-accent-success/10', label: 'NORMAL' };
  };

  const getStatusReverse = (value, ranges) => {
    if (value <= ranges.critical) return { color: 'text-physio-accent-critical', bg: 'bg-physio-accent-critical/10', label: 'CRITICAL' };
    if (value <= ranges.warning) return { color: 'text-physio-accent-warning', bg: 'bg-physio-accent-warning/10', label: 'WARNING' };
    return { color: 'text-physio-accent-success', bg: 'bg-physio-accent-success/10', label: 'NORMAL' };
  };

  return (
    <div className="bg-physio-bg-surface border border-physio-border-strong rounded-xl p-4 shadow-neo">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-xs font-bold text-physio-text-primary uppercase tracking-wider">
          Virtual Phlebotomist
        </h3>
        <div className="text-[9px] text-physio-text-tertiary uppercase">
          Predicted Lab Values
        </div>
      </div>

      <div className="space-y-2">
        {/* HDL */}
        <LabRow 
          label="HDL" 
          value={labValues.hdl.toFixed(0)} 
          unit="mg/dL"
          status={getStatusReverse(labValues.hdl, { critical: 30, warning: 35 })}
          reference="&gt; 40"
        />

        {/* LDL */}
        <LabRow 
          label="LDL" 
          value={labValues.ldl.toFixed(0)} 
          unit="mg/dL"
          status={getStatus(labValues.ldl, { critical: 160, warning: 130 })}
          reference="&lt; 100"
        />

        {/* Hematocrit */}
        <LabRow 
          label="HCT" 
          value={labValues.hematocrit.toFixed(1)} 
          unit="%"
          status={getStatus(labValues.hematocrit, { critical: 54, warning: 50 })}
          reference="&lt; 50%"
        />

        {/* AST */}
        <LabRow 
          label="AST" 
          value={labValues.ast.toFixed(0)} 
          unit="U/L"
          status={getStatus(labValues.ast, { critical: 80, warning: 50 })}
          reference="&lt; 40"
        />

        {/* ALT */}
        <LabRow 
          label="ALT" 
          value={labValues.alt.toFixed(0)} 
          unit="U/L"
          status={getStatus(labValues.alt, { critical: 80, warning: 50 })}
          reference="&lt; 40"
        />

        {/* Creatinine */}
        <LabRow 
          label="Creatinine" 
          value={labValues.creatinine.toFixed(2)} 
          unit="mg/dL"
          status={getStatus(labValues.creatinine, { critical: 1.5, warning: 1.3 })}
          reference="&lt; 1.2"
        />
      </div>

      <div className="mt-4 pt-3 border-t border-physio-border-subtle text-[9px] text-physio-text-tertiary">
        💡 Simulated values. Actual labs vary by genetics, diet, and training.
      </div>
    </div>
  );
};

const LabRow = ({ label, value, unit, status, reference }) => {
  return (
    <div className="flex items-center justify-between py-1.5 px-2 rounded bg-physio-bg-core/50">
      <div className="flex items-center gap-3 flex-1">
        <span className="text-[10px] font-mono text-physio-text-tertiary uppercase w-16">{label}</span>
        <span className={`text-sm font-bold font-mono ${status.color}`}>
          {value} <span className="text-[9px] font-normal">{unit}</span>
        </span>
      </div>
      <div className="flex items-center gap-2">
        <span className="text-[9px] text-physio-text-tertiary font-mono">{reference}</span>
        <span className={`text-[8px] font-bold px-1.5 py-0.5 rounded ${status.bg} ${status.color}`}>
          {status.label}
        </span>
      </div>
    </div>
  );
};

export default LabReportCard;
