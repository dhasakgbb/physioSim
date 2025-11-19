import React from 'react';
import { compoundData } from '../../data/compoundData';

const InteractionSummaryCard = ({
  pair,
  scoringLabel = 'Net benefit − risk',
  benefitSynergy,
  riskSynergy,
  evidenceBlend
}) => {
  if (!pair) return null;

  const [compoundA, compoundB] = pair.compounds;
  const nameA = compoundData[compoundA]?.name || compoundA;
  const nameB = compoundData[compoundB]?.name || compoundB;

  // Calculate evidence percentages
  const pairEvidence = pair.evidence || {};
  const totalWeight = (pairEvidence.clinical || 0) + (pairEvidence.anecdote || 0);
  const clinicalShare = totalWeight
    ? Math.round(((pairEvidence.clinical || 0) / totalWeight) * 100)
    : Math.round((1 - evidenceBlend) * 100);
  const anecdoteShare = 100 - clinicalShare;

  // Format synergy strings
  const benefitSign = benefitSynergy >= 0 ? '+' : '';
  const riskSign = riskSynergy <= 0 ? '' : '+'; // +Risk is bad, but we show sign for clarity

  return (
    <div className="bg-physio-bg-core border border-physio-bg-border rounded-2xl p-5 shadow-sm relative overflow-hidden">
      {/* Radial gradient hint */}
      <div className="absolute top-0 right-0 w-64 h-64 bg-physio-accent-primary/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/3 pointer-events-none" />

      <div className="relative z-10 flex flex-col md:flex-row md:items-start md:justify-between gap-4">
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <h3 className="text-xl font-bold text-physio-text-primary tracking-tight">
              {nameA} <span className="text-physio-text-tertiary">+</span> {nameB}
            </h3>
            {pair.tags && pair.tags.map(tag => (
              <span key={tag} className="px-2 py-0.5 rounded-full bg-physio-bg-surface border border-physio-bg-border text-[10px] uppercase tracking-wide text-physio-text-secondary">
                {tag}
              </span>
            ))}
          </div>
          
          <p className="text-sm text-physio-text-secondary max-w-xl leading-relaxed">
            {pair.summary || 'Interaction modeled based on pharmacological pathways and anecdotal aggregates.'}
          </p>
          
          {/* Insight / Synergy One-Liner */}
          <div className="flex flex-wrap gap-3 pt-1">
            <div className="flex items-center gap-1.5 text-xs">
              <span className="text-physio-text-tertiary uppercase tracking-wide">Synergy Gain</span>
              <span className={`font-semibold ${benefitSynergy >= 0 ? 'text-physio-accent-success' : 'text-physio-text-secondary'}`}>
                {benefitSign}{benefitSynergy.toFixed(1)}% Benefit
              </span>
            </div>
            <div className="w-px h-3 bg-physio-bg-border self-center" />
            <div className="flex items-center gap-1.5 text-xs">
              <span className="text-physio-text-tertiary uppercase tracking-wide">Risk Modifier</span>
              <span className={`font-semibold ${riskSynergy > 0 ? 'text-physio-accent-critical' : 'text-physio-accent-success'}`}>
                {riskSign}{riskSynergy.toFixed(1)}% Risk
              </span>
            </div>
          </div>
        </div>

        <div className="flex flex-col items-end gap-2 min-w-[140px]">
           <div className="text-right">
            <div className="text-[10px] uppercase tracking-wide text-physio-text-tertiary mb-0.5">Evidence Mix</div>
            <div className="flex items-center justify-end gap-2 text-xs font-medium text-physio-text-secondary">
              <span className={clinicalShare > 50 ? 'text-physio-text-primary' : ''}>{clinicalShare}% Clinical</span>
              <div className="w-16 h-1.5 bg-physio-bg-surface rounded-full overflow-hidden">
                <div 
                  className="h-full bg-physio-accent-primary" 
                  style={{ width: `${clinicalShare}%` }}
                />
              </div>
            </div>
           </div>
           
           <div className="text-right mt-1">
             <div className="text-[10px] uppercase tracking-wide text-physio-text-tertiary mb-0.5">Scoring Model</div>
             <div className="text-xs font-medium text-physio-text-primary">{scoringLabel}</div>
           </div>
        </div>
      </div>
    </div>
  );
};

export default InteractionSummaryCard;

