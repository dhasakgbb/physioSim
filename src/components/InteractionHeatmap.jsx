import React, { useState } from 'react';
import { interactionMatrix, getInteractionScore, heatmapScores } from '../data/interactionMatrix';
import { compoundData } from '../data/compoundData';

/**
 * Interaction Detail Card
 * Displays detailed information about a specific compound pair interaction
 */
const InteractionDetailCard = ({ compound1, compound2, onClose }) => {
  const interaction = interactionMatrix[`${compound1}_${compound2}`] || interactionMatrix[`${compound2}_${compound1}`];
  
  if (!interaction) return null;
  
  const compound1Data = compoundData[compound1];
  const compound2Data = compoundData[compound2];
  const score = getInteractionScore(compound1, compound2);
  
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-physio-bg-secondary rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 bg-physio-bg-secondary border-b border-physio-bg-border p-4 flex justify-between items-center">
          <div>
            <h2 className="text-2xl font-bold">
              <span style={{ color: compound1Data.color }}>{compound1Data.abbreviation}</span>
              {' + '}
              <span style={{ color: compound2Data.color }}>{compound2Data.abbreviation}</span>
            </h2>
            <p className="text-sm text-physio-text-secondary mt-1">{interaction.description}</p>
          </div>
          <button
            onClick={onClose}
            className="text-physio-text-tertiary hover:text-physio-text-secondary text-2xl font-bold"
          >
            ×
          </button>
        </div>
        
        {/* Rating Badge */}
        <div className="p-4 border-b border-physio-bg-border">
          <div className="flex items-center gap-3">
            <span
              className="px-4 py-2 rounded-lg font-semibold text-white text-lg"
              style={{ backgroundColor: score.color }}
            >
              {score.symbol} {score.label}
            </span>
            {interaction.synergy && (
              <div className="flex gap-4 text-sm">
                <span className={interaction.synergy.benefit >= 0 ? 'text-physio-accent-mint' : 'text-physio-error'}>
                  Benefit Synergy: {interaction.synergy.benefit > 0 ? '+' : ''}{(interaction.synergy.benefit * 100).toFixed(0)}%
                </span>
                <span className={interaction.synergy.risk <= 0 ? 'text-physio-accent-mint' : 'text-physio-error'}>
                  Risk Synergy: {interaction.synergy.risk > 0 ? '+' : ''}{(interaction.synergy.risk * 100).toFixed(0)}%
                </span>
              </div>
            )}
          </div>
        </div>
        
        {/* Content */}
        <div className="p-6 space-y-6">
          {/* Mechanisms */}
          {interaction.mechanisms && (
            <div>
              <h3 className="text-lg font-semibold mb-3 text-physio-text-primary">Mechanisms & Interactions</h3>
              <ul className="space-y-2">
                {interaction.mechanisms.map((mechanism, idx) => (
                  <li key={idx} className="flex items-start gap-2">
                    <span className="text-physio-accent-cyan mt-1">•</span>
                    <span className="text-physio-text-secondary">{mechanism}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}
          
          {/* Recommended Protocol */}
          {interaction.recommendedProtocol && (
            <div className="bg-physio-bg-tertiary p-4 rounded-lg">
              <h3 className="text-lg font-semibold mb-3 text-blue-900">Recommended Protocol</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {Object.entries(interaction.recommendedProtocol).map(([key, value]) => (
                  <div key={key} className="text-sm">
                    <span className="font-medium text-blue-800 capitalize">
                      {key.replace(/([A-Z])/g, ' $1').trim()}:
                    </span>
                    <span className="text-physio-text-secondary ml-2">{value}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
          
          {/* Recommended Ratio */}
          {interaction.recommendedRatio && (
            <div>
              <h3 className="text-lg font-semibold mb-2 text-physio-text-primary">Dosing Guidance</h3>
              <p className="text-physio-text-secondary bg-physio-bg-core p-3 rounded">{interaction.recommendedRatio}</p>
            </div>
          )}
          
          {/* Benefits */}
          {interaction.stackBenefit && (
            <div className="bg-physio-bg-tertiary p-4 rounded-lg">
              <h3 className="text-lg font-semibold mb-2 text-green-900">Stack Benefits</h3>
              <p className="text-physio-text-secondary">{interaction.stackBenefit}</p>
            </div>
          )}
          
          {/* Risks */}
          {interaction.stackRisk && (
            <div className="bg-red-50 p-4 rounded-lg">
              <h3 className="text-lg font-semibold mb-2 text-red-900">Stack Risks</h3>
              <p className="text-physio-text-secondary">{interaction.stackRisk}</p>
            </div>
          )}
          
          {/* Caution */}
          {interaction.caution && (
            <div className="bg-physio-bg-tertiary border-l-4 border-physio-warning p-4">
              <h3 className="text-lg font-semibold mb-2 text-yellow-900">⚠️ Important Cautions</h3>
              <p className="text-physio-text-secondary">{interaction.caution}</p>
            </div>
          )}
          
          {/* Recommendation */}
          {interaction.recommendation && (
            <div className="bg-physio-bg-tertiary p-4 rounded-lg">
              <h3 className="text-lg font-semibold mb-2 text-physio-text-primary">Expert Recommendation</h3>
              <p className="text-physio-text-secondary">{interaction.recommendation}</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

/**
 * Interaction Heatmap Component
 * Displays a matrix of compound interactions with color-coded ratings
 */
const InteractionHeatmap = () => {
  const [selectedInteraction, setSelectedInteraction] = useState(null);
  
  // Get all compound keys
  const compounds = Object.keys(compoundData);
  
  // Separate injectables and orals
  const injectables = compounds.filter(key => compoundData[key].type === 'injectable');
  const orals = compounds.filter(key => compoundData[key].type === 'oral');
  
  const handleCellClick = (compound1, compound2) => {
    if (compound1 === compound2) return;
    setSelectedInteraction({ compound1, compound2 });
  };
  
  const renderCell = (compound1, compound2) => {
    if (compound1 === compound2) {
      return (
        <div className="h-16 flex items-center justify-center bg-physio-bg-tertiary border border-physio-bg-border">
          <span className="text-gray-400 text-sm">—</span>
        </div>
      );
    }
    
    const score = getInteractionScore(compound1, compound2);
    const hasInteraction = interactionMatrix[`${compound1}_${compound2}`] || interactionMatrix[`${compound2}_${compound1}`];
    
    return (
      <div
        onClick={() => hasInteraction && handleCellClick(compound1, compound2)}
        className={`h-16 flex items-center justify-center border border-physio-bg-border transition-all ${
          hasInteraction ? 'cursor-pointer hover:opacity-80 hover:scale-105' : 'cursor-default'
        }`}
        style={{
          backgroundColor: hasInteraction ? score.color : '#f3f4f6',
          opacity: hasInteraction ? 1 : 0.5
        }}
        title={hasInteraction ? `${compoundData[compound1].name} + ${compoundData[compound2].name}: ${score.label}` : 'No interaction data'}
      >
        <span className="text-white text-2xl font-bold drop-shadow-md">
          {hasInteraction ? score.symbol : '?'}
        </span>
      </div>
    );
  };
  
  return (
    <div className="w-full">
      {/* Legend */}
      <div className="mb-6 bg-physio-bg-secondary p-4 rounded-lg shadow-sm border border-physio-bg-border">
        <h3 className="text-lg font-semibold mb-3 text-physio-text-primary">Interaction Rating Legend</h3>
        <div className="flex flex-wrap gap-3">
          {Object.entries(heatmapScores).map(([key, value]) => (
            <div key={key} className="flex items-center gap-2">
              <div
                className="w-8 h-8 rounded flex items-center justify-center text-white font-bold"
                style={{ backgroundColor: value.color }}
              >
                {value.symbol}
              </div>
              <span className="text-sm text-physio-text-secondary">{value.label}</span>
            </div>
          ))}
        </div>
        <p className="text-sm text-physio-text-tertiary mt-3">
          Click any cell to view detailed interaction information, dosing protocols, and safety guidance.
        </p>
      </div>
      
      {/* Injectable-Injectable Matrix */}
      <div className="mb-8 bg-physio-bg-secondary p-4 rounded-lg shadow-sm border border-physio-bg-border">
        <h3 className="text-lg font-semibold mb-4 text-physio-text-primary">Injectable Compound Interactions</h3>
        <div className="overflow-x-auto">
          <div className="inline-block min-w-full">
            <div className="grid gap-0" style={{ gridTemplateColumns: `120px repeat(${injectables.length}, 80px)` }}>
              {/* Header row */}
              <div className="h-16"></div>
              {injectables.map(key => (
                <div
                  key={key}
                  className="h-16 flex items-center justify-center font-semibold text-sm border border-physio-bg-border bg-physio-bg-secondary"
                  style={{ color: compoundData[key].color }}
                >
                  {compoundData[key].abbreviation}
                </div>
              ))}
              
              {/* Data rows */}
              {injectables.map(row => (
                <React.Fragment key={row}>
                  <div
                    className="h-16 flex items-center justify-center font-semibold text-sm border border-physio-bg-border bg-physio-bg-secondary"
                    style={{ color: compoundData[row].color }}
                  >
                    {compoundData[row].abbreviation}
                  </div>
                  {injectables.map(col => (
                    <div key={`${row}-${col}`}>
                      {renderCell(row, col)}
                    </div>
                  ))}
                </React.Fragment>
              ))}
            </div>
          </div>
        </div>
      </div>
      
      {/* Oral-Injectable Matrix */}
      <div className="mb-8 bg-physio-bg-secondary p-4 rounded-lg shadow-sm border border-physio-bg-border">
        <h3 className="text-lg font-semibold mb-4 text-physio-text-primary">Oral-Injectable Interactions</h3>
        <div className="overflow-x-auto">
          <div className="inline-block min-w-full">
            <div className="grid gap-0" style={{ gridTemplateColumns: `120px repeat(${injectables.length}, 80px)` }}>
              {/* Header row */}
              <div className="h-16"></div>
              {injectables.map(key => (
                <div
                  key={key}
                  className="h-16 flex items-center justify-center font-semibold text-sm border border-physio-bg-border bg-physio-bg-secondary"
                  style={{ color: compoundData[key].color }}
                >
                  {compoundData[key].abbreviation}
                </div>
              ))}
              
              {/* Data rows */}
              {orals.map(row => (
                <React.Fragment key={row}>
                  <div
                    className="h-16 flex items-center justify-center font-semibold text-sm border border-physio-bg-border bg-physio-bg-secondary"
                    style={{ color: compoundData[row].color }}
                  >
                    {compoundData[row].abbreviation}
                  </div>
                  {injectables.map(col => (
                    <div key={`${row}-${col}`}>
                      {renderCell(row, col)}
                    </div>
                  ))}
                </React.Fragment>
              ))}
            </div>
          </div>
        </div>
      </div>
      
      {/* Oral-Oral Matrix */}
      <div className="bg-physio-bg-secondary p-4 rounded-lg shadow-sm border border-physio-bg-border">
        <h3 className="text-lg font-semibold mb-4 text-physio-text-primary">Oral-Oral Combinations (Generally Forbidden)</h3>
        <div className="overflow-x-auto">
          <div className="inline-block min-w-full">
            <div className="grid gap-0" style={{ gridTemplateColumns: `120px repeat(${orals.length}, 80px)` }}>
              {/* Header row */}
              <div className="h-16"></div>
              {orals.map(key => (
                <div
                  key={key}
                  className="h-16 flex items-center justify-center font-semibold text-sm border border-physio-bg-border bg-physio-bg-secondary"
                  style={{ color: compoundData[key].color }}
                >
                  {compoundData[key].abbreviation}
                </div>
              ))}
              
              {/* Data rows */}
              {orals.map(row => (
                <React.Fragment key={row}>
                  <div
                    className="h-16 flex items-center justify-center font-semibold text-sm border border-physio-bg-border bg-physio-bg-secondary"
                    style={{ color: compoundData[row].color }}
                  >
                    {compoundData[row].abbreviation}
                  </div>
                  {orals.map(col => (
                    <div key={`${row}-${col}`}>
                      {renderCell(row, col)}
                    </div>
                  ))}
                </React.Fragment>
              ))}
            </div>
          </div>
        </div>
        <p className="text-sm text-physio-error mt-3 font-medium">
          ⚠️ Stacking two oral compounds is generally not recommended due to multiplicative hepatic stress and lipid impact.
        </p>
      </div>
      
      {/* Detail Modal */}
      {selectedInteraction && (
        <InteractionDetailCard
          compound1={selectedInteraction.compound1}
          compound2={selectedInteraction.compound2}
          onClose={() => setSelectedInteraction(null)}
        />
      )}
    </div>
  );
};

export default InteractionHeatmap;

