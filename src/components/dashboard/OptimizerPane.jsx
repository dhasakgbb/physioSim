import React, { useState } from 'react';
import { simulationService } from '../../engine/SimulationService';
import { COMPOUNDS as compoundData } from '../../data/compounds';
import Input from '../ui/Input';
import { GENETIC_ARCHETYPES } from '../../utils/personalization';

// Icons
const IconEfficiency = () => (
  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
  </svg>
);

const IconSafe = () => (
  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
  </svg>
);

const IconDanger = () => (
  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
  </svg>
);

const IconUser = () => (
  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
  </svg>
);

const Select = ({ label, value, onChange, options, className = "" }) => (
  <div className="flex flex-col gap-1.5">
    {label && (
      <label className="text-xs font-semibold text-physio-text-secondary uppercase tracking-wider ml-1">
        {label}
      </label>
    )}
    <div className="relative">
      <select
        value={value}
        onChange={onChange}
        className={`
          w-full bg-physio-bg-core border border-physio-border-strong rounded-lg px-4 py-2.5 pr-8
          text-physio-text-primary appearance-none
          focus:outline-none focus:border-physio-accent-primary focus:ring-1 focus:ring-physio-accent-primary/50
          transition-all duration-200
          ${className}
        `}
      >
        {options.map((opt) => (
          <option key={opt.value} value={opt.value}>
            {opt.label}
          </option>
        ))}
      </select>
      <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-physio-text-secondary">
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </div>
    </div>
  </div>
);

