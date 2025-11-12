import React, { useState } from 'react';
import { disclaimerText } from '../data/compoundData';

const DisclaimerBanner = () => {
  const [isCollapsed, setIsCollapsed] = useState(false);

  return (
    <div className="bg-physio-warning/10 border-2 border-physio-warning rounded-lg p-4 mb-6">
      <div className="flex justify-between items-start">
        <div className="flex-1">
          <h2 className="text-lg font-bold text-physio-warning mb-2">
            ⚠️ HARM REDUCTION MODELING, NOT MEDICAL ADVICE
          </h2>
          {!isCollapsed && (
            <div className="text-sm text-physio-text-primary whitespace-pre-line">
              {disclaimerText}
            </div>
          )}
        </div>
        <button
          onClick={() => setIsCollapsed(!isCollapsed)}
          className="ml-4 px-3 py-1 text-sm bg-yellow-600 text-white rounded hover:bg-yellow-700 transition-colors"
        >
          {isCollapsed ? 'Show' : 'Hide'}
        </button>
      </div>
    </div>
  );
};

export default DisclaimerBanner;

