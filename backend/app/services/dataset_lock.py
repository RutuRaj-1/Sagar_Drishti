"""
dataset_lock.py
---------------
Global mutex lock to serialize all NetCDF4 and HDF5 C-library operations.
The underlying C libraries for NetCDF-4 / HDF5 are NOT thread-safe on Windows.
Concurrent access across FastAPI threadpools or background threads causes
low-level access violations (0xC0000005) which crash the worker process.
Wrapping all file access and dataset slicing in NETCDF_LOCK guarantees 100%
thread safety and stability in production.
"""
import threading

NETCDF_LOCK = threading.RLock()
