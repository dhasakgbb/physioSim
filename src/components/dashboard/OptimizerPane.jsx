import React, { useState } from 'react';
import { findPeakEfficiency, findMaxTolerableLimit } from '../../utils/stackOptimizer';
import { compoundData } from '../../data/compoundData';

const OptimizationCard = ({ title, subtitle, onClick, loading, active, disabled }) => (
  <button 
    onClick={onClick}
    disabled={loading || disabled}
    className={`relative flex flex-col items-start p-6 rounded-lg border text-left transition-all duration-200 w-full
      ${disabled 
        ? 'opacity-50 cursor-not-allowed bg-physio-bg-surface border-physio-border-subtle' 
        : active 
          ? 'bg-physio-accent-success/5 border-physio-accent-success/40' 
          : 'bg-physio-bg-surface border-physio-border-subtle hover:border-physio-text-secondary hover:bg-physio-bg-highlight'
      }
    `}
  >
    <div className="flex justify-between w-full items-start mb-2">
      <h3 className={`text-sm font-bold ${active ? 'text-physio-accent-success' : 'text-physio-text-primary'}`}>
        {title}
      </h3>
      {loading && active && (
        <div className="w-4 h-4 border-2 border-physio-accent-success border-t-transparent rounded-full animate-spin" />
      )}
    </div>
    <p className="text-xs text-physio-text-secondary leading-relaxed">
      {subtitle}
    </p>
  </button>
);

const ResultPreview = ({ originalStack, optimizedStack, originalScore, newScore, onApply, onCancel, type }) => {
  const diff = (newScore - originalScore).toFixed(2);
  
  // Dynamic Styles for "Redline" mode
  const isRedline = type === 'redline';
  const accentColor = isRedline ? 'text-physio-accent-warning' : 'text-physio-accent-success';
  const bgColor = isRedline ? 'bg-physio-accent-warning/10' : 'bg-physio-accent-success/10';
  const borderColor = isRedline ? 'border-physio-accent-warning/30' : 'border-physio-border-subtle';
  const btnColor = isRedline ? 'bg-physio-accent-warning text-black' : 'bg-physio-accent-success text-black';

  // Calculate changes
  const items = optimizedStack.map((item, index) => {
    const oldItem = originalStack[index];
    const meta = compoundData[item.compound];
    const isChanged = item.dose !== oldItem.dose;
    
    return {
      name: meta?.name || item.compound,
      oldDose: oldItem.dose,
      newDose: item.dose,
      isChanged
    };
  });

  // Sort: Changed items first
  items.sort((a, b) => (b.isChanged ? 1 : 0) - (a.isChanged ? 1 : 0));

  return (
    <div className={`col-span-2 mt-6 p-0 bg-physio-bg-surface rounded-lg border ${borderColor} overflow-hidden animate-fade-in`}>
      {/* Header */}
      <div className={`px-6 py-4 border-b ${isRedline ? 'border-physio-accent-warning/20 bg-physio-accent-warning/5' : 'border-physio-border-subtle bg-physio-bg-highlight/30'} flex justify-between items-center`}>
        <div>
          <h4 className="text-sm font-bold text-physio-text-primary">
             {isRedline ? 'Max Capacity Found' : 'Optimization Found'}
          </h4>
          <p className="text-xs text-physio-text-secondary mt-1">
            Efficiency Score: <span className="text-physio-text-tertiary">{originalScore.toFixed(2)}</span> → <span className={`${accentColor} font-bold`}>{newScore.toFixed(2)}</span>
          </p>
        </div>
        <div className={`text-xs font-mono font-bold ${accentColor} ${bgColor} px-3 py-1.5 rounded`}>
          {isRedline ? 'LIMIT' : `+${diff} pts`}
        </div>
      </div>

      {/* Warning for Redline */}
      {isRedline && (
          <div className="px-6 py-3 bg-physio-accent-warning/10 border-b border-physio-accent-warning/20 flex items-start gap-3">
             <span className="text-lg">⚠️</span>
             <p className="text-[10px] text-physio-accent-warning leading-relaxed">
               <strong>Warning:</strong> This protocol pushes your system to the theoretical limit. 
               Net Benefit is positive, but barely. Side effect risk is maximized.
             </p>
          </div>
      )}

      {/* Changes List */}
      <div className="px-6 py-4 space-y-3">
        {items.map((item, i) => (
          <div key={i} className={`flex justify-between items-center text-xs border-b border-physio-border-subtle/50 last:border-0 pb-2 last:pb-0 ${!item.isChanged ? 'opacity-50' : ''}`}>
            <span className="font-medium text-physio-text-primary">
              {item.name}
              {!item.isChanged && <span className="ml-2 text-[10px] text-physio-text-tertiary uppercase tracking-wider">(Optimal)</span>}
            </span>
            <div className="flex items-center gap-3 font-mono">
              {item.isChanged ? (
                <>
                  <span className="text-physio-text-tertiary">{item.oldDose}mg</span>
                  <span className="text-physio-text-secondary">→</span>
                  <span className={`${accentColor} font-bold`}>{item.newDose}mg</span>
                </>
              ) : (
                <span className="text-physio-text-tertiary">{item.newDose}mg</span>
              )}
            </div>
          </div>
        ))}
      </div>
      
      {/* Actions */}
      <div className="px-6 py-4 bg-physio-bg-core border-t border-physio-border-subtle flex justify-end gap-3">
        <button 
          onClick={onCancel}
          className="px-4 py-2 text-xs font-medium text-physio-text-secondary hover:text-physio-text-primary transition-colors"
        >
          Discard
        </button>
        <button 
          onClick={onApply}
          className={`px-6 py-2 font-bold text-xs rounded hover:opacity-90 transition-colors shadow-sm ${btnColor}`}
        >
          {isRedline ? 'Push Limits' : 'Apply Changes'}
        </button>
      </div>
    </div>
  );
};

