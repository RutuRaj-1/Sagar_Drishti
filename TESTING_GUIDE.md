# Testing Guide for Enhanced Maps

## Quick Start

### 1. Start the Application

```bash
# Terminal 1 - Start Backend (if not already running)
cd d:\sagar-drishti\Sagar_Drishti\backend
python -m uvicorn app.main:app --reload --host 0.0.0.0 --port 8000

# Terminal 2 - Start Frontend
cd d:\sagar-drishti\Sagar_Drishti\frontend
npm run dev
```

### 2. Open Browser
Navigate to: `http://localhost:5173` (or the port shown by Vite)

---

## 🗺️ 2D Map Testing Checklist

### Visual Verification:
- [ ] **Satellite Imagery Visible**
  - Ocean appears in deep blue color
  - Land shows green/yellow/brown terrain
  - Natural earth appearance (not black/dark)
  
- [ ] **Labels & Boundaries**
  - Country names visible
  - Ocean labels show: "Arabian Sea" and "Bay of Bengal"
  - State/province boundaries visible
  - Domain label at top: "SAGAR-DRISHTI Domain..."

- [ ] **Domain Boundary (Blue Highlighted Region)**
  - Cyan/turquoise rectangle visible
  - Rectangle has light blue fill (12% opacity)
  - Dashed border visible
  - Covers region: 5°N-23°N, 60°E-97°E
  - **THIS MUST BE VISIBLE - it's the main requirement!**

### Functional Testing:

#### Data Overlay:
1. Select different variables from left panel:
   - [ ] Sea Bottom Temperature (tob)
   - [ ] Sea Bottom Salinity (sob)
   - [ ] Sea Surface Height (zos)
   - [ ] Mixed Layer Depth (mlotst)
2. Verify:
   - [ ] Color overlay appears over ocean region
   - [ ] Colors match the legend at bottom-left
   - [ ] Data visible on satellite imagery
   - [ ] Opacity slider works (left panel)

#### Argo Floats & Gliders:
1. Look for circular markers in the ocean:
   - [ ] Yellow/orange circles = Argo floats
   - [ ] Cyan/blue circles = Gliders
   - [ ] Green circles = BGC floats
2. Click on a marker:
   - [ ] Popup appears with float information
   - [ ] "View Depth Profile" button works
   - [ ] Right panel shows profile chart

#### Current Vectors:
1. Toggle "Show Flow Vectors (u/v currents)" in left panel
2. Verify:
   - [ ] Arrows appear on map
   - [ ] Arrow colors show speed (blue=slow, red=fast)
   - [ ] Arrows point in flow direction
   - [ ] Arrowheads visible

#### Interactions:
- [ ] **Zoom**: Mouse wheel or zoom controls (top-right)
- [ ] **Pan**: Click and drag map
- [ ] **Hover**: Move mouse over ocean to see coordinates (top-left overlay)
- [ ] **Click**: Click ocean to get time-series (right panel updates)

---

## 🌐 3D View Testing Checklist

### Switching to 3D:
Click "🌐 3D WebGL" button at bottom-right of map

### Visual Verification:
- [ ] **Background Color**
  - Sky blue background (not dark/black)
  - Natural atmosphere appearance
  - No "space" theme

- [ ] **Ocean Floor**
  - Deep blue color (like deep ocean)
  - Not black or very dark
  - Grid lines visible in blue tones

- [ ] **Terrain/Data Surface**
  - Colored 3D heightfield visible
  - Colors match selected variable
  - Vertical exaggeration adjustable (left panel)
  - Natural lighting (not harsh)

- [ ] **Geographic Labels**
  - White background labels visible
  - Labels for: Arabian Sea, Bay of Bengal, India, Sri Lanka
  - Compass directions (North, South)
  - Labels float above terrain

### Functional Testing:

#### 3D Controls:
- [ ] **Orbit**: Left-click and drag to rotate
- [ ] **Zoom**: Mouse wheel to zoom in/out
- [ ] **Pan**: Right-click and drag (or two-finger drag)
- [ ] **Auto-rotate**: Damping effect when released

#### 3D Features:

1. **Argo Float Markers**:
   - [ ] Vertical pins with spheres on top visible
   - [ ] Yellow = Argo, Cyan = Gliders, Green = BGC
   - [ ] Click marker to select (shows profile in right panel)
   - [ ] Selected marker has white glow ring

2. **Current Vectors (3D Cones)**:
   - Toggle "Show Flow Vectors" in left panel
   - [ ] 3D arrow cones appear
   - [ ] Colors indicate speed
   - [ ] Point in flow direction
   - [ ] Hover above terrain

