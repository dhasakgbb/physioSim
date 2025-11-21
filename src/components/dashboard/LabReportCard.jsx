import React, { useMemo } from "react";
import { compoundData } from "../../data/compoundData";

const LabReportCard = ({ stack, metrics }) => {
  const labsWidget = metrics?.analytics?.labsWidget;
  const labValues = metrics?.analytics?.projectedLabs || {
    hdl: 50,
    ldl: 100,
    hematocrit: 45,
    ast: 25,
    alt: 25,
    creatinine: 1.0,
    egfr: 95,
    neuroRisk: 0,
    estradiol: 25,
    prolactin: 6.0,
    shbg: 30,
    totalTestosterone: 600,
    freeTestosterone: 12,
  };

  const totals = metrics?.totals;

  const getStatus = (value, ranges) => {
    // Check for low critical/warning first (if defined)
    if (ranges.lowCritical !== undefined && value <= ranges.lowCritical)
      return {
        color: "text-physio-accent-critical",
        bg: "bg-physio-accent-critical/10",
        label: "CRITICAL LOW",
      };
    if (ranges.lowWarning !== undefined && value <= ranges.lowWarning)
      return {
        color: "text-physio-accent-warning",
        bg: "bg-physio-accent-warning/10",
        label: "LOW",
      };

    // Check for high critical/warning
    if (value >= ranges.critical)
      return {
        color: "text-physio-accent-critical",
        bg: "bg-physio-accent-critical/10",
        label: "CRITICAL",
      };
    if (value >= ranges.warning)
      return {
        color: "text-physio-accent-warning",
        bg: "bg-physio-accent-warning/10",
        label: "WARNING",
      };

    return {
      color: "text-physio-accent-success",
      bg: "bg-physio-accent-success/10",
      label: "NORMAL",
    };
  };

  const widgetStatus = (key, fallback) => {
    const statusKey = labsWidget?.[key]?.status;
    if (statusKey && STATUS_STYLE_MAP[statusKey]) {
      return STATUS_STYLE_MAP[statusKey];
    }
    return fallback;
  };

  const getHdlStatus = (value) => {
    if (value < 30)
      return {
        color: "text-physio-accent-critical",
        bg: "bg-physio-accent-critical/10",
        label: "CRITICAL LOW",
      };
    if (value <= 45)
      return {
        color: "text-physio-accent-warning",
        bg: "bg-physio-accent-warning/10",
        label: "ELEVATED RISK",
      };
    return {
      color: "text-physio-accent-success",
      bg: "bg-physio-accent-success/10",
      label: "OPTIMAL",
    };
  };

  // Recovery Status Logic
  const recoveryStatus = useMemo(() => {
    const score = totals?.maxSuppression || 0;
    if (score >= 5)
      return {
        label: "Severe (4-6 Months+)",
        color: "text-physio-accent-critical",
        bg: "bg-physio-accent-critical/10",
      };
    if (score >= 4)
      return {
        label: "Difficult (3-4 Months)",
        color: "text-physio-accent-critical",
        bg: "bg-physio-accent-critical/10",
      };
    if (score >= 3)
      return {
        label: "Extended (2-3 Months)",
        color: "text-physio-accent-warning",
        bg: "bg-physio-accent-warning/10",
      };
    if (score >= 2)
      return {
        label: "Standard (1-2 Months)",
        color: "text-physio-accent-success",
        bg: "bg-physio-accent-success/10",
      };
    return {
      label: "Rapid (Weeks)",
      color: "text-physio-accent-success",
      bg: "bg-physio-accent-success/10",
    };
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
        {/* HDL */}
        <LabRow
          label="HDL"
          value={(labsWidget?.hdl?.value ?? labValues.hdl).toFixed(0)}
          unit="mg/dL"
          status={widgetStatus("hdl", getHdlStatus(labValues.hdl))}
          reference="&gt; 40"
        />

        {/* LDL */}
        <LabRow
          label="LDL"
          value={(labsWidget?.ldl?.value ?? labValues.ldl).toFixed(0)}
          unit="mg/dL"
          status={widgetStatus(
            "ldl",
            getStatus(labValues.ldl, { critical: 160, warning: 130 }),
          )}
          reference="&lt; 100"
        />

        {/* Hematocrit */}
        <LabRow
          label="HCT"
          value={(labsWidget?.hematocrit?.value ?? labValues.hematocrit).toFixed(1)}
          unit="%"
          status={widgetStatus(
            "hematocrit",
            getStatus(labValues.hematocrit, { critical: 55, warning: 50 }),
          )}
          reference="&lt; 50%"
        />

        {/* AST */}
        <LabRow
          label="AST"
          value={(labsWidget?.ast?.value ?? labValues.ast).toFixed(0)}
          unit="U/L"
          status={widgetStatus(
            "ast",
            getStatus(labValues.ast, { critical: 80, warning: 50 }),
          )}
          reference="&lt; 40"
        />

        {/* ALT */}
        <LabRow
          label="ALT"
          value={(labsWidget?.alt?.value ?? labValues.alt).toFixed(0)}
          unit="U/L"
          status={widgetStatus(
            "alt",
            getStatus(labValues.alt, { critical: 80, warning: 50 }),
          )}
          reference="&lt; 40"
        />

        {/* Creatinine */}
        <LabRow
          label="Creatinine"
          value={(labsWidget?.creatinine?.value ?? labValues.creatinine).toFixed(2)}
          unit="mg/dL"
          status={widgetStatus(
            "creatinine",
            getStatus(labValues.creatinine, {
              critical: 1.5,
              warning: 1.3,
            }),
          )}
          reference="&lt; 1.2"
        />

        <LabRow
          label="eGFR"
          value={(labsWidget?.egfr?.value ?? labValues.egfr).toFixed(0)}
          unit="mL/min"
          status={widgetStatus(
            "egfr",
            getStatus(labValues.egfr, {
              criticalLow: 45,
              warningLow: 60,
            }),
          )}
          reference="&gt; 60"
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
          status={widgetStatus(
            "e2",
            getStatus(labValues.estradiol, {
              critical: 80,
              warning: 50,
              lowWarning: 15,
              lowCritical: 10,
            }),
          )}
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
        {stack.some(
          (i) => compoundData[i.compound]?.flags?.createsMethylEstrogen,
        ) && (
          <LabRow
            label="Methyl-E2"
            value="DETECTED"
            unit="High Potency"
            reference="0"
            status={{
              color: "text-physio-accent-critical",
              bg: "bg-physio-accent-critical/10",
              label: "CRITICAL",
            }}
          />
        )}

        {stack.some((i) => compoundData[i.compound]?.flags?.createsDHN) && (
          <LabRow
            label="DHN Disp."
            value="RISK"
            unit="Sexual Func"
            reference="-"
            status={{
              color: "text-physio-accent-warning",
              bg: "bg-physio-accent-warning/10",
              label: "ELEVATED",
            }}
          />
        )}

        {stack.some((i) => i.compound === "eq") && (
          <LabRow
            label="EQ AI Effect"
            value="ACTIVE"
            unit="Serum E2"
            reference="-"
            status={{
              color: "text-physio-accent-primary",
              bg: "bg-physio-accent-primary/10",
              label: "SUPPRESSIVE",
            }}
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
        <span className="text-xs font-mono text-physio-text-tertiary uppercase w-20">
          {label}
        </span>
        <span className={`text-sm font-bold font-mono ${status.color}`}>
          {value} <span className="text-[10px] font-normal">{unit}</span>
        </span>
      </div>
      <div className="flex items-center gap-3">
        <span className="text-[10px] text-physio-text-tertiary font-mono">
          {reference}
        </span>
        <span
          className={`text-[10px] font-bold px-2 py-0.5 rounded ${status.bg} ${status.color}`}
        >
          {status.label}
        </span>
      </div>
    </div>
  );
};

const STATUS_STYLE_MAP = {
  good: {
    color: "text-physio-accent-success",
    bg: "bg-physio-accent-success/10",
    label: "NORMAL",
  },
  bad: {
    color: "text-physio-accent-warning",
    bg: "bg-physio-accent-warning/10",
    label: "ELEVATED",
  },
  critical: {
    color: "text-physio-accent-critical",
    bg: "bg-physio-accent-critical/10",
    label: "CRITICAL",
  },
};

export default LabReportCard;
