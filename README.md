# OceanScope 3D — SIH Problem Statement #26067 Prototype

**3D Ocean Data Visualization System** for INCOIS — a browser-native, WebGL-based
platform that co-visualizes ocean model output (temperature, salinity, currents,
chlorophyll) with real Argo float / Glider observations, built to the tech
stack and requirements set out in the accompanying Synopsis / PRD / SRS
documentation package.

This is a **complete, runnable full-stack prototype**:

```
sih26067-prototype/
├── backend/            FastAPI + xarray REST API (Python)
│   ├── app/
│   │   ├── main.py             FastAPI app + routers
│   │   ├── config.py
│   │   ├── schemas.py          Pydantic response models
│   │   ├── routers/            /api/variables, /api/model/*, /api/instruments/*
│   │   └── services/           netcdf_service.py, instrument_service.py
│   ├── data/
│   │   ├── generate_sample_data.py   <-- generates the sample dataset (run first)
│   │   ├── ocean_model_sample.nc     (generated)
│   │   ├── argo_floats_sample.json   (generated)
│   │   └── glider_tracks_sample.json (generated)
│   └── requirements.txt
├── frontend/            React + Three.js + Recharts (Vite)
│   └── src/
│       ├── App.jsx
│       ├── api.js
│       ├── components/  Scene3D.jsx, ControlPanel.jsx, ColorbarEditor.jsx, ProfileChart.jsx
│       └── utils/colormap.js
└── dataset_guide/DATASET_GUIDE.md   <-- how to swap in REAL INCOIS/Argo/Glider data
```

## 1. Quick Start

### Backend (Python 3.10+)

```bash
cd backend
python3 -m venv venv && source venv/bin/activate      # optional but recommended
pip install -r requirements.txt

# Generate the sample dataset (NetCDF + Argo/Glider JSON) — only needed once,
# or whenever you want to regenerate it:
python data/generate_sample_data.py

# Run the API
uvicorn app.main:app --reload --port 8000
```

Verify it's up: open **http://localhost:8000/docs** (interactive Swagger UI)
or **http://localhost:8000/api/health**.

### Frontend (Node.js 18+)

```bash
cd frontend
npm install
npm run dev
```

Open **http://localhost:5173**. The Vite dev server proxies `/api/*` calls to
`http://localhost:8000` (see `vite.config.js`), so just make sure the backend
is running first.

### Production build

```bash
cd frontend
npm run build      # outputs static files to frontend/dist/
npm run preview    # serve the production build locally on :4173
```

## 2. What You Get Out of the Box

- **3D volumetric ocean rendering** of temperature / salinity / u-current /
  v-current / chlorophyll across 8 depth levels (0–1000 m), 5 daily time
  steps, over a Bay-of-Bengal + Arabian Sea sample domain (5°N–22°N, 68°E–95°E).
- **Depth-slice slider** — highlights the active depth layer in the 3D scene
  while ghosting the rest of the water column (true volumetric feel).
- **Time-step animation** — play/pause button steps through the 5 sample days.
- **Vertical exaggeration & layer opacity controls**.
- **Customizable colorbar** — 4 palettes (thermal/haline/chlorophyll/velocity),
  editable min/max range, linear/log scale.
- **Argo float + Glider markers** in the 3D scene and a side list — click
  either to open a **depth-vs-variable profile chart** (Recharts) with a
  **model-vs-observation comparison line**, implementing the "Instrument
  Profile Matching" algorithm from SRS §3.6.
- **REST API** matching the endpoints specified in SRS §3.4:
  `/api/variables`, `/api/model/slice`, `/api/model/volume`,
  `/api/instruments`, `/api/instruments/{id}/profile`.

## 3. Swapping in Real Data

See **`dataset_guide/DATASET_GUIDE.md`** for:
- Free, publicly downloadable ocean model + Argo/Glider datasets you can use
  right now for a stronger demo (NOAA OISST, Copernicus Marine, Argo GDAC, IOOS Glider DAC).
- Exactly which file to replace and which config value to change — **no other
  code changes are required**, since the ingestion layer (`netcdf_service.py`
  / `instrument_service.py`) is schema-driven per the SRS's "Extensible
  Design" requirement (FR-ING-3).

## 4. Presentation Tips (for the SIH judging round)

1. Open with the **live demo**, not slides — start both servers, load
   `localhost:5173`, and rotate/zoom the 3D scene first thing.
2. Show the **depth-slice slider** moving through the thermocline (drop from
   ~28°C at surface to ~17°C at 1000 m) — it's visually dramatic and grounded
   in real ocean physics.
3. Click an **Argo marker** and show the model-vs-observation dashed
   comparison line — this is the core "gap" the problem statement calls out
   (no existing tool co-visualizes both), so highlight it explicitly.
4. Mention the **extensibility story**: adding a new variable or sensor is a
   config change, not a rewrite (FR-ING-3) — judges care about this because
   it directly answers the PS's "Inability to ingest new observational data
   streams... without significant re-engineering" gap.
5. If you have time, swap in one real Argo NetCDF profile (see dataset guide)
   live during the demo to prove the ingestion pipeline isn't just synthetic.

## 5. Notes & Known Limitations (be upfront with judges)

- The bundled dataset is **synthetic but schema-realistic** (see
  `backend/data/generate_sample_data.py` for exactly how it's generated) —
  real datasets are large/restricted, so this keeps the repo self-contained
  and instantly runnable. The dataset guide shows how to go live.
- Rendering uses colored point-cloud "sheets" per depth layer rather than
  full ray-marched isosurfaces — chosen deliberately for demo robustness on
  judges' laptops (30+ FPS target per NFR §3.3.1). Isosurface extraction is
  flagged as a Could-Have in the PRD.
- CORS is wide open (`allow_origins=["*"]`) for hackathon convenience —
  tighten this before any real deployment (see SRS §3.3.2).
