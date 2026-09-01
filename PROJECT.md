# 🌊 SAGAR-DRISHTI (सागर-दृष्टि) — The Master Project Guide

### Browser-Native 3D Ocean Data Visualization & In-Situ Analytics Platform
**Smart India Hackathon (SIH 2026) · Problem Statement #26067 · INCOIS (Ministry of Earth Sciences, Govt. of India)**

---

## 🧸 1. Explain It Like I'm 5 (The Big Picture Story)

> Imagine the ocean is a **giant, magical 3-layer cake** full of secret movements, temperatures, and ocean creatures! 🌊🎂

### 🌟 The Problem
We can look at the surface of the ocean with our eyes, but we cannot easily see what is happening **deep inside or at the bottom of the sea**. 
- Is the ocean getting too hot? (This causes super-cyclones 🌀!)
- Is there enough oxygen for fish to breathe? 🐟
- Are underwater rivers (ocean currents) moving warm or salty water around?

### 🛰️ The First Helper: The "Weather Satellite in the Sky" (CMEMS)
Think of **CMEMS** as a giant camera and math computer high up in the sky. Every single day, it predicts a grid map of the whole ocean (temperature, saltiness, sea height) across the Arabian Sea and Bay of Bengal. It creates a **huge 5.8 GB mathematical picture**.

### 🤖 The Second Helper: The "Diving Robot Army" (Argo Floats)
Think of **Argo Floats** as **91 yellow robot submarines** swimming freely in the ocean. 
1. Every few days, the robot sinks down **2,000 meters (2 kilometers!) deep** into the dark sea.
2. As it floats back up to the surface, its digital sensors measure the **real temperature, salt, oxygen, and plant life (chlorophyll)** at every meter!
3. Once it pops its head out of the water, it beeps a satellite: *"Hey! Here is the real ground-truth data from my dive!"*

### 🎯 What SAGAR-DRISHTI Does
**SAGAR-DRISHTI** connects the **Sky Forecast (CMEMS)** with the **Diving Robots (Argo)** in a stunning, interactive 2D & 3D browser application!
- You can fly over the ocean in **3D**, see warm water rise like mountains and cold water dip like valleys.
- You can click on any robot pin to see its **real underwater depth dive**.
- You can check if the computer forecast was right by comparing it directly against what the robot measured!

---

## 📖 2. The Ocean Decoder Ring (Glossary & Shortforms)

Whenever you see short words on the screen, here is what they mean:

### 🛰️ CMEMS Model Variables (Gridded Data)
| Code | Full Name | Simple Meaning | Why It Matters | Color |
|---|---|---|---|---|
| **`tob`** | **Temperature at Ocean Bottom** | How hot or cold the deep sea floor is (°C) | Warm bottom water drives deep currents & warms eddies. | 🔴 Coral Red (`#ff6b6b`) |
| **`sob`** | **Salinity at Ocean Bottom** | How salty the deep water is (PSU) | Heavy, salty water sinks; fresh water floats. | 🩵 Teal-Cyan (`#4ecdc4`) |
| **`zos`** | **Sea Surface Height** | Height of sea surface above normal (meters) | High bumps (warm eddies) spin clockwise and fuel cyclones! | 🔵 Sky Blue (`#74b9ff`) |
| **`mlotst`**| **Mixed Layer Depth** | Thickness of the stirred sunlit top water (meters) | Deep mixed layers store heat that feeds typhoons. | 🟣 Purple (`#a29bfe`) |
| **`pbo`** | **Sea Floor Pressure** | Weight of all water pushing on ocean floor (dbar) | Changes when tides, tsunamis, or heavy currents pass. | 🩷 Pink (`#fd79a8`) |
| **`sivelo`**| **Sea Ice Velocity** | Speed of floating ice drift (m/s) | Monitored in polar regions (zero in tropical India). | ❄️ Silver Ice (`#dfe6e9`) |

