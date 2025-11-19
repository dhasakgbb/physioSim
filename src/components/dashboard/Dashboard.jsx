import React, { useState } from 'react';
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
import DonationModal from '../DonationModal';
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

  const [showDonation, setShowDonation] = useState(false);

  // 4. Render
  return (
    <>
    <DashboardLayout
      // ZONE A: The Active Inputs
      leftRail={
        <ActiveStackRail />
      }

      // Header Controls (View Switcher + Donate)
      headerControls={
        <div className="flex items-center gap-8">
          {/* Navigation Tabs */}
          <div className="flex items-center gap-6">
            <button 
              onClick={() => setViewMode('net')}
              className={`relative py-2 text-sm font-medium transition-colors ${
                viewMode === 'net' 
                  ? 'text-physio-text-primary' 
                  : 'text-physio-text-tertiary hover:text-physio-text-secondary'
              }`}
            >
              Net Impact
              {viewMode === 'net' && (
                <span className="absolute bottom-0 left-0 w-full h-0.5 bg-physio-accent-primary rounded-t-full" />
              )}
            </button>
            <button 
              onClick={() => setViewMode('pk')}
              className={`relative py-2 text-sm font-medium transition-colors ${
                viewMode === 'pk' 
                  ? 'text-physio-text-primary' 
                  : 'text-physio-text-tertiary hover:text-physio-text-secondary'
              }`}
            >
              Stability
              {viewMode === 'pk' && (
                <span className="absolute bottom-0 left-0 w-full h-0.5 bg-physio-accent-primary rounded-t-full" />
              )}
            </button>
            <button 
              onClick={() => setViewMode('network')}
              className={`relative py-2 text-sm font-medium transition-colors ${
                viewMode === 'network' 
                  ? 'text-physio-text-primary' 
                  : 'text-physio-text-tertiary hover:text-physio-text-secondary'
              }`}
            >
              Signaling
              {viewMode === 'network' && (
                <span className="absolute bottom-0 left-0 w-full h-0.5 bg-physio-accent-primary rounded-t-full" />
              )}
            </button>
          </div>
          
          {/* Action Button (Material 3 Filled Tonal) */}
          <button 
            onClick={() => setShowDonation(true)}
            className="flex items-center gap-2 px-4 py-2 rounded-full bg-physio-accent-primary/10 hover:bg-physio-accent-primary/20 text-physio-accent-primary transition-all active:scale-95"
            title="Support Development"
          >
            <span className="material-symbols-rounded text-lg">favorite</span>
            <span className="text-sm font-bold">Donate</span>
          </button>
        </div>
      }

      // ZONE B: The Visualization
      centerStage={
        <ErrorBoundary>
          {viewMode === 'pk' ? (
            <SerumStabilityChart stack={stack} />
          ) : viewMode === 'network' ? (
            <SignalingNetwork stack={stack} metrics={metrics} />
          ) : (
            <NetEffectChart stack={stack} userProfile={userProfile} />
          )}
        </ErrorBoundary>
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

    {/* Donation Modal */}
    {showDonation && (
      <DonationModal 
        onClose={() => setShowDonation(false)} 
      />
    )}
    </>
  );
};

export default Dashboard;
