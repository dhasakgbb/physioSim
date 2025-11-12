# physioLab Design System v1.0
## Complete Brand & Implementation Specification

---

## BRAND IDENTITY

### Wordmark
```
physioLab
├─ Case: Lowercase "p", uppercase "L"
├─ Typography: Inter Medium 600 / Neue Haas Grotesk Semibold
├─ Tracking: +2%
├─ Color: #F5F7FF (primary) or #A6AECF (muted)
└─ Positioning: Optical center to icon circle (24px gap)
```

### Logo System
```
Full Lockup:
  ├─ Icon: Cyan circle with purple waveform/molecular glyph
  ├─ Wordmark: physioLab
  └─ Gap: 24px

Compact Mark (Icon Only):
  ├─ Circle: 2px stroke #4BBBF7 (cyan)
  ├─ Interior: Purple #9B6CFF waveform/molecule
  ├─ Glow: 0 0 32px rgba(75,187,247,0.35)
  └─ Size: Scales 128px → 512px

Monochrome (Light/Print):
  ├─ Icon: #2D3748 (dark gray)
  ├─ Wordmark: #1A202C (dark)
  └─ Use on light backgrounds only
```

---

## COLOR SYSTEM

### Core Palette
```
BACKGROUND (Obsidian Pro)
├─ Core: #101218 (center radial)
├─ Edge: #161925 (vignette zone)
├─ Vignette: 8-10% darkening inward
└─ Overlay: rgba(255,255,255,0.03) for subtle polish

ACCENTS (Signal System)
├─ Accent 1 (Primary Signal): #4BBBF7 (Cyan) — data, signals, lines
├─ Accent 2 (Precision): #9B6CFF (Violet) — pulses, highlights, inner glow
└─ Accent 3 (Health/Success): #45E2AB (Mint) — confirmations, valid states

TEXT HIERARCHY
├─ Primary: #F5F7FF (off-white) — wordmarks, titles, primary text
├─ Secondary: #A6AECF (medium gray) — supporting text, labels
├─ Tertiary: #5A6385 (light gray) — metrics captions, inactive
└─ Monospace: #A6AECF (same secondary) for numerical readouts
```

### Semantic Colors (Evidence Tiers)
```
Tier 1 (Empirical): #45E2AB (Mint green — validated, solid)
Tier 2 (Clinical): #4BBBF7 (Cyan — trusted, clinical)
Tier 3 (Animal/HED): #F59E0B (Amber — caution, modeled)
Tier 4 (Speculative): #F85149 (Red — warning, uncertain)
```

### Compound Colors (Injectables)
```
Testosterone: #4BBBF7 (Cyan — primary, clinical)
NPP: #F59E0B (Amber — secondary, modeled)
Trenbolone: #F85149 (Red — high-risk, attention)
EQ: #45E2AB (Mint — mild, safe)
Masteron: #9B6CFF (Violet — cosmetic, accent)
Primobolan: #9E6A03 (Warm amber — weak, safe)
```

### Compound Colors (Orals)
```
Dianabol: #FB8500 (Orange — estrogenic, kickstart)
Anadrol: #DC2626 (Deep red — hepatic risk)
Winstrol: #5A6385 (Gray — neutral, mild)
Anavar: #4BBBF7 (Cyan — cutting, lean)
Halotestin: #9D174D (Deep purple — strength, potent)
```

### Interactive States
```
Success: #45E2AB (Mint)
Warning: #F59E0B (Amber)
Error: #F85149 (Red)
Info: #4BBBF7 (Cyan)
Disabled: #5A6385 (Muted gray)
Hover: Background #1C2430 (slightly lighter)
Focus: Cyan ring 2px #4BBBF7
```

---

## TYPOGRAPHY SYSTEM

### Font Pairing
```
PRIMARY: Inter / Neue Haas Grotesk
  └─ All UI text, headings, body, labels

SECONDARY: JetBrains Mono
  └─ Metrics, telemetry, numerical readouts, code examples
```