### 🤖 Argo Float In-Situ Parameters (Underwater Dive Data)
| Code | Full Name | What the Robot Measures | Normal Range | Color |
|---|---|---|---|---|
| **`TEMP`** | In-situ Temperature | True water temperature at that exact depth | 28°C (surface) → 2°C (deep) | 🔴 Coral Red |
| **`PSAL`** | Practical Salinity | Saltiness measured via electrical conductivity | 32 to 36 PSU | 🩵 Teal |
| **`PRES`** | Pressure (Depth) | Water pressure (1 dbar ≈ 1 meter depth) | 0 to 2,000 dbar | 🔵 Sky Blue |
| **`DOXY`** | Dissolved Oxygen | Breathing gas for fish & marine life (μmol/kg) | High at surface, drops in OMZ | 🟢 Mint Green (`#55efc4`) |
| **`CHLA`** | Chlorophyll-a | Green microscopic plant plankton (mg/m³) | High where fish eat! | 🟡 Amber (`#fdcb6e`) |
| **`NITRATE`**| Nitrate Nutrient | Plant fertilizer brought up by cold upwelling | 0 to 45 μmol/kg | 🟣 Violet (`#a29bfe`) |
| **`pH`** | Ocean Acidity | Acidity of water (tracks ocean acidification) | 7.8 to 8.2 | 🩷 Hot Pink (`#fd79a8`) |
| **`BBP700`**| Particle Backscattering | Tiny particles & dust suspended in water | 0.0001 to 0.005 m⁻¹ | 🟠 Orange (`#e17055`) |

### 🔬 Scientific Acronyms
- **CMEMS**: Copernicus Marine Environment Monitoring Service (European satellite ocean system).
- **INCOIS**: Indian National Centre for Ocean Information Services (Hyderabad, India — the Problem Owner).
- **BGC-Argo**: Biogeochemical Argo Floats (smart floats with oxygen, plant, and chemical sensors, not just temp/salt).
- **WMO ID**: World Meteorological Organization Float ID number (e.g. `1902367`).
- **JULD**: Julian Day (days counted since 1950-01-01, converted by our backend to standard `YYYY-MM-DD`).
- **PSU**: Practical Salinity Units (roughly grams of salt per kilogram of seawater).
- **dbar**: Decibar (unit of pressure; 10 dbar ≈ 10 meters depth).
- **T-S Diagram**: Temperature vs Salinity plot used to identify "water masses" (like an ocean fingerprint).
- **Co-location**: Comparing the satellite/model estimate at the exact same point and time as the robot float.

---

## 🏗️ 3. End-to-End System Architecture

```
┌─────────────────────────────────────────────────────────────────────────────────────────────┐
│                                 SAGAR-DRISHTI ARCHITECTURE                                  │
│                                                                                             │
│  ┌───────────────────────────────┐               ┌───────────────────────────────────────┐  │
│  │         DATA LAYER            │               │           BACKEND (FastAPI)           │  │
│  │                               │               │                                       │  │
│  │  📁 cmems_...nc (5.8 GB)      │──────────────▶│  netcdf_service.py                    │  │
│  │     • 1,562 daily time steps  │   (xarray     │  • Slices 2D grid: (lat, lon, values) │  │
│  │     • 205 × 325 lat/lon grid  │    lazy mem)  │  • Time-series at any (lat, lon)      │  │
│  │     • 6 physics variables     │               │  • Spatial stats (min, max, histogram)│  │
│  │                               │               │                                       │  │
│  │  📁 DataSelection_.../        │──────────────▶│  argo_nc_service.py                   │  │
│  │     • 91 Profile NC files     │   (netCDF4    │  • Parses WMO IDs & JULD dates        │  │
│  │     • 92 Trajectory NC files  │    lru_cache) │  • Extracts depth vs 7 BGC params     │  │
│  │     • Real Bay of Bengal data │               │  • Computes T-S diagram scatter       │  │
│  │                               │               │  • Fetches CMEMS co-location point    │  │
│  └───────────────────────────────┘               └───────────────────┬───────────────────┘  │
│                                                                      │                      │
│                                                       REST Endpoints │ JSON over HTTP       │
│                                                       Port: 8000     │ (Proxied by Vite)    │
│                                                                      ▼                      │
│  ┌───────────────────────────────────────────────────────────────────────────────────────┐  │
│  │                              FRONTEND (React + Vite + WebGL)                          │  │
│  │                                                                                       │  │
│  │   ┌───────────────────────────┐ ┌───────────────────────────┐ ┌────────────────────┐  │  │
│  │   │  🗺️ 2D Interactive GIS    │ │  🌐 3D WebGL Terrain      │ │  🔴 Argo Explorer  │  │  │
│  │   │     (Leaflet Map)         │ │     (Three.js Engine)     │ │     (Recharts)     │  │  │
│  │   │ • Esri Dark Gray Tiles    │ │ • Elevated 3D terrain     │ │ • Multi-param depth│  │  │
│  │   │ • 78% CMEMS color overlay │ │ • Real geographic axes    │ │ • T-S water mass   │  │  │
│  │   │ • Coastline labels        │ │ • 3D floating text sprites│ │ • Model validation │  │  │
│  │   │ • Glowing Argo float pins │ │ • Surface-anchored pins   │ │ • Float trajectories│  │
│  │   └───────────────────────────┘ └───────────────────────────┘ └────────────────────┘  │  │
│  │                                                                                       │  │
│  │   ┌───────────────────────────┐ ┌───────────────────────────┐ ┌────────────────────┐  │  │
│  │   │  🎛️ Control Panel         │ │  📈 Analytics Engine      │ │  🎨 Color Semantic │  │  │
│  │   │ • Variable card switcher  │ │ • 4-year linear trends    │ │ • Uniform colors   │  │  │
│  │   │ • Date scrubber & player  │ │ • Pearson correlation     │ │ • Custom palettes  │  │  │
│  │   │ • Opacity / Exaggeration  │ │ • Bounding box analytics  │ │ • Dynamic legends  │  │  │
│  │   └───────────────────────────┘ └───────────────────────────┘ └────────────────────┘  │  │
│  └───────────────────────────────────────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────────────────────────────────────┘
```