const PersonalizationSection = ({ profile, onUpdate, dense = false }) => {
    const phenotypeValue = profile.geneticPhenotype || profile.arSensitivity || 'normal';
    const phenotypeMeta = GENETIC_ARCHETYPES[phenotypeValue] || GENETIC_ARCHETYPES.normal;

    const handlePhenotypeChange = (value) => {
      onUpdate({
        ...profile,
        arSensitivity: value,
        geneticPhenotype: value,
      });
    };
  const [isEnabled, setIsEnabled] = useState(() => {
    return localStorage.getItem("personalizationEnabled") === "true";
  });

  const toggleEnabled = () => {
    const newState = !isEnabled;
    setIsEnabled(newState);
    localStorage.setItem("personalizationEnabled", String(newState));
  };

  const handleChange = (field, value) => {
    onUpdate({ ...profile, [field]: value });
  };

  const containerClasses = dense
    ? "mt-4 pt-4 border-t border-physio-border-subtle/60 animate-fade-in"
    : "mt-8 pt-8 border-t border-physio-border-subtle animate-fade-in";

  const headerSpacing = dense ? "mb-4" : "mb-6";

  return (
    <div className={containerClasses} data-testid="optimizer-pane">
      <div className={`flex items-center justify-between ${headerSpacing}`}>
        <div className="flex items-center gap-3">
          <div className={`p-2 rounded-lg transition-colors ${isEnabled ? 'bg-physio-accent-primary/10 text-physio-accent-primary' : 'bg-physio-bg-highlight text-physio-text-secondary'}`}>
            <IconUser />
          </div>
          <div>
            <h3 className={`text-sm font-bold transition-colors ${isEnabled ? 'text-physio-text-primary' : 'text-physio-text-secondary'}`}>
              Advanced Personalization
            </h3>
            <p className="text-xs text-physio-text-tertiary">
              Calibrate the simulation engine to your unique physiology.
            </p>
          </div>
        </div>

        <label className="flex items-center cursor-pointer select-none group">
          <div className="relative">
            <input 
              type="checkbox" 
              className="sr-only" 
              checked={isEnabled} 
              onChange={toggleEnabled} 
            />
            <div className={`block w-10 h-6 rounded-full transition-colors ${isEnabled ? 'bg-physio-accent-primary' : 'bg-physio-bg-highlight group-hover:bg-physio-border-strong'}`}></div>
            <div className={`absolute left-1 top-1 bg-white w-4 h-4 rounded-full transition-transform ${isEnabled ? 'transform translate-x-4' : ''}`}></div>
          </div>
          <span className={`ml-3 text-xs font-medium transition-colors ${isEnabled ? 'text-physio-text-primary' : 'text-physio-text-tertiary'}`}>
            {isEnabled ? 'Enabled' : 'Disabled'}
          </span>
        </label>
      </div>

      <div className={`grid grid-cols-1 md:grid-cols-2 gap-6 transition-all duration-300 ${isEnabled ? 'opacity-100' : 'opacity-40 pointer-events-none grayscale'}`}>
        {/* Column 1: Biometrics */}
        <div className="space-y-4">
          <h4 className="text-xs font-bold text-physio-text-tertiary uppercase tracking-widest mb-2">Biometrics</h4>
          
          <Select
            label="Biological Sex"
            value={profile.gender || 'male'}
            onChange={(e) => handleChange('gender', e.target.value)}
            options={[
              { value: 'male', label: 'Male' },
              { value: 'female', label: 'Female' }
            ]}
          />

          <div className="grid grid-cols-2 gap-4">
            <Input
              label="Age (Years)"
              type="number"
              value={profile.age}
              onChange={(e) => handleChange('age', Number(e.target.value))}
            />
            <Input
              label="Weight (kg)"
              type="number"
              value={profile.bodyweight}
              onChange={(e) => handleChange('bodyweight', Number(e.target.value))}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <Input
              label="Body Fat (%)"
              type="number"
              value={profile.bodyFat || 15}
              onChange={(e) => handleChange('bodyFat', Number(e.target.value))}
            />
            <Input
              label="SHBG (nmol/L)"
              type="number"
              placeholder="Unknown (Default: 30)"
              value={profile.shbg}
              onChange={(e) => handleChange('shbg', Number(e.target.value))}
            />
          </div>
        </div>

        {/* Column 2: Experience & Sensitivity */}
        <div className="space-y-4">
          <h4 className="text-xs font-bold text-physio-text-tertiary uppercase tracking-widest mb-2">Physiology</h4>
          
          <Select
            label="Experience Level"
            value={profile.experience}
            onChange={(e) => handleChange('experience', e.target.value)}
            options={[
              { value: 'none', label: 'Novice (First Cycle)' },
              { value: 'test_only', label: 'Intermediate (Test Only)' },
              { value: 'multi_compound', label: 'Advanced (Multi-Compound)' },
              { value: 'blast_cruise', label: 'Veteran (Blast & Cruise)' }
            ]}
          />

          <div className="grid grid-cols-2 gap-4">
             <Select
              label="Aromatase (CYP19A1)"
              value={profile.aromatase}
              onChange={(e) => handleChange('aromatase', e.target.value)}
              options={[
                { value: 'low', label: 'Low (Dry)' },
                { value: 'moderate', label: 'Normal' },
                { value: 'high', label: 'High (Wet)' }
              ]}
            />
            <Select
              label="Neuro Sensitivity (COMT)"
              value={profile.anxiety}
              onChange={(e) => handleChange('anxiety', e.target.value)}
              options={[
                { value: 'low', label: 'Fast COMT (Resilient)' },
                { value: 'moderate', label: 'Normal' },
                { value: 'high', label: 'Slow COMT (Anxious)' },
              ]}
            />
          </div>

          <Select
            label="Genetic Phenotype"
            value={phenotypeValue}
            onChange={(e) => handlePhenotypeChange(e.target.value)}
            options={[
              {
                value: 'hyper_responder',
                label: 'Hyper-Responder · Low CAG + PDE7B AA',
              },
              {
                value: 'normal',
                label: 'Average · Baseline Clinical Response',
              },
              {
                value: 'low_responder',
                label: 'Non-Responder · High CAG (Rusty Lock)',
              },
            ]}
          />
          <p className="text-[10px] text-physio-text-tertiary ml-1">
            ROI Window: {phenotypeMeta.arMultiplier.toFixed(2)}x signal · {phenotypeMeta.metabolismMultiplier.toFixed(2)}x serum uptake
          </p>

          <Select
            label="Energy State (Diet)"
            value={profile.dietState || 'maintenance'}
            onChange={(e) => handleChange('dietState', e.target.value)}
            options={[
              { value: 'cutting', label: 'Deficit (Cutting)' },
              { value: 'maintenance', label: 'Maintenance' },
              { value: 'bulking', label: 'Surplus (Bulking)' },
            ]}
          />

          <Select
            label="Training Stimulus"
            value={profile.trainingStyle || 'bodybuilding'}
            onChange={(e) => handleChange('trainingStyle', e.target.value)}
            options={[
              { value: 'bodybuilding', label: 'Bodybuilding (Hypertrophy)' },
              { value: 'powerlifting', label: 'Powerlifting (Strength)' },
              { value: 'crossfit', label: 'CrossFit (Mixed/Endurance)' },
            ]}
          />

          <Input
            label="Training Age (Years)"
            type="number"
            value={profile.yearsTraining}
            onChange={(e) => handleChange('yearsTraining', Number(e.target.value))}
          />
        </div>
      </div>
    </div>
  );
};

