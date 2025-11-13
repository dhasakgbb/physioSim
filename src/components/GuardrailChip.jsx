import React from 'react';

const toneStyles = {
  error: 'text-physio-error border-physio-error/40 bg-physio-error/5',
  warning: 'text-physio-warning border-physio-warning/40 bg-physio-warning/5',
  success: 'text-physio-accent-mint border-physio-accent-mint/40 bg-physio-accent-mint/5',
  muted: 'text-physio-text-tertiary border-physio-bg-border bg-physio-bg-core'
};

const GuardrailChip = ({ tone = 'muted', label, detail, size = 'md', className = '' }) => {
  const baseSize = size === 'sm' ? 'text-[10px] px-2 py-0.5' : 'text-xs px-3 py-1';
  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full border font-semibold tracking-wide uppercase ${baseSize} ${
        toneStyles[tone] || toneStyles.muted
      } ${className}`}
    >
      <span>{label}</span>
      {detail && <span className="font-medium normal-case tracking-normal text-[10px]">{detail}</span>}
    </span>
  );
};

export default GuardrailChip;