---

## 📂 4. Complete Codebase Walkthrough (File by File)

Here is a clear explanation of what **every single file** in the project does:

### 🐍 Backend Files (`backend/`)

#### 1. [`backend/app/main.py`](file:///c:/Users/bhome/OneDrive/Desktop/VIT/SIH/SIH%202026/sih26067/sih26067-prototype/backend/app/main.py) — *The Airport Control Tower*
- **Role**: This is the main starting point of the backend. It launches the **FastAPI** application.
- **What it does**:
  - Sets up **CORS** (Cross-Origin Resource Sharing) so the React frontend can talk to it without security blocks.
  - Plugs in all the routers (`/api/model`, `/api/instruments`, `/api/analytics`, `/api/variables`).
  - Pre-warms the dataset in the background during startup so users don't face lag.

#### 2. [`backend/app/config.py`](file:///c:/Users/bhome/OneDrive/Desktop/VIT/SIH/SIH%202026/sih26067/sih26067-prototype/backend/app/config.py) — *The Master Settings Book*
- **Role**: Stores all file paths, variable metadata, and semantic color dictionaries.
- **What it does**:
  - Tells the app where the 5.8 GB CMEMS file and the Argo DataSelection directory live.
  - Defines the `VARIABLE_CATALOGUE` with titles, units, descriptions, and hex colors for every parameter.
  - Defines `ARGO_PARAM_META` for BGC parameters.

