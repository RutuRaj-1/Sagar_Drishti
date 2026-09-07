---
name: Oceanic Telemetry & 3D GIS Platform
colors:
  surface: '#f8f9ff'
  surface-dim: '#c6dbff'
  surface-bright: '#f8f9ff'
  surface-container-lowest: '#ffffff'
  surface-container-low: '#eff3ff'
  surface-container: '#e6eeff'
  surface-container-high: '#dde9ff'
  surface-container-highest: '#d4e3ff'
  on-surface: '#001c39'
  on-surface-variant: '#404850'
  inverse-surface: '#0f3157'
  inverse-on-surface: '#ebf1ff'
  outline: '#707881'
  outline-variant: '#bfc7d1'
  surface-tint: '#006399'
  primary: '#005d90'
  on-primary: '#ffffff'
  primary-container: '#0077b6'
  on-primary-container: '#f3f7ff'
  inverse-primary: '#94ccff'
  secondary: '#00677d'
  on-secondary: '#ffffff'
  secondary-container: '#50d9fe'
  on-secondary-container: '#005c70'
  tertiary: '#4c51a0'
  on-tertiary: '#ffffff'
  tertiary-container: '#646aba'
  on-tertiary-container: '#f9f6ff'
  error: '#ba1a1a'
  on-error: '#ffffff'
  error-container: '#ffdad6'
  on-error-container: '#93000a'
  primary-fixed: '#cde5ff'
  primary-fixed-dim: '#94ccff'
  on-primary-fixed: '#001d32'
  on-primary-fixed-variant: '#004b74'
  secondary-fixed: '#b3ebff'
  secondary-fixed-dim: '#4cd6fb'
  on-secondary-fixed: '#001f27'
  on-secondary-fixed-variant: '#004e5f'
  tertiary-fixed: '#e0e0ff'
  tertiary-fixed-dim: '#bfc2ff'
  on-tertiary-fixed: '#070a61'
  on-tertiary-fixed-variant: '#393e8c'
  background: '#f8f9ff'
  on-background: '#001c39'
  surface-variant: '#d4e3ff'
typography:
  display-lg:
    fontFamily: Space Grotesk
    fontSize: 32px
    fontWeight: '700'
    lineHeight: 40px
    letterSpacing: -0.03em
  display-lg-mobile:
    fontFamily: Space Grotesk
    fontSize: 26px
    fontWeight: '700'
    lineHeight: 34px
    letterSpacing: -0.02em
  display-md:
    fontFamily: Space Grotesk
    fontSize: 24px
    fontWeight: '700'
    lineHeight: 32px
    letterSpacing: -0.02em
  headline-md:
    fontFamily: Space Grotesk
    fontSize: 18px
    fontWeight: '600'
    lineHeight: 26px
    letterSpacing: -0.01em
  title-md:
    fontFamily: Space Grotesk
    fontSize: 14px
    fontWeight: '600'
    lineHeight: 20px
    letterSpacing: 0em
  body-base:
    fontFamily: Inter
    fontSize: 13.5px
    fontWeight: '400'
    lineHeight: 20px
    letterSpacing: 0em
  body-bold:
    fontFamily: Inter
    fontSize: 13.5px
    fontWeight: '600'
    lineHeight: 20px
    letterSpacing: 0.01em
  label-caps:
    fontFamily: Space Grotesk
    fontSize: 10px
    fontWeight: '700'
    lineHeight: 14px
    letterSpacing: 0.12em
  stat-lg:
    fontFamily: Space Grotesk
    fontSize: 22px
    fontWeight: '700'
    lineHeight: 26px
    letterSpacing: -0.03em
  telemetry-mono:
    fontFamily: JetBrains Mono
    fontSize: 11px
    fontWeight: '500'
    lineHeight: 16px
    letterSpacing: 0.02em
rounded:
  sm: 0.125rem
  DEFAULT: 0.25rem
  md: 0.375rem
  lg: 0.5rem
  xl: 0.75rem
  full: 9999px