### Type Scale & Usage
```
H1 (Page Title): 32px, 600 weight, #F5F7FF, line-height 1.2
  Example: "physioLab — AAS Dose-Response Analyzer"

H2 (Section): 24px, 600 weight, #F5F7FF, line-height 1.3
  Example: "Injectables" | "Interactions"

H3 (Subsection): 18px, 600 weight, #F5F7FF, line-height 1.4
  Example: "Testosterone Methodology"

H4 (Minor Header): 16px, 600 weight, #F5F7FF
  Example: "Evidence Quality"

Body (Standard): 14px, 400 weight, #F5F7FF, line-height 1.6
  Example: Main content, descriptions

Body (Small): 13px, 400 weight, #A6AECF, line-height 1.5
  Example: Secondary info, captions

Label (Form/UI): 12px, 500 weight, #A6AECF
  Example: "Dose (mg/week)", input labels

Mono (Data): 13px, 400 weight, JetBrains Mono, #A6AECF
  Example: "50 mg/day", "Tier 1 ✓✓✓", equations

Tracking: +1% for display text (H1-H4)
Letter spacing: 0 for body text
```

---

## SPACING & LAYOUT SYSTEM

### Spacing Scale (Base: 8px)
```
2px (xs)    — Very tight
4px (sm)    — Compact spacing
8px (md)    — Standard gap
12px (lg)   — Comfortable gap
16px (xl)   — Major spacing
24px (2xl)  — Section padding
32px (3xl)  — Between major sections
48px (4xl)  — Page margins
```

### Layout Grid
```
Container max-width: 1400px
Sidebar width: 260px (collapsible to 60px)
Gutter: 16px (between grid columns)
Page padding: 24px (desktop), 16px (tablet), 12px (mobile)
Safe area: 8px minimum on all sides
```

### Breakpoints
```
Mobile:  320–640px
Tablet:  641–1024px
Desktop: 1025–1400px
XL:      1401px+
```

---

## COMPONENT LIBRARY

### Buttons

**Primary Button**
```
Background: #4BBBF7 (cyan)
Text: #101218 (dark, for contrast on cyan)
Padding: 10px 16px
Border radius: 6px
Font: 14px, 500 weight, Inter
Border: none
Hover: Background #3A9FD9 (darker cyan)
Active: Background #2A7FB9 (even darker)
Disabled: Background #5A6385 (gray), opacity 0.5
Focus: Border 2px #4BBBF7, outline none
Transition: all 0.15s ease
Cursor: pointer
```

**Secondary Button**
```
Background: transparent
Border: 1px #2D3748 (subtle gray)
Text: #F5F7FF (white)
Padding: 10px 16px
Hover: Background #1C2430 (slight fill)
Active: Background #21293F
Focus: Border 2px #4BBBF7
Transition: all 0.15s ease
```

**Ghost Button (Minimal)**
```
Background: transparent
Border: none
Text: #4BBBF7 (cyan)
Padding: 8px 12px
Hover: Background #1C2430 (slight fill)
Focus: Border 2px #4BBBF7
Cursor: pointer
```

**Danger Button**
```
Background: #F85149 (red)
Text: #F5F7FF (white)
Padding: 10px 16px
Hover: Background #DC2626 (darker red)
Active: Background #B91C1C
Focus: Border 2px #4BBBF7
```

### Input Fields
```
Background: #1C2430
Border: 1px #2D3748 (subtle)
Text: #F5F7FF (white)
Placeholder: #5A6385 (muted gray)
Padding: 8px 12px
Border radius: 6px
Font: 14px, Inter
Transition: all 0.15s ease

Focus:
  ├─ Border: 2px #4BBBF7 (cyan)
  ├─ Background: slightly lighter (#21293F)
  └─ Outline: none

Error:
  └─ Border: 2px #F85149 (red)

Success:
  └─ Border: 2px #45E2AB (mint)

Disabled:
  ├─ Background: #161925
  ├─ Text: #5A6385
  └─ Opacity: 0.5
```

### Checkboxes & Toggles
```
CHECKBOX:
  ├─ Size: 16×16px
  ├─ Border (unchecked): 1px #2D3748
  ├─ Background (checked): #4BBBF7 (cyan)
  ├─ Icon: white checkmark ✓
  ├─ Border radius: 4px
  └─ Hover: Border #4BBBF7

RADIO BUTTON:
  ├─ Size: 16×16px
  ├─ Border: 1px #2D3748
  ├─ Center (checked): solid #4BBBF7
  └─ Border radius: 50%

TOGGLE SWITCH:
  ├─ Width: 40px, Height: 20px
  ├─ Background (off): #2D3748 (gray)
  ├─ Background (on): #4BBBF7 (cyan)
  ├─ Circle: white, 18px, smooth transition
  └─ Border radius: 20px (pill)
```

