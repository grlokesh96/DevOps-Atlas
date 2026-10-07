---
title: "Troubleshooting: Pod Stuck in Pending"
description: "Structured runbook for diagnosing Kubernetes pods that never leave Pending state."
type: "troubleshooting"
category: "Kubernetes"
tags:
  - Kubernetes
  - Troubleshooting
  - Debugging
  - Scheduling
difficulty: "Intermediate"
published: true
date: "2026-08-08"
---

# Troubleshooting: Pod Stuck in Pending

## Problem

A pod stays `Pending` for minutes or hours. `kubectl get pods` shows `0/1`, no restarts, and the container never starts.

## Symptoms

- `kubectl get pod <pod> -n <ns>` shows status `Pending` with `0/1` ready
- `kubectl describe pod` events end with scheduling messages such as `Insufficient cpu` or `0/3 nodes are available`
- No container logs exist (`kubectl logs` returns `NotFound` or empty)
- The ReplicaSet or Deployment never reaches its desired ready count
- Related PVC may also show `Pending`

## How to Diagnose

### 1. Read the scheduler events

```bash
kubectl describe pod <pod> -n <ns> | sed -n '/Events/,$p'
```

| Message | Meaning |
| --- | --- |
| `Insufficient cpu` | No node has free CPU after requests |
| `Insufficient memory` | Same, memory |
| `didn't match Pod's node affinity/selector` | Placement rules too strict |
| `0/3 nodes are available: 3 No nodes match taints` | Taints without tolerations |
| `volume nodeaffinity conflict` | PV only attachable to certain nodes |

### 2. Compare requests against capacity

```bash
kubectl describe node <node> | grep -A6 "Allocated resources"
kubectl get pods -A -o custom-columns=\
'NS:.metadata.namespace,POD:.metadata.name,CPU-REQ:.spec.containers[*].resources.requests.cpu'
```

### 3. Check taints, labels and affinity

```bash
kubectl get nodes -o custom-columns=NAME:.metadata.name,TAINTS:.spec.taints
kubectl describe node <node> | grep -A5 Taints
kubectl get pod <pod> -o yaml | grep -A10 -E "nodeSelector|affinity"
```

### 4. PVCs and zones

```bash
kubectl get pvc -n <ns>
kubectl describe pvc <name> -n <ns>
```

A `Pending` PVC (for example a `volumezone` conflict) keeps its pod `Pending` too.

## Commands

```bash
# where is it stuck, in one shot
kubectl get pod <pod> -n <ns> -o wide
kubectl describe pod <pod> -n <ns> | tail -20

# capacity vs requests cluster-wide
kubectl top nodes
kubectl describe nodes | grep -E "Name:|Allocated resources" -A4

# watch until scheduled
kubectl get pod <pod> -n <ns> --watch
```

## Possible Causes

| Cause | How to confirm |
| --- | --- |
| Insufficient CPU/memory requests | Scheduler event says `Insufficient cpu/memory` |
| Node taints without toleration | Events mention taints; node has `TAINTS` |
| Node selector / affinity too strict | No node matches the labels in the pod spec |
| PVC Pending or zone mismatch | `kubectl get pvc` shows `Pending` |
| ResourceQuota exhausted | `kubectl describe resourcequota -n <ns>` shows `Used >= Hard` |
| Too many pods per node | Scheduler event `didn't exceed pod's node affinity` / `MaxPod` |

## Solution

### Capacity shortage

```bash
# short term: scale the node group
kubectl scale nodegroup ...        # or via eksctl/terraform

# long term: reduce oversized requests
kubectl set resources deploy api --requests=cpu=250m,memory=256Mi
```

### Taint without toleration

```yaml
tolerations:
  - key: "dedicated"
    operator: "Equal"
    value: "batch"
    effect: "NoSchedule"
```

### Topology spread too strict

Relax `topologySpreadConstraints` `maxSkew`, or add more zones/AZs.

### PVC pending

```bash
kubectl describe pvc <name> -n <ns>
# events showing WaitForFirstConsumer → node without matching AZ
```

Fix the StorageClass `volumeBindingMode` or delete/recreate the PVC on a valid node.

## Prevention

- Set `requests` from real usage metrics, not guesses
- Use `topologySpreadConstraints` instead of hard anti-affinity everywhere
- Alert on `kube_pod_status_unscheduled` > 5 minutes
- Keep 15–20% allocatable headroom per node pool
- Pair `WaitForFirstConsumer` StorageClasses with spread across AZs

## Verification

```bash
kubectl get pod <pod> -n <ns> --watch
kubectl describe pod <pod> -n <ns> | tail -5
```

The pod moves to `Running` and events show `Successfully assigned` with no warnings.
