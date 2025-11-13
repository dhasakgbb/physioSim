import React from 'react';
import ViewToggle from './ViewToggle';
import SweetSpotFinder from './SweetSpotFinder';
import PDFExport from './PDFExport';

const ChartControlBar = ({
  viewMode,
  setViewMode,
  compoundType,
  visibleCompounds,
  userProfile,
  chartRef
}) => {
  const filtersDirty = Object.values(visibleCompounds || {}).some(value => !value);

  return (
    <div className="sticky top-20 z-20 mb-4">
      <div className="bg-physio-bg-secondary/90 border border-physio-bg-border rounded-2xl shadow-physio-subtle px-4 py-3 backdrop-blur">
        <div className="flex flex-col gap-3 md:flex-row md:items-center">
          <div className="flex flex-wrap items-center gap-3 text-sm">
            <span className="text-xs uppercase tracking-wide text-physio-text-tertiary">
              Show
            </span>
            <ViewToggle viewMode={viewMode} setViewMode={setViewMode} />
            {filtersDirty && (
              <span className="px-2 py-0.5 rounded-full text-[11px] bg-physio-bg-tertiary border border-physio-accent-cyan/40 text-physio-accent-cyan font-semibold">
                Legend filters active
              </span>
            )}
          </div>

          <div className="flex flex-col gap-2 md:flex-row md:items-center md:gap-3 md:ml-auto">
            <SweetSpotFinder
              compoundType={compoundType}
              visibleCompounds={visibleCompounds}
              userProfile={userProfile}
              variant="inline"
            />
            <PDFExport chartRef={chartRef} />
          </div>
        </div>
      </div>
    </div>
  );
};

export default ChartControlBar;