### Cards
```
Background: #1C2430
Border: 1px #2D3748 (subtle)
Border radius: 8px
Padding: 16px
Transition: all 0.2s ease

Hover:
  ├─ Border: 1px #4BBBF7 (cyan accent)
  └─ Background: #21293F (slightly lighter)

HIGHLIGHTED CARD (Important):
  ├─ Border-left: 3px #4BBBF7 (cyan accent)
  └─ Rest: 1px #2D3748
```

### Modals & Dialogs
```
Overlay: rgba(16, 18, 24, 0.8) (semi-transparent dark)
Modal Background: #1C2430
Modal Border: 1px #2D3748
Border radius: 12px
Padding: 24px
Box shadow: 0 10px 30px rgba(0, 0, 0, 0.5)
Backdrop filter: blur(12px) (frosted glass effect)
Transition: fade 0.2s, scale 0.95→1.0

Close button: Ghost button style
```

### Badges (Tier System)
```
DEFAULT:
  ├─ Background: #2D3748
  ├─ Text: #A6AECF
  ├─ Padding: 4px 8px
  ├─ Border radius: 4px
  └─ Font: 12px, 500 weight

TIER 1 (Empirical):
  ├─ Background: #45E2AB (mint)
  ├─ Text: #101218 (dark)
  └─ Badge: "✓✓✓ Tier 1"

TIER 2 (Clinical):
  ├─ Background: #4BBBF7 (cyan)
  ├─ Text: #101218 (dark)
  └─ Badge: "✓✓ Tier 2"

TIER 3 (Animal/HED):
  ├─ Background: #F59E0B (amber)
  ├─ Text: #101218 (dark)
  └─ Badge: "⚠️ Tier 3"

TIER 4 (Speculative):
  ├─ Background: #F85149 (red)
  ├─ Text: #F5F7FF (white)
  └─ Badge: "❌ Tier 4"
```

---

## CHART STYLING

### Chart Background
```
Plot area: #101218 (primary background)
Grid lines: #2D3748 with opacity 0.2 (very subtle)
Axis lines: #2D3748 (subtle gray)
```

### Chart Elements

**Uncertainty Bands**
```
Tier 1: #45E2AB (mint) with opacity 0.08
Tier 2: #4BBBF7 (cyan) with opacity 0.10
Tier 3: #F59E0B (amber) with opacity 0.12
Tier 4: #F85149 (red) with opacity 0.25 (more visible to warn)
```

**Benefit Curves (Solid Lines)**
```
Stroke width: 2.5px
Color: Compound color (as-is)
Opacity: 1.0
Smoothing: Cubic spline interpolation
```

**Risk Curves (Dotted Lines)**
```
Stroke width: 2.5px
Stroke dasharray: "5,5"
Color: Compound color
Opacity: 0.85 (slightly muted)
Smoothing: Cubic spline
```

**Data Points**
```
Circle radius: 4px
Stroke: 2px #F5F7FF (white outline)
Fill: Compound color
Hover:
  ├─ Radius: 6px (grows)
  ├─ Glow: 0 0 8px rgba(75,187,247,0.5)
  └─ Opacity: 1.1 (brightens)
Transition: all 0.2s ease
```

**Axes & Labels**
```
Axis labels: #A6AECF (secondary text), 12px, monospace
Axis title: #F5F7FF (primary), 14px, 500 weight
Ticks: #2D3748 (subtle)
Transition: smooth (no jarring jumps)
```

**Legend**
```
Background: transparent (sits on main background)
Text: #F5F7FF (12px, regular)
Checkboxes: Standard toggle style
Section headers: 12px, #5A6385 (muted), uppercase
Item spacing: 8px
Hover: Background #1C2430, text #4BBBF7 (cyan highlight)
```

---

## INTERACTIONS & ANIMATIONS

