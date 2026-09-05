---
name: EduConnect Parent
colors:
  surface: '#f7f9ff'
  surface-dim: '#d7dae0'
  surface-bright: '#f7f9ff'
  surface-container-lowest: '#ffffff'
  surface-container-low: '#f1f4fa'
  surface-container: '#ebeef4'
  surface-container-high: '#e5e8ee'
  surface-container-highest: '#dfe3e8'
  on-surface: '#181c20'
  on-surface-variant: '#414754'
  inverse-surface: '#2d3135'
  inverse-on-surface: '#eef1f7'
  outline: '#727785'
  outline-variant: '#c1c6d6'
  surface-tint: '#005bc0'
  primary: '#005bbf'
  on-primary: '#ffffff'
  primary-container: '#1a73e8'
  on-primary-container: '#ffffff'
  inverse-primary: '#adc7ff'
  secondary: '#994700'
  on-secondary: '#ffffff'
  secondary-container: '#fd8120'
  on-secondary-container: '#602a00'
  tertiary: '#006d2a'
  on-tertiary: '#ffffff'
  tertiary-container: '#16893a'
  on-tertiary-container: '#000701'
  error: '#ba1a1a'
  on-error: '#ffffff'
  error-container: '#ffdad6'
  on-error-container: '#93000a'
  primary-fixed: '#d8e2ff'
  primary-fixed-dim: '#adc7ff'
  on-primary-fixed: '#001a41'
  on-primary-fixed-variant: '#004493'
  secondary-fixed: '#ffdbc8'
  secondary-fixed-dim: '#ffb68a'
  on-secondary-fixed: '#321300'
  on-secondary-fixed-variant: '#743500'
  tertiary-fixed: '#8ffa9b'
  tertiary-fixed-dim: '#73dc82'
  on-tertiary-fixed: '#002108'
  on-tertiary-fixed-variant: '#00531e'
  background: '#f7f9ff'
  on-background: '#181c20'
  surface-variant: '#dfe3e8'
typography:
  display-lg:
    fontFamily: Plus Jakarta Sans
    fontSize: 40px
    fontWeight: '700'
    lineHeight: 48px
    letterSpacing: -0.02em
  display-metric:
    fontFamily: Plus Jakarta Sans
    fontSize: 32px
    fontWeight: '700'
    lineHeight: 40px
    letterSpacing: -0.01em
  headline-lg:
    fontFamily: Plus Jakarta Sans
    fontSize: 24px
    fontWeight: '600'
    lineHeight: 32px
  headline-md:
    fontFamily: Plus Jakarta Sans
    fontSize: 20px
    fontWeight: '600'
    lineHeight: 26px
  headline-sm:
    fontFamily: Plus Jakarta Sans
    fontSize: 16px
    fontWeight: '600'
    lineHeight: 24px
  body-lg:
    fontFamily: Roboto Flex
    fontSize: 16px
    fontWeight: '400'
    lineHeight: 24px
  body-md:
    fontFamily: Roboto Flex
    fontSize: 14px
    fontWeight: '400'
    lineHeight: 20px
  body-sm:
    fontFamily: Roboto Flex
    fontSize: 12px
    fontWeight: '400'
    lineHeight: 16px
  label-lg:
    fontFamily: Roboto Flex
    fontSize: 14px
    fontWeight: '500'
    lineHeight: 20px
    letterSpacing: 0.01em
  label-md:
    fontFamily: Roboto Flex
    fontSize: 12px
    fontWeight: '500'
    lineHeight: 16px
    letterSpacing: 0.02em
  label-sm:
    fontFamily: Roboto Flex
    fontSize: 11px
    fontWeight: '600'
    lineHeight: 14px
    letterSpacing: 0.03em
rounded:
  sm: 0.25rem
  DEFAULT: 0.5rem
  md: 0.75rem
  lg: 1rem
  xl: 1.5rem
  full: 9999px
spacing:
  space-2xs: 0.25rem
  space-xs: 0.5rem
  space-sm: 0.75rem
  space-md: 1rem
  space-lg: 1.25rem
  space-xl: 1.5rem
  space-2xl: 2rem
  space-3xl: 2.5rem
  gutter-mobile: 1rem
  margin-mobile: 1rem
  gutter-tablet: 1.5rem
  margin-tablet: 2rem
---

## Brand & Style

The design system establishes an empathetic, clear, and reassuring parent-facing educational environment. Tailored for busy caregivers monitoring academic progress, attendance, and day-to-day school communications, the visual language balances the approachable warmth of family life with the structured authority of an institutional portal.