const OptimizerPane = ({ stack, userProfile, onApplyOptimization }) => {
  const [optimizing, setOptimizing] = useState(false);
  const [result, setResult] = useState(null);

  const handlePeakEfficiency = () => {
    setOptimizing(true);
    // Simulate calc delay for "checking wires" feel
    setTimeout(() => {
      const res = findPeakEfficiency(stack, userProfile);
      setResult({ ...res, type: 'efficiency' });
      setOptimizing(false);
    }, 800);
  };

  const handleRedline = () => {
    setOptimizing(true);
    setTimeout(() => {
      const res = findMaxTolerableLimit(stack, userProfile);
      setResult({ ...res, type: 'redline' });
      setOptimizing(false);
    }, 1200); // Slightly longer delay for "heavy" calculation
  };

  const isEmpty = stack.length === 0;

  return (
    <div className="absolute inset-0 bg-physio-bg-core flex flex-col">
      {/* Header */}
      <div className="px-8 py-6 border-b border-physio-border-subtle bg-physio-bg-surface/80 backdrop-blur z-10">
        <h2 className="text-base font-bold text-physio-text-primary tracking-wide">
          Protocol Optimization
        </h2>
        <p className="text-xs text-physio-text-tertiary mt-1">
          Select a solver to analyze and improve your current stack configuration.
        </p>
      </div>

      {/* Scrollable Content */}
      <div className="flex-1 overflow-y-auto p-8">
        {isEmpty ? (
          <div className="flex flex-col items-center justify-center h-64 text-center border border-dashed border-physio-border-subtle rounded-xl bg-physio-bg-surface/50">
            <div className="text-2xl mb-3 opacity-50">🧪</div>
            <h3 className="text-sm font-bold text-physio-text-secondary mb-1">No Compounds Detected</h3>
            <p className="text-xs text-physio-text-tertiary max-w-xs">
              Add compounds to your stack in the "Explore" tab to unlock optimization tools.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-6 max-w-3xl mx-auto">
            
            {/* 1. PEAK EFFICIENCY (Main Feature) */}
            <OptimizationCard 
              title={optimizing && result?.type !== 'redline' ? "Analyzing Protocol..." : "Peak Efficiency"}
              subtitle="Adjust dosages to find the mathematical maximum Net Benefit (ROI)."
              onClick={handlePeakEfficiency}
              active={result?.type === 'efficiency'}
              loading={optimizing && result?.type !== 'redline'}
            />

            {/* 2. MAX CAPACITY (Redline) */}
            <OptimizationCard 
              title={optimizing && result?.type === 'redline' ? "Stress Testing..." : "Max Capacity"}
              subtitle="Find the absolute limit before side effects outweigh benefits."
              onClick={handleRedline}
              active={result?.type === 'redline'}
              loading={optimizing && result?.type === 'redline'}
            />

            {/* PREVIEW AREA */}
            {result && result.isDifferent && (
              <ResultPreview 
                originalStack={stack}
                optimizedStack={result.optimizedStack}
                originalScore={result.originalScore}
                newScore={result.newScore}
                type={result.type}
                onApply={() => {
                  onApplyOptimization(result.optimizedStack);
                  setResult(null);
                }}
                onCancel={() => setResult(null)}
              />
            )}
            
            {result && !result.isDifferent && !optimizing && (
               <div className="col-span-2 mt-6 p-4 bg-physio-bg-surface border border-physio-border-subtle rounded-lg text-center animate-fade-in">
                 <div className="text-physio-accent-success mb-2 text-lg">✓</div>
                 <p className="text-sm font-bold text-physio-text-primary">Optimized</p>
                 <p className="text-xs text-physio-text-secondary mt-1">Current protocol is already at peak efficiency.</p>
               </div>
            )}

          </div>
        )}
      </div>
    </div>
  );
};

export default OptimizerPane;