### Timing & Easing
```
DEFAULT: all 0.2s ease-in-out
FAST: 0.1s (immediate feedback, toggles)
SLOW: 0.4s (page transitions, modals)
CHART: 0.3s (zoom, pan, curve updates)

Easing: cubic-bezier(0.2, 0, 0.38, 0.9) for snappy response
```

### Button States

**Click (Press)**
```
Scale: 1.0 → 0.98 (subtle compression)
Duration: 0.1s
Transition: transform 0.1s cubic-bezier(0.2, 0, 0.38, 0.9)
Cursor: pointer
```

**Hover**
```
Duration: 0.2s
Color/background changes smoothly
No scale change (minimal)
Cursor: pointer
```

**Focus**
```
Border: 2px #4BBBF7 (cyan)
Outline: none (border is enough)
Visible and intentional
Transition: all 0.15s ease
```

**Disabled**
```
Opacity: 0.5
Cursor: not-allowed
No hover/focus effects
Text: #5A6385 (muted)
```

### Chart Interactions

**Hover Over Data Point**
```
Point animation:
  ├─ Radius: 4px → 6px
  ├─ Glow: 0 0 8px rgba(75,187,247,0.5)
  └─ Duration: 0.2s

Tooltip:
  ├─ Fade in: 0.2s opacity 0→1
  ├─ Delay: 0.3s before show
  └─ Background: #1C2430, border #2D3748

Curve:
  ├─ Brightens: opacity +0.1
  └─ Duration: 0.2s
```

**Click Compound in Legend**
```
Checkbox:
  └─ Toggle: instant (no transition)

Curve visibility:
  ├─ Fade out: 0.3s opacity 1→0 (if unchecking)
  ├─ Fade in: 0.3s opacity 0→1 (if checking)
  └─ Other curves: unchanged

Background:
  ├─ Row background: #1C2430 when active
  └─ Transition: all 0.2s ease
```

**Zoom & Pan**
```
Chart scaling: smooth 0.3s ease
Grid adjustment: smooth (no jarring)
Axis labels: fade and adjust (0.2s)
Legend updates: smooth (0.2s)
```

### Tooltips

**Appearance**
```
Trigger: hover (not click)
Delay: 0.3s before show
Duration: fade in 0.2s, fade out 0.1s
Background: #1C2430 (secondary)
Border: 1px #2D3748 (subtle)
Text: #F5F7FF (primary) + #A6AECF (secondary)
Padding: 12px 16px
Border radius: 6px
Arrow/pointer: #2D3748 color
Max width: 320px
Position: follow cursor with 8px offset
```

**Content**
```
Tier badge (e.g. "Tier 1 ✓✓✓"): colored background
Source: smaller, secondary color
Caveat: smaller, secondary color
Confidence: "±0.15 (High Conf.)" in monospace
```

---

## LAYOUT PATTERNS

### Header/Top Bar
```
Background: #1C2430 (secondary)
Height: 56px
Padding: 12px 24px
Border-bottom: 1px #2D3748

Layout:
├─ Logo/Wordmark (left) — physioLab mark
├─ Tab Navigation (center)
└─ Export/Settings buttons (right)

Text: #F5F7FF, 14px, 500 weight
Transition: all 0.2s ease
```

### Sidebar (Compounds/Legend)
```
Width: 260px (collapsible to 60px)
Background: #101218 (primary, darker than main)
Border-right: 1px #2D3748
Padding: 16px

Section header:
  ├─ Font: 12px, 500 weight
  ├─ Color: #5A6385 (muted)
  ├─ Case: UPPERCASE
  └─ Tracking: +0.5%

Compound rows:
  ├─ Checkbox (left)
  ├─ Name (#F5F7FF, 14px)
  ├─ Info icon [i] (#5A6385, hover → #4BBBF7)
  └─ Spacing: 8px between rows

Row hover:
  ├─ Background: #1C2430
  ├─ Border-left: 2px #4BBBF7 (cyan accent)
  └─ Transition: all 0.2s ease
```

### Main Content Area
```
Background: #101218 (primary)
Padding: 24px (desktop), 16px (tablet), 12px (mobile)
Min width: 800px (chart requires space)

Chart container:
  ├─ White space: 16px padding within container
  ├─ Chart area: full width
  └─ Legend below chart
```

