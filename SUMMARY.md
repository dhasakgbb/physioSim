# Layout & Cognitive Load Improvements

This working log captures the structural tweaks implemented so far per the guidance in `1.md`.

## Personalization + Global Controls
- Personalization panel auto-collapses after baseline setup, yielding a single-line summary bar with quick Edit/Reset/Forget actions.
- Added a global "Compressed mode" toggle beneath the hero text; it tightens padding/line-height across all major cards.
- Tabs now sit directly under the collapsed profile bar so users reach the main charts immediately.
- A global "Filters active" chip appears only when tracked controls diverge, and users can configure which controls count toward that state.
- The filter-tracking modal now lets you toggle individual levers (view mode, density, interaction sliders, legend visibility) so only the knobs you care about raise the global badge; the Reset action also restores hidden legend entries.

## Injectables / Orals Tabs
- Introduced a collapsed "Need context?" drawer combining Quick Guide, scenario callouts, and evidence tiers into one expandable card.
- Evidence & Confidence panel moved into its own accordion near the footer so heavy methodology is opt-in.
- Chart controls stay in a single slim utility row above the chart; legends remain in the right column.

## Interactions Tab (Normal vs Lab Mode)
- Heatmap includes a numeric legend (0.00 ≈ neutral, ≥0.30 strong) and clicking a cell auto-scrolls to pair detail.
- Added a collapsible “Need context?” card so heatmap guidance, Normal vs Lab differences, and optimizer tips stay hidden until needed.
- Threaded a compact control strip beneath the legend with heatmap focus, goal preset, and evidence weighting so core toggles live above the matrix.
- The entire legend + control band now stays sticky on desktop so the toggles remain accessible while scanning long matrices, and it collapses into a slim mini-header that shows the active pair, goal, evidence mix, and delta metrics with a back-to-matrix button.
- Heatmap focus, goal preset, and evidence weighting now persist via local storage so returning users keep their investigative context.
- Pair detail gains a sticky summary bar (pair name, goal preset, evidence mix, delta metrics).
- Added a "Pin focus" control next to the heatmap focus buttons so Benefit/Risk/Volatility selection persists across sessions via local storage (and survives global filter resets).
- Lightweight dividers now segment sliders, charts, and recommendation blocks so the scroll feels chunked instead of continuous.
- The dose sliders/dimension controls now live in a dedicated left column, while the metric cards stay pinned on the right even when Lab Mode is off.
- Normal and Lab recommendations include small orientation chips (goal preset, evidence blend, net status) so each card carries its context.
- Normal mode shows sliders, the new net benefit/risk bar chart, and top recommendations (with hover-to-highlight bands on the sweep chart).
- Lab Mode unlocks dimension chips, detailed metrics, the dose sweep chart (with reference band + current-dose marker), dose surface with numbered markers, and the multi-compound optimizer + sensitivity sliders.
- Multi-compound optimizer is collapsed by default with an Expand/Collapse button; casual users aren’t forced through the advanced panels.

## Interaction Visuals
- Recommendations hover/focus states shade the dose sweep, mark the surface heatmap with numbered badges, and pre-fill Stack Builder.
- Axis ghost labels (“A dose (mg)” / “B dose (mg)”) added to the dose surface grid.

## Stack Builder
- Added sticky orientation bars that keep the current goal, compound count, ratio, goal score, and ancillary summary pinned while scrolling long sections.
- Ancillary protocol summary mirrors the same pattern so weekly costs and monitoring counts stay visible as you expand/collapse cards, with a pinned right column showing total cost and lab requirements.
- Saved cycle cards and PDF exports now render the same recommendation chips (goal preset, net status, ratio, guardrails) used in the interaction tab, so snapshots/exported decks retain their investigative context.

## Pending / Next
_None right now — ready for the next backlog refinement._
