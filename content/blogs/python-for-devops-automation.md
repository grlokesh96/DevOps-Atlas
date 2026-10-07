---
title: "Python For DevOps Automation"
description: "A pragmatic tour of Python for infrastructure automation — boto3, YAML/JSON handling, subprocess safety and project layout."
type: "blog"
category: "Python"
tags:
  - Python
  - Automation
  - AWS
  - DevOps
difficulty: "Beginner"
published: true
date: "2026-07-14"
---

# Python For DevOps Automation

Bash is fine for ten lines. Past that, Python's standard library and ecosystem save real time — especially around cloud APIs, structured data and error handling.

## When Python Wins

- Wrapping cloud SDKs (`boto3`, `google-cloud`)
- Parsing and transforming YAML/JSON
- Anything with retries, backoff or concurrency
- CLI tools your teammates will actually read

## A Solid Script Skeleton

```python
#!/usr/bin/env python3
"""Stop idle EC2 instances older than 7 days."""
import argparse
import logging
from datetime import datetime, timedelta, timezone

import boto3

logging.basicConfig(level=logging.INFO, format="%(asctime)s %(levelname)s %(message)s")
log = logging.getLogger("idle-stop")

def main() -> None:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--region", default="ap-south-1")
    parser.add_argument("--dry-run", action="store_true")
    args = parser.parse_args()

    ec2 = boto3.client("ec2", region_name=args.region)
    cutoff = datetime.now(timezone.utc) - timedelta(days=7)

    reservations = ec2.describe_instances()["Reservations"]
    for r in reservations:
        for inst in r["Instances"]:
            launched = inst["LaunchTime"]
            if inst["State"]["Name"] == "running" and launched < cutoff:
                log.info("stopping %s (launched %s)", inst["InstanceId"], launched.date())
                if not args.dry_run:
                    ec2.stop_instances(InstanceIds=[inst["InstanceId"]])

if __name__ == "__main__":
    main()
```

## Safe Subprocess Usage

```python
import subprocess

result = subprocess.run(
    ["kubectl", "get", "pods", "-n", "prod"],
    check=True,
    capture_output=True,
    text=True,
    timeout=30,
)
print(result.stdout)
```

> Never `shell=True` with interpolated input. It is the shell-injection door everyone forgets about.

## Structured Config

```python
from pathlib import Path
import yaml

config = yaml.safe_load(Path("config.yaml").read_text())
env = config["environment"]["name"]
```

## Project Layout

```text
atlas-ops/
├── pyproject.toml
├── src/atlas_ops/
│   ├── __init__.py
│   ├── ec2.py
│   └── cli.py
└── tests/
```

Pin tools with `uv` or `pip-tools`, lint with `ruff`, type-check with `mypy`.

## Quick Reference

| Task | Tool |
| --- | --- |
| AWS API | `boto3` |
| YAML/JSON | `yaml`, `json` |
| HTTP | `httpx` |
| CLI | `argparse` or `typer` |
| Lint + format | `ruff` |

## Key Takeaways

Python gives DevOps scripts structure, typing and testability that bash cannot match. Keep scripts small, pin dependencies, run `ruff`, and always support `--dry-run`.
