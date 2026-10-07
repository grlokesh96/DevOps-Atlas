---
title: "Troubleshooting: Pod CrashLoopBackOff"
description: "Structured runbook for Kubernetes pods that start, fail, restart and land in CrashLoopBackOff."
type: "troubleshooting"
category: "Kubernetes"
tags:
  - Kubernetes
  - Troubleshooting
  - Debugging
  - Containers
difficulty: "Intermediate"
published: true
date: "2026-08-14"
---

# Troubleshooting: Pod CrashLoopBackOff

## Problem

A pod repeatedly starts and dies. Status flips between `Running` and `CrashLoopBackOff`, restart count climbs, and traffic never reaches it.

## Symptoms

- `kubectl get pods` shows `CrashLoopBackOff` with an increasing `RESTARTS` count
- `kubectl logs --previous` shows an application error or empty output
- Events show `Back-off restarting failed container`
- Readiness/liveness probes fail right after start
- Deployment rollout is stuck with old pods still serving

## How to Diagnose

### 1. Read the last logs of the crashed container

```bash
kubectl logs <pod> -n <ns> --previous --tail=100
```

### 2. Inspect the container exit code

```bash
kubectl describe pod <pod> -n <ns> | grep -A5 "Last State"
```

| Exit code | Typical meaning |
| --- | --- |
| `0` | Process exited cleanly — probe or `restartPolicy` loop |
| `1` | Application error |
| `2` | Misuse of container command (bad ENTRYPOINT/CMD) |
| `126/127` | Command not executable / not found |
| `137` | `SIGKILL` — OOMKilled or `kubectl delete --force` |
| `143` | `SIGTERM` — graceful shutdown |

### 3. Check resource kills and probes

```bash
kubectl describe pod <pod> -n <ns> | grep -E "OOMKilled|Liveness|Readiness|Failed"
kubectl get pod <pod> -n <ns> -o jsonpath='{.status.containerStatuses[*].lastState}'
```

### 4. Reproduce locally

```bash
docker run --rm -it --entrypoint sh <image>:<tag>   # try the start command manually
```

## Commands

```bash
# full crash loop picture
kubectl logs <pod> -n <ns> --previous --tail=100
kubectl describe pod <pod> -n <ns> | sed -n '/Events/,$p'
kubectl get pod <pod> -n <ns> -o jsonpath='{range .status.containerStatuses[*]}{.name}{" exit="}{.state.terminated.exitCode}{" reason="}{.state.terminated.reason}{"\n"}{end}'

# watch restarts climb
kubectl get pod <pod> -n <ns> -w
```

## Possible Causes

| Cause | How to confirm |
| --- | --- |
| Application crash on boot (bad config/env) | `--previous` logs show stack trace |
| Missing env var or secret | Logs show `KeyError` / `config not found` |
| OOMKilled | `lastState.terminated.reason = OOMKilled`, exit 137 |
| Liveness probe too aggressive | Events show `Liveness probe failed`, restarts shortly after `Ready` |
| Bad ENTRYPOINT/CMD or wrong working dir | Exit 127/126, "command not found" |
| Readiness never passes, then startupProbe gives up | Startup probe failures in events |

## Solution

### Broken config or env

```bash
kubectl set env deploy/<name> CORRECT_VAR=value -n <ns>
kubectl rollout restart deploy/<name> -n <ns>
```

### OOMKilled

```bash
kubectl set resources deploy/<name> --limits=memory=512Mi --requests=memory=256Mi -n <ns>
```

### Probe too aggressive

```yaml
livenessProbe:
  initialDelaySeconds: 15
  periodSeconds: 20
  failureThreshold: 6
```

### Bad image command

Fix the Dockerfile `CMD`/`ENTRYPOINT`, push a new tag, and roll out:

```bash
kubectl set image deploy/<name> app=<repo>:<fixed-tag> -n <ns>
```

## Prevention

- Ship a `/healthz` endpoint before enabling liveness probes
- Set memory requests/limits from measured usage, not defaults
- Fail fast and loudly on missing config at startup
- Use `startupProbe` for slow-booting JVM/mono services
- Scan images for a valid entrypoint in CI

## Verification

```bash
kubectl rollout status deploy/<name> -n <ns>
kubectl get pod -l app=<name> -n <ns>   # RESTARTS stays 0
```

Pods stay `Running` with `READY 1/1` and a restart count of zero.
