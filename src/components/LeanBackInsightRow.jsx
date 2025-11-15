import React from 'react';

const toneVariants = {
  info: 'bg-physio-accent-cyan/15 text-physio-accent-cyan border border-physio-accent-cyan/30',
  success: 'bg-physio-accent-mint/15 text-physio-accent-mint border border-physio-accent-mint/30',
  warning: 'bg-physio-warning/15 text-physio-warning border border-physio-warning/30',
  neutral: 'bg-physio-bg-tertiary/70 text-physio-text-secondary border border-physio-bg-border/70'
};

const LeanBackInsightRow = ({ insights = [] }) => {
  if (!insights.length) return null;

  return (
    <div className="flex flex-wrap items-center gap-2">
      {insights.map(insight => (
        <div
          key={insight.key || insight.label}
          className={`flex flex-col rounded-full px-3 py-1.5 text-[11px] font-semibold tracking-wide uppercase ${
            toneVariants[insight.tone] || toneVariants.neutral
          }`}
        >
          <span className="text-[10px] text-physio-text-tertiary/80">{insight.label}</span>
          <span className="text-[12px] normal-case text-current">
            {insight.detail}
          </span>
        </div>
      ))}
    </div>
  );
};

export default LeanBackInsightRow;
