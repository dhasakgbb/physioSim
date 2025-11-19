import { createJSONStore } from "./storage";
import { CYCLE_STORAGE_KEY } from "./storageKeys";

const cyclesStore = createJSONStore(CYCLE_STORAGE_KEY, { fallback: [] });

const readStorage = () =>
  cyclesStore.read({
    transform: (value) => (Array.isArray(value) ? value : []),
  });

const writeStorage = (cycles) => {
  cyclesStore.write(cycles);
};

export const loadCycles = () => readStorage();

export const saveCycle = (cycle) => {
  if (!cycle) return null;
  const all = readStorage().filter((entry) => entry.id !== cycle.id);
  const now = new Date().toISOString();
  const record = {
    id:
      cycle.id ||
      (typeof crypto !== "undefined" && crypto.randomUUID
        ? crypto.randomUUID()
        : `${Date.now()}`),
    name: cycle.name || "Untitled Cycle",
    notes: cycle.notes || "",
    stack: cycle.stack || [],
    profile: cycle.profile || null,
    createdAt: cycle.createdAt || now,
    updatedAt: now,
  };
  all.push(record);
  writeStorage(all);
  return record;
};

export const deleteCycle = (cycleId) => {
  if (!cycleId) return [];
  const remaining = readStorage().filter((entry) => entry.id !== cycleId);
  writeStorage(remaining);
  return remaining;
};
