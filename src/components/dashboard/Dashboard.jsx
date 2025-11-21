import React, { useState } from "react";
import DashboardLayout from "./DashboardLayout";
import ActiveStackRail from "./ActiveStackRail";
import TabbedChartCanvas from "./TabbedChartCanvas";
import CompoundInspector from "./CompoundInspector";
import ErrorBoundary from "../ui/ErrorBoundary";
import RightInspector from "./RightInspector";
import { useStack } from "../../context/StackContext";
import { evaluateStack } from "../../utils/stackEngine";

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

  // Calculate Steady State Metrics (Fixed 12 Weeks) for the "Net Efficiency" Card
  // This ensures the score doesn't jump around when the user plays with the time slider
  const steadyStateMetrics = React.useMemo(() => {
    return evaluateStack({
      stackInput: stack,
      profile: userProfile,
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
