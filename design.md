---
name: Technical Precision
colors:
  surface: "#f8f9ff"
  surface-dim: "#cbdbf5"
  surface-bright: "#f8f9ff"
  surface-container-lowest: "#ffffff"
  surface-container-low: "#eff4ff"
  surface-container: "#e5eeff"
  surface-container-high: "#dce9ff"
  surface-container-highest: "#d3e4fe"
  on-surface: "#0b1c30"
  on-surface-variant: "#464555"
  inverse-surface: "#213145"
  inverse-on-surface: "#eaf1ff"
  outline: "#777587"
  outline-variant: "#c7c4d8"
  surface-tint: "#4d44e3"
  primary: "#3525cd"
  on-primary: "#ffffff"
  primary-container: "#4f46e5"
  on-primary-container: "#dad7ff"
  inverse-primary: "#c3c0ff"
  secondary: "#565e74"
  on-secondary: "#ffffff"
  secondary-container: "#dae2fd"
  on-secondary-container: "#5c647a"
  tertiary: "#3130c0"
  on-tertiary: "#ffffff"
  tertiary-container: "#4b4dd8"
  on-tertiary-container: "#d9d8ff"
  error: "#ba1a1a"
  on-error: "#ffffff"
  error-container: "#ffdad6"
  on-error-container: "#93000a"
  primary-fixed: "#e2dfff"
  primary-fixed-dim: "#c3c0ff"
  on-primary-fixed: "#0f0069"
  on-primary-fixed-variant: "#3323cc"
  secondary-fixed: "#dae2fd"
  secondary-fixed-dim: "#bec6e0"
  on-secondary-fixed: "#131b2e"
  on-secondary-fixed-variant: "#3f465c"
  tertiary-fixed: "#e1e0ff"
  tertiary-fixed-dim: "#c0c1ff"
  on-tertiary-fixed: "#07006c"
  on-tertiary-fixed-variant: "#2f2ebe"
  background: "#f8f9ff"
  on-background: "#0b1c30"
  surface-variant: "#d3e4fe"
typography:
  display:
    fontFamily: Inter
    fontSize: 36px
    fontWeight: "700"
    lineHeight: 44px
    letterSpacing: -0.025em
  display-mobile:
    fontFamily: Inter
    fontSize: 28px
    fontWeight: "700"
    lineHeight: 36px
    letterSpacing: -0.02em
  headline-lg:
    fontFamily: Inter
    fontSize: 30px
    fontWeight: "600"
    lineHeight: 38px
    letterSpacing: -0.02em
  headline-lg-mobile:
    fontFamily: Inter
    fontSize: 24px
    fontWeight: "600"
    lineHeight: 32px
    letterSpacing: -0.015em
  headline-md:
    fontFamily: Inter
    fontSize: 20px
    fontWeight: "600"
    lineHeight: 28px
    letterSpacing: -0.015em
  headline-sm:
    fontFamily: Inter
    fontSize: 16px
    fontWeight: "600"
    lineHeight: 24px
    letterSpacing: -0.01em
  body-lg:
    fontFamily: Inter
    fontSize: 16px
    fontWeight: "400"
    lineHeight: 26px
  body-md:
    fontFamily: Inter
    fontSize: 14px
    fontWeight: "400"
    lineHeight: 22px
  body-sm:
    fontFamily: Inter
    fontSize: 12px
    fontWeight: "400"
    lineHeight: 18px
  label-md:
    fontFamily: Inter
    fontSize: 13px
    fontWeight: "500"
    lineHeight: 18px
    letterSpacing: 0.01em
  label-sm:
    fontFamily: Inter
    fontSize: 11px
    fontWeight: "500"
    lineHeight: 16px
    letterSpacing: 0.02em
  code-md:
    fontFamily: JetBrains Mono
    fontSize: 13px
    fontWeight: "400"
    lineHeight: 20px
  code-sm:
    fontFamily: JetBrains Mono
    fontSize: 11px
    fontWeight: "500"
    lineHeight: 16px
rounded:
  sm: 0.25rem
  DEFAULT: 0.5rem
  md: 0.75rem
  lg: 1rem
  xl: 1.5rem
  full: 9999px
spacing:
  gutter: 1.5rem
  gutter-mobile: 1rem
  margin: 2rem
  margin-mobile: 1rem
  space-xs: 0.25rem
  space-sm: 0.5rem
  space-md: 1rem
  space-lg: 1.5rem
  space-xl: 2rem
---

