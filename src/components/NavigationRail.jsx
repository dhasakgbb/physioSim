import React from 'react';

const NavigationRail = ({ tabs, activeTab, onTabChange }) => {
  return (
    <nav className="bg-physio-bg-secondary/70 border border-physio-bg-border rounded-3xl px-4 py-2 shadow-physio-subtle overflow-x-auto">
      <div className="flex items-center gap-2 min-w-max">
        {tabs.map(tab => {
          const isActive = tab.key === activeTab;
          return (
            <button
              key={tab.key}
              type="button"
              onClick={() => onTabChange(tab.key)}
              className={`px-4 py-2 rounded-full text-sm font-semibold transition-all duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-physio-accent-cyan/70 ${
                isActive
                  ? 'bg-physio-accent-cyan/15 text-physio-accent-cyan border border-physio-accent-cyan shadow-lg shadow-physio-accent-cyan/20'
                  : 'text-physio-text-secondary border border-transparent hover:border-physio-bg-border hover:text-physio-text-primary'
              }`}
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
