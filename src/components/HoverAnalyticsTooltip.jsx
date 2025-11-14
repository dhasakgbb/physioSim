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

const HoverAnalyticsTooltip = ({
  active,
  payload,
  label,
  unit = 'mg',
  visibleCompounds,
  mode = 'benefit'
}) => {
  if (!active || !payload || !payload.length) {
    return null;
  }

  const row = payload[0]?.payload;
  if (!row) return null;
  const trimmedUnit = unit?.trim() || 'mg';

  const entries = Object.entries(compoundData)
    .filter(([key]) => visibleCompounds?.[key])
    .map(([key, data]) => {
      const benefit = row[`${key}-benefit-value`];
      const risk = row[`${key}-risk-value`];
      const efficiency = row[`${key}-efficiency-value`];
      if (benefit === undefined && risk === undefined && efficiency === undefined) return null;

      const prevDose = row[`${key}-benefit-prevDose`] ?? row[`${key}-risk-prevDose`];
      const deltaBenefit = row[`${key}-benefit-delta`];
      const deltaRisk = row[`${key}-risk-delta`];
      const benefitMeta = row[`${key}-benefit-meta`];
      const riskMeta = row[`${key}-risk-meta`];
      const metaSources = [benefitMeta, riskMeta].filter(Boolean);
      const plateauDose =
        metaSources.find(source => typeof source?.plateauDose === 'number')?.plateauDose ?? null;
      const hardMax =
        metaSources.find(source => typeof source?.hardMax === 'number')?.hardMax ?? null;
      const clampedEntry = metaSources.find(
        source => source && source.clampedDose !== undefined && source.requestedDose !== undefined
      );
      const clamped =
        metaSources.some(
          source =>
            source &&
            source.clampedDose !== undefined &&
            source.requestedDose !== undefined &&
            source.clampedDose !== source.requestedDose
        ) || false;
      const beyondEvidence = metaSources.some(source => source?.beyondEvidence);
      const nearingPlateau = metaSources.some(source => source?.nearingPlateau);
      const guardrailCaption = [];
      if (nearingPlateau && plateauDose !== null) {
        guardrailCaption.push(`Plateau kicks in near ${plateauDose} ${trimmedUnit}.`);
      }
      if (beyondEvidence && hardMax !== null) {
        guardrailCaption.push(`Outside evidence (> ${hardMax} ${trimmedUnit}). Values are damped.`);
      }
      if (clamped && clampedEntry) {
        guardrailCaption.push(
          `Requested ${clampedEntry.requestedDose} ${trimmedUnit} but clamped to ${clampedEntry.clampedDose} ${trimmedUnit}.`
        );
      }

      return {
        key,
        label: data.abbreviation,
        color: data.color,
        benefit,
        risk,
        prevDose,
        deltaBenefit,
        deltaRisk,
        guardrails: {
          plateauDose,
          hardMax,
          clamped,
          clampedDose: clampedEntry?.clampedDose ?? null,
          requestedDose: clampedEntry?.requestedDose ?? null,
          beyondEvidence,
          nearingPlateau,
          caption: guardrailCaption.join(' '),
          active: Boolean(nearingPlateau || beyondEvidence || clamped)
        },
        efficiency
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
        {entries.map(item => {
          const showBenefit = mode === 'benefit' || mode === 'efficiency' || mode === 'uncertainty';
          const showRisk = mode === 'risk' || mode === 'efficiency' || mode === 'uncertainty';
          const showEfficiency = mode === 'efficiency';
          return (
            <div key={item.key} className="text-xs">
              <div className="flex items-center justify-between">
                <span className="font-semibold" style={{ color: item.color }}>
                  {item.label}
                </span>
                <div className="text-physio-text-secondary flex flex-col items-end leading-tight">
                  {showBenefit && (
                    <span>Benefit {formatScore(item.benefit)}</span>
                  )}
                  {showRisk && (
                    <span>Risk {formatScore(item.risk)}</span>
                  )}
                  {showEfficiency && (
                    <span>Efficiency {formatScore(item.efficiency)}</span>
                  )}
                </div>
              </div>
              {item.prevDose !== null && item.prevDose !== undefined && (
                <div className="text-[11px] text-physio-text-tertiary mt-0.5">
                  {item.prevDose}→{label}{unit} • ΔBenefit {formatDelta(item.deltaBenefit)} vs ΔRisk {formatDelta(item.deltaRisk)}
                </div>
              )}
              {item.guardrails?.active && (
                <div className="flex flex-wrap gap-1 mt-1">
                  {item.guardrails.nearingPlateau && item.guardrails.plateauDose !== null && (
                    <span className="px-2 py-0.5 rounded-full bg-physio-warning/10 border border-physio-warning/30 text-[10px] text-physio-warning font-semibold">
                      Plateau @ {item.guardrails.plateauDose} {trimmedUnit}
                    </span>
                  )}
                  {item.guardrails.beyondEvidence && item.guardrails.hardMax !== null && (
                    <span className="px-2 py-0.5 rounded-full bg-physio-error/10 border border-physio-error/30 text-[10px] text-physio-error font-semibold">
                      Outside evidence &gt; {item.guardrails.hardMax} {trimmedUnit}
                    </span>
                  )}
                  {item.guardrails.clamped && item.guardrails.clampedDose !== null && (
                    <span className="px-2 py-0.5 rounded-full bg-physio-warning/5 border border-physio-warning/30 text-[10px] text-physio-text-primary font-semibold">
                      Clamped to {item.guardrails.clampedDose} {trimmedUnit}
                    </span>
                  )}
                </div>
              )}
              {item.guardrails?.caption && (
                <p className="text-[11px] text-physio-text-tertiary mt-0.5">{item.guardrails.caption}</p>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default HoverAnalyticsTooltip;
