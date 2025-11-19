import React from 'react';
import SweetSpotFinder from './SweetSpotFinder';
import PDFExport from './PDFExport';

import Card from './ui/Card';
import Button from './ui/Button';

const UtilityCardRow = ({
  compoundType,
  visibleCompounds,
  userProfile,
  chartRef,
  onOpenProfile
}) => {
  return (
    <div className="grid gap-4 md:grid-cols-3">
      <Card title="Sweet Spot" action={<span className="text-xs uppercase tracking-wide text-physio-text-tertiary">Personal</span>}>
        <SweetSpotFinder
          compoundType={compoundType}
          visibleCompounds={visibleCompounds}
          userProfile={userProfile}
          variant="inline"
        />
      </Card>

      <Card title="PDF Brief" action={<span className="text-xs uppercase tracking-wide text-physio-text-tertiary">Export</span>}>
        <p className="text-xs text-physio-text-secondary mb-3">
          Capture the current chart, guardrails, and methodology copy for offline review.
        </p>
        <PDFExport chartRef={chartRef} />
      </Card>

      <Card title="Model Panel" action={<span className="text-xs uppercase tracking-wide text-physio-text-tertiary">Profile</span>}>
        <p className="text-xs text-physio-text-secondary mb-3">
          Adjust personalization levers and save presets for future sessions.
        </p>
        <div className="flex gap-2">
          <Button
            onClick={onOpenProfile}
            variant="secondary"
            className="flex-1 border-physio-accent-mint text-physio-accent-mint hover:bg-physio-accent-mint hover:text-physio-bg-core"
          >
            Open panel
          </Button>
        </div>
      </Card>
    </div>
  );
};

export default UtilityCardRow;
