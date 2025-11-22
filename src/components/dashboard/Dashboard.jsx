import React, { useState } from "react";
import DashboardLayout from "./DashboardLayout";
import ActiveStackRail from "./ActiveStackRail";
import TabbedChartCanvas from "./TabbedChartCanvas";
import CompoundInspector from "./CompoundInspector";
import ErrorBoundary from "../ui/ErrorBoundary";
import RightInspector from "./RightInspector";
import { useStack } from "../../context/StackContext";

const Dashboard = () => {
  const {
    stack,
    userProfile,
    inspectedCompound,
    setInspectedCompound,
    metrics,
  } = useStack();

  const [timeScrubData, setTimeScrubData] = useState(null);

  const handleTimeScrub = (dataPoint) => {
    setTimeScrubData(dataPoint);
  };

  // Use metrics from context which are now powered by the simulation engine
  const steadyStateMetrics = metrics;

  return (
    <>
      <DashboardLayout
        // ZONE A: The Active Inputs
        leftRail={<ActiveStackRail />}
        // ZONE B: The Visualization
        centerStage={
          <ErrorBoundary>
            <TabbedChartCanvas
              onTimeScrub={handleTimeScrub}
              scrubbedPoint={timeScrubData}
            />
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