## Brand & Style

The design system targets students, mentors, and academic administrators engaged in rigorous project-based learning and code review. It bridges the gap between structured enterprise software and high-velocity developer tools. The personality is disciplined, clear, and utilitarian without being stark. It evokes trust, accountability, and technical focus, eliminating decorative distraction in favor of scannable status indicators, crisp typographic contracts, and predictable spatial pacing.

Drawing from modern developer-centric design patterns and the Radix/Shadcn ethos, the aesthetic uses neutral slate surfaces, hairline administrative borders, intentional monospace annotations for git metadata, and high-contrast semantic badging to accelerate triage, code review, and evaluation workflows.

## Colors

The color hierarchy is anchored by deep slate neutrals and energized by focused indigo accents for interactive flow:

- **Primary Canvas & Surfaces**: The base canvas is `#F8FAFC` (Slate-50), with active working surfaces and data containers resting on crisp `#FFFFFF` (White) panels enclosed by `#E2E8F0` (Slate-200) structural boundaries.
- **Brand & Interaction**: `#4F46E5` serves as the primary actionable anchor for focus states, key triggers, active navigation markers, and selected states. `#6366F1` acts as the hover/secondary accent token.
- **Text & Hierarchy**: Headings utilize `#0F172A` (Slate-900) for maximum legibility; standard copy sits at `#475569` (Slate-600); timestamps, helper captions, and auxiliary metadata use `#94A3B8` (Slate-400).
- **Review Status Semantics**: Review states must always pair color tinting with explicit text labels:
  - **Pending / In Review**: Amber (`#D97706` text, `#FEF3C7` fill, `#FDE68A` border)
  - **Approved / Merged**: Emerald (`#059669` text, `#D1FAE5` fill, `#A7F3D0` border)
  - **Changes Requested / Rejected**: Rose (`#E11D48` text, `#FFE4E6` fill, `#FECDD3` border)
- **Focus Rings**: Dual-ring technique using a `#FFFFFF` inner ring (2px) and `#4F46E5` outer ring (2px) at an opacity of 100% to guarantee WCAG 2.1 AA accessibility against all surface tones.

## Typography

Typography is organized into a utilitarian hierarchy built around `Inter` for interface structure, prose, and metadata, backed by `JetBrains Mono` for developer-specific tokens: commit SHAs, git branch names, pull request markers, and file directory trees.

Titles and sectional headers employ tighter letter-spacing (`-0.02em` to `-0.025em`) to evoke density and architectural stability. System labels, input captions, and tab indicators prioritize medium (`500`) and semi-bold (`600`) weights for rapid visual scanning across dense dashboards. Monospaced elements are set slightly smaller than surrounding body copy to normalize their perceived visual cap height.

## Layout & Spacing

The layout follows a 12-column responsive fluid grid pinned inside a maximum content width of `1440px`.

- **Desktop (>= 1024px)**: Dual-pane or triple-pane operational view consisting of a fixed 260px collapsible sidebar navigation, a 12-column dynamic work canvas with `1.5rem` (`24px`) gutters, and an optional 380px inspector/review drawer for diffs and rubric rubrics. Outer canvas margin is `2rem` (`32px`).
- **Tablet (768px - 1023px)**: Sidebar shifts to an off-canvas drawer. The grid adapts to an 8-column layout with `1.5rem` gutters and `1.5rem` outer canvas padding.
- **Mobile (< 768px)**: Content reflows into a single 4-column column structure with `1rem` (`16px`) gutters and margins. Dense horizontal tables automatically swap into vertical summary cards to safeguard horizontal real estate.

Component spacing adheres strictly to an 8pt spatial cadence with 4pt baseline substeps for micro-alignments (`space-xs` at 4px, `space-sm` at 8px, `space-md` at 16px, `space-lg` at 24px, and `space-xl` at 32px).

## Elevation & Depth

Depth is established primarily through low-contrast perimeter borders (`#E2E8F0`) augmented by subtle, cool-slate ambient drop shadows that emulate physical card stock under clean workspace lighting. Deep or aggressive blurs are avoided to keep technical text legible.

