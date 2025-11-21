# 🗺️ Project Roadmap & Handoff Guide

**Version:** 2.0 (Post-Backend Removal)
**Last Updated:** November 21, 2025
**Status:** Active Development / Handoff Ready

---

## 🎯 Project Vision

physioSim is an evidence-based harm reduction tool designed to visualize the dose-response relationships of anabolic-androgenic steroids (AAS). Unlike simple "cycle planners," it uses a sophisticated simulation engine to model pharmacokinetics, receptor saturation, and systemic toxicity.

**Current State:**

- **Architecture:** Single-page React application (Vite + Tailwind).
- **Data Source:** Static JSON (`src/data/compoundData.js`) with rigorous citation requirements.
- **Simulation:** Client-side JavaScript engine (`src/utils/stackEngine.js`).
- **Backend:** None (Serverless/Static).

---

## 🚦 Phase 1: Stability & Technical Debt (Immediate)

_Goal: Harden the codebase for scale and prevent regression bugs._

### 1.1 TypeScript Migration (High Priority)

The simulation engine relies on complex math with loose typing.

- [ ] **Action:** Rename `src/utils/stackEngine.js` to `.ts`.
- [ ] **Action:** Define strict interfaces for `Compound`, `StackItem`, and `SimulationResult`.
- [ ] **Benefit:** Eliminates silent `NaN` errors and runtime crashes.

### 1.2 Routing Infrastructure

Current routing is manual string parsing of `window.location`.

- [ ] **Action:** Install `react-router-dom` or `TanStack Router`.
- [ ] **Action:** Implement proper routes for `/explore`, `/optimize`, `/signaling`.
- [ ] **Benefit:** Enables deep linking, browser history support, and cleaner code.

### 1.3 Strict Data Validation

- [ ] **Action:** Add Zod schemas for `compoundData.js` validation.
- [ ] **Action:** Ensure new Ki values (`compoundKiValues.js`) are strictly typed.

---

## ⚡ Phase 2: Performance Optimization

_Goal: Ensure 60fps interactions even with complex stacks._

### 2.1 "Workerize" the Engine

The `evaluateStack` function runs synchronously on the main thread, causing UI jank during slider drags.

- [ ] **Action:** Move `stackEngine.js` to a Web Worker.
- [ ] **Action:** Use `comlink` for seamless async communication.
- [ ] **Benefit:** Decouples simulation math from UI rendering frame rate.

### 2.2 State Management Refactor

`StackContext` is currently a "God Object" handling UI state, business logic, and data.

- [ ] **Action:** Migrate to **Zustand**.
- [ ] **Action:** Split stores: `useStackStore` (data) vs `useUIStore` (modals, tabs).
- [ ] **Benefit:** Reduces unnecessary re-renders and simplifies component logic.

---

## 🧬 Phase 3: Feature Expansion

_Goal: Leverage the new Ki values and deepen the simulation._

### 3.1 Ki-Based Binding Simulation

We recently added `src/data/compoundKiValues.js` but haven't fully integrated it.

- [ ] **Action:** Update `stackEngine` to use Ki values for competitive binding logic.
- [ ] **Action:** Model receptor saturation based on affinity (lower Ki = stronger binding).
- [ ] **Benefit:** More accurate simulation of "stacking" behavior (e.g., DHT displacing T).

### 3.2 User Accounts (Optional)

- [ ] **Action:** Integrate Supabase or Firebase Auth.
- [ ] **Action:** Allow saving/sharing stacks to the cloud.
- [ ] **Benefit:** Community sharing and persistent history across devices.

---

## 🤝 Handoff Notes for New Developers

### 1. The "Golden Rule" of Data

**DO NOT modify `src/data/compoundData.js` without a citation.**
This project is built on trust. Every data point (Tier 1-4) must be defensible. See `docs/ki_values_integration.md` for the standard.

### 2. Key Files

- **`src/utils/stackEngine.js`**: The brain. Calculates benefits, risks, and synergy.
- **`src/context/StackContext.jsx`**: The heart. Manages app state (needs refactoring).
- **`src/components/dashboard/`**: The face. Contains all visualization widgets.

### 3. Known Quirks

- **Oxandrolone Anomaly**: Its Ki value is 62nM (very weak), but it's clinically potent. This is flagged in `compoundKiValues.js` and requires special handling in the engine (likely non-genomic or metabolic activation).
- **Trenbolone Plateau**: The benefit curve is explicitly capped at 300mg/week based on anecdotal consensus. Do not "fix" this without new evidence.

### 4. Testing

- Run `npm test` before every commit.
- `src/test/dataValidation.test.js` ensures no one accidentally breaks the physics (e.g., negative risk values).

---

## 📅 Timeline Estimate

| Phase                   | Duration  | Resource     |
| ----------------------- | --------- | ------------ |
| **Phase 1 (Stability)** | 2 Weeks   | 1 Senior FE  |
| **Phase 2 (Perf)**      | 2 Weeks   | 1 Senior FE  |
| **Phase 3 (Features)**  | 3-4 Weeks | 1 Full Stack |

**Total to v3.0:** ~8 Weeks