const OptimizationCard = ({ title, subtitle, onClick, loading, active, disabled, variant = 'default', carbonHeader = false }) => {
  
  let borderClass = 'border-physio-border-subtle';
  let bgClass = 'bg-physio-bg-surface';
  let activeClass = 'bg-physio-bg-highlight';
  let iconColor = 'text-physio-text-primary';
  let Icon = IconEfficiency;

  if (variant === 'warning') {
    activeClass = 'bg-physio-accent-warning/10 border-physio-accent-warning/50';
    iconColor = 'text-physio-accent-warning';
    Icon = IconSafe;
  } else if (variant === 'critical') {
    activeClass = 'bg-physio-accent-critical/10 border-physio-accent-critical/50';
    iconColor = 'text-physio-accent-critical';
    Icon = IconDanger;
  } else if (variant === 'ai') {
    activeClass = 'bg-gradient-to-br from-physio-accent-primary/10 to-physio-accent-secondary/10 border-physio-accent-primary/50';
    iconColor = 'text-physio-accent-primary';
    Icon = IconEfficiency; // Could add a custom AI icon later
  } else if (active) {
    activeClass = 'bg-physio-accent-success/10 border-physio-accent-success/50';
    iconColor = 'text-physio-accent-success';
  }

  const interactiveGlow = disabled
    ? ""
    : active
      ? "ring-2 ring-offset-2 ring-offset-physio-bg-core shadow-[0_0_32px_rgba(59,130,246,0.4)]"
      : "hover:border-physio-accent-primary hover:shadow-[0_0_22px_rgba(59,130,246,0.35)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-physio-accent-primary/60 focus-visible:outline-offset-2";

  const stateClass = disabled
    ? "opacity-50 cursor-not-allowed bg-physio-bg-surface border-physio-border-subtle"
    : active
      ? `${activeClass} border-2`
      : `${bgClass} ${borderClass}`;

  return (
    <button 
      onClick={onClick}
      disabled={loading || disabled}
      className={`group cta-scan relative flex flex-col items-start p-5 rounded-lg border text-left transition-all duration-200 w-full overflow-hidden ${stateClass} ${interactiveGlow}`}
    >
      <span className="scan-line" aria-hidden="true"></span>
      <div className="flex justify-between w-full items-center mb-2">
        <div className="flex items-center gap-3">
          <span className={`${iconColor} transition-colors group-hover:text-physio-accent-primary`}>
            <Icon />
          </span>
          <h3 className={`text-sm font-bold transition-colors ${active ? iconColor : 'text-physio-text-primary'} group-hover:text-physio-accent-primary`}>
            {title}
          </h3>
          {active && !loading && (
            <div className="flex items-center justify-center w-5 h-5 bg-physio-accent-success rounded-full shadow-sm">
              <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
              </svg>
            </div>
          )}
        </div>
        {loading && (
          <div className="flex items-center gap-2">
            <span className="text-xs font-medium text-physio-text-secondary animate-pulse">PROCESSING</span>
            <div className="w-4 h-4 border-2 border-physio-text-secondary border-t-transparent rounded-full animate-spin" />
          </div>
        )}
      </div>
      <p className="text-xs text-physio-text-secondary leading-relaxed pl-8 transition-colors group-hover:text-physio-accent-primary/80">
        {subtitle}
      </p>
    </button>
  );
};

