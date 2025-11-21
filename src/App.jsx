import React from "react";
import Dashboard from "./components/dashboard/Dashboard";
import { StackProvider } from "./context/StackContext";
import { SimulationProvider } from "./context/SimulationContext";

function App() {
  return (
    <StackProvider>
      <SimulationProvider>
        <div className="relative h-screen bg-physio-bg-core text-physio-text-primary overflow-hidden">
          <div
            className="pointer-events-none fixed inset-0 z-0 opacity-[0.02]"
            style={{
              backgroundImage:
                "url(\"data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.65' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)'/%3E%3C/svg%3E\")",
            }}
          />
          <div className="relative z-10 h-full">
            <Dashboard />
          </div>
        </div>
      </SimulationProvider>
    </StackProvider>
  );
}

export default App;
