import sys
sys.path.append("e:/proyectos/inversiones/backend")

from routers.scanner import ALL_ASSETS, _scan_single
from services.market_data import preload_scanner_data

print("Starting preload...")
preload_scanner_data(ALL_ASSETS, period="3mo")
print("Preload done.")

results = []
print("Scanning single...")
for i, t in enumerate(ALL_ASSETS):
    print(f"Scanning {t}...")
    res = _scan_single(t)
    if res:
        results.append(res)
print(f"Done! {len(results)} results")