spacing:
  unit: 0.25rem
  xs: 0.25rem
  sm: 0.5rem
  md: 0.75rem
  base: 1rem
  lg: 1.25rem
  xl: 1.5rem
  2xl: 2rem
  3xl: 3rem
  sidebar-left: 19.375rem
  sidebar-right: 25.625rem
  topbar-h: 3.625rem
  gutter: 1rem
---

## Brand & Style

The design system embodies **Hydrographic Precision and Operational Clarity**, engineered for oceanographers, climate researchers, and maritime disaster command teams under high-consequence monitoring scenarios. Navigating dynamic multidimensional marine datasets—from deep-sea Argo floats and sub-surface glider transects to 3D volumetric NetCDF isosurfaces—demands an aesthetic that prioritizes cognitive calm, spatial exactitude, and rapid legibility over visual noise.

Moving deliberately away from murky dark-mode sci-fi tropes, this design system establishes an **Ocean Breeze Glacial Daylight** visual language. It combines the crisp spatial discipline of scientific instrumentation with tactile neo-brutalist precision: sharp structural outlines (1.5px to 2px), defined tactile offsets, crisp ice-white and glacial blue surfaces, and vibrant hydrographic telemetry vectors. The user experience evokes the technical atmosphere of an oceanic research vessel's tactical navigation bridge on a clear morning: calm, authoritative, robust, and mathematically grounded.

## Colors

The core color system is rooted in the high-fidelity five-tier Ocean Breeze spectrum, purposefully calibrated to balance expansive geospatial map viewports with high-density tabular telemetry and 3D WebGL bathymetric models.

### Primary Spectrum
* **Rich Cerulean (`#0077B6`)**: The primary interactive anchor. Governs primary action buttons, active tab indicators, selected spatial boundaries, and bathymetric scrub bars.
* **Vibrant Cyan (`#00B4D8`)**: The fluid telemetry accent. Applied to animated current vectors, glider navigation paths, sensor pulse rings, and bathymetric countour highlights.
* **Deep Navy (`#03045E`)**: The structural abyssal base. Anchors persistent command navigation headers, high-emphasis KPI values, structural hard drop-shadows, and modal perimeters.
* **Light Aqua (`#90E0EF`)**: The contextual highlight and hover plane. Drives hover states, secondary telemetry chips, and spatial buffer zones.
* **Ice White (`#CAF0F8`)**: The luminous glacial card base. Provides an ultra-clean contrast surface for data overlays, telemetry badges, and map control clusters.

### Background Foundations & Neutral Layers
* **Workspace Glacial Canvas (`#F4F9FD`)**: Baseline background surface reducing ocular fatigue during extended scientific observation shifts while accentuating complex satellite imagery.
* **Panel Tint Surface (`#E6F2F9` / `#DEEBF5`)**: Subtle ocean mist tint applied to navigation sidebars, tool trays, and docked parameter inspectors.
* **Outline Stroke (`#8CBCDB`)**: Structural boundary lines, coordinate crossbars, and card contours.
* **Divider Subtle (`#B8DAF0`)**: Low-contrast internal separators, unselected table borders, and grid guides.

### Scientific & Operational Status Semantics
* **Operational Sea Green (`#059669`)**: Live telemetry connection, nominal sensor streaming, dissolved oxygen parameters.
* **Thermal Alert Amber (`#F77F00`)**: Cyclone heat potential flags, pycnocline barrier layer thresholds, chlorophyll-a concentrations.
* **Surface Critical Red (`#D62828`)**: Critical sea-surface temperature anomalies, data loss alerts, acoustic transponder timeouts.

## Typography

The typographical system establishes a dual identity: technical engineering authority via **Space Grotesk** paired with neutral analytical ergonomics via **Inter**. A specialized third monospace voice, **JetBrains Mono**, is utilized for high-density oceanographic telemetry.

