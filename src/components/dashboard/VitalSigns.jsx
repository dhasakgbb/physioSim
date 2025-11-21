import React, { useMemo } from "react";
import Card from "../ui/Card";
import PhlebotomistCell from "../ui/PhlebotomistCell";
import { getAncillaryProtocol } from "../../data/sideFxAndAncillaries";
import { compoundData } from "../../data/compoundData";

// Reference ranges for common biomarkers
const BIOMARKER_RANGES = {
  // Lipid Panel
  total_cholesterol: { min: 0, max: 300, optimal: { min: 100, max: 200 }, unit: "mg/dL" },
  ldl: { min: 0, max: 200, optimal: { min: 0, max: 100 }, unit: "mg/dL" },
  hdl: { min: 30, max: 100, optimal: { min: 40, max: 100 }, unit: "mg/dL" },
  triglycerides: { min: 0, max: 400, optimal: { min: 0, max: 150 }, unit: "mg/dL" },

  // Liver Function
  alt: { min: 7, max: 56, optimal: { min: 7, max: 40 }, unit: "U/L" },
  ast: { min: 10, max: 40, optimal: { min: 10, max: 35 }, unit: "U/L" },
  alp: { min: 44, max: 147, optimal: { min: 44, max: 129 }, unit: "U/L" },
  bilirubin: { min: 0.1, max: 1.2, optimal: { min: 0.1, max: 1.0 }, unit: "mg/dL" },

  // Hormonal Panel
  testosterone: { min: 300, max: 1000, optimal: { min: 600, max: 900 }, unit: "ng/dL" },
  cortisol: { min: 5, max: 25, optimal: { min: 10, max: 20 }, unit: "µg/dL" },
  shbg: { min: 10, max: 50, optimal: { min: 15, max: 40 }, unit: "nmol/L" },
  prolactin: { min: 2, max: 18, optimal: { min: 2, max: 15 }, unit: "ng/mL" },

  // Metabolic
  glucose: { min: 70, max: 140, optimal: { min: 80, max: 100 }, unit: "mg/dL" },
  insulin: { min: 2, max: 25, optimal: { min: 5, max: 15 }, unit: "µIU/mL" },
};

// Visual reference range indicator (Material Design style)
const ReferenceRangeIndicator = ({ value, range, label }) => {
  const { min, max, optimal, unit } = range;
  const rangeWidth = max - min;
  const optimalWidth = optimal.max - optimal.min;
  const optimalStart = ((optimal.min - min) / rangeWidth) * 100;
  const valuePosition = Math.max(0, Math.min(100, ((value - min) / rangeWidth) * 100));

  // Determine status color
  let statusColor = 'text-physio-accent-success'; // Green - optimal
  if (value < optimal.min || value > optimal.max) {
    statusColor = 'text-physio-accent-warning'; // Orange - suboptimal
  }
  if (value < min || value > max * 1.5) {
    statusColor = 'text-physio-accent-critical'; // Red - concerning
  }

  return (
    <div className="flex items-center gap-3 flex-1">
      {/* Range visualization */}
      <div className="flex-1 relative h-6 flex items-center">
        {/* Full range background */}
        <div className="absolute inset-0 h-1 bg-physio-bg-core rounded-full border border-physio-border-subtle" />

        {/* Optimal range highlight */}
        <div
          className="absolute h-1 bg-physio-accent-success/30 rounded-full"
          style={{
            left: `${optimalStart}%`,
            width: `${(optimalWidth / rangeWidth) * 100}%`
          }}
        />

        {/* Value marker */}
        <div
          className={`absolute w-2 h-2 rounded-full border-2 border-white shadow-sm ${statusColor.replace('text-', 'bg-')}`}
          style={{ left: `${valuePosition}%`, top: '50%', transform: 'translate(-50%, -50%)' }}
        />
      </div>

      {/* Value display */}
      <div className="flex items-baseline gap-1 min-w-0">
        <span className={`font-bold text-sm ${statusColor}`}>
          {value.toFixed(1)}
        </span>
        <span className="text-xs text-physio-text-tertiary">
          {unit}
        </span>
      </div>
    </div>
  );
};


