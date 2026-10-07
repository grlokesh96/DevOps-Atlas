---
title: "Troubleshooting: Prometheus Target Down"
description: "Structured runbook for scrape failures — Targets page down, up == 0, and metrics gaps in Prometheus."
type: "troubleshooting"
category: "Monitoring"
tags:
  - Monitoring
  - Prometheus
  - Troubleshooting
  - Observability
difficulty: "Intermediate"
published: true
date: "2026-10-01"
---

# Troubleshooting: Prometheus Target Down

## Problem

Prometheus shows targets as `DOWN`, `up{job="..."} == 0`, and dashboards have gaps. Alert rules fire for `PrometheusTargetScrapePoolNotAlerting` / missing series.

## Symptoms

- Targets page (or `/api/v1/targets`) shows `health: down`
- `up == 0` or the `up` series disappears entirely
- Grafana panels show "No data" for the affected job
- `scrape_duration_seconds` near timeout
- Relabelled away targets — active target count lower than configured

## How to Diagnose

### 1. Query the target state

```promql
up == 0
```

```bash
curl -s 'http://prometheus:9090/api/v1/targets?state=active' | python3 -m json.tool | head -60
```

### 2. Read the scrape error

```bash
curl -s 'http://prometheus:9090/api/v1/targets?state=active' | \
  python3 -c 'import json,sys; [print(t["scrapePool"], t["lastError"]) for t in json.load(sys.stdin)["data"]["activeTargets"] if t["health"]!="up"]'
```

Typical: `connection refused`, `context deadline exceeded`, `401 Unauthorized`, `no such host`.

### 3. Test the scrape endpoint from Prometheus itself

```bash
# inside the prometheus container
wget -qO- http://target-ns:9100/metrics | head -5
# or
kubectl run tmp --rm -it --image=curlimages/curl -n monitoring -- \
  curl -sv http://target:9100/metrics -o /dev/null
```

### 4. Verify config and relabeling

```bash
promtool check config prometheus.yml
promtool config convert prometheus.yml >/dev/null && echo syntax-ok
kubectl get prometheus -n monitoring -o yaml | grep -A10 scrape
```

## Commands

```bash
# per-job health summary
curl -s 'localhost:9090/api/v1/query?query=count by (job) (up==0)' | python3 -m json.tool

# is it DNS, TCP, or auth?
nslookup <service>
nc -vz <service> 9100
curl -sv http://<service>:9100/metrics -o /dev/null

# reload after config fix
curl -X POST http://localhost:9090/-/reload
```

## Possible Causes

| Last error | Cause |
| --- | --- |
| `connection refused` | App/metrics port down, pod not running, wrong port |
| `context deadline exceeded` | Slow endpoint, network policy drop, huge metric payload |
| `no such host` | DNS broken or stale Service name |
| `401/403` | scrape TLS/metrics auth credentials missing |
| `received unsupported version` | Endpoint is not Prometheus format (e.g., plain web page) |
| Target absent entirely | Relabel rules dropping the pod labels |
| `i/o timeout` | NetworkPolicy/SG blocks Prometheus → target |

## Solution

### Endpoint down

```bash
kubectl get pods -n <ns> -l app=<name>          # restart/fix readiness
kubectl port-forward deploy/<name> 9100:9100 -n <ns>
```

### Network policy / firewall

```yaml
# allow prometheus to scrape
ingress:
  - from:
      - namespaceSelector:
          matchLabels: {kubernetes.io/metadata.name: monitoring}
    ports:
      - port: 9100
```

### Relabel misconfiguration

```yaml
scrape_configs:
  - job_name: node
    kubernetes_sd_configs:
      - role: pod
    relabel_configs:
      - source_labels: [__meta_kubernetes_pod_annotation_prometheus_io_scrape]
        action: keep
        regex: "true"
      # make sure the port label maps to the metrics port
      - source_labels: [__meta_kubernetes_pod_annotation_prometheus_io_port]
        action: replace
        target_label: __address__
        replacement: "$1:$2"
```

### Auth

```yaml
authorization:
  type: Bearer
  credentials: "${METRICS_TOKEN}"
```

## Prevention

- Alert on `up == 0 for 5m` and on target count changes per job
- `promtool check config` + dry-run in CI before every config change
- Keep scrape timeouts below the app's p99 handler latency
- Label all metrics endpoints with `prometheus.io/scrape=true` consistently

## Verification

```bash
curl -s 'localhost:9090/api/v1/query?query=count(up==0)'   # result: 0
```

`up` is 1 for every expected target and the job's series are continuous again.
