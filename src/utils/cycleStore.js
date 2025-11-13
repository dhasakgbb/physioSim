const STORAGE_KEY = 'physioSim:cycles';

const readStorage = () => {
  if (typeof window === 'undefined') return [];
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
};

const writeStorage = (cycles) => {
  if (typeof window === 'undefined') return;
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(cycles));
  } catch (error) {
    console.warn('Failed to persist cycles', error);
  }
};

export const loadCycles = () => readStorage();

export const saveCycle = (cycle) => {
  if (!cycle) return null;
  const all = readStorage().filter(entry => entry.id !== cycle.id);
  const now = new Date().toISOString();
  const record = {
    id: cycle.id || (typeof crypto !== 'undefined' && crypto.randomUUID ? crypto.randomUUID() : `${Date.now()}`),
    name: cycle.name || 'Untitled Cycle',
    goalPreset: cycle.goalPreset || 'lean_mass',
    notes: cycle.notes || '',
    stack: cycle.stack || [],
    profile: cycle.profile || null,
    createdAt: cycle.createdAt || now,
    updatedAt: now
  };
  all.push(record);
  writeStorage(all);
  return record;
};

export const deleteCycle = (cycleId) => {
  if (!cycleId) return [];
  const remaining = readStorage().filter(entry => entry.id !== cycleId);
  writeStorage(remaining);
  return remaining;
};