const VitalSigns = ({
  metrics,
  stack,
  showScoreOnly = false,
  showSafetyOnly = false,
  timeScrubData = null,
}) => {
  // Use time-scrubbed data if available
  const displayMetrics = timeScrubData ? {
    totals: {
      totalBenefit: timeScrubData.benefit || timeScrubData.total || 0,
      totalRisk: timeScrubData.risk || 0,
      netScore: timeScrubData.netScore || (timeScrubData.benefit - timeScrubData.risk) || 0,
      totalAnabolicLoad: timeScrubData.mgEq || timeScrubData.total || 0
    }
  } : metrics;

  const { totalRisk, netScore, brRatio } = displayMetrics.totals;
  const hasActiveStack = Array.isArray(stack) && stack.length > 0;

  // Use centralized pathway loads from stackEngine
  const loads = metrics?.analytics?.pathwayLoads || {
    heart: 0,
    liver: 0,
    neuro: 0,
    estrogen: 0,
  };

  const organLoads = {
    heart: loads.heart || 0,
    liver: loads.liver || 0,
    mind: loads.neuro || 0,
    estrogen: loads.estrogen || 0,
  };

  const riskLevel =
    totalRisk > 8
      ? "Critical"
      : totalRisk > 5
        ? "High"
        : totalRisk > 3
          ? "Moderate"
          : "Low";
  const riskColor =
    totalRisk > 8
      ? "text-physio-accent-critical"
      : totalRisk > 5
        ? "text-physio-accent-warning"
        : "text-physio-accent-success";

  // Default to showing everything if no specific prop is passed
  const showAll = !showScoreOnly && !showSafetyOnly;

  const scoreColor = !hasActiveStack
    ? "text-physio-text-secondary"
    : netScore > 0
      ? "text-physio-accent-cyan"
      : "text-physio-accent-warning";

  const badgeStyles = !hasActiveStack
    ? "bg-physio-bg-highlight border-physio-border-subtle text-physio-text-secondary"
    : brRatio > 1.5
      ? "bg-physio-accent-success/10 border-physio-accent-success/30 text-physio-accent-success"
      : brRatio > 1.0
        ? "bg-physio-accent-cyan/10 border-physio-accent-cyan/30 text-physio-accent-cyan"
        : "bg-physio-accent-critical/10 border-physio-accent-critical/30 text-physio-accent-critical";

  const badgeLabel = !hasActiveStack
    ? "Awaiting Stack"
    : brRatio > 1.5
      ? "Optimized"
      : brRatio > 1.0
        ? "Sustainable"
        : "Diminishing";

  return (
    <div className="space-y-6 relative">
      {/* Time-Scrub Indicator */}
      {timeScrubData && (
        <div className="absolute top-2 right-2 z-10 bg-physio-accent-primary/90 text-white px-2 py-1 rounded text-xs font-bold shadow-lg animate-fade-in">
          {timeScrubData.day !== undefined
            ? `Day ${Math.round(timeScrubData.day)}`
            : timeScrubData.mgEq !== undefined
              ? `${Math.round(timeScrubData.mgEq)} mgEq`
              : 'TIME SCRUB'
          }
        </div>
      )}

      {/* --- SECTION 1: THE NORTH STAR (SCORE) --- */}
      {(showAll || showScoreOnly) && (
        <Card
          variant="core"
          className="shadow-inner relative overflow-hidden p-0"
        >
          {/* Header */}
          <div className="p-4 border-b border-physio-border-subtle bg-physio-bg-surface/50">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-[10px] uppercase tracking-widest text-physio-text-tertiary mb-1">
                  Net Efficiency
                </p>
                <div className="flex items-baseline gap-1">
                  <span
                    className={`text-3xl font-bold ${scoreColor}`}
                  >
                    {hasActiveStack && netScore > 0 ? "+" : ""}
                    {netScore.toFixed(2)}
                  </span>
                  <span className="text-xs text-physio-text-secondary">
                    pts
                  </span>
                </div>
              </div>
              <div
                className={`px-2 py-1 rounded text-[10px] font-bold uppercase tracking-wider border ${badgeStyles}`}
              >
                {badgeLabel}
              </div>
            </div>
          </div>

          {/* The Dual Perspective (Bro vs Scientist) */}
          <div className="grid grid-cols-2 divide-x divide-physio-border-subtle">
            {/* Left: The Gains (Bro Appeal) */}
            <div className="p-3 bg-physio-accent-success/5">
              <p className="text-[9px] uppercase tracking-wider text-physio-text-tertiary mb-1">
                Anabolic Power
              </p>
              <div className="flex items-baseline gap-1">
                <span className="text-xl font-bold text-physio-accent-success">
                  {displayMetrics.totals.totalBenefit.toFixed(1)}
                </span>
                <span className="text-[9px] text-physio-text-tertiary">
                  / 15.0
                </span>
              </div>
              <p className="text-[9px] font-medium text-physio-text-secondary mt-1">
                {displayMetrics.totals.totalBenefit > 10
                  ? "ELITE TIER"
                  : displayMetrics.totals.totalBenefit > 7
                    ? "ADVANCED"
                    : displayMetrics.totals.totalBenefit > 4
                      ? "INTERMEDIATE"
                      : "SPORTS TRT"}
              </p>
            </div>

            {/* Right: The Cost (Scientist Appeal) */}
            <div className="p-3 bg-physio-accent-critical/5">
              <p className="text-[9px] uppercase tracking-wider text-physio-text-tertiary mb-1">
                Systemic Cost
              </p>
              <div className="flex items-baseline gap-1">
                <span className="text-xl font-bold text-physio-accent-critical">
                  {displayMetrics.totals.totalRisk.toFixed(1)}
                </span>
                <span className="text-[9px] text-physio-text-tertiary">
                  / 15.0
                </span>
              </div>
              <p className="text-[9px] font-medium text-physio-text-secondary mt-1">
                {displayMetrics.totals.totalRisk > 10
                  ? "HAZARDOUS"
                  : displayMetrics.totals.totalRisk > 7
                    ? "HIGH RISK"
                    : displayMetrics.totals.totalRisk > 4
                      ? "MANAGEABLE"
                      : "SAFE"}
              </p>
            </div>
          </div>
        </Card>
      )}

      {/* --- SECTION 2: THE BILL (SAFETY & SUPPORT) --- */}
      {(showAll || showSafetyOnly) && (
        <>
          {/* NEW: Clinical Warnings (The "Doctor's Note") */}
          {displayMetrics.warnings && displayMetrics.warnings.length > 0 && (
            <div className="space-y-2 mb-4">
              <h4 className="text-xs uppercase tracking-widest text-physio-accent-critical font-bold border-b border-physio-accent-critical/30 pb-2 flex items-center gap-2">
                <span>⚠️ Clinical Contraindications</span>
              </h4>
              {displayMetrics.warnings.map((warn, idx) => (
                <div
                  key={idx}
                  className={`p-3 rounded-lg border text-xs ${
                    warn.level === "critical"
                      ? "bg-red-950/30 border-red-900/50 text-red-200"
                      : "bg-orange-950/30 border-orange-900/50 text-orange-200"
                  }`}
                >
                  <strong className="block mb-1 uppercase text-xs tracking-wider opacity-80">
                    {warn.type} Warning
                  </strong>
                  {warn.message}
                </div>
              ))}
            </div>
          )}

          {/* Inspector Grid - Visual Biomarker Analysis */}
          <div className="space-y-6">
            {/* LIPIDS Section */}
            <div className="space-y-3">
              <h4 className="text-xs uppercase tracking-widest text-physio-text-primary font-bold border-b border-physio-border-subtle pb-2 flex items-center gap-2">
                <span className="text-lg">🫀</span> Lipids
              </h4>
              <div className="grid grid-cols-2 gap-3">
                <PhlebotomistCell
                  label="Total Cholesterol"
                  value={185}
                  min={0}
                  max={300}
                  safeMax={200}
                  unit="mg/dL"
                />
                <PhlebotomistCell
                  label="LDL"
                  value={105}
                  min={0}
                  max={200}
                  safeMax={100}
                  unit="mg/dL"
                  isCritical={105 > 100}
                />
                <PhlebotomistCell
                  label="HDL"
                  value={55}
                  min={0}
                  max={100}
                  safeMax={40}
                  unit="mg/dL"
                />
                <PhlebotomistCell
                  label="Triglycerides"
                  value={95}
                  min={0}
                  max={200}
                  safeMax={150}
                  unit="mg/dL"
                />
              </div>
            </div>

            {/* HORMONES Section */}
            <div className="space-y-3">
              <h4 className="text-xs uppercase tracking-widest text-physio-text-primary font-bold border-b border-physio-border-subtle pb-2 flex items-center gap-2">
                <span className="text-lg">⚡</span> Hormones
              </h4>
              <div className="grid grid-cols-2 gap-3">
                <PhlebotomistCell
                  label="Testosterone"
                  value={650}
                  min={0}
                  max={1000}
                  safeMax={800}
                  unit="ng/dL"
                />
                <PhlebotomistCell
                  label="Cortisol"
                  value={18}
                  min={0}
                  max={30}
                  safeMax={25}
                  unit="μg/dL"
                />
                <PhlebotomistCell
                  label="SHBG"
                  value={25}
                  min={0}
                  max={50}
                  safeMax={40}
                  unit="nmol/L"
                />
                <PhlebotomistCell
                  label="Prolactin"
                  value={8}
                  min={0}
                  max={20}
                  safeMax={15}
                  unit="ng/mL"
                />
              </div>
            </div>

            {/* ORGANS Section */}
            <div className="space-y-3">
              <h4 className="text-xs uppercase tracking-widest text-physio-text-primary font-bold border-b border-physio-border-subtle pb-2 flex items-center gap-2">
                <span className="text-lg">🫘</span> Organ Function
              </h4>
              <div className="grid grid-cols-2 gap-3">
                <PhlebotomistCell
                  label="ALT"
                  value={32}
                  min={0}
                  max={100}
                  safeMax={40}
                  unit="U/L"
                />
                <PhlebotomistCell
                  label="AST"
                  value={28}
                  min={0}
                  max={100}
                  safeMax={40}
                  unit="U/L"
                />
                <PhlebotomistCell
                  label="ALP"
                  value={85}
                  min={0}
                  max={150}
                  safeMax={120}
                  unit="U/L"
                />
                <PhlebotomistCell
                  label="Bilirubin"
                  value={0.8}
                  min={0}
                  max={2.0}
                  safeMax={1.2}
                  unit="mg/dL"
                />
                <PhlebotomistCell
                  label="Glucose"
                  value={92}
                  min={0}
                  max={140}
                  safeMax={100}
                  unit="mg/dL"
                />
                <PhlebotomistCell
                  label="Insulin"
                  value={8}
                  min={0}
                  max={25}
                  safeMax={15}
                  unit="μIU/mL"
                />
              </div>
            </div>
          </div>

          {/* Ancillary Checklist (HIDDEN) */}
          {/* 
          {ancillaries && ancillaries.essential.length > 0 ? (
            <div className="p-4 bg-physio-accent-warning/5 border border-physio-accent-warning/20 rounded-xl">
              <div className="flex items-center justify-between mb-2">
                <h4 className="text-xs font-bold text-physio-accent-warning uppercase tracking-wide">
                  Required Support
                </h4>
                <span className="text-xs text-physio-text-secondary">
                  ${ancillaries.totalWeeklyCost}/wk
                </span>
              </div>
              <ul className="space-y-2">
                {ancillaries.essential.map((med, i) => (
                  <li key={i} className="flex items-start gap-2 text-xs text-physio-text-secondary">
                    <span className="text-physio-accent-warning mt-0.5">●</span>
                    <span>
                      <span className="font-semibold text-physio-text-primary">{med.drug}</span>
                      <span className="block text-xs text-physio-text-tertiary">{med.dosing}</span>
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          ) : (
             stack.length > 0 && (
              <div className="p-4 bg-physio-bg-surface border border-physio-border-subtle rounded-xl flex items-center gap-3 opacity-60">
                <div className="w-6 h-6 rounded-full bg-physio-accent-success/10 flex items-center justify-center text-physio-accent-success text-xs">✓</div>
                <p className="text-xs text-physio-text-tertiary">No essential ancillaries triggered.</p>
              </div>
            )
          )} 
          */}
        </>
      )}
    </div>
  );
};

export default VitalSigns;