- **Level 0 (Canvas Base)**: `#F8FAFC`. Flat, zero shadow.
- **Level 1 (Panels, Cards, Tables)**: `#FFFFFF` fill with a `1px` solid `#E2E8F0` border and an ambient shadow: `box-shadow: 0 1px 2px 0 rgba(15, 23, 42, 0.05)`.
- **Level 2 (Hovered Cards, Dropdown Menus, Context Popovers)**: `#FFFFFF` fill, `1px` solid `#CBD5E1` border, elevated shadow: `box-shadow: 0 4px 6px -1px rgba(15, 23, 42, 0.08), 0 2px 4px -2px rgba(15, 23, 42, 0.04)`.
- **Level 3 (Modal Dialogs, Drawer Overlays)**: `#FFFFFF` surface with `box-shadow: 0 20px 25px -5px rgba(15, 23, 42, 0.1), 0 8px 10px -6px rgba(15, 23, 42, 0.05)`. Modals pair with a backcloth scrim set to `rgba(15, 23, 42, 0.45)` with a backdrop blur of `4px`.

## Shapes

The design language standardizes on an 8px (`0.5rem`) geometric corner radius for interactive controls, cards, and structured panels, striking a balance between modern ergonomics and technical utility.

- **Core Elements (Cards, Containers, Dialogs)**: Standardized at `0.5rem` (`rounded-lg`, 8px).
- **Micro-Controls (Buttons, Inputs, Select Triggers)**: Pinned at `0.375rem` (6px) or `0.5rem` (8px) to maintain a cohesive silhouette when nested inside cards.
- **Badges and Pills**: Status badges leverage `9999px` (fully rounded pills) to visually distinguish immutable status labels from clickable rectangular input controls.
- **Monospace Tokens / Tags**: Git commit chips and branch names use a compact `4px` radius to reflect code editor tabs.

## Components

### Buttons

- **Primary**: Solid `#4F46E5` background, white text, 8px radius, height `40px` (desktop) / `44px` (mobile touch target). Hover state: `#4338CA`. Active state: `#3730A3`. Focus ring: `2px` offset with `#4F46E5`.
- **Secondary / Outline**: `#FFFFFF` background, `1px` solid `#E2E8F0`, `#0F172A` text. Hover state: `#F8FAFC` background with `#CBD5E1` border.
- **Ghost**: No border, transparent background, `#475569` text. Hover: `#F1F5F9` background, `#0F172A` text.
- **Destructive**: Solid `#E11D48` background, white text. Hover: `#BE123C`.

### Form Inputs & Selects

- Text fields and textareas feature a `#FFFFFF` background, `1px` border in `#CBD5E1`, and placeholder copy in `#94A3B8`. Standard height is `40px` on desktop with minimum `44px` hit areas on mobile.
- Focus state switches the border to `#4F46E5` with an external halo: `box-shadow: 0 0 0 3px rgba(79, 70, 229, 0.15)`.
- Error states render in `#E11D48` border with a matching soft red glow and a visible inline error message below the input.

### Status Badges & Chips

- Status badges are rendered as compact pills (`height: 24px`, padding: `2px 10px`) utilizing semantic combinations:
  - **Pending**: `#FEF3C7` fill, `#FDE68A` border, `#92400E` text with a 6px amber dot indicator preceding the label.
  - **Approved**: `#D1FAE5` fill, `#A7F3D0` border, `#065F46` text with a 6px emerald dot indicator.
  - **Rejected**: `#FFE4E6` fill, `#FECDD3` border, `#9F1239` text with a 6px rose dot indicator.
- Git metadata chips use monospace typography, a neutral `#F1F5F9` background, a hairline `#E2E8F0` border, and `#475569` text.

### Cards & Panels

- Cards use `#FFFFFF` fill, an outer `1px` solid `#E2E8F0` border, and standard padding of `24px` (`space-lg`).
- Interactive cards (such as review submission queues) transition border color to `#CBD5E1` and translate up `-1px` on hover with shadow Level 2. Card headers clearly separate titles from meta badges using flexbox alignment with `space-md` gaps.

### Checkboxes & Radio Controls

- Base control dimensions are `18px x 18px` (encapsulated in an accessible 44px tap zone on touch devices).
- Unchecked: `#FFFFFF` fill with `1.5px` border in `#CBD5E1`.
- Checked: `#4F46E5` fill with a sharp white SVG check icon. Focus indicator matches standard input halo.

### Specialized Review & Submission Components

- **Code & Repository Snippet**: Monospace block encapsulated in `#F8FAFC` background, `1px` border `#E2E8F0`, with built-in copy-to-clipboard action and git branch badge.
- **Rubric Scorecard**: Structured matrix card with distinct score pills (e.g., `5/5`, `Needs Revision`), inline mentor markdown feedback areas, and time-stamped revision histories.
