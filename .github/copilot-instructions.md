# PhysioSim AI Coding Instructions

You are working on **PhysioSim**, an evidence-based AAS dose-response visualization tool focused on harm reduction.

## 🏗 Architecture & State

- **Frontend**: React 18 (Vite), TailwindCSS, Recharts.
- **State Management (Legacy/Active)**: `src/context/StackContext.jsx` is the "God Object" managing global state, URL sync, and simulation triggers.
- **State Management (Target)**: `src/store/simulationStore.ts` (Zustand) is the future state manager. Prefer using/migrating to this for new features.
- **Simulation Engine**:
  - **Legacy (Active)**: `src/utils/stackEngine.js` runs synchronously on the main thread. **Warning**: Heavy computation.
  - **Target**: `src/engine/simulation.worker.ts` (Web Worker) + `src/engine/SimulationService.ts`.
- **Data Source**: `src/data/compoundData.js` (Legacy) and `src/data/compounds.ts` (New).

## 🚀 Critical Workflows

- **Build**: `npm run build` (Vite).
- **Test**: `npm test` (Vitest).
  - **UI Mode**: `npm run test:ui`.
  - **Key Test**: `src/test/dataValidation.test.js` ensures curve integrity.
- **Linting**: Standard ESLint setup.

## 🧩 Project Patterns & Conventions

### 1. Evidence-Based Modeling (CRITICAL)
- **Transparency**: Every data point must have an evidence tier (Tier 1 RCT -> Tier 4 Anecdotal).
- **Uncertainty**: Visualized via confidence bands. Wider bands = lower confidence.
- **Trenbolone Rule**: Benefit curve **MUST PLATEAU** (not decline) after 300mg. This is a hard-coded data integrity rule verified by tests.
- **Risk Scoring**: Follow the formula: `Risk = 0.3*Lipid + 0.3*Cardio + 0.2*Psych + 0.1*Hepatic + 0.1*Suppression`.

### 2. Component Structure
- **Dashboard**: `src/components/dashboard/Dashboard.jsx` is the main view.
- **Layout**: Uses a "Zone" concept (Zone A: Inputs, Zone B: Chart, Zone C: Inspector).
- **Charts**: Recharts wrappers in `src/components/charts/`.
- **UI**: Tailwind for styling. Use `src/utils/theme.js` for shared constants (colors, spacing).

### 3. Data Integrity
- **Immutable Data**: `src/data/compoundData.js` should generally be treated as read-only unless you have new sourced data.
- **Sourcing**: Any data change requires a citation in `docs/DESIGN.md` or `README.md`.

### 4. Migration & Refactoring
- **TypeScript**: New code should be TypeScript (`.ts`/`.tsx`).
- **Worker Offloading**: Move heavy math from `stackEngine.js` to `simulation.worker.ts`.
- **Context to Store**: Move state from `StackContext` to `simulationStore` (Zustand).

## ⚠️ Common Pitfalls
- **Main Thread Blocking**: `evaluateStack` in `stackEngine.js` is heavy. Avoid calling it in render loops or `useEffect` without memoization.
- **NaN Propagation**: The legacy JS engine is prone to silent `NaN` failures. Use `safeNumber` or strict TS types.
- **URL State**: The app manually parses URL hash/search in `StackContext`. Be careful when changing routing logic.

## 🧪 Testing Strategy
- **Data Validation**: Always run `npm test dataValidation.test.js` after touching `compoundData.js`.
- **Integration**: Use `renderWithAct` helper in tests to handle async state updates.
