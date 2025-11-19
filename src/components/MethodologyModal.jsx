import React, { useState } from 'react';
import Button from './ui/Button';
import { compoundData, tierDescriptions } from '../data/compoundData';

const describeConfidence = (score = 0) => {
  if (score >= 0.75) return 'High confidence — human clinical anchors dominate.';
  if (score >= 0.55) return 'Moderate confidence — mix of human data + extrapolation.';
  if (score >= 0.4) return 'Caution — modeled/animal data heavy.';
  return 'Experimental — primarily anecdotal inputs.';
};

const MethodologyModal = ({ compound, onClose }) => {
  const [expandedSections, setExpandedSections] = useState({
    benefit: false,
    risk: false,
    sources: false,
    limitations: true, // Start with limitations expanded (most important)
    assumptions: false,
    variance: false,
    tiers: false
  });

  const toggleSection = (section) => {
    setExpandedSections(prev => ({
      ...prev,
      [section]: !prev[section]
    }));
  };

  if (!compound) return null;

  const data = compoundData[compound];
  if (!data) return null;

  const CollapsibleSection = ({ id, icon, title, children, bgColor = 'bg-physio-bg-subtle' }) => {
    const isExpanded = expandedSections[id];
    return (
      <section className="border border-physio-bg-border rounded-lg overflow-hidden">
        <button
          onClick={() => toggleSection(id)}
          className="w-full flex items-center justify-between p-4 hover:bg-physio-bg-core transition-colors"
        >
          <h3 className="text-lg font-bold text-physio-text-primary flex items-center">
            <span className="mr-2">{icon}</span>
            {title}
          </h3>
          <span className="text-2xl text-physio-text-tertiary">
            {isExpanded ? '−' : '+'}
          </span>
        </button>
        {isExpanded && (
          <div className={`p-4 border-t border-physio-bg-border ${bgColor}`}>
            {children}
          </div>
        )}
      </section>
    );
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
      <div className="bg-physio-bg-secondary rounded-lg max-w-4xl max-h-[90vh] overflow-y-auto shadow-2xl">
        <div className="sticky top-0 bg-physio-bg-secondary border-b-2 border-physio-bg-border p-6 flex justify-between items-start z-10">
          <div>
            <h2 className="text-2xl font-bold" style={{ color: data.color }}>
              {data.name} ({data.abbreviation})
            </h2>
            <p className="text-physio-text-secondary mt-1">Evidence-Based Methodology</p>
          </div>
          <Button
            onClick={onClose}
            variant="ghost"
          >
            Close
          </Button>
        </div>

        <div className="p-6 space-y-3">
          {/* Evidence Summary (Always visible) */}
          <div className="bg-physio-bg-tertiary p-4 rounded-lg border-2 border-physio-bg-border">
            <h3 className="text-lg font-bold text-physio-text-primary mb-2 flex items-center">
              <span className="mr-2">📊</span>
              Evidence Hierarchy
            </h3>
            <p className="text-physio-text-primary font-semibold">{data.methodology.summary}</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div className="border border-physio-bg-border rounded-lg p-4 bg-physio-bg-core">
              <div className="text-sm font-semibold text-physio-text-secondary mb-1">Model Confidence</div>
              <div className="text-3xl font-bold text-physio-text-primary">
                {(data.modelConfidence ?? 0).toFixed(2)}
              </div>
              <p className="text-xs text-physio-text-tertiary mt-1">{describeConfidence(data.modelConfidence)}</p>
              {data.varianceDrivers && (
                <div className="mt-2 text-xs text-physio-text-secondary">
                  <span className="font-semibold text-physio-text-primary">Variance drivers:</span>{' '}
                  {data.varianceDrivers.join(' • ')}
                </div>
              )}
            </div>

            <div className="border border-physio-bg-border rounded-lg p-4 bg-physio-bg-core">
              <div className="text-sm font-semibold text-physio-text-secondary mb-2">Data Provenance</div>
              <div className="grid grid-cols-3 gap-2 text-center text-xs">
                <div className="bg-physio-bg-secondary rounded-lg p-2">
                  <div className="uppercase text-[10px] text-physio-text-tertiary">Human</div>
                  <div className="text-xl font-bold text-physio-accent-success">
                    {data.evidenceProvenance?.human ?? 0}
                  </div>
                </div>
                <div className="bg-physio-bg-secondary rounded-lg p-2">
                  <div className="uppercase text-[10px] text-physio-text-tertiary">Animal</div>
                  <div className="text-xl font-bold text-physio-accent-warning">
                    {data.evidenceProvenance?.animal ?? 0}
                  </div>
                </div>
                <div className="bg-physio-bg-secondary rounded-lg p-2">
                  <div className="uppercase text-[10px] text-physio-text-tertiary">Aggregate</div>
                  <div className="text-xl font-bold text-physio-accent-cyan">
                    {data.evidenceProvenance?.aggregate ?? 0}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Limitations (Start expanded - most important) */}
          <CollapsibleSection id="limitations" icon="🚨" title="Key Limitations" bgColor="bg-physio-accent-critical/10">
            <ul className="list-disc list-inside space-y-2">
              {data.methodology.limitations.map((limitation, idx) => (
                <li key={idx} className="text-physio-accent-critical">{limitation}</li>
              ))}
            </ul>
          </CollapsibleSection>

          {/* Benefit Rationale */}
          <CollapsibleSection id="benefit" icon="💪" title="Benefit Curve Rationale">
            <p className="text-physio-text-secondary leading-relaxed">{data.methodology.benefitRationale}</p>
          </CollapsibleSection>

          {/* Risk Rationale */}
          <CollapsibleSection id="risk" icon="⚠️" title="Risk Curve Rationale">
            <p className="text-physio-text-secondary leading-relaxed">{data.methodology.riskRationale}</p>
          </CollapsibleSection>

          {/* Sources */}
          <CollapsibleSection id="sources" icon="📚" title="Key Sources">
            <ul className="list-disc list-inside space-y-2">
              {data.methodology.sources.map((source, idx) => (
                <li key={idx} className="text-physio-text-secondary">{source}</li>
              ))}
            </ul>
          </CollapsibleSection>

          {/* Assumptions */}
          <CollapsibleSection id="assumptions" icon="✓" title="Model Assumptions" bgColor="bg-physio-accent-primary/10">
            <ul className="list-disc list-inside space-y-2">
              {data.methodology.assumptions.map((assumption, idx) => (
                <li key={idx} className="text-physio-accent-primary">{assumption}</li>
              ))}
            </ul>
          </CollapsibleSection>

          {/* Individual Variance */}
          <CollapsibleSection id="variance" icon="👤" title="Individual Variance Factors" bgColor="bg-physio-accent-warning/10">
            <ul className="list-disc list-inside space-y-2">
              {data.methodology.individualVariance.map((variance, idx) => (
                <li key={idx} className="text-physio-text-primary">{variance}</li>
              ))}
            </ul>
          </CollapsibleSection>

          {/* Tier Descriptions */}
          <CollapsibleSection id="tiers" icon="📋" title="Evidence Tier System">
            <div className="space-y-3">
              {Object.entries(tierDescriptions).map(([tier, description]) => (
                <div key={tier} className="border-l-4 border-gray-400 pl-4">
                  <div className="font-bold text-physio-text-primary">{tier}</div>
                  <div className="text-sm text-physio-text-secondary">{description}</div>
                </div>
              ))}
            </div>
          </CollapsibleSection>
        </div>
      </div>
    </div>
  );
};

export default MethodologyModal;
