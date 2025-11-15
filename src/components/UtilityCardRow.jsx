import React from 'react';
import SweetSpotFinder from './SweetSpotFinder';
import PDFExport from './PDFExport';

const CardShell = ({ title, accent, children, helper }) => (
  <div className="group relative overflow-hidden rounded-[28px] border border-physio-bg-border/70 bg-gradient-to-br from-physio-bg-secondary/90 via-physio-bg-core/80 to-physio-bg-secondary/60 p-4 shadow-[0_25px_80px_rgba(0,0,0,0.45)] transition-shadow duration-200">
    <div className="pointer-events-none absolute inset-0 opacity-0 group-hover:opacity-100 bg-[radial-gradient(circle_at_top,var(--physio-accent-cyan)/0.12,transparent_65%)] transition-opacity duration-300" />
    <div className="relative flex items-center justify-between">
      <h3 className={`text-sm font-semibold tracking-wide ${accent}`}>
        {title}
      </h3>
      {helper && <span className="text-[11px] uppercase tracking-wide text-physio-text-tertiary">{helper}</span>}
    </div>
    <div className="relative flex flex-col gap-3 mt-3">
      {children}
    </div>
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
        title="Sweet Spot"
        accent="text-physio-accent-cyan"
        helper="Personal"
      >
        <SweetSpotFinder
          compoundType={compoundType}
          visibleCompounds={visibleCompounds}
          userProfile={userProfile}
          variant="inline"
        />
      </CardShell>

      <CardShell
        title="PDF Brief"
        accent="text-physio-accent-violet"
        helper="Export"
      >
        <p className="text-xs text-physio-text-secondary">
          Capture the current chart, guardrails, and methodology copy for offline review.
        </p>
        <PDFExport chartRef={chartRef} />
      </CardShell>

      <CardShell
        title="Model Panel"
        accent="text-physio-text-secondary"
        helper="Profile"
      >
        <p className="text-xs text-physio-text-secondary">
          Adjust personalization levers and save presets for future sessions.
        </p>
        <div className="flex gap-2">
          <button
            type="button"
            onClick={onOpenProfile}
            className="flex-1 px-4 py-2 rounded-full border border-physio-accent-mint text-sm font-semibold text-physio-accent-mint hover:bg-physio-accent-mint hover:text-physio-bg-core transition"
          >
            Open panel
          </button>
        </div>
      </CardShell>
    </div>
  );
};

export default UtilityCardRow;