#### 3. [`backend/app/services/netcdf_service.py`](file:///c:/Users/bhome/OneDrive/Desktop/VIT/SIH/SIH%202026/sih26067/sih26067-prototype/backend/app/services/netcdf_service.py) — *The CMEMS Data Slicer*
- **Role**: Reads the 5.8 GB NetCDF4 satellite/model file.
- **What it does**:
  - Uses `xarray.open_dataset()` with lazy disk access (doesn't load all 5.8 GB into RAM at once).
  - `get_surface(variable, date, downsample)`: Grabs a single 2D sheet of data for a specific day and returns lat, lon, and numerical grid values.
  - `get_timeseries(variable, lat, lon)`: Drills down through all 1,562 days at a specific coordinate to give a full 4-year time history.
  - `get_spatial_stats(variable, date)`: Computes mean, min, max, std dev, and a 20-bin histogram.
  - `get_anomaly(variable, date)`: Calculates how much today's ocean temperature deviates from the 4-year average.

#### 4. [`backend/app/services/argo_nc_service.py`](file:///c:/Users/bhome/OneDrive/Desktop/VIT/SIH/SIH%202026/sih26067/sih26067-prototype/backend/app/services/argo_nc_service.py) — *The Robot Float Parser*
- **Role**: Reads all 91 profile NetCDF files and 92 trajectory NetCDF files from the Coriolis export.
- **What it does**:
  - Converts strange `JULD` float numbers (days since 1950) into human dates like `2026-07-15`.
  - Cleans up WMO float platform IDs (e.g. `1902367`).
  - Reads depth arrays (`PRES`) and pairs them with `TEMP`, `PSAL`, `DOXY`, `CHLA`, `NITRATE`, `pH`, and `BBP700`.
  - `get_ts_diagram(id)`: Pairs temperature with salinity at identical pressure levels for water-mass identification.
  - `get_float_trajectory(id)`: Extracts GPS latitude and longitude path over time.
  - Uses `@functools.lru_cache` so files are read once and cached in memory for instant millisecond responses.

#### 5. [`backend/app/services/instrument_service.py`](file:///c:/Users/bhome/OneDrive/Desktop/VIT/SIH/SIH%202026/sih26067/sih26067-prototype/backend/app/services/instrument_service.py) — *The Co-Location Matchmaker*
- **Role**: Combines Argo in-situ readings with CMEMS model readings.
- **What it does**:
  - When you ask for an Argo profile, it also calls `netcdf_service.get_value_at_point()` to fetch the CMEMS model prediction at that exact coordinate and date, attaching it as `model_comparison`.

#### 6. [`backend/app/routers/`](file:///c:/Users/bhome/OneDrive/Desktop/VIT/SIH/SIH%202026/sih26067/sih26067-prototype/backend/app/routers/) — *The API Waiters*
- **`model.py`**: Handles requests for 2D surface slices, anomalies, histograms, and time series.
- **`instruments.py`**: Handles requests for the float list, dive profiles, trajectories, and T-S scatter.
- **`analytics.py`**: Handles rolling trends, linear regressions, and Pearson cross-correlations.
- **`variables.py`**: Serves the variable list and date calendar.

---

### ⚛️ Frontend Files (`frontend/`)

#### 1. [`frontend/src/App.jsx`](file:///c:/Users/bhome/OneDrive/Desktop/VIT/SIH/SIH%202026/sih26067/sih26067-prototype/frontend/src/App.jsx) — *The Mother Ship*
- **Role**: The main React container that ties the entire UI together.
- **What it does**:
  - Manages global state: active tab (`viz`, `argo`, `analytics`), current variable, current date index, active float, animation timer.
  - Renders the glowing Topbar with live backend health pills and dataset stats.
  - Switches smoothly between the 3 main modes: **Visualization**, **Argo Explorer**, and **Analytics Dashboard**.

#### 2. [`frontend/src/components/OceanMap.jsx`](file:///c:/Users/bhome/OneDrive/Desktop/VIT/SIH/SIH%202026/sih26067/sih26067-prototype/frontend/src/components/OceanMap.jsx) — *The 2D GIS Map*
- **Role**: Renders the crisp 2D geographic ocean view.
- **What it does**:
  - Uses **Leaflet.js** with **Esri World Dark Gray Canvas** base tiles.
  - Draws the Indian Peninsula, Sri Lanka (at 80°–82°E), Lakshadweep, and Andaman & Nicobar clearly.
  - Overlays the CMEMS data as a semi-transparent canvas layer (78% opacity).
  - Adds an Esri reference layer on top for clean white text labels of cities and coastlines.
  - Plots Argo float pins (yellow for CTD, neon-green for BGC) with animated pulse rings.
  - Clicking any ocean point triggers a time-series chart in the right sidebar.

#### 3. [`frontend/src/components/Scene3D.jsx`](file:///c:/Users/bhome/OneDrive/Desktop/VIT/SIH/SIH%202026/sih26067/sih26067-prototype/frontend/src/components/Scene3D.jsx) — *The 3D WebGL Ocean Landscape*
- **Role**: Extrudes 2D ocean data into a 3D landscape using **Three.js**.
- **What it does**:
  - Deforms a 3D vertex mesh: height represents value (warm water rises, cold water dips).
  - Geographically aligned: Left = West (Arabian Sea), Right = East (Bay of Bengal), Back = North, Front = South.
  - Renders 3D floating billboard labels for **Arabian Sea**, **Bay of Bengal**, **Indian Peninsula**, **Sri Lanka**, **Lakshadweep**, and **Andaman**.
  - Pins 3D float markers directly on top of the moving terrain surface.
  - OrbitControls allows the user to rotate, tilt, pan, and zoom with buttery 60 FPS performance.

#### 4. [`frontend/src/components/ProfileChart.jsx`](file:///c:/Users/bhome/OneDrive/Desktop/VIT/SIH/SIH%202026/sih26067/sih26067-prototype/frontend/src/components/ProfileChart.jsx) — *The Depth Profile & T-S Explorer*
- **Role**: Visualizes the robot dive data in the right sidebar.
- **What it does**:
  - Draws vertical depth profile charts (0 to 2000 dbar) for Temperature, Salinity, Oxygen, Chlorophyll, and Nitrate using **Recharts**.
  - Has a **🌀 T-S Diagram tab** showing temperature vs salinity scatter points to identify water masses.
  - Displays the **CMEMS Model Comparison badge** showing model value vs real float measurement.

#### 5. [`frontend/src/components/ControlPanel.jsx`](file:///c:/Users/bhome/OneDrive/Desktop/VIT/SIH/SIH%202026/sih26067/sih26067-prototype/frontend/src/components/ControlPanel.jsx) — *The Left Command Console*
- **Role**: Provides interactive controls for the user.
- **What it does**:
  - Color-coded variable selector cards (with colored accent indicators and mini palette bars).
  - Time navigator slider with **▶ Animate / ⏸ Pause** controls across 1,562 days.
  - 3D controls: Vertical Exaggeration slider (0.2× to 5.0×) and Opacity slider.
  - 5-step interactive pipeline indicator showing the live data pipeline stages.

#### 6. [`frontend/src/components/StatsDashboard.jsx`](file:///c:/Users/bhome/OneDrive/Desktop/VIT/SIH/SIH%202026/sih26067/sih26067-prototype/frontend/src/components/StatsDashboard.jsx) — *The Science Analytics Tab*
- **Role**: Deep scientific analysis of the ocean basin.
- **What it does**:
  - Displays KPI summary cards: Basin Min, Basin Max, Basin Mean, Std Dev.
  - Plots a 20-bin histogram of data distribution.
  - Calculates 4-year linear trend slope and 30-day moving average.
  - Computes Pearson correlation scatter between any two selected variables.

#### 7. [`frontend/src/utils/colormap.js`](file:///c:/Users/bhome/OneDrive/Desktop/VIT/SIH/SIH%202026/sih26067/sih26067-prototype/frontend/src/utils/colormap.js) — *The Scientific Color Palette Engine*
- **Role**: Mathematical color mapping.
- **What it does**:
  - Contains calibrated palettes: `thermal` (temperature), `haline` (salinity), `viridis` (SSH), `deep` (MLD/pressure), `ice` (sea ice).
  - Normalizes raw physical values to `[0, 1]` with linear or logarithmic scaling.
  - Maps any float value to `[R, G, B]` color stops.
  - Exports `VARIABLE_COLORS` and `ARGO_PARAM_COLORS` registries.

#### 8. [`frontend/src/styles.css`](file:///c:/Users/bhome/OneDrive/Desktop/VIT/SIH/SIH%202026/sih26067/sih26067-prototype/frontend/src/styles.css) — *The Design System*
- **Role**: Defines the visual styling.
- **What it does**:
  - Loads Google Fonts (`Outfit`, `Inter`, `JetBrains Mono`).
  - Sets up CSS custom properties (`--c-temp`, `--c-salt`, `--c-ssh`, `--glass`, `--panel-grad`).
  - Implements glassmorphism backdrop blurs, glowing badge animations, and responsive layouts.

---

## ⚡ 5. What Happens in the Complete App (Step-by-Step)

```
1. You run `uvicorn` & `npm run dev`
   │
2. Backend starts in 3 seconds:
   ├── Opens CMEMS NetCDF (5.8 GB) with xarray memory-mapping
   └── Indexes all 91 Argo NetCDF files into an in-memory cache
   │
3. Frontend opens in your browser (http://localhost:5173):
   ├── Calls /api/variables → loads variable catalogue & color tokens
   ├── Calls /api/variables/dates → loads 1,562 date calendar
   ├── Calls /api/instruments → renders 91 glowing float pins on map
   └── Calls /api/model/surface → downloads 2D grid slice and paints ocean colors
   │
4. You click on the 2D Map:
   └── Calls /api/model/timeseries?lat=...&lon=... → right panel instantly plots 
       a 4-year historical graph showing how temperature changed at that spot!
   │
5. You click the "3D" toggle:
   └── Three.js transforms the 2D map into a 3D mountain landscape with floating 
       billboard labels for Arabian Sea, Bay of Bengal, and Sri Lanka!
   │
6. You click an Argo Float pin:
   └── Calls /api/instruments/{id}/profile → draws real vertical dive charts down 
       to 2000m depth and compares the float reading with the CMEMS model!
   │
7. You click "Argo Explorer" or "Analytics":
   └── Deep-dive into water mass T-S diagrams, oxygen minimum zones, and 
       multi-variable Pearson correlation coefficients!
```

---

## 🚀 6. How to Run (Step-by-Step Commands)

### 💻 Step 1: Start Backend (FastAPI)
Open your first terminal and run:
```bash
cd backend

# Install Python requirements (one time)
pip install fastapi uvicorn xarray netCDF4 numpy pandas scipy pydantic python-multipart

# Start the server
uvicorn app.main:app --reload --port 8000
```
> Server will start at **`http://localhost:8000`**.

### 🌐 Step 2: Start Frontend (React + Vite)
Open your second terminal and run:
```bash
cd frontend

# Install dependencies (one time)
npm install

# Start the dev server
npm run dev
```
> Open your browser at **`http://localhost:5173`**.

### 🧪 Step 3: Test API Endpoints
You can verify everything in a third terminal:
```bash
# Check system health
curl http://localhost:8000/api/health

# List all 91 real Argo floats
curl http://localhost:8000/api/instruments

# Get 2D surface slice for Sea Bottom Temp on 2024-01-01
curl "http://localhost:8000/api/model/surface?variable=tob&date=2024-01-01&downsample=4"

# Get real depth profile for float 1902373 with CMEMS comparison
curl "http://localhost:8000/api/instruments/ARGO-1902373-000/profile?compare_variable=tob"
```

---

## 🏆 7. SIH 2026 Presentation Script (For Judges)

When presenting to INCOIS and SIH evaluators, follow this winning 4-point demo:

1. **Point 1 — Problem & Dual-Dataset Fusion**:
   *"Judges, INCOIS requires high-resolution 3D visualization and validation of ocean data. We integrated both the 5.8 GB Copernicus gridded numerical model AND 91 real in-situ Argo profiling floats from the Bay of Bengal & Arabian Sea into a single, unified, browser-native platform."*

2. **Point 2 — 3D WebGL Visualization & Geography**:
   *(Switch to 3D View and tilt camera)*
   *"Our custom Three.js engine extrudes ocean scalar fields into 3D topography. Warm-core eddy domes and coastal upwelling troughs are instantly recognizable. Notice the precise alignment of the Indian Peninsula, Arabian Sea, Bay of Bengal, and Sri Lanka with 3D spatial labels."*

3. **Point 3 — Model Validation (Co-location)**:
   *(Click on an Argo float in Bay of Bengal)*
   *"Here is our core innovation: clicking an Argo float extracts the real 2,000-meter vertical dive profile for Temperature, Salinity, Dissolved Oxygen, and Chlorophyll. Our backend automatically co-locates and compares the CMEMS model prediction against the in-situ float measurement."*

4. **Point 4 — Scientific Analytics & T-S Diagrams**:
   *(Switch to Argo Explorer & Analytics tabs)*
   *"Oceanographers can inspect T-S water-mass identification diagrams, 4-year climate trend slopes, and cross-variable Pearson correlations — all running locally in the browser with zero heavy GIS software required."*

---

## 👥 Team
- **Project**: SAGAR-DRISHTI (सागर-दृष्टि)
- **SIH Problem Statement**: 26067 (INCOIS / Ministry of Earth Sciences)
- **Architecture**: FastAPI · NetCDF4 · xarray · React 18 · Three.js · Leaflet · Recharts
