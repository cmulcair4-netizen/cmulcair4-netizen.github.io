#!/usr/bin/env bash
set -euo pipefail
test -f icons/icon-192.png
test -f icons/icon-512.png
python3 - <<'PY'
import json
with open("manifest.webmanifest", encoding="utf-8") as f:
    m=json.load(f)
for icon in m["icons"]:
    assert icon["src"] in ("./icons/icon-192.png","./icons/icon-512.png")
print("FlipForge PWA assets verified.")
PY
