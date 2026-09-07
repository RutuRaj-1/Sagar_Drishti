#!/usr/bin/env python3
"""Quick diagnostic to verify all datasets are working"""
import xarray as xr
import os
import json
from app import config

results = {
    "datasets": {},
    "issues": [],
    "timestamp": "2026-09-07"
}

# Test CMEMS 2D
print("Testing CMEMS 2D Surface...")
if os.path.exists(config.NC_PATH):
    try:
        with xr.open_dataset(config.NC_PATH, engine='netcdf4') as ds:
            results["datasets"]["cmems_2d"] = {
                "exists": True,
                "time_start": str(ds.time.values[0])[:10],
                "time_end": str(ds.time.values[-1])[:10],
                "timesteps": int(len(ds.time)),
                "variables": list(ds.data_vars.keys()),
                "status": "OK"
            }
            print(f"  [OK] Found: {len(ds.time)} timesteps, {len(ds.data_vars)} variables")
    except Exception as e:
        results["datasets"]["cmems_2d"] = {"exists": True, "status": f"ERROR: {str(e)}"}
        results["issues"].append(f"CMEMS 2D: {str(e)}")
        print(f"  [FAIL] Error: {e}")
else:
    results["datasets"]["cmems_2d"] = {"exists": False, "status": "FILE NOT FOUND"}
    results["issues"].append(f"CMEMS 2D file not found: {config.NC_PATH}")
    print(f"  [FAIL] File not found")

# Test CMEMS 4D
print("\nTesting CMEMS 4D Volumetric...")
if os.path.exists(config.REAL_4D_NC_PATH):
    try:
        with xr.open_dataset(config.REAL_4D_NC_PATH, engine='netcdf4') as ds4d:
            depth_coord = None
            for coord in ['depth', 'lev', 'z', 'depth_level']:
                if coord in ds4d.coords:
                    depth_coord = coord
                    break
            
            results["datasets"]["cmems_4d"] = {
                "exists": True,
                "time_start": str(ds4d.time.values[0])[:10],
                "time_end": str(ds4d.time.values[-1])[:10],
                "timesteps": int(len(ds4d.time)),
                "depth_levels": int(len(ds4d[depth_coord])) if depth_coord else 0,
                "depth_coordinate": depth_coord,
                "variables": list(ds4d.data_vars.keys()),
                "status": "OK"
            }
            print(f"  [OK] Found: {len(ds4d.time)} timesteps, {len(ds4d[depth_coord]) if depth_coord else 0} depth levels")
    except Exception as e:
        results["datasets"]["cmems_4d"] = {"exists": True, "status": f"ERROR: {str(e)}"}
        results["issues"].append(f"CMEMS 4D: {str(e)}")
        print(f"  [FAIL] Error: {e}")
else:
    results["datasets"]["cmems_4d"] = {"exists": False, "status": "FILE NOT FOUND"}
    results["issues"].append(f"CMEMS 4D file not found: {config.REAL_4D_NC_PATH}")
    print(f"  [FAIL] File not found")

# Test Argo
print("\nTesting Argo Profiles...")
if os.path.exists(config.ARGO_NC_DIR):
    files = [f for f in os.listdir(config.ARGO_NC_DIR) if f.endswith('.nc')]
    results["datasets"]["argo"] = {
        "exists": True,
        "profile_files": len(files),
        "directory": config.ARGO_NC_DIR,
        "status": "OK" if files else "WARNING: No files"
    }
    print(f"  [OK] Found {len(files)} Argo profile files")
else:
    results["datasets"]["argo"] = {"exists": False, "status": "DIRECTORY NOT FOUND"}
    results["issues"].append(f"Argo directory not found: {config.ARGO_NC_DIR}")
    print(f"  [FAIL] Directory not found")

print("\n" + "="*60)
print("SUMMARY:")
print("="*60)
for dataset, info in results["datasets"].items():
    status = info.get("status", "UNKNOWN")
    print(f"{dataset.upper():20} -> {status}")

if results["issues"]:
    print("\n⚠️  ISSUES FOUND:")
    for issue in results["issues"]:
        print(f"  - {issue}")
else:
    print("\n✅ All datasets OK")

print("\nJSON Output:")
print(json.dumps(results, indent=2))
