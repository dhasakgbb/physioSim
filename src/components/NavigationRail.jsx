import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';

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
  const [focusedKey, setFocusedKey] = useState(activeTab);

  useEffect(() => {
    buttonRefs.current = buttonRefs.current.slice(0, tabs.length);
  }, [tabs.length]);

  useEffect(() => {
    setFocusedKey(activeTab);
  }, [activeTab]);

  const enabledTabs = useMemo(() => tabs.filter(tab => !tab.disabled), [tabs]);

  const focusTabByOffset = useCallback(
    (currentKey, delta) => {
      const enabledKeys = enabledTabs.map(tab => tab.key);
      if (!enabledKeys.length) return;
      const referenceKey = currentKey && enabledKeys.includes(currentKey)
        ? currentKey
        : activeTab && enabledKeys.includes(activeTab)
        ? activeTab
        : enabledKeys[0];
      const enabledIndex = enabledKeys.indexOf(referenceKey);
      if (enabledIndex === -1) return;
      const nextIndex = (enabledIndex + delta + enabledKeys.length) % enabledKeys.length;
      const nextKey = enabledKeys[nextIndex];
      const nextButtonIndex = tabs.findIndex(tab => tab.key === nextKey);
      const nextButton = buttonRefs.current[nextButtonIndex];
      if (nextButton) {
        nextButton.focus();
        setFocusedKey(nextKey);
      }
    },
    [activeTab, enabledTabs, tabs]
  );

  const handleKeyDown = useCallback(
    (event, tab) => {
      if (event.key === 'ArrowRight' || event.key === 'ArrowDown') {
        event.preventDefault();
        focusTabByOffset(tab.key, 1);
      } else if (event.key === 'ArrowLeft' || event.key === 'ArrowUp') {
        event.preventDefault();
        focusTabByOffset(tab.key, -1);
      } else if (event.key === 'Home') {
        event.preventDefault();
        const firstEnabled = enabledTabs.find(t => !t.disabled);
        if (firstEnabled) {
          setFocusedKey(firstEnabled.key);
          const idx = tabs.findIndex(t => t.key === firstEnabled.key);
          buttonRefs.current[idx]?.focus();
        }
      } else if (event.key === 'End') {
        event.preventDefault();
        const reversed = [...enabledTabs].reverse();
        const lastEnabled = reversed.find(t => !t.disabled);
        if (lastEnabled) {
          setFocusedKey(lastEnabled.key);
          const idx = tabs.findIndex(t => t.key === lastEnabled.key);
          buttonRefs.current[idx]?.focus();
        }
      } else if (event.key === 'Enter' || event.key === ' ') {
        event.preventDefault();
        if (!tab.disabled) {
          onTabChange?.(tab.key);
        }
      }
    },
    [enabledTabs, focusTabByOffset, onTabChange, tabs]
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
          const isFocused = tab.key === focusedKey;
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
              tabIndex={isFocused ? 0 : -1}
              onClick={() => !isDisabled && onTabChange?.(tab.key)}
              onKeyDown={event => handleKeyDown(event, tab)}
              onFocus={() => setFocusedKey(tab.key)}
              onMouseEnter={() => setFocusedKey(tab.key)}
              className={`rounded-full font-semibold transition-all duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-physio-accent-violet/70 ${tokens.button} ${tokens.font} ${
                isActive
                  ? 'bg-physio-accent-cyan/15 text-physio-accent-cyan border border-physio-accent-cyan shadow-[0_0_20px_rgba(75,187,247,0.35)]'
                  : isDisabled
                  ? 'text-physio-text-tertiary/60 border border-dashed border-physio-bg-border/70 cursor-not-allowed'
                  : 'text-physio-text-secondary border border-transparent hover:border-physio-accent-cyan/50 hover:text-white hover:shadow-[0_0_18px_rgba(75,187,247,0.2)]'
              } ${isFocused && !isActive ? 'border border-physio-bg-border/70 text-physio-text-primary' : ''}`}
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
