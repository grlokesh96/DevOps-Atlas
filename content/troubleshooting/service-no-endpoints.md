---
title: "Troubleshooting: Service Has No Endpoints"
description: "Structured runbook for Services that return connection refused or 503 because no pods back them."
type: "troubleshooting"
category: "Kubernetes"
tags:
  - Kubernetes
  - Troubleshooting
  - Networking
  - Services
difficulty: "Intermediate"
published: true
date: "2026-08-20"
---

# Troubleshooting: Service Has No Endpoints

## Problem

A `ClusterIP` or `LoadBalancer` Service resolves but requests fail with `connection refused`, `no route to host` or `503`, and `kubectl get endpoints` is empty.

## Symptoms

- `kubectl get endpoints <svc> -n <ns>` prints `<none>` or an empty ADDRESS column
- `curl http://<svc>.<ns>.svc.cluster.local` returns connection refused
- Ingress returns `503 Service Unavailable`
- Pods for the workload are `Running` and `READY 1/1`
- CoreDNS resolves the service name correctly (the name exists, nothing answers)

## How to Diagnose

### 1. Confirm endpoints and selector

```bash
kubectl get endpoints <svc> -n <ns>
kubectl get svc <svc> -n <ns> -o wide
kubectl get svc <svc> -n <ns> -o jsonpath='{.spec.selector}'; echo
```

### 2. Check that pods actually match the selector

```bash
kubectl get pods -n <ns> --show-labels
kubectl get endpointslices -n <ns> -l kubernetes.io/service-name=<svc>
```

### 3. Verify readiness gates

```bash
kubectl get pod <pod> -n <ns> -o jsonpath='{.status.conditions[?(@.type=="Ready")].status}{"\n"}'
kubectl logs <pod> -n <ns> --tail=50
```

### 4. Check the endpoint port

```bash
kubectl get svc <svc> -n <ns> -o jsonpath='{.spec.ports}'; echo
```

A Service pointing at port 80 while the container listens on 8080 passes readiness but never connects.

## Commands

```bash
# end-to-end in one go
kubectl get svc,endpoints,endpointslices -n <ns> | grep <svc>

# debug from inside the cluster
kubectl run tmp --rm -it --image=busybox:1.36 -n <ns> -- sh
wget -qO- http://<svc>:<port>/healthz

# who owns this service
kubectl get endpointslices -n <ns> -l kubernetes.io/service-name=<svc> -o yaml | grep -E "name:|port"
```

## Possible Causes

| Cause | How to confirm |
| --- | --- |
| Label selector mismatch | Pod labels do not contain the Service selector |
| Pod not Ready (readiness failing) | EndpointSlices list no targets; Ready condition `False` |
| Wrong target port | Service `targetPort` ≠ container `containerPort` |
| Deployment scaled to zero | `kubectl get deploy` shows `0/0` |
| Dual-stack / IP family mismatch | Endpoints have IPv4 but pod is IPv6 only |
| Endpoint slice controller lag | Resolves within a few seconds after pod Ready |

## Solution

### Selector mismatch

```bash
kubectl patch svc <svc> -n <ns> -p '{"spec":{"selector":{"app":"<correct-label>"}}}'
```

### Readiness failing

```bash
kubectl logs <pod> -n <ns> | grep -i health
kubectl port-forward <pod> 8080:8080 -n <ns>   # test locally
# fix the probe path, then
kubectl rollout status deploy/<name> -n <ns>
```

### Wrong target port

```bash
kubectl patch svc <svc> -n <ns> -p '{"spec":{"ports":[{"port":80,"targetPort":8080}]}}'
```

### Scaled to zero

```bash
kubectl scale deploy/<name> --replicas=2 -n <ns>
```

## Prevention

- Keep Service `targetPort` aligned with `containerPort` in the same chart value
- Always define readiness probes so broken pods never join endpoints
- Add a CI check that asserts `endpoints > 0` after each deploy
- Alert when an expected Service has zero endpoints for > 5 minutes

## Verification

```bash
kubectl get endpoints <svc> -n <ns> -w
kubectl run tmp --rm -it --image=busybox:1.36 -n <ns> -- wget -qO- http://<svc>:<port>/healthz
```

Endpoints show pod IPs and an in-cluster request returns HTTP 200.
