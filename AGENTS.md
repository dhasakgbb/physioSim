# Repository Guidelines

## Source Layout & Key Modules
- Entry points live in `src/main.jsx` and `src/App.jsx`, and almost all UI is composed in `src/components`. Critical surfaces: `AASVisualization` (top-level layout + tab orchestration), `DoseResponseChart`/`OralDoseChart` (curve rendering), `InteractionHeatmap` (pair analysis with the full analytics stack), `StackBuilder`, `AncillaryCalculator`, `SideEffectProfile`, and `ProfileStatusBar`.
- Domain data is under `src/data`: `compoundData` (curves + methodology copy), `interactionMatrix` (ratings + utility helpers), `interactionEngineData` (optimizer templates, dimensions, sensitivity defaults), and `sideFxAndAncillaries`. Shared logic sits in `src/utils` (`interactionEngine`, `stackEngine`, `stackOptimizer`, `sweetSpot`, `cycleStore`, `personalization`).
- Tests live near their concern (`src/components/__tests__`) or in `src/test` for broader suites (`stackBuilder`, `interactions`, `dataValidation`, `components`). Global styles are in `src/index.css` with Tailwind configuration via `tailwind.config.js`.

## State & Persistence
- Local storage keys matter: `PROFILE_STORAGE_KEY` for personalization, `layoutFilterPrefs` for filter chips, `interactionControls` for heatmap focus, and `physioSim:cycles` for saved stacks/cycles. Be defensive when accessing `window` (SSR guards already exist) and keep these keys in sync if you add new persisted controls.
- InteractionHeatmap and StackBuilder now always run in the dense, advanced configuration—assume optimizer/surface tooling is available by default and persist only the user-tunable controls tied to the keys above.
- Filter dirty state is centralized in `AASVisualization` (`filtersDirty`, `interactionFiltersDirty`, `filterPrefs`). New knobs should register themselves through those mechanisms so the global “Filters active” indicator stays accurate.

## Styling & UX Patterns
- Stick to 2-space indentation, modern React (hooks + functional components), and descriptive filenames (`SimulationPanel.jsx`). Compose Tailwind utilities from layout → typography → state. Heavy context drawers (e.g., EvidencePanel) should remain lazy/opt-in to keep first paint light.
- The post-merge layout (see `SUMMARY.md`) expects: profile status → sticky control bar → hero charts, with context drawers for injectables/orals and sticky interaction pair summaries. Preserve those affordances when touching layout.

## Build, Dev & Tooling
- Install deps with `npm install`. Common scripts:
  - `npm run dev` – Vite dev server (HMR on http://localhost:5173).
  - `npm run build` – production bundle into `dist/`.
  - `npm run preview` – serve the built output for smoke tests.
  - `npm test` – Vitest in watch mode (uses `src/test/setup.js` to stub `localStorage`, `ResizeObserver`, and `scrollTo`).
  - `npm run test:ui` – Vitest UI for targeted suites.
- HTML export tooling relies on `html2canvas` + `jspdf` inside `PDFExport`; changes there should be validated manually since automated coverage is thin.

## Testing Guidance
- Vitest + Testing Library is the default. Always import `src/test/setup.js` (configured via Vitest) so DOM shims are available.
- Regression-critical suites:
  - `src/test/dataValidation.test.js` protects compound curve integrity (plateaus, tiers, monotonic risk curves, CI bounds).
  - `src/test/interactions.test.js` covers interaction scoring, ancillary protocols, and synergy ranges.
  - `src/test/stackBuilder.test.jsx` and `src/test/components.test.jsx` ensure UI toggles and StackBuilder flows keep working (`renderWithAct` helper already set up).
  - `src/components/__tests__/InteractionHeatmap.test.jsx` maintains heatmap snapshots; update via `vitest -u` only when intentional.
- When adding complex interactivity, prefer new Vitest tests near the feature plus a note in `README` describing any shims or required mocks (per `1.md` outstanding work).

## Outstanding Work & References
- High-priority polish from `1.md`: (1) CustomLegend hover guardrail badges + sticky pair summary badge. (2) Interaction tab reflow (sticky summary bar, anchor chunks, unified analytics messaging). (3) Document the compressed mode + profile warning badge and lazy-load heavy drawers. (4) Cycle workspace narrative upgrades. (5) Document testing setup + add interaction test guidance. Keep these items in mind when touching related areas.
- `README.md` holds a comprehensive feature overview and methodology notes; `SUMMARY.md` documents recent layout decisions; `1.md` tracks remaining UX/testing debt. Update those docs when you alter related functionality.
