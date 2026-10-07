---
title: "Troubleshooting: Helm Release Stuck in pending-install"
description: "Structured runbook for Helm releases stuck pending-install / pending-upgrade / pending-rollback after a failed deploy."
type: "troubleshooting"
category: "Platform Engineering"
tags:
  - Helm
  - Kubernetes
  - Troubleshooting
  - Platform Engineering
difficulty: "Intermediate"
published: true
date: "2026-10-03"
---

# Troubleshooting: Helm Release Stuck in pending-install

## Problem

`helm upgrade` or `helm install` hangs or fails and the release stays `pending-install`, `pending-upgrade` or `pending-rollback`. Every subsequent Helm command errors with `another operation (install/upgrade/rollback) is in progress`.

## Symptoms

- `helm list` shows status `pending-install` (or `pending-upgrade`)
- `Error: another operation (install/upgrade/rollback) is in progress`
- No rollout happened, or half the resources exist
- `kubectl get events` shows the install Job/webhook timing out
- Tiller-less Helm v3: lock is the release Secret in the namespace

## How to Diagnose

### 1. Identify the stuck release

```bash
helm list -A | grep -E "pending|failed"
helm status <release> -n <ns>
helm history <release> -n <ns>
```

### 2. Read what Helm last did

```bash
kubectl get secret -n <ns> -l owner=helm,name=<release> -o name
kubectl get secret sh.helm.release.v1.<release>.v<N> -n <ns> -o jsonpath='{.data.release}' | base64 -d | gunzip
```

### 3. Find the resource that blocked it

```bash
kubectl get events -n <ns> --sort-by=.lastTimestamp | tail -20
kubectl get pods -n <ns>                      # failed hook Jobs?
kubectl get validatingwebhookconfigurations,mutatingwebhookconfigurations
```

### 4. Check what already exists (partial install)

```bash
helm get manifest <release> -n <ns> | kubectl apply --dry-run=server -f - 2>&1 | head
```

## Commands

```bash
# quick status sweep
helm list -A --filter 'pending|failed' 2>/dev/null || helm list -A | grep -iE 'pending|failed'

# last events before the hang
kubectl get events -n <ns> --sort-by=.lastTimestamp | tail -20

# hook jobs that never completed
kubectl get jobs -n <ns> -l "app.kubernetes.io/managed-by=Helm"
```

## Possible Causes

| Cause | How to confirm |
| --- | --- |
| Failed install hook (Job never succeeded) | Job in `Failed`/`Running` since the install time |
| Admission webhook rejecting resources | API server errors `denied by ... webhook` |
| CRD not yet registered | `no matches for kind "X"` in events |
| Resource quota exhausted | Events `exceeded quota` |
| Invalid manifest (schema error) | Events show `validation error` |
| Network/registry timeout mid-install | Hook pod stuck `ImagePullBackOff` |
| Concurrent Helm commands on same release | Two runs in CI raced |

## Solution

### Confirm it's safe to roll back

```bash
helm history <release> -n <ns>
# if nothing healthy exists yet:
helm uninstall <release> -n <ns> --wait
helm install <release> <chart> -n <ns> --atomic --timeout 5m
```

### Unlock after fixing the root cause

```bash
# mark the release as failed so Helm lets you proceed
helm rollback <release> 1 -n <ns>       # to previous revision
# or (Helm >= 3.13):
helm rollback <release> 0 -n <ns> --force   # re-install last config
```

For `pending-install` with no useful history:

```bash
kubectl delete secret -n <ns> -l name=<release>,owner=helm
helm uninstall <release> -n <ns> 2>/dev/null || true
helm install <release> <chart> -n <ns> --atomic --timeout 5m
```

### Fix the failing hook

```bash
kubectl logs job/<hook-job> -n <ns> --all-containers
kubectl delete job <hook-job> -n <ns>      # after fixing the cause
helm upgrade <release> <chart> -n <ns> --atomic
```

## Prevention

- Always deploy with `--atomic --timeout 5m` in CI (auto-rollback on failure)
- Make pre-install hooks idempotent and fast; fail early with clear logs
- Ensure CRDs are applied in a separate step before chart install
- One pipeline per release; use a lock in CI (`concurrency: group`)
- Alert on `helm_release_info{status=~"pending.*"}` for > 10 minutes

## Verification

```bash
helm list -n <ns>          # STATUS: deployed
helm history <release> -n <ns> | head -3   # REVISION status deployed
kubectl rollout status deploy/<name> -n <ns>
```

The release reports `deployed` and resources roll out successfully.
