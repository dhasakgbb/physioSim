import React from 'react';
import SweetSpotFinder from './SweetSpotFinder';
import PDFExport from './PDFExport';

const CardShell = ({ title, accent, children, helper }) => (
  <div className="bg-physio-bg-secondary/80 border border-physio-bg-border rounded-2xl p-4 shadow-physio-subtle flex flex-col gap-3">
    <div className="flex items-center justify-between">
      <h3 className={`text-sm font-semibold ${accent}`}>
        {title}
      </h3>
      {helper && <span className="text-[11px] uppercase tracking-wide text-physio-text-tertiary">{helper}</span>}
    </div>
    {children}
  </div>
);

const UtilityCardRow = ({
  compoundType,
  visibleCompounds,
  userProfile,
  chartRef,
  onOpenProfile
}) => {
  return (
    <div className="grid gap-4 md:grid-cols-3">
      <CardShell
        title="Sweet Spot Finder"
        accent="text-physio-accent-cyan"
        helper="Personalized"
      >
        <SweetSpotFinder
          compoundType={compoundType}
          visibleCompounds={visibleCompounds}
          userProfile={userProfile}
          variant="inline"
        />
      </CardShell>

      <CardShell
        title="PDF Intelligence Brief"
        accent="text-physio-accent-violet"
        helper="Export"
      >
        <p className="text-xs text-physio-text-secondary">
          Capture the current chart, guardrails, and methodology overview in a polished PDF for offline review.
        </p>
        <PDFExport chartRef={chartRef} />
      </CardShell>

      <CardShell
        title="Model Settings"
        accent="text-physio-text-secondary"
        helper="Profile"
      >
        <p className="text-xs text-physio-text-secondary">
          Adjust personalization levers (age, SHBG, aromatase, anxiety) and save presets for future sessions.
        </p>
        <div className="flex gap-2">
          <button
            type="button"
            onClick={onOpenProfile}
            className="flex-1 px-4 py-2 rounded-full border border-physio-accent-mint text-sm font-semibold text-physio-accent-mint hover:bg-physio-accent-mint hover:text-physio-bg-core transition"
          >
            Open settings
          </button>
        </div>
      </CardShell>
    </div>
  );
};

export default UtilityCardRow;
