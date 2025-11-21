# Architecture & Implementation Review

**Date:** November 21, 2025
**Scope:** Frontend Architecture, State Management, Performance, Tech Stack

## EXECUTIVE SUMMARY

physioSim has evolved into a sophisticated simulation tool with rich domain logic. The recent removal of the unused backend was a major win for simplicity. However, the frontend architecture is currently **strained** by the complexity of the simulation logic running on the main thread, a "God Object" state container, and a lack of strict type safety.

**Health Score:** 🟡 **Functional but Fragile**

---

## 1. 🏗️ TECH STACK ANALYSIS

| Component     | Current Choice                 | Status         | Recommendation                                                                                               |
| ------------- | ------------------------------ | -------------- | ------------------------------------------------------------------------------------------------------------ |
| **Framework** | React 18 + Vite                | ✅ Excellent   | Keep. Fast, modern, standard.                                                                                |
| **Language**  | Mixed JS / TS                  | ⚠️ **Risk**    | **Migrate to TypeScript.** The math engines (`stackEngine.js`) are complex and prone to silent `NaN` errors. |
| **State**     | React Context (`StackContext`) | ⚠️ **Strain**  | **Migrate to Zustand.** Context is causing unnecessary re-renders as the app grows.                          |
| **Routing**   | Custom URL Parsing             | ❌ **Fragile** | **Adopt React Router / TanStack Router.** Current manual `window.history` manipulation is brittle.           |
| **Styling**   | TailwindCSS                    | ✅ Good        | Consistent usage observed. Keep.                                                                             |
| **Testing**   | Vitest + RTL                   | ✅ Good        | `dataValidation.test.js` is excellent. Expand coverage to `stackEngine` logic.                               |

---

## 2. 🔍 DEEP DIVE FINDINGS

### A. The "Main Thread" Bottleneck

The `evaluateStack` function in `src/utils/stackEngine.js` is a heavy synchronous operation (1200+ lines of logic) that runs inside a `useMemo` in `StackContext`.

- **Risk:** As you add more compounds, interactions (like the new Ki matrix), and features, this _will_ cause UI jank (dropped frames) during slider dragging.
- **Fix:** Move the simulation engine to a **Web Worker**. This decouples the math from the UI frame rate.

### B. State Management Strain

`StackContext.jsx` has become a "God Object" (333 lines). It handles:

1.  Global State (Stack, Profile)
2.  Business Logic (`evaluateStack` calls)
3.  URL Synchronization (`syncViewModeToUrl`)
4.  UI State (View Mode, Inspection)

This violates the Single Responsibility Principle. A change to "View Mode" shouldn't necessarily trigger a re-evaluation of the stack metrics, but in the current Context model, it risks doing so if not carefully memoized.

### C. Type Safety Gaps

The core logic (`stackEngine.js`) relies heavily on runtime safety checks like `safeNumber(value, 0)`.

- **Code Smell:** `const safeNumber = ...` appears 75 lines into `stackEngine.js`.
- **Reality:** This defensive coding masks bugs. If a value is `NaN`, we should know _why_ at compile time, not silence it at runtime.

### D. Routing Fragility

The custom URL logic in `StackContext` manually parses `window.location.search` and `hash`.

- **Issue:** It breaks standard browser behavior (back/forward button handling is manual).
- **Impact:** Deep linking to specific states (e.g., sharing a stack) is harder to implement robustly.

---

## 3. 🚀 OPTIMIZATION ROADMAP (Ranked)

### Phase 1: Stability & Safety (High Priority)

1.  **TypeScript Migration (Core)**: Rename `stackEngine.js` to `.ts` and define strict interfaces for `Compound`, `StackItem`, and `SimulationResult`. Stop passing "loose objects".
2.  **Standard Router**: Replace custom URL logic with `react-router-dom`.

### Phase 2: Performance (Medium Priority)

3.  **Workerize Engine**: Move `evaluateStack` to a Web Worker using `comlink` or standard `Worker` API. This ensures the UI never freezes.
4.  **Zustand Migration**: Split `StackContext` into `useStackStore` (data) and `useUIStore` (view state).

### Phase 3: Polish (Low Priority)

5.  **Component Reorganization**: Group `src/components` by feature (e.g., `features/stack-builder`, `features/analytics`) instead of a flat list.

## 4. 💡 "QUICK WINS" (Do these now)

1.  **Strict Types for Ki Values**: Since we just added `compoundKiValues.js`, define a TS interface for it immediately to prevent integration bugs.
2.  **Memoize Heavy Components**: Ensure `NetEffectChart` and `SignalingNetwork` are wrapped in `React.memo` so they don't re-render when you just toggle a tooltip.

---

## CONCLUSION

The project is well-structured conceptually but needs infrastructure maturity to handle its increasing complexity. **Prioritize TypeScript migration for the engine**—it's the highest ROI activity for preventing bugs in a math-heavy application.
