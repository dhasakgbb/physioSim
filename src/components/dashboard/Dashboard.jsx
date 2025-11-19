import React, { useState, useMemo, useCallback } from 'react';
import DashboardLayout from './DashboardLayout';
import CompoundDock from './CompoundDock';
import ActiveStackRail from './ActiveStackRail';
import NetEffectChart from './NetEffectChart';
import VitalSigns from './VitalSigns';
import MechanismMonitor from './MechanismMonitor';
import BiomarkerMatrix from './BiomarkerMatrix';
import CompoundInspector from './CompoundInspector';
import SerumStabilityChart from './SerumStabilityChart';
import OutcomeRadar from './OutcomeRadar';
import LabReportCard from './LabReportCard';
import { compoundData } from '../../data/compoundData';
import { evaluateStack } from '../../utils/stackEngine';
import { defaultProfile } from '../../utils/personalization';

const Dashboard = () => {
  // 1. Unified State
  const [stack, setStack] = useState([]);
  const [userProfile] = useState(defaultProfile);
  const [inspectedCompound, setInspectedCompound] = useState(null);
  const [viewMode, setViewMode] = useState('net'); // 'net', 'pk', 'radar'

  // 2. The Brain
  const metrics = useMemo(() => {
    return evaluateStack({
      stackInput: stack,
      profile: userProfile
    });
  }, [stack, userProfile]);

  // 3. Actions
  const handleAddCompound = useCallback((compoundKey) => {
    if (stack.some(i => i.compound === compoundKey)) return; 
    const meta = compoundData[compoundKey];
    const startDose = meta.type === 'oral' ? 20 : 200; 
    
    // --- THE GOOGLE "SMART DEFAULT" LOGIC ---
    let defaultFreq = 3.5; // Default 2x/week
    if (meta.type === 'oral') defaultFreq = 1; // Daily
    else if (meta.halfLife < 48) defaultFreq = 2; // EOD for short esters
    // ----------------------------------------

    setStack(prev => [...prev, { 
      compound: compoundKey, 
      dose: startDose,
      frequency: defaultFreq // Store it here
    }]);
  }, [stack]);

  const handleDoseChange = useCallback((compoundKey, newDose) => {
    setStack(prev => prev.map(item => 
      item.compound === compoundKey ? { ...item, dose: newDose } : item
    ));
  }, []);

  const handleRemove = useCallback((compoundKey) => {
    setStack(prev => prev.filter(i => i.compound !== compoundKey));
  }, []);

  const handleEsterChange = useCallback((compoundKey, newEster) => {
    setStack(prev => prev.map(item => 
      item.compound === compoundKey ? { ...item, ester: newEster } : item
    ));
  }, []);

  const handleFrequencyChange = useCallback((compoundKey, newFreq) => {
    setStack(prev => prev.map(item => 
      item.compound === compoundKey ? { ...item, frequency: newFreq } : item
    ));
  }, []);

  // 4. Render
  return (
    <>
    <DashboardLayout
      // ZONE A: The Active Inputs
      leftRail={
        <ActiveStackRail 
          stack={stack} 
          onDoseChange={handleDoseChange} 
          onRemove={handleRemove}
          onInspect={setInspectedCompound}
          onEsterChange={handleEsterChange}
          onFrequencyChange={handleFrequencyChange}
        />
      }

      // ZONE B: The Visualization
      centerStage={
        <>
          {/* Toggle Switch (Floating Top Right) */}
          <div className="absolute top-4 right-6 z-20 flex bg-physio-bg-surface/80 backdrop-blur border border-physio-border-subtle rounded-lg p-1">
            <button 
              onClick={() => setViewMode('net')}
              className={`px-3 py-1 text-xs font-medium rounded transition-all ${viewMode === 'net' ? 'bg-physio-bg-highlight text-white shadow-sm' : 'text-physio-text-tertiary hover:text-physio-text-primary'}`}
            >
              Net Impact
            </button>
            <button 
              onClick={() => setViewMode('pk')}
              className={`px-3 py-1 text-xs font-medium rounded transition-all ${viewMode === 'pk' ? 'bg-physio-bg-highlight text-white shadow-sm' : 'text-physio-text-tertiary hover:text-physio-text-primary'}`}
            >
              Stability (PK)
            </button>
            <button 
              onClick={() => setViewMode('radar')}
              className={`px-3 py-1 text-xs font-medium rounded transition-all ${viewMode === 'radar' ? 'bg-physio-bg-highlight text-white shadow-sm' : 'text-physio-text-tertiary hover:text-physio-text-primary'}`}
            >
              Phenotype
            </button>
          </div>

          {/* View Switcher */}
          {viewMode === 'net' ? (
            <NetEffectChart stack={stack} userProfile={userProfile} />
          ) : viewMode === 'pk' ? (
            <SerumStabilityChart stack={stack} />
          ) : (
            <OutcomeRadar metrics={metrics} />
          )}
        </>
      }

      // ZONE C: THE LOGICAL LOOP (Score -> Governor -> Engine -> Bill)
      rightRail={
        <div className="space-y-6 pb-10">
          {/* 1. THE NORTH STAR: Score */}
          <VitalSigns metrics={metrics} stack={stack} showScoreOnly={true} />

          {/* 2. THE GOVERNOR: Saturation */}
          <MechanismMonitor stack={stack} />

          {/* 3. THE VIRTUAL PHLEBOTOMIST: Lab Prediction */}
          <LabReportCard stack={stack} />

          {/* 4. THE ENGINE: Signaling */}
          <BiomarkerMatrix stack={stack} />

          {/* 5. THE BILL: Safety */}
          <VitalSigns metrics={metrics} stack={stack} showSafetyOnly={true} />
        </div>
      }

      // ZONE D: The Dock
      bottomDock={
        <CompoundDock onAddCompound={handleAddCompound} />
      }
    />

    {/* CompoundInspector - Render outside layout as overlay */}
    {inspectedCompound && (
      <CompoundInspector 
        compoundKey={inspectedCompound} 
        onClose={() => setInspectedCompound(null)} 
      />
    )}
    </>
  );
};

export default Dashboard;
