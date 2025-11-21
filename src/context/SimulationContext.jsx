import React, { createContext, useContext, useMemo } from "react";
import { useStack } from "./StackContext";

const SimulationContext = createContext(null);

export const SimulationProvider = ({ children }) => {
  const {
    stack,
    setStack,
    metrics,
    handleDoseChange,
    handleFrequencyChange,
    handleEsterChange,
    handleRemove,
    handleAddCompound,
  } = useStack();

  const value = useMemo(
    () => ({
      compounds: stack,
      setCompounds: setStack,
      metrics,
      updateDose: handleDoseChange,
      updateFrequency: handleFrequencyChange,
      updateEster: handleEsterChange,
      removeCompound: handleRemove,
      addCompound: handleAddCompound,
    }),
    [
      stack,
      setStack,
      metrics,
      handleDoseChange,
      handleFrequencyChange,
      handleEsterChange,
      handleRemove,
      handleAddCompound,
    ],
  );

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
