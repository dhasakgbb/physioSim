# Layout & Cognitive Load Improvements

This log tracks how the UI is converging on the Obsidian Pro blueprint from `1.md`.

## Zone A — Profile & Global Controls
- **ProfileContextBar** compresses personalization (age, weight, SHBG, aromatase, anxiety, experience) into a single strip with Edit / Save / Reset controls plus unsaved + filter badges.
- **Filter tracking** is user-configurable: view mode, density, interaction controls, and legend state each opt-in to the global "Filters active" chip and share the new reset hook.
- **NavigationRail** replaced the tab buttons and lives directly under the profile strip; keyboard roving index + hover glow match the Obsidian Pro spec.
- **CompoundChipRail** mirrors StackBuilder chips so compound visibility toggles, hover states, and personalization cues stay consistent between injectables/orals.
- **Compressed mode toggle** now resides beside the rail controls, tightening spacing across every major card while registering as a tracked filter.

## Zone B — Injectables & Orals Hero Surface
- **ChartControlBar** anchors the four spotlight modes (Benefit, Risk, Efficiency, Uncertainty) and reports dirty state upstream.
- **Legend column + CompoundInsightCards** form the new right rail so hover dimming, toggles, and personalized plateau/guardrail intel stay co-located with the chart.
- **Spotlight polish**: Benefit mist, risk gradient fills, and mint uncertainty veils now mirror the Obsidian Pro spec, and legend hover states dim non-focused compounds for a true spotlight effect.
- **UtilityCardRow** installs the Sweet Spot Finder, PDF Export, and Model Settings cards as the CTA trio under every hero surface.
- **Context drawers** still lazy-load `EvidencePanel`, but copy now emphasizes guardrails (e.g., liver stress cadence for orals) and scenario tiles tied to the redesigned layout.

## Interactions & Stack Surfaces
- Heatmap focus, scoring label, evidence blend, and "pin focus" chips remain sticky while scanning.
- Pair detail keeps the sticky summary bar + optimizer integration so InteractionHeatmap continues feeding StackBuilder with context-aware prefills.
- Stack Builder keeps the orientation bars, ancillary summary pinning, and shared scoring/evidence chips introduced earlier, ensuring saved cycles/PDF exports mirror the hero layout vocabulary.

## Pending / Next
- Rebuild the InteractionHeatmap workflow per `2.md`: zoned layout (matrix + detail drawer), modular analytics cards, upgraded dose slider kit, and hover insight bubbles.
- Finish the premium `DoseSlider` component and propagate it through InteractionHeatmap + StackBuilder.
- Align typography + tokens (radial background, focus rings, accent palette) globally once the slider kit lands, followed by README/Storybook documentation of the Zone model.