### Typographic Roles & Principles
* **Geometric Structural Display (Space Grotesk)**: Drives page landmarks, basin indicators, KPI figures, and micro status chips. All uppercase micro headers (`label-caps`) enforce a strict `+0.12em` tracking for legibility at compact dimensions.
* **Neutral Data Narratives (Inter)**: Manages diagnostic reports, sensor metadata descriptions, and complex configuration lists. Its humanist proportions minimize cognitive drag in dense dashboards.
* **Monospace Telemetry (JetBrains Mono)**: Mandatory for GPS coordinates (`12.458°N, 84.120°E`), depth readings (`454.2 dbar`), Argo WMO identifiers, and raw NetCDF matrix streams. Fixed-width figures (`font-variant-numeric: tabular-nums`) prevent UI jumping during real-time updates.
* **Label to Value Association**: Spacing between metadata labels and numeric metrics adheres strictly to a 4px vertical rhythm.

## Layout & Spacing

The system is built on a 4px structural baseline unit (`0.25rem`) that scales into an operational three-pane tactical canvas. 

### Structural Layout Engine
* **Command Bar (Top)**: Fixed height of `58px` (`3.625rem`). Serves as the master global control hub housing basin selector, mission status beacons, layer presets, and platform health telemetry.
* **Left Parameter Console**: Fixed width of `310px` (`19.375rem`). Dedicated to variable management (SST, Salinity, Isosurfaces), depth-level scrubbers, temporal NetCDF stepping decks, and model execution controls.
* **Center GIS / WebGL Viewport**: Flexible fluid viewport (`1fr`). Accommodates interactive 2D map tiles (Leaflet/Mapbox) or 3D WebGL bathymetric rendering with dynamic coordinates inspector and colorbar HUDs.
* **Right Telemetry & Diagnostics Console**: Fixed width of `410px` (`25.625rem`). Hosts vertical Argo CTD depth profiles, dual-line Model-vs-Observation cross-validation charts, and T-S water mass scatter plots.

### Responsive Breakpoint Strategy
* **Desktop Ultra-Wide (≥1440px)**: Default 3-column split (`310px` | `1fr` | `410px`).
* **Standard Desktop (1101px – 1439px)**: Compact telemetry split (`270px` | `1fr` | `300px`).
* **Field Laptop / Tablet Landscape (861px – 1100px)**: 2-column layout (`260px` | `1fr`). Right analysis panel collapses into an on-demand slide-over drawer.
* **Tactical Mobile (≤860px)**: Full-bleed single viewport (`1fr`). Sidebars convert into expandable bottom-sheet drawers; top command bar consolidates into compact mission indicators.

## Elevation & Depth

Visual depth is achieved through an intentional convergence of **tactile neo-brutalist hard offsets** and **high-clarity glassmorphic overlays**, avoiding diffuse ambient blur that muddles fine geospatial vectors.

### Elevation Hierarchy
* **Level 0 (Glacial Ground Plane)**: The underlying map or WebGL bathymetric canvas, sitting at `z-index: 1`. Clean, sharp, unobstructed daylight perspective.
* **Level 1 (Docked Structural Sidebars)**: Left and right panels bounded by `1.5px solid #8CBCDB` borders with surface backgrounds of `#E6F2F9` and zero shadow blur, establishing firm physical partition lines.
* **Level 2 (Tactile Cards & Action Buttons)**: Cards and elevated modules feature crisp hard offsets: `box-shadow: 2px 2px 0px #0077B6` or `3px 3px 0px #03045E`. Interactive elements displace physically upon interaction (`transform: translate(-1px, -1px)` on hover, `transform: translate(2px, 2px)` on press).
* **Level 3 (HUD Glassmorphic Floats)**: On-map coordinate readouts, colorbar legends, and 3D camera controls utilize translucent ice-white shields (`rgba(255, 255, 255, 0.94)`) combined with a `backdrop-filter: blur(12px)`, an outline of `2px solid #0077B6`, and a crisp shadow offset (`0px 4px 16px rgba(3, 4, 94, 0.12)`).
* **Level 4 (System Modals & Diagnostics)**: Overlays and full-basin diagnostics render at `z-index: 2000`, bordered by `2px solid #03045E` with `6px 6px 0px #0077B6` hard drop-shadows over a tinted backdrop.

