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
  return (
    <div className="bg-physio-bg-secondary border border-physio-bg-border rounded-2xl shadow-physio-subtle px-4 py-3 mb-6">
      <div className="flex flex-col gap-3">
        <div className="flex flex-col gap-3 md:flex-row md:items-center">
          <div className="flex flex-wrap items-center gap-3 text-sm">
            <span className="text-xs uppercase tracking-wide text-physio-text-tertiary">
              Show
            </span>
            <ViewToggle viewMode={viewMode} setViewMode={setViewMode} />
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
