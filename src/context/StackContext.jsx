import React, {
  createContext,
  useContext,
  useState,
  useMemo,
  useCallback,
} from "react";
import { compoundData } from "../data/compoundData";
import { evaluateStack } from "../utils/stackEngine";
import { defaultProfile } from "../utils/personalization";

const StackContext = createContext();

export const useStack = () => {
  const context = useContext(StackContext);
  if (!context) {
    throw new Error("useStack must be used within a StackProvider");
  }
  return context;
};

export const StackProvider = ({ children }) => {
  // 1. Unified State
  const [stack, setStack] = useState([]);
  const [userProfile, setUserProfile] = useState(defaultProfile);
  const [inspectedCompound, setInspectedCompound] = useState(null);
  const [viewMode, setViewMode] = useState("net"); // 'net', 'pk', 'radar'

  // 2. The Brain
  const metrics = useMemo(() => {
    return evaluateStack({
      stackInput: stack,
      profile: userProfile,
    });
  }, [stack, userProfile]);

  // 3. Actions
  const handleAddCompound = useCallback(
    (compoundKey) => {
      if (stack.some((i) => i.compound === compoundKey)) return;
      const meta = compoundData[compoundKey];
      const startDose = meta.type === "oral" ? 20 : 200;

      // --- THE GOOGLE "SMART DEFAULT" LOGIC ---
      let defaultFreq = 3.5; // Default 2x/week
      if (meta.type === "oral")
        defaultFreq = 1; // Daily
      else if (meta.halfLife < 48) defaultFreq = 2; // EOD for short esters
      // ----------------------------------------

      setStack((prev) => [
        ...prev,
        {
          compound: compoundKey,
          dose: startDose,
          frequency: defaultFreq, // Store it here
        },
      ]);
    },
    [stack],
  );

  const handleDoseChange = useCallback((compoundKey, newDose) => {
    setStack((prev) =>
      prev.map((item) =>
        item.compound === compoundKey ? { ...item, dose: newDose } : item,
      ),
    );
  }, []);

  const handleRemove = useCallback((compoundKey) => {
    setStack((prev) => prev.filter((i) => i.compound !== compoundKey));
  }, []);

  const handleEsterChange = useCallback((compoundKey, newEster) => {
    setStack((prev) =>
      prev.map((item) =>
        item.compound === compoundKey ? { ...item, ester: newEster } : item,
      ),
    );
  }, []);

  const handleFrequencyChange = useCallback((compoundKey, newFreq) => {
    setStack((prev) =>
      prev.map((item) =>
        item.compound === compoundKey ? { ...item, frequency: newFreq } : item,
      ),
    );
  }, []);

  const value = {
    stack,
    userProfile,
    setUserProfile,
    inspectedCompound,
    setInspectedCompound,
    viewMode,
    setViewMode,
    metrics,
    handleAddCompound,
    handleDoseChange,
    handleRemove,
    handleEsterChange,
    handleFrequencyChange,
  };

  return (
    <StackContext.Provider value={value}>{children}</StackContext.Provider>
  );
};
