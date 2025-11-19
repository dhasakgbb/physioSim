import React from "react";
import { compoundData } from "../data/compoundData";

const formatScore = (value) => {
  if (value === undefined || value === null) return "—";
  return Number(value).toFixed(2);
};

const HoverAnalyticsTooltip = ({
  active,
  payload,
  label,
  unit = "mg",
  visibleCompounds,
  mode = "benefit",
}) => {
  if (!active || !payload || !payload.length) {
    return null;
  }

  const row = payload[0]?.payload;
  if (!row) return null;

  // Filter to show only active compounds
  const entries = Object.entries(compoundData)
    .filter(([key]) => visibleCompounds?.[key])
    .map(([key, data]) => {
      const benefit = row[`${key}-benefit-value`];
      const risk = row[`${key}-risk-value`];
      const efficiency = row[`${key}-efficiency-value`];

      if (benefit === undefined && risk === undefined) return null;

      // Check for guardrails
      const benefitMeta = row[`${key}-benefit-meta`];
      const riskMeta = row[`${key}-risk-meta`];
      const meta = benefitMeta || riskMeta || {};

      const isPlateau = meta.nearingPlateau;
      const isBeyond = meta.beyondEvidence;

      return {
        key,
        label: data.abbreviation,
        color: data.color,
        benefit,
        risk,
        efficiency,
        isPlateau,
        isBeyond,
      };
    })
    .filter(Boolean)
    // Sort by value descending based on current mode
    .sort((a, b) => {
      if (mode === "risk") return (b.risk || 0) - (a.risk || 0);
      if (mode === "efficiency")
        return (b.efficiency || 0) - (a.efficiency || 0);
      return (b.benefit || 0) - (a.benefit || 0);
    });

  if (!entries.length) return null;

  return (
    <div className="bg-physio-bg-core border border-physio-border-active rounded-md shadow-2xl min-w-[220px] overflow-hidden ring-1 ring-black/50">
      <div className="bg-physio-bg-subtle px-3 py-2 border-b border-physio-border-subtle flex justify-between items-center">
        <span className="text-[10px] uppercase tracking-wider text-physio-text-tertiary font-bold">
          Weekly Dose
        </span>
        <span className="text-xs font-bold text-physio-text-primary font-mono">
          {label}{" "}
          <span className="text-[10px] text-physio-text-secondary font-sans">
            {unit.trim()}
          </span>
        </span>
      </div>

      <div className="p-2 flex flex-col gap-px">
        {entries.map((item) => (
          <div
            key={item.key}
            className="flex items-center justify-between py-1.5 px-2 rounded hover:bg-physio-bg-surface/50 transition-colors group"
          >
            <div className="flex items-center gap-2">
              <div
                className="w-1.5 h-1.5 rounded-sm shadow-sm"
                style={{ backgroundColor: item.color }}
              />
              <span className="text-xs font-medium text-physio-text-secondary group-hover:text-physio-text-primary transition-colors">
                {item.label}
              </span>
              {item.isPlateau && (
                <span className="text-[9px] font-bold text-physio-accent-amber px-1 bg-physio-accent-amber/10 rounded">
                  PLATEAU
                </span>
              )}
              {item.isBeyond && (
                <span className="text-[9px] font-bold text-physio-accent-red px-1 bg-physio-accent-red/10 rounded">
                  CAP
                </span>
              )}
            </div>

            <div className="flex items-center gap-3 text-xs font-mono">
              {mode === "benefit" && (
                <span className="text-physio-text-primary font-bold">
                  {formatScore(item.benefit)}
                </span>
              )}
              {mode === "risk" && (
                <span className="text-physio-accent-red font-bold">
                  {formatScore(item.risk)}
                </span>
              )}
              {mode === "efficiency" && (
                <span className="text-physio-accent-cyan font-bold">
                  {formatScore(item.efficiency)}
                </span>
              )}

              {/* Secondary metric in lighter text */}
              {mode === "benefit" && (
                <span className="text-physio-text-tertiary text-[10px] w-8 text-right opacity-60">
                  {formatScore(item.risk)} R
                </span>
              )}
              {mode === "risk" && (
                <span className="text-physio-text-tertiary text-[10px] w-8 text-right opacity-60">
                  {formatScore(item.benefit)} B
                </span>
              )}
            </div>
          </div>
        ))}
      </div>

      {entries.some((e) => e.isPlateau || e.isBeyond) && (
        <div className="px-3 py-2 bg-physio-bg-subtle border-t border-physio-border-subtle text-[10px] text-physio-text-secondary leading-tight">
          {entries.some((e) => e.isBeyond)
            ? "Includes extrapolated data > known clinical ranges."
            : " diminishing returns detected."}
        </div>
      )}
    </div>
  );
};

export default HoverAnalyticsTooltip;
