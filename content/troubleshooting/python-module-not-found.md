---
title: "Troubleshooting: Python ModuleNotFoundError"
description: "Structured runbook for ModuleNotFoundError / ImportError — interpreter mismatch, virtualenvs and path issues."
type: "troubleshooting"
category: "Python"
tags:
  - Python
  - Troubleshooting
  - Dependencies
  - Debugging
difficulty: "Beginner"
published: true
date: "2026-10-05"
---

# Troubleshooting: Python ModuleNotFoundError

## Problem

A script or service dies with `ModuleNotFoundError: No module named 'requests'` (or any module) even though you "installed" it — the code runs under a different interpreter, environment or path than the one where the package lives.

## Symptoms

- `ModuleNotFoundError: No module named '<pkg>'` at import time
- `python3 script.py` works but `./script.py` (or the opposite) fails
- Works in your terminal, fails in cron/CI/systemd
- IDE green, terminal red (or vice versa)
- `pip install` says `Requirement already satisfied` yet import fails

## How to Diagnose

### 1. Compare the interpreter paths

```bash
which python python3 pip pip3
python3 -c 'import sys; print(sys.executable); print("\n".join(sys.path))'
head -1 $(which <script>)        # shebang of the failing script
```

### 2. See where the package actually is

```bash
pip show requests | grep -E "Name|Version|Location"
python3 -c 'import importlib.util; print(importlib.util.find_spec("requests"))'
```

### 3. Check the environment identity

```bash
echo "VIRTUAL_ENV=$VIRTUAL_ENV"
which python3 && python3 -m pip --version
python3 -m pip list | head -20
```

### 4. Runtime context (cron/CI/container)

```bash
# cron uses a bare environment
crontab -l
# systemd unit
systemctl cat <service> | grep -E "ExecStart|Environment"
# container
docker run --rm <image> which python3
```

## Commands

```bash
# one-shot consistency check
python3 - <<'EOF'
import sys, importlib.util
print("exe :", sys.executable)
print("path:", sys.path)
for m in ["requests", "flask", "yaml"]:
    print(f"{m:10}", "OK" if importlib.util.find_spec(m) else "MISSING")
EOF

# install into the interpreter you actually run
python3 -m pip install requests        # never bare `pip` when ambiguous
```

## Possible Causes

| Sign | Cause |
| --- | --- |
| `pip` ≠ `python3`'s pip | apt `pip` points to another Python (e.g., 3.11 vs 3.12) |
| venv activated in one shell only | `VIRTUAL_ENV` empty in the failing context |
| Shebang `#!/usr/bin/env python` vs installed `python3` | Script runs on the wrong binary |
| Package installed with `--user` for another user | Running as root/service user |
| Wrong working directory → local shadowing | A local `requests.py` or empty dir shadows the package |
| Container image lacks the dependency | `pip install` happened outside the image build layer |

## Solution

### Always use the explicit module form

```bash
python3 -m pip install requests
python3 -m script.py
```

### Align the environment

```bash
python3 -m venv .venv
source .venv/bin/activate
python -m pip install -r requirements.txt
which python && python -m pip --version   # both inside the venv now
```

### Fix the shebang

```bash
#!/usr/bin/env python3
# or fully explicit
#!/opt/venv/bin/python
```

### Container / CI

```dockerfile
RUN python3 -m pip install --no-cache-dir -r requirements.txt
ENTRYPOINT ["python3", "-m", "app"]
```

### Cron / systemd

```bash
# cron
0 * * * * cd /app && /opt/venv/bin/python -m app.scheduler
# systemd
ExecStart=/opt/venv/bin/python -m app.server
```

## Prevention

- Commit `requirements.txt`/`pyproject.toml` and install with `python -m pip`
- One venv per project; never mix system and user installs
- Standardise shebangs and container entrypoints on `python3`
- Add an import smoke test (`python -c "import app"`) to CI

## Verification

```bash
python3 -c 'import requests; print(requests.__version__)'
./script.py        # or python3 -m script.py in the target context (cron, container)
```

Imports succeed under the exact interpreter/context that was failing.
