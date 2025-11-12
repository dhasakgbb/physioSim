import React from 'react';
import { compoundData } from '../data/compoundData';

const confidenceLabel = (score) => {
  if (score >= 0.75) return 'High confidence (Tier 1 heavy)';
  if (score >= 0.55) return 'Mixed clinical + modeling';
  if (score >= 0.4) return 'Modeled / extrapolated';
  return 'Experimental / anecdotal';
};

const compoundTypesForTab = (activeTab) => {
  if (activeTab === 'injectables') return ['injectable'];
  if (activeTab === 'orals') return ['oral'];
  return ['injectable', 'oral'];
};

const EvidencePanel = ({ activeTab, visibleCompounds }) => {
  const typeFilter = compoundTypesForTab(activeTab);
  const compounds = Object.entries(compoundData).filter(
    ([key, data]) => typeFilter.includes(data.type) && visibleCompounds[key]
  );

  if (!compounds.length) return null;

  return (
    <section className="mt-10 bg-physio-bg-core border-2 border-physio-bg-border rounded-2xl p-6 shadow-lg">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-5">
        <div>
          <h3 className="text-xl font-bold text-physio-text-primary">Evidence & Confidence Layer</h3>
          <p className="text-sm text-physio-text-secondary">
            Each visible compound carries a provenance badge: human vs. animal vs. aggregate citations,
            model confidence, and the dominant variance drivers.
          </p>
        </div>
        <p className="text-xs text-physio-text-tertiary">
          Want the full traceability? Click ⓘ in the legend for methodology notes.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {compounds.map(([key, data]) => {
          const provenance = data.evidenceProvenance || { human: 0, animal: 0, aggregate: 0 };
          const varianceDrivers = data.varianceDrivers || [];
          const score = data.modelConfidence ?? 0;
          const label = confidenceLabel(score);

          return (
            <article
              key={key}
              className="border border-physio-bg-border rounded-xl p-4 bg-physio-bg-secondary shadow-inner flex flex-col gap-3"
            >
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-sm font-bold uppercase tracking-wide" style={{ color: data.color }}>
                    {data.abbreviation}
                  </div>
                  <div className="text-xs text-physio-text-secondary">{data.name}</div>
                </div>
                <div className="text-right">
                  <div className="text-lg font-bold text-physio-text-primary">
                    {score?.toFixed(2)}
                  </div>
                  <div className="text-[11px] text-physio-text-tertiary">{label}</div>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-2 text-center text-xs">
                <div className="bg-physio-bg-core rounded-lg p-2 border border-green-400/40">
                  <div className="text-[10px] uppercase text-physio-text-tertiary">Human</div>
                  <div className="text-lg font-bold text-green-400">{provenance.human}</div>
                </div>
                <div className="bg-physio-bg-core rounded-lg p-2 border border-amber-400/40">
                  <div className="text-[10px] uppercase text-physio-text-tertiary">Animal</div>
                  <div className="text-lg font-bold text-amber-400">{provenance.animal}</div>
                </div>
                <div className="bg-physio-bg-core rounded-lg p-2 border border-physio-accent-cyan/40">
                  <div className="text-[10px] uppercase text-physio-text-tertiary">Aggregate</div>
                  <div className="text-lg font-bold text-physio-accent-cyan">{provenance.aggregate}</div>
                </div>
              </div>

              <div className="text-xs text-physio-text-secondary">
                <span className="font-semibold text-physio-text-primary">Variance drivers:</span>{' '}
                {varianceDrivers.length ? varianceDrivers.join(' • ') : 'General population variance (±20-30%).'}
              </div>
            </article>
          );
        })}
      </div>
    </section>
  );
};

export default EvidencePanel;