Rooted in **Corporate / Modern** principles with strong Material Design 3 (Material You) heritage, the system prioritizes instantaneous comprehension:
- High scannability allows parents to evaluate grades, daily schedules, and urgent notices in seconds.
- Friendly, humanist geometry counters administrative stress, replacing bureaucratic friction with transparent, encouraging feedback.
- Tactile visual clarity relies on gentle tonal surfaces, deliberate color-coded states, and expansive touch targets tailored for one-handed mobile navigation on iOS and Android devices.

## Colors

The palette is engineered for immediate cognitive categorization across school tasks, notifications, and student metrics.

### Primary Role
- **Primary Classroom Blue (`#1A73E8`)**: Drives primary actions, active tabs, header focus states, and primary navigational links.
- **Primary Container (`#E8F0FE`)**: Applied as the fill for active state chips, soft pill badges, and highlighted student switcher cards.
- **On-Primary Container (`#174EA6`)**: Delivers contrast-compliant typography and icons nested within primary containers.

### Status Roles & Semantic Tones
- **Tertiary Emerald (`#1E8E3E`)**: Designates positive academic standing, on-time attendance, completed assignments, and verified teacher sign-offs.
  - *Tertiary Container (`#E6F4EA`)* / *On-Tertiary Container (`#137333`)*.
- **Secondary Terracotta / Warning (`#E8710A`)**: Communicates pending homework, upcoming exam deadlines, and schedule adjustments.
  - *Secondary Container (`#FEF7E0`)* / *On-Secondary Container (`#B06000`)*.
- **Error / Alert Coral (`#D93025`)**: Pinpoints unexcused absences, missing submissions, overdue notices, and disciplinary messages.
  - *Error Container (`#FCE8E6`)* / *On-Error Container (`#A50E0E`)*.

### Neutral & Surface Hierarchy
- **Surface Crisp White (`#FFFFFF`)**: Base background for cards, modal dialogs, and top app bars.
- **Surface Container Low (`#F8F9FA`)**: Primary mobile app canvas background, providing separation behind elevated white cards.
- **Surface Container High (`#F1F3F4`)**: Input track backgrounds, disabled chips, divider fills, and unread notification containers.
- **Outline / Border (`#E0E2E6`)**: Subtle architectural hairline borders ensuring structure on low-contrast screens.
- **Text High Emphasis (`#202124`)**: Primary titles, critical grades, and student names.
- **Text Medium Emphasis (`#5F6368`)**: Secondary captions, timestamps, subject labels, and supporting metadata.

## Typography

The type system blends the geometry of **Plus Jakarta Sans** for headlines and high-impact educational metrics with the neutral efficiency of **Roboto Flex** for running body text, form elements, and tabular lists.

### Hierarchy Guidelines
- **Academic Metrics (`display-metric`, `display-lg`)**: Bold, prominent presentation of cumulative GPA, test percentages, and attendance counts. Tabular numbers ensure alignment in vertical rosters.
- **Headings & Student Profiles (`headline-lg`, `headline-md`, `headline-sm`)**: Used for classroom subjects, child selector headers, and card titles. Ensures swift eye scanning across multi-child dashboards.
- **Body & Communications (`body-lg`, `body-md`, `body-sm`)**: Optimized for reading long-form teacher feedback, report card comments, and school announcements with balanced line heights.
- **Labels & Badging (`label-lg`, `label-md`, `label-sm`)**: Styled in medium-to-semibold weights with slight tracking expansions for pill badges, button actions, and timestamp breadcrumbs.

## Layout & Spacing

Layouts follow a structured **fluid grid** calibrated around standard 8pt/4pt rhythmic increments.

### Mobile Grid (Default, &lt;600px)
- **Margins & Gutter**: 16px (`1rem`) lateral screen padding with 16px row gaps between major information modules.
- **Single Column Flow**: Feed cards, assignment timelines, and parent-teacher messaging collapse to 1 column full width.
- **Horizontal Scrolling Trays**: Used selectively for rapid horizontal context switching: sibling picker pills, date strips, and metric chips.

### Tablet Grid (600px - 1023px)
- **Columns**: 8-column layout with 24px (`1.5rem`) gutters and 32px (`2rem`) side margins.
- **Split Hierarchy**: Supports master-detail views (e.g., student roster list on left, grade detail and attendance log on right).

### Tap Targets
All actionable controls, bottom navigation items, icon toggles, and badge filters enforce a minimum interactive footprint of 48px × 48px to accommodate one-handed operation by parents on the go.

## Elevation & Depth

