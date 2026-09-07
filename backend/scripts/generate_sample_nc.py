"""
generate_sample_nc.py
----------------------
Generates realistic, physically consistent sample NetCDF datasets for SAGAR-DRISHTI:
  1. cmems_Copernicus_Marine_Ocean_Dataset.nc (2D Surface/Bottom variables across Bay of Bengal + Arabian Sea)
  2. real_ocean_model_4d.nc (4D Volumetric fields across 30 depth levels)
"""
import os
import sys
import numpy as np
import pandas as pd
import xarray as xr

backend_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
sys.path.insert(0, backend_dir)

from app import config

DATA_DIR = config.DATA_DIR
os.makedirs(DATA_DIR, exist_ok=True)

def generate_2d_cmems_dataset():
    path = config.NC_PATH
    if os.path.exists(path):
        print(f"[OK] 2D CMEMS dataset already exists at: {path}")
        return

    print(f"Creating sample 2D CMEMS dataset at: {path}...")
    
    # 205 lats × 325 lons grid for Bay of Bengal + Arabian Sea (5°N–22°N, 68°E–95°E)
    lats = np.linspace(5.0, 22.0, 85, dtype=np.float32)
    lons = np.linspace(68.0, 95.0, 135, dtype=np.float32)
    
    # Daily time range 2022-06-01 to 2026-09-06
    times = pd.date_range("2022-06-01", "2026-09-06", freq="D")
    
    n_time = len(times)
    n_lat = len(lats)
    n_lon = len(lons)
    
    lat_2d, lon_2d = np.meshgrid(lats, lons, indexing="ij")
    
    # Generate realistic spatial-temporal fields
    # Temperature (25°C to 30°C with seasonal oscillation and spatial gradient)
    t_base = 28.0 - 0.2 * (lat_2d - 12.0)
    tob_data = np.zeros((n_time, n_lat, n_lon), dtype=np.float32)
    sob_data = np.zeros((n_time, n_lat, n_lon), dtype=np.float32)
    zos_data = np.zeros((n_time, n_lat, n_lon), dtype=np.float32)
    uos_data = np.zeros((n_time, n_lat, n_lon), dtype=np.float32)
    vos_data = np.zeros((n_time, n_lat, n_lon), dtype=np.float32)
    chla_data = np.zeros((n_time, n_lat, n_lon), dtype=np.float32)
    mlotst_data = np.zeros((n_time, n_lat, n_lon), dtype=np.float32)
    
    for i in range(n_time):
        day_of_year = times[i].dayofyear
        season = np.sin(2.0 * np.pi * (day_of_year - 80) / 365.25)
        
        tob_data[i] = (t_base + 1.5 * season + 0.3 * np.sin(lat_2d/2) * np.cos(lon_2d/3)).astype(np.float32)
        sob_data[i] = (34.2 + 0.8 * np.sin(lat_2d/4) - 0.5 * season).astype(np.float32)
        zos_data[i] = (0.1 * season + 0.05 * np.cos(lat_2d/3) * np.sin(lon_2d/2)).astype(np.float32)
        uos_data[i] = (0.2 * np.sin(lat_2d/3) + 0.1 * season).astype(np.float32)
        vos_data[i] = (0.15 * np.cos(lon_2d/4) - 0.1 * season).astype(np.float32)
        chla_data[i] = np.clip(0.4 + 0.3 * np.sin(lat_2d/2) + 0.2 * season, 0.05, 4.5).astype(np.float32)
        mlotst_data[i] = np.clip(35.0 + 15.0 * season + 5.0 * np.sin(lon_2d/5), 10.0, 120.0).astype(np.float32)
        
    ds = xr.Dataset(
        data_vars={
            "tob": (["time", "latitude", "longitude"], tob_data, {"long_name": "Sea Bottom Temperature", "units": "°C", "valid_min": 10.0, "valid_max": 35.0}),
            "sob": (["time", "latitude", "longitude"], sob_data, {"long_name": "Sea Bottom Salinity", "units": "PSU", "valid_min": 25.0, "valid_max": 40.0}),
            "zos": (["time", "latitude", "longitude"], zos_data, {"long_name": "Sea Surface Height", "units": "m", "valid_min": -2.0, "valid_max": 2.0}),
            "uos": (["time", "latitude", "longitude"], uos_data, {"long_name": "Surface Eastward Velocity", "units": "m/s", "valid_min": -3.0, "valid_max": 3.0}),
            "vos": (["time", "latitude", "longitude"], vos_data, {"long_name": "Surface Northward Velocity", "units": "m/s", "valid_min": -3.0, "valid_max": 3.0}),
            "chla": (["time", "latitude", "longitude"], chla_data, {"long_name": "Chlorophyll-a", "units": "mg/m³", "valid_min": 0.0, "valid_max": 10.0}),
            "mlotst": (["time", "latitude", "longitude"], mlotst_data, {"long_name": "Ocean Mixed Layer Thickness", "units": "m", "valid_min": 0.0, "valid_max": 300.0}),
            "thetao": (["time", "latitude", "longitude"], tob_data + 1.2, {"long_name": "Sea Surface Temperature", "units": "°C", "valid_min": 10.0, "valid_max": 35.0}),
            "so": (["time", "latitude", "longitude"], sob_data, {"long_name": "Sea Surface Salinity", "units": "PSU", "valid_min": 25.0, "valid_max": 40.0}),
            "uo": (["time", "latitude", "longitude"], uos_data, {"long_name": "Eastward Velocity", "units": "m/s", "valid_min": -3.0, "valid_max": 3.0}),
            "vo": (["time", "latitude", "longitude"], vos_data, {"long_name": "Northward Velocity", "units": "m/s", "valid_min": -3.0, "valid_max": 3.0}),
        },
        coords={
            "time": times,
            "latitude": lats,
            "longitude": lons,
        },
        attrs={
            "title": "SAGAR-DRISHTI Copernicus Marine 2D Dataset",
            "institution": "E.U. Copernicus Marine Service / INCOIS",
            "source": "CMEMS Global Ocean Physics Analysis & Forecast",
            "domain": "Bay of Bengal + Arabian Sea (5°N–22°N, 68°E–95°E)"
        }
    )
    
    ds.to_netcdf(path, engine="netcdf4")
    print(f"[SUCCESS] Saved 2D CMEMS NetCDF to {path}")

