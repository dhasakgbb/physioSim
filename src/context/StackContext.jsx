import React, {
  createContext,
  useContext,
  useState,
  useMemo,
  useCallback,
  useEffect,
} from "react";
import { defaultProfile, PROFILE_STORAGE_KEY } from "../utils/personalization";
import {
  readJSONStorage,
  writeJSONStorage,
  getSafeStorage,
} from "../utils/storage";
import { VIEW_MODE_STORAGE_KEY } from "../utils/storageKeys";
import { useSimulationStore } from "../store/simulationStore";

const BASE_PATH = (import.meta.env?.BASE_URL || "/").replace(/\/*$/, "/");
const BASE_PATH_NO_TRAIL = BASE_PATH.replace(/\/$/, "");

const stripBasePath = (pathname) => {
  if (BASE_PATH === "/") return pathname;
  if (pathname.startsWith(BASE_PATH)) {
    return pathname.slice(BASE_PATH.length - 1);
  }
  if (BASE_PATH_NO_TRAIL && pathname.startsWith(BASE_PATH_NO_TRAIL)) {
    return pathname.slice(BASE_PATH_NO_TRAIL.length);
  }
  return pathname;
};

const StackContext = createContext();

export const useStack = () => {
  const context = useContext(StackContext);
  if (!context) {
    throw new Error("useStack must be used within a StackProvider");
  }
  return context;
};

const hydrateProfile = (rawProfile) => {
  const source =
    rawProfile && typeof rawProfile === "object" ? rawProfile : undefined;
  const hydrated = {
    ...defaultProfile,
    ...(source || {}),
  };

  hydrated.curveScales = {
    ...defaultProfile.curveScales,
    ...(source?.curveScales || {}),
  };

  hydrated.labMode = {
    ...defaultProfile.labMode,
    ...(source?.labMode || {}),
  };

  hydrated.labMode.scales = {
    ...defaultProfile.labMode.scales,
    ...(source?.labMode?.scales || {}),
  };

  return hydrated;
};

const loadStoredProfile = () =>
  readJSONStorage(PROFILE_STORAGE_KEY, {
    fallback: null,
  });

export const VIEW_MODE_SLUGS = Object.freeze({
  net: "explore",
  optimize: "optimize",
  network: "signaling",
});

const SLUG_TO_VIEW = Object.fromEntries(
  Object.entries(VIEW_MODE_SLUGS).map(([mode, slug]) => [slug, mode]),
);

const VALID_VIEW_MODES = new Set(Object.keys(VIEW_MODE_SLUGS));

const loadStoredViewMode = () => {
  const storage = getSafeStorage();
  if (!storage) return "net";
  try {
    const stored = storage.getItem(VIEW_MODE_STORAGE_KEY);
    return VALID_VIEW_MODES.has(stored) ? stored : "net";
  } catch (error) {
    console.warn("Failed to read dashboard view from storage", error);
    return "net";
  }
};

const getViewModeFromUrl = () => {
  if (typeof window === "undefined") return null;
  try {
    const params = new URLSearchParams(window.location.search);
    const slug = (params.get("view") || "").toLowerCase();
    if (SLUG_TO_VIEW[slug]) return SLUG_TO_VIEW[slug];

    const hash = (window.location.hash || "").replace(/^#/, "").toLowerCase();
    if (SLUG_TO_VIEW[hash]) return SLUG_TO_VIEW[hash];

    const pathSegment = stripBasePath(window.location.pathname)
      .replace(/^\/+/, "")
      .toLowerCase()
      .split("/")[0];
    if (SLUG_TO_VIEW[pathSegment]) return SLUG_TO_VIEW[pathSegment];

    return null;
  } catch (error) {
    console.warn("Failed to parse view from URL", error);
    return null;
  }
};

const getInitialViewMode = () => getViewModeFromUrl() || loadStoredViewMode();

const getSlugForViewMode = (mode) => VIEW_MODE_SLUGS[mode] || VIEW_MODE_SLUGS.net;

const syncViewModeToUrl = (mode) => {
  if (typeof window === "undefined") return;
  const slug = getSlugForViewMode(mode);
  const url = new URL(window.location.href);
  if (slug === VIEW_MODE_SLUGS.net) {
    url.searchParams.delete("view");
  } else {
    url.searchParams.set("view", slug);
  }
  const target = `${url.pathname}${url.search}${url.hash}`;
  const current = `${window.location.pathname}${window.location.search}${window.location.hash}`;
  const method =
    current === target || !syncViewModeToUrl.hasHydrated
      ? "replaceState"
      : "pushState";
  window.history[method]({}, "", target);
  syncViewModeToUrl.hasHydrated = true;
};
syncViewModeToUrl.hasHydrated = false;

export const StackProvider = ({ children }) => {
  // 1. Unified State
  // Bridge to Zustand Store
  const { 
    stack: storeStack, 
    compounds, 
    addToStack, 
    removeFromStack, 
    updateStackItem, 
    simulationResults 
  } = useSimulationStore();

  // Local UI state for card expand/collapse
  const [openCards, setOpenCards] = useState(new Map());

  // Map store stack to legacy stack format for UI compatibility
  const stack = useMemo(() => {
    return storeStack.map(item => {
      const compoundDef = compounds[item.compoundId];
      return {
        id: item.id,
        compound: item.compoundId,
        dose: item.dose,
        frequency: item.frequency,
        ester: item.esterId,
        isOpen: openCards.get(item.compoundId) ?? true, // Default to open, use Map state
        // Add legacy fields if needed by UI
        name: compoundDef?.metadata.name,
        color: '#0066CC', // Placeholder
      };
    });
  }, [storeStack, compounds, openCards]);

  const [userProfile, setUserProfile] = useState(() =>
    hydrateProfile(loadStoredProfile()),
  );
  const [inspectedCompound, setInspectedCompound] = useState(null);
  const [viewMode, setViewMode] = useState(getInitialViewMode);

  useEffect(() => {
    writeJSONStorage(PROFILE_STORAGE_KEY, userProfile);
  }, [userProfile]);

  useEffect(() => {
    const storage = getSafeStorage();
    if (!storage) return;
    try {
      storage.setItem(VIEW_MODE_STORAGE_KEY, viewMode);
    } catch (error) {
      console.warn("Failed to persist dashboard view", error);
    }
  }, [viewMode]);

  useEffect(() => {
    syncViewModeToUrl(viewMode);
  }, [viewMode]);

  useEffect(() => {
    if (typeof window === "undefined") return undefined;
    const handlePopState = () => {
      const next = getViewModeFromUrl();
      if (next && next !== viewMode) {
        setViewMode(next);
      }
      if (!next && viewMode !== "net") {
        setViewMode("net");
      }
    };
    window.addEventListener("popstate", handlePopState);
    return () => window.removeEventListener("popstate", handlePopState);
  }, [viewMode]);

  // 2. The Brain (Bridge)
  const metrics = useMemo(() => {
    if (!simulationResults) return null;
    
    // Create a bridge object that mimics the old metrics structure but uses new data
    // This is a temporary adapter to keep the UI from crashing
    const { aggregate, aggregateBenefit, aggregateToxicity } = simulationResults;
    
    // Calculate steady-state organ-specific toxicity (use last values from smoothed arrays)
    const lastIndex = aggregate?.totalToxicity?.hepatic?.length - 1 || 0;
    const hepatic = aggregate?.totalToxicity?.hepatic?.[lastIndex] || 0;
    const renal = aggregate?.totalToxicity?.renal?.[lastIndex] || 0;
    const cardiovascular = aggregate?.totalToxicity?.cardiovascular?.[lastIndex] || 0;
    const lipid = aggregate?.totalToxicity?.lipid_metabolism?.[lastIndex] || 0;
    const neuro = aggregate?.totalToxicity?.neurotoxicity?.[lastIndex] || 0;
    
    // Use organ-specific toxicity with smaller multipliers for realistic lab values
    return {
      totals: {
        netScore: (aggregateBenefit || 0) - (aggregateToxicity || 0),
        totalRisk: aggregateToxicity || 0,
        totalBenefit: aggregateBenefit || 0
      },
      analytics: {
        labsWidget: {
           // Use organ-specific toxicity for each lab value
           hdl: { value: Math.max(0, 60 - (lipid * 0.1)), status: 'normal' },
           ldl: { value: 90 + (lipid * 0.1), status: 'normal' },
           ast: { value: Math.max(0, 22 + (hepatic * 0.05)), status: 'normal' },
           alt: { value: Math.max(0, 24 + (hepatic * 0.05)), status: 'normal' },
           estradiol: { value: 24 + ((cardiovascular + hepatic) * 0.01), status: 'normal' },
           hematocrit: { value: Math.min(60, 45 + (cardiovascular * 0.02)), status: 'normal' },
           creatinine: { value: Math.max(0.5, 1.0 + (renal * 0.005)), status: 'normal' },
           egfr: { value: Math.max(15, 95 - (renal * 0.1)), status: 'normal' }
        }
      },
      // Legacy fields mapped to new aggregates (using last point or average)
      totalTestosterone: aggregate.totalTestosteroneEquivalent[aggregate.totalTestosteroneEquivalent.length - 1] || 0,
      anabolicRating: aggregate.totalAnabolicLoad[aggregate.totalAnabolicLoad.length - 1] || 0,
      // Add raw results for new components
      _raw: simulationResults
    };
  }, [simulationResults]);

  // 3. Actions (Proxied to Store)
  const handleAddCompound = useCallback(
    (compoundKey) => {
      addToStack(compoundKey);
    },
    [addToStack],
  );

  const handleDoseChange = useCallback((compoundKey, newDose) => {
    // Find item in stack (legacy stack uses compoundKey as ID sometimes, but new store uses UUID)
    // We need to find the item ID. 
    // For now, let's assume compoundKey is the compoundId and we update the first occurrence
    const item = storeStack.find(i => i.compoundId === compoundKey);
    if (item) {
      updateStackItem(item.id, { dose: newDose });
    }
  }, [storeStack, updateStackItem]);

  const handleRemove = useCallback((compoundKey) => {
    // Same issue, need item ID.
    // The UI passes the ID if we mapped it correctly in the stack useMemo above.
    // If compoundKey is actually the UUID (which it should be if we updated the UI), use it.
    // If it's the compound slug, find it.
    const item = storeStack.find(i => i.id === compoundKey || i.compoundId === compoundKey);
    if (item) {
      removeFromStack(item.id);
    }
  }, [storeStack, removeFromStack]);

  const handleEsterChange = useCallback((compoundKey, newEster) => {
    const item = storeStack.find(i => i.compoundId === compoundKey);
    if (item) {
      updateStackItem(item.id, { esterId: newEster });
    }
  }, [storeStack, updateStackItem]);

  const handleFrequencyChange = useCallback((compoundKey, newFreq) => {
    const item = storeStack.find(i => i.compoundId === compoundKey);
    if (item) {
      updateStackItem(item.id, { frequency: newFreq });
    }
  }, [storeStack, updateStackItem]);

  const handleSetCompoundOpen = useCallback((compoundKey, nextOpen) => {
    setOpenCards(prev => {
      const next = new Map(prev);
      next.set(compoundKey, nextOpen);
      return next;
    });
  }, []);

  const toggleSupportProtocol = useCallback((protocolKey) => {
    // TODO: Implement support protocols in store
    console.warn("Support protocols not yet implemented in new engine");
  }, []);

  const value = {
    stack,
    setStack: () => console.warn("setStack is deprecated, use store actions"),
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
    handleSetCompoundOpen,
    toggleSupportProtocol,
  };

  return (
    <StackContext.Provider value={value}>{children}</StackContext.Provider>
  );
};

