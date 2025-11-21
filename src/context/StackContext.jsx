import React, {
  createContext,
  useContext,
  useState,
  useMemo,
  useCallback,
  useEffect,
} from "react";
import { compoundData } from "../data/compoundData";
import { evaluateStack } from "../utils/stackEngine";
import { defaultProfile, PROFILE_STORAGE_KEY } from "../utils/personalization";
import {
  readJSONStorage,
  writeJSONStorage,
  getSafeStorage,
} from "../utils/storage";
import { VIEW_MODE_STORAGE_KEY } from "../utils/storageKeys";

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
  const [stack, setStack] = useState([]);
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
    setStack,
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
