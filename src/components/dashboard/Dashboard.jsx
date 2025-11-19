import React, { useState, useMemo, useCallback } from 'react';
import DashboardLayout from './DashboardLayout';
import CompoundDock from './CompoundDock';
import ActiveStackRail from './ActiveStackRail';
import NetEffectChart from './NetEffectChart';
import VitalSigns from './VitalSigns';
import MechanismMonitor from './MechanismMonitor';
import BiomarkerMatrix from './BiomarkerMatrix';
import CompoundInspector from './CompoundInspector';
import { compoundData } from '../../data/compoundData';
import { evaluateStack } from '../../utils/stackEngine';
import { defaultProfile } from '../../utils/personalization';

const Dashboard = () => {
  // 1. Unified State
  const [stack, setStack] = useState([]);
  const [userProfile] = useState(defaultProfile);
  const [inspectedCompound, setInspectedCompound] = useState(null);

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
    setStack(prev => [...prev, { compound: compoundKey, dose: startDose }]);
  }, [stack]);

  const handleDoseChange = useCallback((compoundKey, newDose) => {
    setStack(prev => prev.map(item => 
      item.compound === compoundKey ? { ...item, dose: newDose } : item
    ));
  }, []);

  const handleRemove = useCallback((compoundKey) => {
    setStack(prev => prev.filter(i => i.compound !== compoundKey));
  }, []);

  // 4. Render
  return (
    <DashboardLayout
      // ZONE A: The Active Inputs
      leftRail={
        <ActiveStackRail 
          stack={stack} 
          onDoseChange={handleDoseChange} 
          onRemove={handleRemove}
          onInspect={setInspectedCompound}
        />
      }

      // ZONE B: The Visualization
      centerStage={
        <>
          <NetEffectChart stack={stack} userProfile={userProfile} />
          {inspectedCompound && (
            <CompoundInspector 
              compoundKey={inspectedCompound} 
              onClose={() => setInspectedCompound(null)} 
            />
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

          {/* 3. THE ENGINE: Signaling */}
          <BiomarkerMatrix stack={stack} />

          {/* 4. THE BILL: Safety */}
          <VitalSigns metrics={metrics} stack={stack} showSafetyOnly={true} />
        </div>
      }

      // ZONE D: The Dock
      bottomDock={
        <CompoundDock onAddCompound={handleAddCompound} />
      }
    />
  );
};

export default Dashboard;
