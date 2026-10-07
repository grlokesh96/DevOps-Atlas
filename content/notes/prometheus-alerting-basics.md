---
title: "Prometheus Alerting Basics"
description: "Short reference on Prometheus alert rules, severity routing, silences and multi-window burn rates."
type: "note"
category: "Monitoring"
tags:
  - Monitoring
  - Prometheus
  - Alerting
  - SLO
difficulty: "Intermediate"
published: true
date: "2026-08-21"
---

# Prometheus Alerting Basics

Quick reference for writing alerts that page the right person for the right reason.

## Rule Anatomy

```yaml
groups:
  - name: availability
    rules:
      - alert: ApiDown
        expr: up{job="api"} == 0
        for: 2m
        labels:
          severity: page
        annotations:
          summary: "api target down on {{ $labels.instance }}"
          runbook_url: "https://runbooks.example.com/api-down"
```

- `expr` — condition to evaluate
- `for` — how long it must stay true before firing (avoid flapping)
- `labels` — routing input (`severity`, `team`)
- `annotations` — human text; always link a runbook

## Severity Model

| Severity | Meaning | Route |
| --- | --- | --- |
| `page` | User-visible impact now | Pager |
| `ticket` | Degraded, fix this sprint | Issue tracker |
| `info` | Awareness only | Chat channel |

## Multi-window Error Budget Burn

```yaml
- alert: SLOBurnFast
  expr: |
    (
      job:http_requests:availability{job="api"} < 0.99
    and
      job:http_requests:rate5m{job="api"} > 0
    )
  for: 2m
  labels:
    severity: page
```

Fast burn (short window) pages; slow burn (long window) opens a ticket.

## Alertmanager Routing

```yaml
route:
  receiver: slack-default
  group_by: [alertname, cluster]
  routes:
    - matchers: [severity="page"]
      receiver: pagerduty
      continue: false
```

## Maintenance Commands

```bash
# silence noisy target during deploy
amtool silence add alertname=ApiDown instance="10.0.1.10:9100" \
  --duration=30m --reason="planned deploy"

amtool silence list --author=me
```

## Hygiene Checklist

- [ ] Every alert has a runbook link
- [ ] No alert fires without human-visible impact or a forecast
- [ ] `for` durations set to avoid single-scrape blips
- [ ] Weekly review of permanently firing alerts

## Key Takeaways

Alerts are a product for on-call engineers: severity routing, short summaries and runbooks matter more than clever expressions.
