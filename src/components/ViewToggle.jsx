import React from 'react';
import { motion } from 'framer-motion';

const ViewToggle = ({ viewMode, setViewMode }) => {
  const modes = [
    { id: 'benefit', label: 'Benefit' },
    { id: 'risk', label: 'Risk' },
    { id: 'efficiency', label: 'Efficiency' },
    { id: 'uncertainty', label: 'Uncertainty' }
  ];

  return (
    <div className="flex p-1 bg-physio-bg-surface border border-physio-border-subtle rounded-xl relative">
      {modes.map((mode) => {
        const isActive = viewMode === mode.id;
        return (
          <button
            key={mode.id}
            onClick={() => setViewMode(mode.id)}
            className={`relative flex-1 px-4 py-2 text-sm font-medium transition-colors duration-200 rounded-lg z-10 ${
              isActive ? 'text-white' : 'text-physio-text-secondary hover:text-physio-text-primary'
            }`}
          >
            {isActive && (
              <motion.div
                layoutId="activeTab"
                className="absolute inset-0 bg-physio-accent-primary rounded-lg shadow-neo-glow"
                transition={{ type: "spring", stiffness: 500, damping: 30 }}
              />
            )}
            <span className="relative z-10">{mode.label}</span>
          </button>
        );
      })}
    </div>
  );
};

export default ViewToggle;
