import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';

const NavigationRail = ({
  tabs,
  activeTab,
  onTabChange,
  ariaLabel = 'Navigation',
  className = ''
}) => {
  const buttonRefs = useRef([]);
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
      if (event.key === 'ArrowDown') {
        event.preventDefault();
        focusTabByOffset(tab.key, 1);
      } else if (event.key === 'ArrowUp') {
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
      className={`flex flex-col gap-1 w-full ${className}`}
      aria-label={ariaLabel}
      role="tablist"
      aria-orientation="vertical"
    >
      {tabs.map((tab, index) => {
        const isActive = tab.key === activeTab;
        const isDisabled = Boolean(tab.disabled);
        const isFocused = tab.key === focusedKey;
        
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
            className={`
              group flex items-center justify-between px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-200
              focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-physio-accent-primary
              ${isDisabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
              ${isActive 
                ? 'bg-physio-bg-surface text-physio-text-primary shadow-neo-sm border border-physio-border-subtle' 
                : 'text-physio-text-secondary hover:bg-physio-bg-highlight hover:text-physio-text-primary border border-transparent'}
            `}
          >
            <span className="truncate tracking-tight">{tab.label}</span>
            {isActive && (
              <div className="w-1.5 h-1.5 rounded-full bg-physio-accent-primary shadow-[0_0_8px_rgba(99,102,241,0.8)]" />
            )}
          </button>
        );
      })}
    </nav>
  );
};

export default NavigationRail;
