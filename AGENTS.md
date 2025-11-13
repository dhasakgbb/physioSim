# Repository Guidelines

## Project Structure & Module Organization
The Vite/React entry points live in `src/main.jsx` and `src/App.jsx`, with reusable UI housed under `src/components` and shared helpers in `src/utils`. Domain data for dose-response curves is kept in `src/data`, while exploratory specs and stories belong in `src/test`. Global styles are centralized in `src/index.css`, backed by Tailwind settings in `tailwind.config.js`. Built assets land in `dist/` after running the production build.

## Build, Test, and Development Commands
Run `npm install` once per environment. Everyday workflows rely on:

```bash
npm run dev       # Vite dev server with fast HMR on http://localhost:5173
npm run build     # Optimized production bundle in dist/
npm run preview   # Serves the build output for smoke tests
npm test          # Vitest unit/integration suite in watch mode
npm run test:ui   # Launches the Vitest UI for targeted debugging
```

## Coding Style & Naming Conventions
Use modern React with functional components, hooks, and explicit prop shapes. Prefer 2-space indentation, ES module syntax, and descriptive file names such as `SimulationPanel.jsx`. Tailwind utility classes should be composed in logical layers (layout → typography → state). Keep data modules camelCase (`riskCurves.js`) and co-locate companion CSS or hooks beside the component they serve. Before pushing, format via your editor’s Prettier integration and ensure imports stay sorted.

## Testing Guidelines
Vitest with Testing Library (`@testing-library/react`) is the default stack; tests sit near the code they exercise inside `src/test` or as `ComponentName.test.jsx`. Mock network and canvas APIs using happy-dom or jsdom helpers. Add regression tests for every new UI surface plus edge-case coverage for dose calculations; aim to keep meaningful assertions rather than raw coverage percentages, but avoid regressions below current thresholds in CI. Run `npm test` locally and attach failing snapshots when relevant.

## Commit & Pull Request Guidelines
Follow the existing short, imperative commit style (`Add custom stack optimizer…`). Group related changes into a single commit that explains the “why,” not just the “what.” Pull requests should include: a concise summary, screenshots or GIFs for UI changes, references to linked issues, and explicit testing notes (e.g., “npm test`, `npm run preview`). Keep branch names descriptive (`feature/interaction-engine`). Request review once CI passes and all checklist items are addressed.
