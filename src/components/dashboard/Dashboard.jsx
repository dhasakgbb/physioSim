import React from 'react';
import DashboardLayout from './DashboardLayout';
import CompoundDock from './CompoundDock';
import ActiveStackRail from './ActiveStackRail';
import NetEffectChart from './NetEffectChart';
import VitalSigns from './VitalSigns';
import MechanismMonitor from './MechanismMonitor';
import BiomarkerMatrix from './BiomarkerMatrix';
import CompoundInspector from './CompoundInspector';
import SerumStabilityChart from './SerumStabilityChart';
import SignalingNetwork from './SignalingNetwork';
import LabReportCard from './LabReportCard';
import ErrorBoundary from '../ui/ErrorBoundary';
import { useStack } from '../../context/StackContext';

const Dashboard = () => {
  const {
    stack,
    userProfile,
    inspectedCompound,
    setInspectedCompound,
    viewMode,
    setViewMode,
    metrics,
    handleAddCompound
  } = useStack();

  // 4. Render
  return (
    <>
    <DashboardLayout
      // ZONE A: The Active Inputs
      leftRail={
        <ActiveStackRail />
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
              onClick={() => setViewMode('network')}
              className={`px-3 py-1 text-xs font-medium rounded transition-all ${viewMode === 'network' ? 'bg-physio-bg-highlight text-white shadow-sm' : 'text-physio-text-tertiary hover:text-physio-text-primary'}`}
            >
              Signaling
            </button>
          </div>

          {/* View Switcher */}
          <ErrorBoundary>
            {viewMode === 'pk' ? (
              <SerumStabilityChart stack={stack} />
            ) : viewMode === 'network' ? (
              <SignalingNetwork stack={stack} />
            ) : (
              <NetEffectChart stack={stack} userProfile={userProfile} />
            )}
          </ErrorBoundary>
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
        <CompoundDock />
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
