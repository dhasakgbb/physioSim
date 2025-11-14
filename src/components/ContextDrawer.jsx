import React from 'react';

const CollapseChevron = ({ open }) => (
  <svg
    className={`w-4 h-4 text-physio-text-tertiary transition-transform duration-200 ${open ? 'rotate-180' : ''}`}
    viewBox="0 0 20 20"
    fill="currentColor"
    aria-hidden="true"
  >
    <path
      fillRule="evenodd"
      d="M5.23 7.21a.75.75 0 011.06.02L10 10.94l3.71-3.71a.75.75 0 111.06 1.06l-4.24 4.25a.75.75 0 01-1.06 0L5.21 8.29a.75.75 0 01.02-1.08z"
      clipRule="evenodd"
    />
  </svg>
);

const ContextDrawer = ({
  collapsed,
  onToggle,
  title = 'Expand to learn how to read the charts',
  eyebrowText = 'Need context?',
  children,
  renderEvidence,
  dataSection
}) => (
  <div
    data-section={dataSection}
    className="mt-4 bg-physio-bg-secondary/80 border border-physio-bg-border rounded-2xl p-4 shadow-physio-subtle"
  >
    <button
      type="button"
      onClick={onToggle}
      className="w-full flex items-center justify-between text-left"
    >
      <div>
        {eyebrowText && (
          <p className="text-xs uppercase tracking-wide text-physio-text-tertiary">{eyebrowText}</p>
        )}
        <h3 className="text-base md:text-lg font-semibold text-physio-accent-cyan">{title}</h3>
      </div>
      <CollapseChevron open={!collapsed} />
    </button>
    {!collapsed && (
      <div className="text-sm text-physio-text-primary mt-3 space-y-4">
        {children}
        {typeof renderEvidence === 'function' && (
          <section className="bg-physio-bg-core border border-physio-bg-border rounded-xl p-3">
            <h4 className="font-semibold text-physio-text-secondary mb-1.5">Evidence & Confidence</h4>
            {renderEvidence()}
          </section>
        )}
      </div>
    )}
  </div>
);

export default ContextDrawer;
