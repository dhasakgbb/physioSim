import React, { useMemo } from 'react';
import { compoundData } from '../../data/compoundData';

const LabReportCard = ({ stack, totals }) => {
  // Calculate predicted lab values based on stack
  const labValues = useMemo(() => {
    let hdl = 50; // Baseline mg/dL
    let ldl = 100; // Baseline mg/dL
    let hematocrit = 45; // Baseline %
    let ast = 25; // Baseline U/L
    let alt = 25; // Baseline U/L
    let creatinine = 1.0; // Baseline mg/dL
    let neuroRisk = 0; // Baseline Index
    let estradiol = 25; // Baseline pg/mL
    let prolactin = 6.0; // Baseline ng/mL

    stack.forEach(item => {
      const meta = compoundData[item.compound];
      const dose = item.dose;

      // HDL Decline (all AAS suppress HDL)
      if (meta.type === 'injectable') {
        // Bhasin et al: 600mg Test -> ~20% HDL drop. 
        // Previous logic (0.02 * dose) was too aggressive (500mg -> -10mg/dL).
        // New logic: 0.008 * dose (500mg -> -4mg/dL) which is more clinically accurate for Test.
        hdl -= dose * 0.008; 
      } else if (meta.type === 'oral') {
        // Orals are hepatic lipase suicide inhibitors. They CRUSH HDL.
        // 50mg Anavar -> -50% HDL is common.
        hdl -= dose * 0.5; 
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
      if (item.compound === 'trenbolone') {
        creatinine += dose * 0.0008;
      }

      // Neurotoxicity Accumulation
      if (meta.biomarkers?.neurotoxicity) {
        neuroRisk += meta.biomarkers.neurotoxicity * (dose / 300);
      }

      // Estradiol (E2) Calculation
      // Base assumption: Average Responder (No AI)
      if (meta.flags?.aromatization) {
        // ~500mg Test -> ~75pg/mL E2 (Average response)
        // Previous (0.15) was "High Aromatizer". New (0.10) is "Average".
        estradiol += dose * 0.10 * meta.flags.aromatization;
      }
      if (item.compound === 'dianabol') {
        // Methyl-E2 is potent but 1.5 was extreme. 1.0 is safer average.
        estradiol += dose * 1.0;
      }

      // Prolactin Calculation (19-nors)
      if (meta.biomarkers?.prolactin) {
        // Scale: 300mg NPP -> +10ng/mL
        prolactin += meta.biomarkers.prolactin * (dose / 100);
      }

      // AI Logic (Arimidex)
      if (item.compound === 'arimidex') {
        // 1mg Arimidex/week reduces E2 by ~40pg/mL (Linear approx)
        estradiol -= dose * 40;
      }

      // SPECIAL: Equipoise (Boldenone) "AI Effect"
      if (item.compound === 'eq') {
        estradiol -= dose * 0.12; 
      }

      // TESTOSTERONE & SHBG LOGIC
      if (item.compound === 'testosterone') {
        totalTestosterone += dose * 7; // ~500mg -> 3500ng/dL
      }

      // SHBG Suppression (DHTs crush it)
      if (meta.biomarkers?.shbg) {
        // shbg biomarker is negative (e.g. -3). 
        // 50mg Proviron (-3) -> -15 nmol/L reduction
        shbg += meta.biomarkers.shbg * (dose / 100) * 5;
      }
    });

    // Clamp values to realistic ranges
    hdl = Math.max(20, Math.min(hdl, 60));
    ldl = Math.min(ldl, 200);
    hematocrit = Math.min(hematocrit, 58);
    ast = Math.min(ast, 150);
    alt = Math.min(alt, 150);
    creatinine = Math.min(creatinine, 2.0);
    neuroRisk = Math.min(neuroRisk, 10.0);
    estradiol = Math.max(5, estradiol); 
    
    // Clamp SHBG (Can't go below ~5 nmol/L realistically)
    shbg = Math.max(5, shbg);
    
    // Calculate Free Testosterone (The "Active" Hormone)
    // Simplified Free Androgen Index (FAI) proxy
    // As SHBG drops, % of Free Test rises.
    // Baseline: 2% free. Crushed SHBG: ~6% free.
    const freeTestRatio = 0.02 + ((30 - shbg) * 0.0015);
    freeTestosterone = totalTestosterone * freeTestRatio * 10; // x10 for pg/mL scaling approx

    return { hdl, ldl, hematocrit, ast, alt, creatinine, neuroRisk, estradiol, prolactin, totalTestosterone, freeTestosterone, shbg };
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

  // Recovery Status Logic
  const recoveryStatus = useMemo(() => {
    const score = totals?.maxSuppression || 0;
    if (score >= 5) return { label: 'Severe (4-6 Months+)', color: 'text-physio-accent-critical', bg: 'bg-physio-accent-critical/10' };
    if (score >= 4) return { label: 'Difficult (3-4 Months)', color: 'text-physio-accent-critical', bg: 'bg-physio-accent-critical/10' };
    if (score >= 3) return { label: 'Extended (2-3 Months)', color: 'text-physio-accent-warning', bg: 'bg-physio-accent-warning/10' };
    if (score >= 2) return { label: 'Standard (1-2 Months)', color: 'text-physio-accent-success', bg: 'bg-physio-accent-success/10' };
    return { label: 'Rapid (Weeks)', color: 'text-physio-accent-success', bg: 'bg-physio-accent-success/10' };
  }, [totals]);

  return (
    <div className="bg-physio-bg-surface border border-physio-border-strong rounded-xl p-5 shadow-neo">
      <div className="flex items-center justify-between mb-5">
        <h3 className="text-sm font-bold text-physio-text-primary uppercase tracking-wider">
          Virtual Phlebotomist
        </h3>
        <div className="text-xs text-physio-text-tertiary uppercase">
          Predicted Lab Values
        </div>
      </div>

      <div className="space-y-2.5">
        {/* Recovery Score (New) */}
        <div className="flex items-center justify-between py-2 px-3 rounded bg-physio-bg-core/50 border border-physio-border-subtle mb-4">
          <div className="flex items-center gap-3 flex-1">
            <span className="text-xs font-mono text-physio-text-tertiary uppercase w-24">Est. Recovery</span>
            <span className={`text-sm font-bold font-mono ${recoveryStatus.color}`}>
              {recoveryStatus.label}
            </span>
          </div>
        </div>

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

        {/* Neuro Risk */}
        <LabRow 
          label="Neuro Risk" 
          value={labValues.neuroRisk.toFixed(1)} 
          unit="Index"
          status={getStatus(labValues.neuroRisk, { critical: 5, warning: 3 })}
          reference="&lt; 2.0"
        />

        {/* HORMONAL PANEL (New) */}
        <div className="my-3 border-t border-physio-border-subtle/50" />
        
        <LabRow 
          label="Estradiol" 
          value={labValues.estradiol.toFixed(0)} 
          unit="pg/mL"
          status={getStatus(labValues.estradiol, { critical: 80, warning: 50 })}
          reference="20-40"
        />

        <LabRow 
          label="Prolactin" 
          value={labValues.prolactin.toFixed(1)} 
          unit="ng/mL"
          status={getStatus(labValues.prolactin, { critical: 20, warning: 15 })}
          reference="&lt; 15"
        />

        {/* Metabolite Shadow (New) */}
        {stack.some(i => compoundData[i.compound]?.flags?.createsMethylEstrogen) && (
          <LabRow 
            label="Methyl-E2" 
            value="DETECTED" 
            unit="High Potency" 
            reference="0" 
            status={{ color: 'text-physio-accent-critical', bg: 'bg-physio-accent-critical/10', label: 'CRITICAL' }} 
          />
        )}

        {stack.some(i => compoundData[i.compound]?.flags?.createsDHN) && (
          <LabRow 
            label="DHN Disp." 
            value="RISK" 
            unit="Sexual Func" 
            reference="-" 
            status={{ color: 'text-physio-accent-warning', bg: 'bg-physio-accent-warning/10', label: 'ELEVATED' }} 
          />
        )}

        {stack.some(i => i.compound === 'eq') && (
          <LabRow 
            label="EQ AI Effect" 
            value="ACTIVE" 
            unit="Serum E2" 
            reference="-" 
            status={{ color: 'text-physio-accent-primary', bg: 'bg-physio-accent-primary/10', label: 'SUPPRESSIVE' }} 
          />
        )}
      </div>

      <div className="mt-5 pt-3 border-t border-physio-border-subtle text-xs text-physio-text-tertiary">
        💡 Simulated values. Actual labs vary by genetics, diet, and training.
      </div>
    </div>
  );
};

const LabRow = ({ label, value, unit, status, reference }) => {
  return (
    <div className="flex items-center justify-between py-2 px-3 rounded bg-physio-bg-core/50">
      <div className="flex items-center gap-3 flex-1">
        <span className="text-xs font-mono text-physio-text-tertiary uppercase w-20">{label}</span>
        <span className={`text-sm font-bold font-mono ${status.color}`}>
          {value} <span className="text-[10px] font-normal">{unit}</span>
        </span>
      </div>
      <div className="flex items-center gap-3">
        <span className="text-[10px] text-physio-text-tertiary font-mono">{reference}</span>
        <span className={`text-[10px] font-bold px-2 py-0.5 rounded ${status.bg} ${status.color}`}>
          {status.label}
        </span>
      </div>
    </div>
  );
};

export default LabReportCard;
