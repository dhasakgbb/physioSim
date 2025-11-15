import React, { useCallback, useEffect, useMemo, useRef } from 'react';

const sizeTokens = {
  sm: {
    navPadding: 'px-3 py-1.5',
    gap: 'gap-1.5',
    button: 'px-3 py-1.5 text-xs',
    font: 'text-[13px]'
  },
  md: {
    navPadding: 'px-4 py-2',
    gap: 'gap-2',
    button: 'px-4 py-2 text-sm',
    font: 'text-sm'
  }
};

const NavigationRail = ({
  tabs,
  activeTab,
  onTabChange,
  ariaLabel = 'Navigation',
  size = 'md',
  className = ''
}) => {
  const buttonRefs = useRef([]);
  const tokens = sizeTokens[size] || sizeTokens.md;

  useEffect(() => {
    buttonRefs.current = buttonRefs.current.slice(0, tabs.length);
  }, [tabs.length]);

  const enabledTabs = useMemo(() => tabs.filter(tab => !tab.disabled), [tabs]);

  const focusTabByOffset = useCallback(
    (currentIndex, delta) => {
      const enabledKeys = enabledTabs.map(tab => tab.key);
      if (!enabledKeys.length) return;
      const currentKey = tabs[currentIndex]?.key;
      const enabledIndex = enabledKeys.indexOf(currentKey);
      if (enabledIndex === -1) return;
      const nextIndex = (enabledIndex + delta + enabledKeys.length) % enabledKeys.length;
      const nextKey = enabledKeys[nextIndex];
      const nextButtonIndex = tabs.findIndex(tab => tab.key === nextKey);
      const nextButton = buttonRefs.current[nextButtonIndex];
      if (nextButton) {
        nextButton.focus();
        onTabChange?.(nextKey);
      }
    },
    [enabledTabs, onTabChange, tabs]
  );

  const handleKeyDown = useCallback(
    (event, index) => {
      if (event.key === 'ArrowRight' || event.key === 'ArrowDown') {
        event.preventDefault();
        focusTabByOffset(index, 1);
      } else if (event.key === 'ArrowLeft' || event.key === 'ArrowUp') {
        event.preventDefault();
        focusTabByOffset(index, -1);
      }
    },
    [focusTabByOffset]
  );

  return (
    <nav
      className={`bg-physio-bg-secondary/70 border border-physio-bg-border rounded-3xl shadow-physio-subtle overflow-x-auto ${tokens.navPadding} ${className}`.trim()}
      aria-label={ariaLabel}
    >
      <div className={`flex items-center min-w-max ${tokens.gap}`} role="tablist">
        {tabs.map((tab, index) => {
          const isActive = tab.key === activeTab;
          const isDisabled = Boolean(tab.disabled);
          const controlProps = tab.panelId ? { 'aria-controls': tab.panelId } : {};
          return (
            <button
              key={tab.key}
              type="button"
              ref={el => {
                buttonRefs.current[index] = el;
              }}
              disabled={isDisabled}
              role="tab"
              aria-selected={isActive}
              tabIndex={isActive ? 0 : -1}
              onClick={() => !isDisabled && onTabChange?.(tab.key)}
              onKeyDown={event => handleKeyDown(event, index)}
              className={`rounded-full font-semibold transition-all duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-physio-accent-violet/70 ${tokens.button} ${tokens.font} ${
                isActive
                  ? 'bg-physio-accent-cyan/15 text-physio-accent-cyan border border-physio-accent-cyan shadow-lg shadow-physio-accent-cyan/20'
                  : isDisabled
                  ? 'text-physio-text-tertiary/60 border border-dashed border-physio-bg-border/70 cursor-not-allowed'
                  : 'text-physio-text-secondary border border-transparent hover:border-physio-bg-border hover:text-physio-text-primary'
              }`}
              {...controlProps}
            >
              {tab.label}
            </button>
          );
        })}
      </div>
    </nav>
  );
};

export default NavigationRail;
