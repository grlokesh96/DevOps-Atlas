---
title: "Troubleshooting: GitHub Actions Runner Out of Disk"
description: "Structured runbook for ENOSPC failures in GitHub Actions — cleaning and rethinking runner disk usage."
type: "troubleshooting"
category: "CI/CD"
tags:
  - CI/CD
  - GitHub Actions
  - Troubleshooting
  - Docker
difficulty: "Intermediate"
published: true
date: "2026-09-10"
---

# Troubleshooting: GitHub Actions Runner Out of Disk

## Problem

A GitHub Actions job fails with `ENOSPC: no space left on device`, `Docker layer tarball` errors, or `The template is not valid` mid-workflow — the hosted runner ran out of ~14 GB free disk.

## Symptoms

- Step fails with `no space left on device`
- `docker build` dies on a layer write or `failed to export image`
- `actions/cache` restore fails late in the job
- Job worked before, then grew past the disk budget
- Only one heavy job (tests + build + scan) hits it

## How to Diagnose

### 1. Measure in the workflow itself

```yaml
- name: Disk usage
  run: df -h && sudo du -xh --max-depth=1 / 2>/dev/null | sort -rh | head
```

### 2. Check the big known hogs

```bash
sudo du -sh /usr/share/dotnet /usr/local/lib/android /opt/ghc /usr/local/.ghcup 2>/dev/null
docker system df
```

### 3. Confirm which step spikes it

Add `df -h` before/after build, test and image-push steps; correlate the failing step with the drop.

## Commands

```bash
# inside the job
df -h
sudo rm -rf /usr/share/dotnet/* /usr/local/lib/android/* /opt/ghc/* /usr/local/.ghcup/* || true
sudo rm -rf "$AGENT_TOOLSDIRECTORY"/* || true
docker system prune -af --filter "until=24h" || true
df -h   # compare
```

## Possible Causes

| Cause | How to confirm |
| --- | --- |
| Preinstalled SDKs unused by the job | `du` shows GBs in dotnet/android/ghc |
| Docker images/layers accumulating | `docker system df` shows many GBs |
| Cache restore fills workspace | Jump in usage after the `actions/cache` step |
| Test artifacts / coverage dumps | Workspace `du` dominated by `coverage/`, `test-results/` |
| npm/pip/poetry caches kept in workspace | `node_modules` + `.venv` across many packages |

## Solution

### Free space at job start

```yaml
- name: Free disk space
  run: |
    sudo rm -rf /usr/share/dotnet /usr/local/lib/android /opt/ghc /usr/local/.ghcup
    sudo docker system prune -af
    df -h
```

### Cache in the right place

```yaml
- uses: actions/cache@v4
  with:
    path: |
      ~/.npm
      !~/.npm/_logs
    key: npm-${{ hashFiles('**/package-lock.json') }}
```

### Build once, push by digest

```yaml
- docker/build-push-action
  with:
    cache-from: type=gha
    cache-to: type=gha,mode=max
```

Do not re-export the same image in multiple jobs — push to a registry and pull by digest.

### Split the job

```yaml
jobs:
  test:   # no docker build
  image:  # needs: test, does build+push
  scan:   # pulls by digest
```

## Prevention

- Add a `df -h` step in every heavy pipeline's debug mode
- Disable unused toolchains (`.NET`, Android) by default in self-hosted images
- Set container retention and image GC policies on self-hosted runners
- Alert (via job summary) when free disk drops below 2 GB

## Verification

```bash
df -h    # printed by the job; ≥ 3 GB free after cleanup
```

The previously failing step completes and the workflow reaches its last step green.