const ResultPreview = ({ originalStack, optimizedStack, originalScore, newScore, onApply, onCancel, type, mode, riskScore, warning }) => {
  const isDeathWish = mode === 'absolute_max';
  const isMaxSafe = mode === 'max_safe';
  
  let accentColor = 'text-physio-accent-success';
  let bgColor = 'bg-physio-accent-success/10';
  let borderColor = 'border-physio-border-subtle';
  let btnColor = 'bg-physio-accent-success text-black';
  let titleText = 'Optimization Found';

  if (isMaxSafe) {
    accentColor = 'text-physio-accent-warning';
    bgColor = 'bg-physio-accent-warning/10';
    borderColor = 'border-physio-accent-warning/30';
    btnColor = 'bg-physio-accent-warning text-black';
    titleText = 'Max Tolerable Load Found';
  } else if (isDeathWish) {
    accentColor = 'text-physio-accent-critical';
    bgColor = 'bg-physio-accent-critical/10';
    borderColor = 'border-physio-accent-critical';
    btnColor = 'bg-physio-accent-critical text-white hover:bg-red-600';
    titleText = 'REDLINE PROTOCOL FOUND';
  }

  // Handle different stack structures (AI optimization vs traditional)
  const isAIResult = type === 'genetic_algorithm' || type === 'multi_objective';

  let items;
  if (isAIResult) {
    // For AI results, show all compounds in the optimized stack
    items = optimizedStack.map((item) => {
      const meta = compoundData[item.compoundId];
      const originalItem = originalStack.find(o => o.compoundId === item.compoundId);

      return {
        name: meta?.metadata?.name || item.compoundId,
        oldDose: originalItem?.dose || 0,
        newDose: item.dose,
        isChanged: !originalItem || item.dose !== originalItem.dose,
        isNew: !originalItem,
        isRemoved: false
      };
    });

    // Mark removed compounds
    originalStack.forEach((item) => {
      if (!optimizedStack.find(o => o.compoundId === item.compoundId)) {
        const meta = compoundData[item.compoundId];
        items.push({
          name: meta?.metadata?.name || item.compoundId,
          oldDose: item.dose,
          newDose: 0,
          isChanged: true,
          isNew: false,
          isRemoved: true
        });
      }
    });
  } else {
    // Traditional optimization - assume same compounds, different doses
    items = optimizedStack.map((item, index) => {
      const oldItem = originalStack[index];
      const meta = compoundData[item.compoundId];
      const isChanged = item.dose !== oldItem.dose;

      return {
        name: meta?.metadata?.name || item.compoundId,
        oldDose: oldItem.dose,
        newDose: item.dose,
        isChanged,
        isNew: false,
        isRemoved: false
      };
    });
  }

  items.sort((a, b) => {
    // Sort by: new additions, changes, removals
    if (a.isNew && !b.isNew) return -1;
    if (!a.isNew && b.isNew) return 1;
    if (a.isRemoved && !b.isRemoved) return 1;
    if (!a.isRemoved && b.isRemoved) return -1;
    if (a.isChanged && !b.isChanged) return -1;
    if (!a.isChanged && b.isChanged) return 1;
    return 0;
  });

  return (
    <div className={`mt-6 bg-physio-bg-surface rounded-lg border ${borderColor} overflow-hidden animate-fade-in shadow-lg`}>
      {/* Header */}
      <div className={`px-6 py-4 border-b ${carbonHeader ? 'carbon-header' : isDeathWish ? 'border-physio-accent-critical/30 bg-physio-accent-critical/5' : isMaxSafe ? 'border-physio-accent-warning/20 bg-physio-accent-warning/5' : 'border-physio-border-subtle bg-physio-bg-highlight/30'} flex justify-between items-start`}>
        <div>
          <h4 className={`text-sm font-bold ${isDeathWish ? 'text-physio-accent-critical' : 'text-physio-text-primary'}`}>
             {titleText}
          </h4>
          <p className="text-xs text-physio-text-secondary mt-1">
            {isDeathWish || isMaxSafe ? 'Anabolic Power (Benefit):' : 'Efficiency Score:'} <span className="text-physio-text-tertiary">{originalScore?.toFixed(2)}</span> → <span className={`${accentColor} font-bold`}>{newScore?.toFixed(2)}</span>
          </p>
          {isDeathWish && (
             <p className="text-xs text-physio-accent-critical mt-1 font-bold">
               Risk Score: {riskScore?.toFixed(1)} (EXTREME LOAD)
             </p>
          )}
        </div>
        <div className={`text-xs font-mono font-bold ${accentColor} ${bgColor} px-3 py-1.5 rounded uppercase`}>
          {isDeathWish ? 'REDLINE' : isMaxSafe ? 'MAX LOAD' : 'OPTIMAL'}
        </div>
      </div>

      {/* Warning Banner */}
      {(warning || isDeathWish || isMaxSafe) && (
          <div className={`px-6 py-3 border-b flex items-start gap-3 ${isDeathWish ? 'bg-physio-accent-critical/10 border-physio-accent-critical/20' : 'bg-physio-accent-warning/10 border-physio-accent-warning/20'}`}>
             <div className={`mt-0.5 ${isDeathWish ? 'text-physio-accent-critical' : 'text-physio-accent-warning'}`}>
               <IconDanger />
             </div>
             <p className={`text-[10px] leading-relaxed ${isDeathWish ? 'text-physio-accent-critical' : 'text-physio-accent-warning'}`}>
               {warning || (isDeathWish 
                 ? <strong>WARNING: This protocol ignores tolerance limits. Organ stress is critical. Diminishing returns are active.</strong> 
                 : <strong>Warning: This protocol pushes your system to the theoretical limit. Net Benefit is positive, but barely.</strong>
               )}
             </p>
          </div>
      )}

      {/* Changes List */}
      <div className="px-6 py-4 space-y-3">
        {items.map((item, i) => {
          let changeType = '';
          let changeColor = accentColor;

          if (item.isNew) {
            changeType = 'NEW';
            changeColor = 'text-green-400';
          } else if (item.isRemoved) {
            changeType = 'REMOVED';
            changeColor = 'text-red-400';
          } else if (item.isChanged) {
            changeType = 'CHANGED';
          }

          return (
            <div key={i} className={`flex justify-between items-center text-xs border-b border-physio-border-subtle/50 last:border-0 pb-2 last:pb-0 ${!item.isChanged && !item.isNew && !item.isRemoved ? 'opacity-50' : ''}`}>
              <div className="flex items-center gap-2">
                <span className="font-medium text-physio-text-primary">
                  {item.name}
                </span>
                {changeType && (
                  <span className={`text-[10px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded ${changeColor} bg-current/10`}>
                    {changeType}
                  </span>
                )}
                {!item.isChanged && !item.isNew && !item.isRemoved && (
                  <span className="text-[10px] text-physio-text-tertiary uppercase tracking-wider">(Optimal)</span>
                )}
              </div>
              <div className="flex items-center gap-3 font-mono">
                {item.isRemoved ? (
                  <span className="text-physio-text-tertiary line-through">{item.oldDose}mg</span>
                ) : item.isNew ? (
                  <span className={`${changeColor} font-bold`}>+{item.newDose}mg</span>
                ) : item.isChanged ? (
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
          );
        })}
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
          {isDeathWish ? 'I Understand the Risks - Apply' : isMaxSafe ? 'Push Limits' : 'Apply Changes'}
        </button>
      </div>
    </div>
  );
};

const OptimizerPane = ({ stack, userProfile, onApplyOptimization, onUpdateProfile, compact = false }) => {
  const [optimizing, setOptimizing] = useState(false);
  const [result, setResult] = useState(null);
  const [personalizationOpen, setPersonalizationOpen] = useState(!compact);

  const handlePeakEfficiency = async () => {
    setOptimizing(true);
    setResult({ type: 'efficiency', loading: true });
    try {
      const activeCompounds = stack.map(s => compoundData[s.compoundId]).filter(Boolean);
      const currentStack = stack.map(s => ({ compoundId: s.compoundId, dose: s.dose }));
      
      const res = await simulationService.runOptimization({
        type: 'efficiency',
        currentStack,
        compounds: activeCompounds,
        userProfile
      });
      
      setResult({ 
        ...res, 
        type: 'efficiency',
        originalBenefit: res.originalScore, // Map for UI compatibility
        newBenefit: res.newScore,
        isDifferent: res.newScore > res.originalScore
      });
    } catch (error) {
      console.error("Optimization failed:", error);
    } finally {
      setOptimizing(false);
    }
  };

  const handleMaxSafe = async () => {
    setOptimizing(true);
    setResult({ mode: 'max_safe', loading: true });
    try {
      const activeCompounds = stack.map(s => compoundData[s.compoundId]).filter(Boolean);
      const currentStack = stack.map(s => ({ compoundId: s.compoundId, dose: s.dose }));

      const res = await simulationService.runOptimization({
        type: 'max_safe',
        currentStack,
        compounds: activeCompounds,
        userProfile
      });

      setResult({ 
        ...res, 
        mode: 'max_safe',
        originalBenefit: res.originalScore,
        newBenefit: res.newScore,
        isDifferent: res.newScore > res.originalScore
      });
    } catch (error) {
      console.error("Optimization failed:", error);
    } finally {
      setOptimizing(false);
    }
  };

  const handleAbsoluteMax = async () => {
    setOptimizing(true);
    setResult({ mode: 'absolute_max', loading: true });
    try {
      const activeCompounds = stack.map(s => compoundData[s.compoundId]).filter(Boolean);
      const currentStack = stack.map(s => ({ compoundId: s.compoundId, dose: s.dose }));

      const res = await simulationService.runOptimization({
        type: 'redline',
        currentStack,
        compounds: activeCompounds,
        userProfile
      });

      setResult({ 
        ...res, 
        mode: 'absolute_max',
        originalBenefit: res.originalScore,
        newBenefit: res.newScore,
        isDifferent: res.newScore > res.originalScore
      });
    } catch (error) {
      console.error("Optimization failed:", error);
    } finally {
      setOptimizing(false);
    }
  };

  const handleGeneticAlgorithm = async () => {
    setOptimizing(true);
    setResult({ type: 'genetic_algorithm', loading: true });
    try {
      const activeCompounds = stack.map(s => compoundData[s.compoundId]).filter(Boolean);
      const currentStack = stack.map(s => ({ compoundId: s.compoundId, dose: s.dose }));

      const res = await simulationService.runOptimization({
        type: 'genetic_algorithm',
        currentStack,
        compounds: activeCompounds,
        userProfile
      });

      setResult({ 
        ...res, 
        type: 'genetic_algorithm',
        originalBenefit: res.originalScore,
        newBenefit: res.newScore,
        isDifferent: res.newScore > res.originalScore
      });
    } catch (error) {
      console.error("Optimization failed:", error);
    } finally {
      setOptimizing(false);
    }
  };

  const handleMultiObjective = async () => {
    setOptimizing(true);
    setResult({ type: 'multi_objective', loading: true });
    try {
      const activeCompounds = stack.map(s => compoundData[s.compoundId]).filter(Boolean);
      const currentStack = stack.map(s => ({ compoundId: s.compoundId, dose: s.dose }));

      const res = await simulationService.runOptimization({
        type: 'multi_objective',
        currentStack,
        compounds: activeCompounds,
        userProfile
      });

      setResult({ 
        ...res, 
        type: 'multi_objective',
        originalBenefit: res.originalScore,
        newBenefit: res.newScore,
        isDifferent: res.newScore > res.originalScore
      });
    } catch (error) {
      console.error("Optimization failed:", error);
    } finally {
      setOptimizing(false);
    }
  };

  const isEmpty = stack.length === 0;

  const containerClasses = compact
    ? "h-full bg-physio-bg-core/85 border border-physio-border-subtle rounded-2xl backdrop-blur-xl flex flex-col shadow-neo-lg"
    : "absolute inset-0 bg-physio-bg-core flex flex-col";

  const headerClasses = compact
    ? "px-5 py-3 border-b border-physio-border-subtle/60 flex items-center justify-between"
    : "px-8 py-6 border-b border-physio-border-subtle bg-physio-bg-surface/80 backdrop-blur z-10";

  const contentClasses = compact
    ? "flex-1 overflow-hidden px-5 py-4"
    : "flex-1 overflow-y-auto p-8";

  return (
    <div className={containerClasses} data-testid="optimizer-pane">
      {/* Header */}
      <div className={headerClasses}>
        <h2 className="text-base font-bold text-physio-text-primary tracking-wide">
          Protocol Optimization
        </h2>
        <p className={`text-xs text-physio-text-tertiary ${compact ? "ml-auto" : "mt-1"}`}>
          Select a solver to analyze and improve your current stack configuration.
        </p>
      </div>

      {/* Scrollable Content */}
      <div className={contentClasses}>
        {isEmpty ? (
          <div className={`flex flex-col items-center justify-center ${compact ? "h-full" : "h-64"} text-center border border-dashed border-physio-border-subtle rounded-xl bg-physio-bg-surface/50`}>
            <div className="text-physio-text-tertiary mb-3">
              <IconEfficiency />
            </div>
            <h3 className="text-sm font-bold text-physio-text-secondary mb-1">No Compounds Detected</h3>
            <p className="text-xs text-physio-text-tertiary max-w-xs">
              Add compounds to your stack in the "Explore" tab to unlock optimization tools.
            </p>
          </div>
        ) : (
          <div className={compact ? "h-full flex flex-col gap-4 overflow-y-auto pr-1" : "max-w-2xl mx-auto space-y-4"}>
            
            {/* 1. PEAK EFFICIENCY */}
            <div className={compact ? "grid grid-cols-1 md:grid-cols-3 gap-3" : "space-y-4"}>
            <OptimizationCard 
              title="Peak Efficiency"
              subtitle="Adjust dosages to find the mathematical maximum Net Benefit (ROI)."
              onClick={handlePeakEfficiency}
              active={result?.type === 'efficiency' || (result?.loading && result?.type === 'efficiency')}
              loading={optimizing && result?.type === 'efficiency'}
            />

            {/* 2. MAX SAFE POWER */}
            <OptimizationCard 
              variant="warning"
              title="Max Tolerable Load"
              subtitle="Push dosages to the absolute limit while maintaining a positive ROI."
              onClick={handleMaxSafe}
              loading={optimizing && result?.mode === 'max_safe'}
              active={result?.mode === 'max_safe' || (result?.loading && result?.mode === 'max_safe')}
            />

            {/* 3. ABSOLUTE MAX POWER */}
            <OptimizationCard
              variant="critical"
              title="Redline"
              subtitle="Ignore tolerance caps. Maximize Anabolic Signal until receptors fully saturate."
              onClick={handleAbsoluteMax}
              loading={optimizing && result?.mode === 'absolute_max'}
              active={result?.mode === 'absolute_max' || (result?.loading && result?.mode === 'absolute_max')}
            />
            </div>

            {/* ADVANCED OPTIMIZATION ALGORITHMS */}
            <div className="mt-6 pt-6 border-t border-physio-border-subtle/60">
              <h4 className="text-xs font-bold text-physio-text-secondary uppercase tracking-wider mb-4 flex items-center gap-2">
                <span className="text-physio-accent-primary">🤖</span>
                Advanced Algorithms
              </h4>

              <div className={compact ? "grid grid-cols-1 md:grid-cols-2 gap-3" : "grid grid-cols-1 md:grid-cols-2 gap-4"}>
                {/* 4. GENETIC ALGORITHM */}
                <OptimizationCard
                  variant="ai"
                  carbonHeader={true}
                  title="Genetic Algorithm"
                  subtitle="Evolutionary optimization using population-based search to find optimal stacks."
                  onClick={handleGeneticAlgorithm}
                  loading={optimizing && result?.type === 'genetic_algorithm'}
                  active={result?.type === 'genetic_algorithm' || (result?.loading && result?.type === 'genetic_algorithm')}
                />

                {/* 5. MULTI-OBJECTIVE OPTIMIZATION */}
                <OptimizationCard
                  variant="ai"
                  carbonHeader={true}
                  title="Multi-Objective"
                  subtitle="Find Pareto-optimal solutions balancing muscle gain vs side effects."
                  onClick={handleMultiObjective}
                  loading={optimizing && result?.type === 'multi_objective'}
                  active={result?.type === 'multi_objective' || (result?.loading && result?.type === 'multi_objective')}
                />
              </div>
            </div>

            {/* PREVIEW AREA */}
            {result && !result.loading && result.isDifferent && (
              <ResultPreview 
                originalStack={stack}
                optimizedStack={result.optimizedStack}
                originalScore={result.originalBenefit || result.originalScore}
                newScore={result.newBenefit || result.newScore}
                type={result.type}
                mode={result.mode}
                riskScore={result.riskScore}
                warning={result.warning}
                onApply={() => {
                  onApplyOptimization(result.optimizedStack);
                  setResult(null);
                }}
                onCancel={() => setResult(null)}
              />
            )}
            
            {result && !result.loading && !result.isDifferent && !optimizing && (
               <div className="mt-6 p-4 bg-physio-bg-surface border border-physio-border-subtle rounded-lg text-center animate-fade-in">
                 <div className="text-physio-accent-success mb-2 flex justify-center">
                   <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                     <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                   </svg>
                 </div>
                 <p className="text-sm font-bold text-physio-text-primary">Optimized</p>
                 <p className="text-xs text-physio-text-secondary mt-1">Current protocol is already at peak efficiency.</p>
               </div>
            )}

            {/* PERSONALIZATION SECTION */}
            {compact && (
              <button
                onClick={() => setPersonalizationOpen((prev) => !prev)}
                className="flex items-center justify-between w-full px-4 py-2 text-xs font-semibold uppercase tracking-[0.3em] text-physio-text-secondary border border-physio-border-subtle rounded-lg bg-physio-bg-highlight/30 hover:border-physio-accent-primary hover:text-physio-accent-primary transition"
              >
                <span>Advanced Personalization</span>
                <span>{personalizationOpen ? "−" : "+"}</span>
              </button>
            )}

            {(!compact || personalizationOpen) && (
              <PersonalizationSection
                dense={compact}
                profile={userProfile}
                onUpdate={onUpdateProfile}
              />
            )}

          </div>
        )}
      </div>
    </div>
  );
};

export default OptimizerPane;
