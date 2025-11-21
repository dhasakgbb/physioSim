import React, { useState } from "react";
import DashboardLayout from "./DashboardLayout";
import ActiveStackRail from "./ActiveStackRail";
import TabbedChartCanvas from "./TabbedChartCanvas";
import CompoundInspector from "./CompoundInspector";
import ErrorBoundary from "../ui/ErrorBoundary";
import RightInspector from "./RightInspector";
import { useStack } from "../../context/StackContext";
import { useSimulation } from "../../context/SimulationContext";
import { evaluateStack } from "../../utils/stackEngine";

const Dashboard = () => {
  const {
    stack,
    userProfile,
    inspectedCompound,
    setInspectedCompound,
    metrics,
  } = useStack();
  const { cycleDuration, setCycleDuration } = useSimulation();

  const [timeScrubData, setTimeScrubData] = useState(null);

  const handleTimeScrub = (dataPoint) => {
    setTimeScrubData(dataPoint);
  };

  // Calculate Steady State Metrics (Fixed 12 Weeks) for the "Net Efficiency" Card
  // This ensures the score doesn't jump around when the user plays with the time slider
  const steadyStateMetrics = React.useMemo(() => {
    return evaluateStack({
      stackInput: stack,
      profile: userProfile,
      durationWeeks: 12, // Fixed standard duration
    });
  }, [stack, userProfile]);

  return (
    <>
      <DashboardLayout
        // ZONE A: The Active Inputs
        leftRail={<ActiveStackRail />}
        // ZONE B: The Visualization
        centerStage={
          <ErrorBoundary>
            <TabbedChartCanvas onTimeScrub={handleTimeScrub} />
          </ErrorBoundary>
        }
        // ZONE C: Inspector Pane
        rightRail={
          <RightInspector
            metrics={metrics}
            steadyStateMetrics={steadyStateMetrics}
            scrubbedPoint={timeScrubData}
          />
        }
        // BOTTOM RAIL: Center Status Bar
        bottomControls={
          <footer className="h-14 border-t border-white/5 bg-[#0F1115] flex items-center justify-between px-4 text-[11px] uppercase tracking-[0.3em]">
            <div className="flex items-center gap-2 text-gray-400">
              <div className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
              <span className="font-mono tracking-[0.2em] text-[10px] text-gray-500">System Ready</span>
            </div>

            <div className="flex items-center gap-4 w-[320px]">
              <span className="text-[10px] font-semibold text-gray-400 tracking-[0.2em]">
                Duration
              </span>
              <input
                type="range"
                min={4}
                max={24}
                value={cycleDuration}
                onChange={(event) => setCycleDuration(Number(event.target.value))}
                className="flex-1 h-1 appearance-none bg-gray-700 rounded-full cursor-pointer accent-indigo-500"
              />
              <span className="text-[10px] font-mono text-white w-12 text-right tracking-normal">
                {cycleDuration} wks
              </span>
            </div>

            <div className="flex items-center gap-3 text-[10px] text-gray-600 tracking-[0.2em]">
              <span>v0.9.2 BETA</span>
            </div>
          </footer>
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
    </>
  );
};

export default Dashboard;
