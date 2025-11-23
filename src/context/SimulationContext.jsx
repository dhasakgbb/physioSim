import React, { createContext, useContext } from "react";

const SimulationContext = createContext(null);

export const SimulationProvider = ({ children, value }) => {
  if (!value) {
    throw new Error("SimulationProvider requires an explicit value prop.");
  }
  return (
    <SimulationContext.Provider value={value}>
      {children}
    </SimulationContext.Provider>
  );
};

export const useSimulation = () => {
  const context = useContext(SimulationContext);
  if (!context) {
    throw new Error("useSimulation must be used within a SimulationProvider");
  }
  return context;
};
