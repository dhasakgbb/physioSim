import { expect, afterEach, vi } from "vitest";
import { cleanup } from "@testing-library/react";
import "@testing-library/jest-dom/vitest";

const localStorageStore = new Map();

// Cleanup after each test
afterEach(() => {
  cleanup();
  localStorageStore.clear();
});

const mockLocalStorage = {
  getItem: (key) =>
    localStorageStore.has(key) ? localStorageStore.get(key) : null,
  setItem: (key, value) => localStorageStore.set(key, String(value)),
  removeItem: (key) => localStorageStore.delete(key),
  clear: () => localStorageStore.clear(),
};

if (typeof window !== "undefined") {
  Object.defineProperty(window, "localStorage", {
    value: mockLocalStorage,
    configurable: true,
  });
  if (typeof window.scrollTo !== "function") {
    window.scrollTo = vi.fn();
  }
}

if (typeof global.ResizeObserver === "undefined") {
  class ResizeObserver {
    observe() {}
    unobserve() {}
    disconnect() {}
  }
  global.ResizeObserver = ResizeObserver;
}

if (typeof global.Worker === "undefined") {
  class MockWorker {
    constructor() {
      this.onmessage = null;
      this.onerror = null;
    }

    postMessage() {
      // No-op; tests mock modules that rely on worker responses.
    }

    terminate() {}

    addEventListener(type, handler) {
      if (type === "message") {
        this.onmessage = handler;
      } else if (type === "error") {
        this.onerror = handler;
      }
    }

    removeEventListener(type) {
      if (type === "message") {
        this.onmessage = null;
      } else if (type === "error") {
        this.onerror = null;
      }
    }
  }

  global.Worker = MockWorker;
}
