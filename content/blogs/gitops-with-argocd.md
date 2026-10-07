---
title: "GitOps With Argo CD"
description: "How we moved deployments to GitOps with Argo CD — repo layout, app-of-apps, sync waves and drift handling."
type: "blog"
category: "Platform Engineering"
tags:
  - ArgoCD
  - GitOps
  - Kubernetes
  - Platform Engineering
  - CI/CD
difficulty: "Intermediate"
published: true
date: "2026-09-30"
---

# GitOps With Argo CD

Our CI used to push manifests straight into clusters. It worked until a well-meaning `kubectl apply` overwrote what the pipeline had shipped. Argo CD fixed the drift problem by making **git the only write path**.

## What Changed

| Before (push) | After (GitOps pull) |
| --- | --- |
| CI holds cluster credentials | Cluster holds read-only git access |
| Drift discovered during incidents | Drift visible in the UI constantly |
| Rollback = re-run pipeline | Rollback = `git revert` |
| Anyone with kubectl can change prod | Changes require a reviewed PR |

## Repository Layout

```text
gitops/
├── apps/
│   ├── base/
│   └── overlays/
│       ├── dev/
│       └── prod/
├── infrastructure/
│   └── cluster/
└── argocd/
    ├── applications/
    └── app-of-apps.yaml
```

## App of Apps

One root Application instantiates everything else:

```yaml
apiVersion: argoproj.io/v1alpha1
kind: Application
metadata:
  name: root
  namespace: argocd
spec:
  project: default
  source:
    repoURL: https://github.com/grlokesh96/gitops.git
    targetRevision: main
    path: argocd/applications
  destination:
    server: https://kubernetes.default.svc
  syncPolicy:
    automated:
      prune: true
      selfHeal: true
    syncOptions:
      - CreateNamespace=true
```

`selfHeal: true` means manual kubectl edits get reverted within minutes — drift becomes visible instead of hidden.

## Sync Waves

Order matters: CRDs and operators first, then namespaces, then workloads.

```yaml
metadata:
  annotations:
    argocd.argoproj.io/sync-wave: "1"
```

Negative waves run earlier. Keep waves between -5 and 5; if you need more, split apps.

## Promotion Flow

1. Merge PR → Argo CD syncs **dev** automatically
2. Smoke tests run in dev
3. PR to `overlays/prod` → **prod** syncs on merge
4. Release evidence lives in git history

## What We Would Do Differently

- Start with **fewer** applications, not one per Helm chart
- Invest in AppSet generators early if you have many clusters
- Do not fight Helm and Kustomize in the same app path

## Key Takeaways

GitOps is not a tool purchase — it is a policy: **if it is not in git, it does not exist**. Argo CD just makes that policy enforceable and observable.