## Shapes

The design system maintains a **Soft-Technical (Level 1)** geometric aesthetic. Corners remain predominantly structured and architectural, conveying mechanical precision without harsh industrial brutality.

### Shape Geometry Specifications
* **Default Elements (`rounded-sm` / 4px)**: Applied to buttons, input controls, metric readouts, and variable selection cards. Preserves clean rectangular edges that align neatly with dense tabular arrays.
* **Structural Containers (`rounded-md` / 6px to 8px)**: Applied to persistent analytical cards, floating HUD legends, and sensor profile containers.
* **Interactive Pills & Badges (`rounded-full` / 9999px)**: Reserved exclusively for status indicators, live telemetry mode chips (e.g., `ARGO LIVE`, `MODEL RUN`), and temporal playback scrub handles.

## Components

### 1. Buttons & Command Triggers
* **Primary Command Button (e.g., Run Forecast, Launch 3D Explorer)**:
  - Fill: Deep Navy (`#03045E`) with Pure White (`#FFFFFF`) typography.
  - Border: `2px solid #03045E`.
  - Radius: `4px`.
  - Shadow: `3px 3px 0px #0077B6` (Cerulean offset).
  - Hover: `background: #0077B6; transform: translate(-1px, -1px); box-shadow: 4px 4px 0px #03045E;`.
  - Active: `transform: translate(2px, 2px); box-shadow: 0px 0px 0px;`.
* **Secondary Utility Button (e.g., Export GeoJSON, Clear Filter)**:
  - Fill: Ice White (`#CAF0F8`) with Deep Navy (`#03045E`) typography.
  - Border: `2px solid #0077B6`.
  - Shadow: `2px 2px 0px #0077B6`.
  - Hover: `background: #90E0EF; border-color: #03045E;`.

### 2. Variable Selector Cards (`.var-card`)
* Base: White background with a `1.5px solid #B8DAF0` border and a distinctive `4px solid var(--var-accent)` indicator on the left edge.
* Selected State: Fill shifts to `#CAF0F8`, border transitions to `2px solid #0077B6`, accented with a `2px 2px 0px #0077B6` shadow.
* Footer: Houses an integrated 3px colorbar preview gradient representing the variable's active transfer function.

### 3. Chips & Telemetry Status Badges
* Geometry: Pill-shaped (`rounded-full`), height `22px`, padding `0 10px`.
* Typography: `Space Grotesk` uppercase at `10px` (`+0.12em` tracking).
* Live Ping Variant: Includes an active green beacon (`#059669`) with a radar-ping wave effect indicating real-time satellite stream sync.

### 4. Input Fields & Search Scrubbers
* Base: Background `#FFFFFF`, border `1.5px solid #8CBCDB`, text `#03045E`.
* Height: Compact `34px` for space optimization in tool panels.
* Focus State: Border snaps to `2px solid #0077B6` with an immediate `2px 2px 0px #03045E` tactile shadow. Monospace inputs strictly format numeric telemetry.

### 5. Checkboxes & Radio Matrix Selectors
* Checkbox: `16x16px` square with `2px` roundedness and `2px solid #0077B6` stroke. Checked state is solid `#0077B6` with an Ice White tick.
* Radio Tiles: Rectangular segmented buttons with `2px solid #8CBCDB`. Selected segment displays `#CAF0F8` fill, `2px solid #0077B6`, and bold Navy text.

### 6. Specialized Oceanographic Cards & Graph HUDs
* **Profile & TS Diagram Enclosures**: Clean `#FFFFFF` cards with a `3px` colored top bar identifying the physical variable (e.g., `#D64045` for Temperature, `#0D9488` for Salinity). Dual grid lines in `#E2EFF9`.
* **Floating GIS HUDs**: Coordinate inspection overlays with `backdrop-filter: blur(12px)`, semi-transparent Ice White fill (`rgba(255, 255, 255, 0.94)`), and `JetBrains Mono` telemetry outputs.
