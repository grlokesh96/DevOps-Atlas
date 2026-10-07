---
title: "EKS Fargate Cost Notes"
description: "Short post on when EKS Fargate is cheaper than managed node groups — and the gotchas that surprise people."
type: "post"
category: "AWS"
tags:
  - AWS
  - EKS
  - Fargate
  - Cost
difficulty: "Beginner"
published: true
date: "2026-06-28"
---

# EKS Fargate Cost Notes

Fargate removes node management but changes the cost model. Quick notes from comparing bills.

## Pricing Shape

- **Node groups** — pay for the instance 24/7, pack pods densely
- **Fargate** — pay per pod vCPU + memory, rounded up to 256 MB / 0.25 vCPU increments, minimum 20 minutes

## When Fargate Wins

- Spiky or low-duty workloads (cron, staging, webhooks)
- Clusters where instances sit > 40% idle
- Teams without capacity-management skills

## When It Loses

- Dense, steady-state services — bin packing on nodes is cheaper
- GPU or special hardware — not supported
- Pods needing hostNetwork, hostPath, or DaemonSets — not supported

```yaml
apiVersion: v1
kind: Pod
metadata:
  name: batch-job
spec:
  serviceAccountName: batch
  containers:
    - name: worker
      image: 111122223333.dkr.ecr.ap-south-1.amazonaws.com/worker:1.4
      resources:
        requests:
          cpu: "512m"
          memory: "512Mi"
        limits:
          cpu: "1"
          memory: "1Gi"
```

> Requests drive Fargate billing. An oversized `requests` block is a silent 24/7 charge.

## Hybrid Pattern That Works

| Workload | Placement |
| --- | --- |
| Steady APIs | Managed node group (Spot mix) |
| Batch/cron | Fargate profile `batch-*` |
| System add-ons | Node group, pinned |

## Key Takeaways

Fargate is a convenience tax that flips to a saving for spiky workloads. Right-size requests first, then compare a month of real billing.