### Tab Navigation
```
Style: Underline-based (minimal)

Active tab:
  ├─ Text: #4BBBF7 (cyan)
  ├─ Underline: 2px solid #4BBBF7
  └─ Weight: 500

Inactive tab:
  ├─ Text: #A6AECF (secondary)
  ├─ Underline: none
  └─ Weight: 400

Hover (inactive):
  ├─ Text: #F5F7FF (brighter)
  ├─ Underline: 1px #5A6385 (faint)
  └─ Transition: all 0.2s ease

Spacing: 24px between tabs
Border-bottom: 1px #2D3748 (full line)
```

### Methodology Card (Expandable)
```
Header:
  ├─ Background: #1C2430 (slightly lighter)
  ├─ Text: #4BBBF7 (cyan, for emphasis)
  ├─ Font: 16px, 600 weight
  └─ Padding: 12px 16px

Body:
  ├─ Background: #161925 (tertiary, darker)
  ├─ Padding: 16px
  └─ Border: 1px #2D3748

Expandable arrow:
  ├─ Icon: "⊕" or "⊖"
  ├─ Color: #4BBBF7 (cyan) when expanded
  └─ Color: #5A6385 (gray) when collapsed

Section dividers: 1px #2D3748
Subsection headers: #F5F7FF, 13px, 500 weight

Transition: all 0.3s ease (smooth expand/collapse)
```

---

## VISUAL HIERARCHY

### Information Levels

**Level 1 (Most Important)**
```
Color: #4BBBF7 (cyan)
Size: 16px+
Weight: 600
Examples: Tier badges, uncertainty warnings, key metrics
```

**Level 2 (Secondary)**
```
Color: #F5F7FF (white)
Size: 14px
Weight: 500
Examples: Compound names, methodology titles, body text
```

**Level 3 (Tertiary)**
```
Color: #A6AECF (secondary gray)
Size: 12px
Weight: 400
Examples: Labels, captions, helper text
```

**Level 4 (Muted)**
```
Color: #5A6385 (light gray)
Size: 12px
Weight: 400
Examples: Disabled state, very secondary info
```

---

## ICONS

### Icon Style
```
Stroke-based (not filled)
Stroke width: 1.5–2px
Size: 16px (standard), 20px (large), 12px (small)
Color: #4BBBF7 (cyan, default) or #F5F7FF (white)
Hover: #4BBBF7 (cyan for emphasis)
Transition: color 0.2s ease
```

### Icon Families
```
Info [i]: Circle with 'i' inside
Close [✕]: X symbol, 16px
Expand [⊕]: Plus, 16px
Collapse [⊖]: Minus, 16px
Settings [⚙]: Gear, 16px
Download [⬇]: Arrow down, 16px
Link [🔗]: Chain, 16px
Check [✓]: Checkmark, 16px
Warning [⚠]: Triangle with !, 16px
Methodology [?]: Question mark, 16px (or [i])

Color: #5A6385 (muted default)
Hover: #4BBBF7 (cyan highlight)
```

---

## ACCESSIBILITY

### Color Contrast
```
#F5F7FF on #101218: ~16:1 (excellent)
#A6AECF on #101218: ~8:1 (good)
#4BBBF7 on #101218: ~7:1 (good)
#45E2AB on #101218: ~7.5:1 (good)

WCAG AA minimum: 4.5:1 (all passed)
WCAG AAA target: 7:1 (mostly met)
```

### Focus States
```
Always visible: 2px cyan (#4BBBF7) border
Never rely on color alone: Use border + shape
No outlines hidden: Focus ring always shows
Keyboard navigation: Tab order logical, not visual
```

### Motion
```
Animations: 0.2s (fast enough to feel responsive)
Transitions: eased (not linear)
No auto-play media
Respects prefers-reduced-motion: Reduced to 0.05s
```

---

## BACKGROUND SPECIFICATION