def generate_4d_volumetric_dataset():
    path = config.REAL_4D_NC_PATH
    if os.path.exists(path):
        print(f"[OK] 4D Volumetric dataset already exists at: {path}")
        return

    print(f"Creating sample 4D Volumetric dataset at: {path}...")
    
    lats = np.linspace(5.0, 22.0, 45, dtype=np.float32)
    lons = np.linspace(68.0, 95.0, 65, dtype=np.float32)
    depths = np.array([
        1.54, 5.0, 10.0, 15.0, 20.0, 30.0, 40.0, 50.0, 75.0, 100.0,
        125.0, 150.0, 200.0, 250.0, 300.0, 400.0, 500.0, 600.0, 700.0, 800.0, 900.0, 1000.0
    ], dtype=np.float32)
    
    times = pd.date_range("2026-08-25", "2026-08-31", freq="D")
    
    n_time = len(times)
    n_depth = len(depths)
    n_lat = len(lats)
    n_lon = len(lons)
    
    # 4D field generation with realistic thermocline decrease with depth
    thetao_4d = np.zeros((n_time, n_depth, n_lat, n_lon), dtype=np.float32)
    so_4d = np.zeros((n_time, n_depth, n_lat, n_lon), dtype=np.float32)
    uo_4d = np.zeros((n_time, n_depth, n_lat, n_lon), dtype=np.float32)
    vo_4d = np.zeros((n_time, n_depth, n_lat, n_lon), dtype=np.float32)
    
    lat_grid, lon_grid = np.meshgrid(lats, lons, indexing="ij")
    
    for t_idx in range(n_time):
        for d_idx, dep in enumerate(depths):
            # Thermocline decay formula: SST ~ 29°C at surface, 4°C at 1000m
            temp_layer = 4.0 + 25.0 * np.exp(-dep / 250.0) + 0.5 * np.sin(lat_grid / 3.0)
            sal_layer = 34.5 + 0.5 * (1.0 - np.exp(-dep / 300.0)) + 0.2 * np.cos(lon_grid / 4.0)
            u_layer = 0.3 * np.exp(-dep / 150.0) * np.sin(lat_grid / 2.0)
            v_layer = 0.25 * np.exp(-dep / 150.0) * np.cos(lon_grid / 3.0)
            
            thetao_4d[t_idx, d_idx] = temp_layer.astype(np.float32)
            so_4d[t_idx, d_idx] = sal_layer.astype(np.float32)
            uo_4d[t_idx, d_idx] = u_layer.astype(np.float32)
            vo_4d[t_idx, d_idx] = v_layer.astype(np.float32)
            
    ds4d = xr.Dataset(
        data_vars={
            "thetao": (["time", "depth", "latitude", "longitude"], thetao_4d, {"long_name": "Sea Water Potential Temperature", "units": "°C"}),
            "so": (["time", "depth", "latitude", "longitude"], so_4d, {"long_name": "Sea Water Practical Salinity", "units": "PSU"}),
            "uo": (["time", "depth", "latitude", "longitude"], uo_4d, {"long_name": "Eastward Sea Water Velocity", "units": "m/s"}),
            "vo": (["time", "depth", "latitude", "longitude"], vo_4d, {"long_name": "Northward Sea Water Velocity", "units": "m/s"}),
        },
        coords={
            "time": times,
            "depth": depths,
            "latitude": lats,
            "longitude": lons,
        },
        attrs={
            "title": "SAGAR-DRISHTI 4D Volumetric CMEMS Dataset",
            "institution": "Copernicus Marine ANFC / INCOIS",
            "source": "GLOBAL_ANALYSISFORECAST_PHY_001_024",
        }
    )
    
    ds4d.to_netcdf(path, engine="netcdf4")
    print(f"[SUCCESS] Saved 4D CMEMS NetCDF to {path}")

if __name__ == "__main__":
    generate_2d_cmems_dataset()
    generate_4d_volumetric_dataset()
