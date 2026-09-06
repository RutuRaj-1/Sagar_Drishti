# Quick Start: Testing Globe Mode

## 🚀 Start the Application

```bash
# Terminal 1 - Backend (if not already running)
cd d:\sagar-drishti\Sagar_Drishti\backend
python -m uvicorn app.main:app --reload

# Terminal 2 - Frontend
cd d:\sagar-drishti\Sagar_Drishti\frontend
npm run dev
```

## 🌍 Access Globe Mode

1. Open browser: `http://localhost:5173`
2. Click the **"🌍 Globe"** button at bottom-right
3. Wait 3-5 seconds for Cesium to load
4. See realistic Earth with blue oceans!

## ✅ Quick Verification

### You Should See:
- ✅ Blue Earth globe with realistic continents
- ✅ Blue atmospheric glow around planet
- ✅ Yellow/cyan dots (Argo floats & gliders) on ocean
- ✅ Camera starts looking at India region
- ✅ Smooth drag/rotate when you move mouse

### Try These Actions:
1. **Drag** → Earth rotates
2. **Scroll** → Zoom in/out
3. **Click yellow dot** → Profile sidebar opens
4. **Click "🏔️ Regional"** → Switches to old 3D view
5. **Click "🌍 Globe"** → Returns to globe (same marker still selected!)

## 🔧 If Globe Doesn't Load

### Check 1: Internet Connection
Globe streams tiles from Cesium servers - needs internet

### Check 2: Browser Console
Press `F12` → Console tab → Look for errors

### Check 3: Backend Running
Make sure `http://localhost:8000/api/health` returns OK

### Check 4: Cesium Token
If you see "token expired":
1. Go to https://ion.cesium.com/signup
2. Sign up (free)
3. Get your access token
4. Replace token in `frontend/src/components/CesiumGlobeView.jsx` line 22

## 📊 Compare All Three Modes

| Mode | Button | Best For |
|------|--------|----------|
| 🗺️ 2D Map | Bottom-right | Quick overview, data exploration |
| 🌍 Globe | Bottom-right | Global context, Google Earth experience |
| 🏔️ Regional | Bottom-right | Detailed analysis, isosurfaces, terrain |

## 🎯 Success = All Three Work!

✅ **2D Map**: Shows satellite imagery, blue oceans, zoom works  
✅ **Globe Mode**: Shows Earth globe, markers visible, smooth navigation  
✅ **Regional 3D**: Shows terrain with data, same as before (unchanged)

**All three show same Argo floats, same data, use same controls!**

---

## 🐛 Common Issues

### "TypeError: Cannot read properties of undefined"
→ Wait for data to load, or refresh page

### "Failed to load Cesium assets"
→ Run `npm run dev` again (Vite needs to copy Cesium files)

### Markers not visible
→ Zoom in closer, or check backend is returning instruments

### Performance issues
→ Close other tabs, Cesium is GPU-intensive

---

## ✨ Ready for Demo!

Once all three modes work, you have a professional ocean visualization platform with Google Earth-quality globe view! 🎉
