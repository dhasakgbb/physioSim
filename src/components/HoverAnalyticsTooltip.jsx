import React from 'react';
import { compoundData } from '../data/compoundData';

const formatScore = (value) => {
  if (value === undefined || value === null) return '—';
  return Number(value).toFixed(2);
};

const formatDelta = (value) => {
  if (value === undefined || value === null) return 'n/a';
  const rounded = Number(value).toFixed(2);
  return value >= 0 ? `+${rounded}` : rounded;
};

const HoverAnalyticsTooltip = ({ active, payload, label, unit = 'mg', visibleCompounds }) => {
  if (!active || !payload || !payload.length) {
    return null;
  }

  const row = payload[0]?.payload;
  if (!row) return null;

  const entries = Object.entries(compoundData)
    .filter(([key]) => visibleCompounds?.[key])
    .map(([key, data]) => {
      const benefit = row[`${key}-benefit-value`] ?? row[`${key}_benefit`];
      const risk = row[`${key}-risk-value`] ?? row[`${key}_risk`];
      if (benefit === undefined && risk === undefined) return null;

      const prevDose = row[`${key}-benefit-prevDose`] ?? row[`${key}-risk-prevDose`];
      const deltaBenefit = row[`${key}-benefit-delta`];
      const deltaRisk = row[`${key}-risk-delta`];

      return {
        key,
        label: data.abbreviation,
        color: data.color,
        benefit,
        risk,
        prevDose,
        deltaBenefit,
        deltaRisk
      };
    })
    .filter(Boolean);

  if (!entries.length) return null;

  return (
    <div className="bg-physio-bg-core border border-physio-bg-border rounded-xl p-3 shadow-xl min-w-[240px] max-w-sm">
      <div className="text-xs text-physio-text-tertiary mb-2">
        Dose: <span className="font-semibold text-physio-text-primary">{label}{unit}</span>
      </div>
      <div className="space-y-2">
        {entries.map(item => (
          <div key={item.key} className="text-xs">
            <div className="flex items-center justify-between">
              <span className="font-semibold" style={{ color: item.color }}>
                {item.label}
              </span>
              <span className="text-physio-text-secondary">
                Benefit {formatScore(item.benefit)} | Risk {formatScore(item.risk)}
              </span>
            </div>
            {item.prevDose !== null && item.prevDose !== undefined && (
              <div className="text-[11px] text-physio-text-tertiary mt-0.5">
                {item.prevDose}→{label}{unit} • ΔBenefit {formatDelta(item.deltaBenefit)} vs ΔRisk {formatDelta(item.deltaRisk)}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};

export default HoverAnalyticsTooltip;