This design system expresses spatial hierarchy through **tonal layering supplemented by subtle, diffuse ambient shadows**, strictly aligned with Material You ergonomics rather than skeuomorphic drop shadows.

### Elevation Levels
- **Level 0 (Flat Canvas)**: `#F8F9FA` background with no shadow. Used as the main application viewport background.
- **Level 1 (Card & Module Surface)**: Pure white `#FFFFFF` surface accompanied by a hairline border (`1px solid #E0E2E6`) and an ambient shadow: `0px 1px 3px rgba(32, 33, 36, 0.06), 0px 1px 2px rgba(32, 33, 36, 0.04)`. Applied to assignment cards, announcement blocks, and feed entries.
- **Level 2 (Floating & Active Interaction)**: `#FFFFFF` surface with an elevated shadow: `0px 4px 8px rgba(32, 33, 36, 0.08), 0px 1px 3px rgba(32, 33, 36, 0.06)`. Applied to active filters, snackbars, and floating action buttons (FABs).
- **Level 3 (Modal & Bottom Sheet Navigation)**: `#FFFFFF` surface with a deep grounding shadow: `0px 8px 24px rgba(32, 33, 36, 0.12), 0px 2px 6px rgba(32, 33, 36, 0.04)`. Applied to bottom sheets, child-switch modals, and teacher contact overlays.

## Shapes

The design system incorporates **soft, welcoming curvature** with Material 3 geometry.

- **Cards & Sheets (`rounded-2xl` / 16px - 24px)**: Academic modules, report cards, and modal bottom sheets utilize generous 16px to 24px corner radii, evoking a modern, approachable classroom feeling.
- **Pills & Status Indicators (`rounded-full` / 9999px)**: Category tags, subject labels, attendance status chips, and numerical score markers use full circular caps to preserve visual softness.
- **Inputs & Action Buttons (`rounded-xl` / 12px - 16px)**: Form fields and actionable buttons follow a cohesive 12px to 16px corner radius, ensuring consistent ergonomics across touch interactions.

## Components

### Buttons
- **Filled Primary**: `#1A73E8` solid fill, `#FFFFFF` text, `rounded-xl` (12px), 48px height. Displays no stroke in default state; applies `#174EA6` in pressed state. Used for key actions: "Message Teacher", "Submit Absence Note".
- **Tonal Button**: `#E8F0FE` fill, `#174EA6` text, `rounded-xl`. Serves as secondary action within cards ("View Assignment Details").
- **Outlined Button**: 1px solid `#E0E2E6` stroke, transparent background, `#202124` text. Used for auxiliary dismiss or cancel controls.

### Cards
- **Assignment & Grade Cards**: White `#FFFFFF` container with `rounded-2xl` (16px), 1px stroke `#E0E2E6`, and Level 1 elevation. Contains an integrated header with subject chip, large bold numerical grade (`display-metric`), and progress timestamp.
- **Urgent Announcement Card**: Outlined card accented with a 4px solid left border in the respective semantic tone (Coral `#D93025` for urgent notices, Terracotta `#E8710A` for warnings).

### Status Badges & Chips
- **Presence / Verified**: Pill (`rounded-full`), `#E6F4EA` background, `#137333` label text, preceded by a solid dot or checkmark.
- **Pending / Warning**: Pill (`rounded-full`), `#FEF7E0` background, `#B06000` label text.
- **Absent / Critical**: Pill (`rounded-full`), `#FCE8E6` background, `#A50E0E` label text.
- **Filter Chips**: 32px height, `rounded-lg` (8px), `#F1F3F4` resting background. Toggles to `#E8F0FE` border and fill with `#1A73E8` text when selected.

### Bottom Navigation Bar
- Fixed to bottom viewport, 80px standard M3 height with safe area inset padding.
- Surface fill is pure white (`#FFFFFF`) with a top border of 1px `#E0E2E6`.
- Active items display an elongated pill background indicator (`#E8F0FE`) around the icon with `#1A73E8` icon and label fill. Inactive items use `#5F6368`.

### Input Fields
- Outlined box style with 1px `#E0E2E6` border in resting state, transitioning to 2px `#1A73E8` border upon focus.
- Background defaults to `#F8F9FA` to clearly separate editable inputs from white card surfaces.
- Floating labels conform to `label-md` in `#5F6368` resting, shifting to `#1A73E8` when active.

### Student Switcher (Family Bar)
- Positioned in the top app bar: a horizontal pill selector showing the student's circular avatar (32px), first name, and grade level.
- Tapping triggers a bottom sheet listing all enrolled children with individual GPA snapshots and school badges.