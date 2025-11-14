import React, { useEffect, useRef, useState } from 'react';

const buttonVariants = {
  default:
    'px-2.5 py-1.5 text-xs',
  compact:
    'px-2 py-1 text-[11px]'
};

const panelWidth = {
  default: 'w-64',
  compact: 'w-56'
};

const FilterStatusBadge = ({
  items = [],
  onReset,
  onManagePrefs,
  size = 'default',
  align = 'right',
  label = 'Filters active',
  className = ''
}) => {
  const [open, setOpen] = useState(false);
  const containerRef = useRef(null);
  const hasItems = Array.isArray(items) && items.length > 0;

  useEffect(() => {
    if (!open || typeof document === 'undefined') return undefined;
    const handleClickOutside = (event) => {
      if (!containerRef.current) return;
      if (!containerRef.current.contains(event.target)) {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [open]);

  if (!hasItems) return null;

  const alignmentClass = align === 'left' ? 'left-0' : 'right-0';
  const buttonSizeClass = buttonVariants[size] || buttonVariants.default;
  const panelWidthClass = panelWidth[size] || panelWidth.default;

  return (
    <div className={`relative ${className}`} ref={containerRef}>
      <button
        type="button"
        onClick={() => setOpen(prev => !prev)}
        className={`${buttonSizeClass} rounded-full border border-physio-accent-cyan text-physio-accent-cyan bg-physio-bg-secondary/90 font-semibold flex items-center gap-1.5 transition-standard hover:border-physio-accent-mint hover:text-physio-accent-mint`}
      >
        {label}
        <span className="inline-flex items-center justify-center min-w-[1.5rem] h-5 rounded-full bg-physio-accent-cyan/15 text-[11px] text-physio-accent-cyan">
          {items.length}
        </span>
      </button>

      {open && (
        <div
          className={`absolute ${alignmentClass} mt-1.5 ${panelWidthClass} border border-physio-bg-border bg-physio-bg-secondary rounded-2xl shadow-physio-strong p-3.5 z-30`}
        >
          <div className="flex items-center justify-between mb-2.5">
            <div>
              <p className="text-xs uppercase tracking-wide text-physio-text-tertiary">Active adjustments</p>
              <p className="text-[12px] text-physio-text-secondary">These settings differ from the defaults.</p>
            </div>
            <button
              type="button"
              onClick={() => setOpen(false)}
              className="text-physio-text-tertiary text-sm hover:text-physio-text-primary"
            >
              ✕
            </button>
          </div>

          <ul className="space-y-2 text-sm">
            {items.map(item => (
              <li key={item.key || item.label} className="bg-physio-bg-core/80 border border-physio-bg-border rounded-xl p-2.5">
                <div className="font-semibold text-physio-text-primary text-sm">{item.label}</div>
                {item.description && (
                  <p className="text-[11px] text-physio-text-secondary mt-0.5 leading-tight">{item.description}</p>
                )}
              </li>
            ))}
          </ul>

          <div className="flex flex-wrap gap-1.5 mt-3 justify-end">
            {onManagePrefs && (
              <button
                type="button"
                onClick={() => {
                  setOpen(false);
                  onManagePrefs();
                }}
                className="px-2.5 py-1.5 text-[11px] font-semibold rounded-full border border-physio-bg-border text-physio-text-secondary hover:text-physio-text-primary"
              >
                Manage tracking
              </button>
            )}
            {onReset && (
              <button
                type="button"
                onClick={() => {
                  setOpen(false);
                  onReset();
                }}
                className="px-3 py-1.5 text-xs font-semibold rounded-full bg-physio-accent-cyan text-white shadow-physio-strong hover:bg-physio-accent-cyan/90"
              >
                Reset all
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default FilterStatusBadge;
