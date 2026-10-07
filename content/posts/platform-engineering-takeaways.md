---
title: "Platform Engineering Takeaways"
description: "Short post: five lessons from building an internal developer platform on top of Kubernetes and GitOps."
type: "post"
category: "Platform Engineering"
tags:
  - Platform Engineering
  - Kubernetes
  - GitOps
  - Developer Experience
difficulty: "Beginner"
published: true
date: "2026-10-01"
---

# Platform Engineering Takeaways

Five lessons from a year of building an internal platform for 40+ engineers.

## 1. Golden Paths Beat Guardrails

Mandates generate friction. A `create-service` template that is genuinely faster than rolling your own wins adoption on its own.

## 2. Self-service Is the Product

If opening a ticket is still required for the common case, you have built a portal, not a platform. Measure time-to-first-deploy for a new service.

## 3. pave the Observability Road

Every template ships with metrics, logs, traces and dashboards pre-wired. Teams that start blind never catch up.

## 4. Break-glass Must Exist

```bash
kubectl --context prod-prod -n payments rollout undo deploy/api
```

Documented, audited, practiced — an escape hatch people trust is what keeps them on the golden path.

## 5. Write It Down

A single `docs/` folder with an architecture decision record per platform choice ends the recurring Slack debates.

> The platform team's KPI is not deployments shipped — it is how rarely anyone needs to talk to the platform team.

Next up: measuring DORA metrics without gamifying them.