### Obsidian Pro Canvas
```
CSS (Vanilla):
background:
  radial-gradient(circle at 50% 45%,
    #161925 0%,
    #151926 55%,
    #101218 85%) fixed;
box-shadow:
  inset 0 0 200px rgba(0,0,0,0.25),
  inset 0 0 600px rgba(0,0,0,0.18);

Tailwind:
className="min-h-screen bg-[radial-gradient(circle_at_50%_45%,#161925_0%,#151926_55%,#101218_85%)] shadow-[inset_0_0_200px_rgba(0,0,0,.25),inset_0_0_600px_rgba(0,0,0,.18)]"
```

### Why This Works
```
Center (#161925): Slightly lighter, draws eye to focus area
Edge (#101218): Darker, creates "spotlit" effect
Vignette: Inward darkening gives depth and premium feel
Fixed attachment: Background stays still when scrolling
```

---

## COMPONENT EXPORT GUIDE

### File Naming Convention
```
physioLab-logo-full.svg        (Icon + wordmark)
physioLab-mark-only.svg        (Icon only)
physioLab-mark-monochrome.svg  (Monochrome variant)
physioLab-wordmark.svg         (Text only)

physioLab-color-palette.css    (All colors)
physioLab-typography.css       (Fonts + scale)
physioLab-components.css       (Buttons, inputs, cards)
physioLab-layout.css           (Grid, spacing, breakpoints)
```

### CSS Variables (Recommended)
```
/* Colors */
:root {
  --physio-bg-core: #101218;
  --physio-bg-edge: #161925;
  --physio-bg-secondary: #1C2430;
  --physio-bg-tertiary: #21293F;
  
  --physio-text-primary: #F5F7FF;
  --physio-text-secondary: #A6AECF;
  --physio-text-tertiary: #5A6385;
  
  --physio-accent-cyan: #4BBBF7;
  --physio-accent-violet: #9B6CFF;
  --physio-accent-mint: #45E2AB;
  
  --physio-tier-1: #45E2AB;
  --physio-tier-2: #4BBBF7;
  --physio-tier-3: #F59E0B;
  --physio-tier-4: #F85149;
}

/* Shadows */
:root {
  --physio-shadow-subtle: 0 1px 2px rgba(0, 0, 0, 0.3);
  --physio-shadow-medium: 0 4px 6px rgba(0, 0, 0, 0.4);
  --physio-shadow-elevated: 0 10px 15px rgba(0, 0, 0, 0.5);
  --physio-glow-cyan: 0 0 32px rgba(75, 187, 247, 0.35);
}

/* Transitions */
:root {
  --physio-transition-fast: all 0.1s ease;
  --physio-transition-standard: all 0.2s ease-in-out;
  --physio-transition-slow: all 0.4s ease-in-out;
}
```

---

## IMPLEMENTATION CHECKLIST

- [ ] Update all background gradients to Obsidian Pro spec
- [ ] Implement cyan (#4BBBF7) and violet (#9B6CFF) throughout
- [ ] Update typography to Inter/JetBrains Mono scale
- [ ] Replace all buttons with physioLab button styles
- [ ] Update chart colors and uncertainty bands
- [ ] Implement new interactive states (hover, focus, active)
- [ ] Add tooltip styling
- [ ] Update legend and sidebar to new design
- [ ] Implement tab navigation (underline style)
- [ ] Add methodology card expand/collapse animations
- [ ] Test accessibility (contrast, focus states)
- [ ] Test responsive design (mobile, tablet, desktop)
- [ ] Export assets (logo, color palette, component library)
- [ ] Document in Figma or design tool
- [ ] Hand off to dev team with CSS variables

---

## NEXT STEPS

**Phase 1: Core Implementation** (2–3 days)
- Update backgrounds (Obsidian Pro gradient)
- Implement new color palette
- Update typography
- Style buttons, inputs, cards

**Phase 2: Chart & Data Visualization** (1–2 days)
- Update chart styling
- New uncertainty band colors
- Implement hover interactions
- Update legend and sidebar

**Phase 3: Polish & Animation** (1–2 days)
- Smooth transitions (0.2s defaults)
- Hover effects on all interactive elements
- Focus states (cyan ring)
- Tooltip styling

**Phase 4: Testing & Export** (1 day)
- Test on mobile, tablet, desktop
- Accessibility audit
- Export assets
- QA checklist

**Total: 5–8 days for full implementation**

---

**Design System v1.0**  
*Last updated: [Date]*  
*Status: Ready for implementation*