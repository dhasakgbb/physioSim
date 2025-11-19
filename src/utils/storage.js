let cachedStorage;

const resolveStorage = () => {
  if (cachedStorage !== undefined) return cachedStorage;
  if (typeof window === "undefined") {
    cachedStorage = null;
    return cachedStorage;
  }
  try {
    const storage = window.localStorage;
    if (
      storage &&
      typeof storage.getItem === "function" &&
      typeof storage.setItem === "function" &&
      typeof storage.removeItem === "function"
    ) {
      cachedStorage = storage;
    } else {
      cachedStorage = null;
    }
  } catch (error) {
    console.warn("Local storage unavailable", error);
    cachedStorage = null;
  }
  return cachedStorage;
};

export const getSafeStorage = () => resolveStorage();

const runStorageOp = (operation, { fallback = null, errorMessage } = {}) => {
  const storage = resolveStorage();
  if (!storage) {
    return typeof fallback === "function" ? fallback() : fallback;
  }
  try {
    return operation(storage);
  } catch (error) {
    console.warn(errorMessage || "Storage operation failed", error);
    return typeof fallback === "function" ? fallback(error) : fallback;
  }
};

const isOptionsObject = (value) =>
  value !== null && typeof value === "object" && !Array.isArray(value);

export const readJSONStorage = (key, fallbackOrOptions = null) => {
  const options = isOptionsObject(fallbackOrOptions)
    ? fallbackOrOptions
    : { fallback: fallbackOrOptions };
  const { fallback = null, reviver, transform } = options;
  return runStorageOp(
    (storage) => {
      const raw = storage.getItem(key);
      if (raw === null || raw === undefined || raw === "") return fallback;
      const parsed = JSON.parse(raw, reviver);
      return typeof transform === "function" ? transform(parsed) : parsed;
    },
    {
      fallback,
      errorMessage: `Failed to read ${key} from storage`,
    },
  );
};

export const writeJSONStorage = (key, value, options = {}) => {
  const { replacer, space } = options || {};
  return runStorageOp(
    (storage) => {
      if (value === undefined) {
        storage.removeItem(key);
        return true;
      }
      storage.setItem(key, JSON.stringify(value, replacer, space));
      return true;
    },
    {
      fallback: false,
      errorMessage: `Failed to persist ${key} to storage`,
    },
  );
};

export const removeStorageKey = (key) =>
  runStorageOp(
    (storage) => {
      storage.removeItem(key);
      return true;
    },
    {
      fallback: false,
      errorMessage: `Failed to remove ${key} from storage`,
    },
  );

export const createJSONStore = (key, { fallback = null } = {}) => {
  const normalize = (options) => {
    if (options === undefined) return {};
    return isOptionsObject(options) ? options : { fallback: options };
  };
  const read = (options = undefined) => {
    const normalized = normalize(options);
    if (!Object.prototype.hasOwnProperty.call(normalized, "fallback")) {
      normalized.fallback = fallback;
    }
    return readJSONStorage(key, normalized);
  };
  const write = (value, options = {}) => writeJSONStorage(key, value, options);
  const clear = () => removeStorageKey(key);
  return { read, write, clear };
};

export const resetStorageCache = () => {
  cachedStorage = undefined;
};
