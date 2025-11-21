import React from "react";
import Dashboard from "./components/dashboard/Dashboard";
import { StackProvider } from "./context/StackContext";
import { SimulationProvider } from "./context/SimulationContext";

function App() {
  return (
    <StackProvider>
      <SimulationProvider>
        <div className="h-screen bg-physio-bg-core text-physio-text-primary overflow-hidden">
          <Dashboard />
        </div>
      </SimulationProvider>
    </StackProvider>
  );
}

export default App;
