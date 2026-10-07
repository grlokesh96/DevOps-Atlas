---
title: "Prometheus Monitoring Stack"
description: "Compose a Prometheus monitoring stack with exporters, ServiceMonitors, recording rules and sane alerting hygiene."
type: "article"
category: "Monitoring"
tags:
  - Monitoring
  - Prometheus
  - Grafana
  - Observability
difficulty: "Intermediate"
published: true
date: "2026-07-06"
---

# Prometheus Monitoring Stack

Prometheus scrapes time-series metrics on an interval; everything else — dashboards, alerts, SLOs — is built on that simple contract.

## The Stack

| Component | Role |
| --- | --- |
| Prometheus | TSDB + scrape + rule evaluation |
| node-exporter | Host metrics (CPU, disk, net) |
| kube-state-metrics | Object state (deployments, pods) |
| cAdvisor | Container resource usage |
| Alertmanager | Routing, grouping, silencing |
| Grafana | Dashboards and exploration |

## Deploying With the Operator

```yaml
apiVersion: monitoring.coreos.com/v1
kind: Prometheus
metadata:
  name: atlas
spec:
  replicas: 2
  retention: 15d
  serviceMonitorSelectorNilUsesHelmValues: false
  serviceMonitorSelector: {}
  resources:
    requests:
      cpu: 500m
      memory: 1Gi
```

## Scraping Targets

```yaml
apiVersion: monitoring.coreos.com/v1
kind: ServiceMonitor
metadata:
  name: api
spec:
  selector:
    matchLabels:
      app: api
  endpoints:
    - port: http
      path: /metrics
      interval: 15s
```

## Recording Rules

Precompute expensive expressions before alerting on them:

```yaml
groups:
  - name: slo
    rules:
      - record: job:http_requests:rate5m
        expr: sum(rate(http_requests_total[5m])) by (job)
      - record: job:http_requests:availability
        expr: 1 - (sum(rate(http_requests_total{code=~"5.."}[5m])) / sum(rate(http_requests_total[5m])))
```

## Alert Hygiene

Alert on **symptoms users feel**, not on causes:

```yaml
- alert: HighErrorRate
  expr: job:http_requests:availability < 0.99
  for: 10m
  labels:
    severity: page
  annotations:
    summary: "Error budget burning for {{ $labels.job }}"
```

| Bad alert | Good alert |
| --- | --- |
| CPU > 90% | 5xx rate above SLO burn threshold |
| Pod restarted | Request latency p99 above objective |
| Disk 85% full | Forecast: disk full in < 48h |

## Grafana on Top

- Use variables for `cluster`, `namespace`, `job`
- One overview dashboard, then drill-down dashboards
- Embed the alert link in every panel for fast context

## Key Takeaways

Keep retention realistic, record rules before alerting on heavy queries, and page humans only when a user-visible objective is at risk. Everything else is a ticket.
