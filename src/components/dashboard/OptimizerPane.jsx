import React, { useState } from 'react';
import { findPeakEfficiency, findOptimalConfiguration } from '../../utils/stackOptimizer';
import { compoundData } from '../../data/compoundData';
import Input from '../ui/Input';

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

const PersonalizationSection = ({ profile, onUpdate }) => {
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

  return (
    <div className="mt-8 pt-8 border-t border-physio-border-subtle animate-fade-in">
      <div className="flex items-center justify-between mb-6">
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
            label="AR Sensitivity (CAG Repeats)"
            value={profile.arSensitivity || 'normal'}
            onChange={(e) => handleChange('arSensitivity', e.target.value)}
            options={[
              { value: 'low_responder', label: 'Low Responder (High CAG)' },
              { value: 'normal', label: 'Normal' },
              { value: 'hyper_responder', label: 'Hyper Responder (Low CAG)' },
            ]}
          />

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

const OptimizationCard = ({ title, subtitle, onClick, loading, active, disabled, variant = 'default' }) => {
  
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
  } else if (active) {
    activeClass = 'bg-physio-accent-success/10 border-physio-accent-success/50';
    iconColor = 'text-physio-accent-success';
  }

  return (
    <button 
      onClick={onClick}
      disabled={loading || disabled}
      className={`group relative flex flex-col items-start p-5 rounded-lg border text-left transition-all duration-200 w-full
        ${disabled 
          ? 'opacity-50 cursor-not-allowed bg-physio-bg-surface border-physio-border-subtle' 
          : active 
            ? activeClass 
            : `${bgClass} ${borderClass} hover:bg-physio-bg-highlight hover:border-physio-text-secondary`
        }
      `}
    >
      <div className="flex justify-between w-full items-center mb-2">
        <div className="flex items-center gap-3">
          <span className={`${iconColor} transition-colors`}>
            <Icon />
          </span>
          <h3 className={`text-sm font-bold ${active ? iconColor : 'text-physio-text-primary'}`}>
            {title}
          </h3>
        </div>
        {loading && (
          <div className="flex items-center gap-2">
            <span className="text-xs font-medium text-physio-text-secondary animate-pulse">PROCESSING</span>
            <div className="w-4 h-4 border-2 border-physio-text-secondary border-t-transparent rounded-full animate-spin" />
          </div>
        )}
      </div>
      <p className="text-xs text-physio-text-secondary leading-relaxed pl-8">
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

  items.sort((a, b) => (b.isChanged ? 1 : 0) - (a.isChanged ? 1 : 0));

  return (
    <div className={`mt-6 bg-physio-bg-surface rounded-lg border ${borderColor} overflow-hidden animate-fade-in shadow-lg`}>
      {/* Header */}
      <div className={`px-6 py-4 border-b ${isDeathWish ? 'border-physio-accent-critical/30 bg-physio-accent-critical/5' : isMaxSafe ? 'border-physio-accent-warning/20 bg-physio-accent-warning/5' : 'border-physio-border-subtle bg-physio-bg-highlight/30'} flex justify-between items-start`}>
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
          {isDeathWish ? 'I Understand the Risks - Apply' : isMaxSafe ? 'Push Limits' : 'Apply Changes'}
        </button>
      </div>
    </div>
  );
};

const OptimizerPane = ({ stack, userProfile, onApplyOptimization, onUpdateProfile }) => {
  const [optimizing, setOptimizing] = useState(false);
  const [result, setResult] = useState(null);

  const handlePeakEfficiency = async () => {
    setOptimizing(true);
    setResult({ type: 'efficiency', loading: true });
    try {
      const res = await findPeakEfficiency(stack, userProfile);
      setResult({ ...res, type: 'efficiency' });
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
      const res = await findOptimalConfiguration(stack, userProfile, 'safe');
      setResult(res);
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
      const res = await findOptimalConfiguration(stack, userProfile, 'extreme');
      setResult(res);
    } catch (error) {
      console.error("Optimization failed:", error);
    } finally {
      setOptimizing(false);
    }
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
            <div className="text-physio-text-tertiary mb-3">
              <IconEfficiency />
            </div>
            <h3 className="text-sm font-bold text-physio-text-secondary mb-1">No Compounds Detected</h3>
            <p className="text-xs text-physio-text-tertiary max-w-xs">
              Add compounds to your stack in the "Explore" tab to unlock optimization tools.
            </p>
          </div>
        ) : (
          <div className="max-w-2xl mx-auto space-y-4">
            
            {/* 1. PEAK EFFICIENCY */}
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
            <PersonalizationSection profile={userProfile} onUpdate={onUpdateProfile} />

          </div>
        )}
      </div>
    </div>
  );
};

export default OptimizerPane;