3. **Isosurface (Marching Cubes)**:
   - Toggle "3D Marching Cubes Isosurface" in left panel
   - Adjust isovalue slider (e.g., 28°C)
   - [ ] 3D shell/bubble appears
   - [ ] Semi-transparent colored surface
   - [ ] Represents temperature threshold
   - [ ] Rotates with scene

#### Display Settings (Left Panel):
- [ ] **Vertical Exaggeration**: Slider changes terrain height
- [ ] **Layer Opacity**: Slider changes data visibility
- [ ] **Palette**: Dropdown changes colors (Thermal, Viridis, etc.)
- [ ] **Color Scale**: Linear vs Logarithmic

---

## 📊 Other Tabs Testing

### Argo & Gliders Tab:
Click "🔴 Argo & Gliders" in top navigation

- [ ] Left panel shows list of instruments
- [ ] Click instrument to see profile
- [ ] Center shows depth profile charts
- [ ] Right panel shows telemetry summary

### Analytics Tab:
Click "📊 Analytics & Anomalies" in top navigation

- [ ] Statistical dashboard loads
- [ ] Histograms visible
- [ ] Trend indicators work
- [ ] Summary cards show data

---

## 🐛 Common Issues & Solutions

### Issue: Map is all gray or not loading
**Solution**: Check internet connection - tiles load from Esri servers

### Issue: Blue domain rectangle not visible
**Solution**: 
1. Zoom to fit the Indian Ocean region
2. Check if at correct coordinates (5°N-23°N, 60°E-97°E)
3. Verify OceanMap.jsx changes were applied

### Issue: 3D view is still dark/black
**Solution**: 
1. Refresh browser (Ctrl+F5 or Cmd+Shift+R)
2. Clear browser cache
3. Verify Scene3D.jsx changes were applied
4. Check browser console for errors

### Issue: Data overlay not visible
**Solution**:
1. Select a date with data (use date slider)
2. Increase layer opacity slider
3. Check if backend is running and returning data
4. Look in browser console for API errors

### Issue: Labels have wrong colors
**Solution**:
1. Hard refresh browser
2. Check if styles.css changes were applied
3. Inspect element to see if CSS is loading

---

## 🎯 Success Criteria

### ✅ 2D Map Success:
1. Satellite imagery visible (blue oceans, green land)
2. Domain boundary rectangle visible with cyan fill
3. All Argo floats and gliders clickable
4. Data overlay displays on top of satellite imagery
5. Current vectors visible when toggled
6. All labels readable with good contrast

### ✅ 3D View Success:
1. Sky blue background (not dark)
2. Natural lighting and colors
3. Ocean floor is deep blue (not black)
4. Labels have white backgrounds
5. Terrain heightfield visible with data colors
6. All markers (floats/gliders) visible and clickable
7. Isosurface renders when toggled
8. Current vector cones visible

### ✅ UI/UX Success:
1. All controls responsive
2. Tooltips and popups readable
3. Legend visible on both 2D and 3D
4. No visual clashing between UI and map
5. Performance is smooth (no lag)

---

## 📸 Expected Screenshots

### 2D Map View:
- Blue ocean with satellite terrain
- Green/brown Indian subcontinent
- Cyan rectangle boundary visible
- Colorful data overlay
- Argo float markers scattered
- Ocean labels visible

### 3D Globe View:
- Sky blue atmosphere
- Natural earth-toned terrain
- White label backgrounds
- 3D heightfield with colors
- Vertical pin markers
- Deep blue ocean floor

---

## 🔧 Developer Tools

### Browser Console Checks:
```javascript
// Press F12, then Console tab

// Check if Leaflet loaded
console.log(L.version); // Should show: "1.9.4"

// Check if THREE.js loaded
console.log(THREE.REVISION); // Should show: "160"

// Check for errors
// Should see no red error messages
```

### Network Tab:
- Check tile requests to `server.arcgisonline.com`
- Verify tiles loading successfully (Status 200)
- Check API calls to backend (localhost:8000)

---

## 📝 Report Template

### If Issues Found:

**2D Map Issues:**
- [ ] Describe what you see vs. what's expected
- [ ] Screenshot attached?
- [ ] Browser console errors?
- [ ] Network tab showing tile load failures?

**3D View Issues:**
- [ ] Describe visual appearance
- [ ] Screenshot attached?
- [ ] Console errors (especially WebGL errors)?
- [ ] Performance issues (FPS)?

**Data/Functionality Issues:**
- [ ] Which feature not working?
- [ ] Steps to reproduce
- [ ] Expected vs. actual behavior
- [ ] Console errors?

---

## ✨ All Tests Pass?

If all checklist items are ✅, the enhancement is successful!

The maps should now look professional, earthly, and intuitive like Google Earth, while maintaining all scientific data visualization capabilities.

**Key Success Indicator**: The blue highlighted region (Indian Ocean domain) should be **MORE visible** than before with the cyan fill and enhanced border!
