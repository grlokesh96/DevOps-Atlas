---
title: "Kubernetes Services In Depth"
description: "Understand ClusterIP, NodePort, LoadBalancer and ExternalName services — selection, DNS, sessions and when to use each."
type: "article"
category: "Kubernetes"
tags:
  - Kubernetes
  - Networking
  - Services
  - DNS
difficulty: "Intermediate"
published: true
date: "2026-08-02"
---

# Kubernetes Services In Depth

A Service is a stable virtual IP and DNS name in front of a changing set of pods. Everything else in Kubernetes networking builds on that idea.

## The Core Problem

Pods are ephemeral: IPs change on every reschedule. Services give you one address that keeps working while backends come and go.

## Service Types

| Type | Reachable from | Use case |
| --- | --- | --- |
| ClusterIP | Inside the cluster only | Default; internal APIs, databases |
| NodePort | Node IP + port range (30000–32767) | Debugging, legacy integrations |
| LoadBalancer | Internet (cloud LB) | Public HTTP/gRPC endpoints |
| ExternalName | CNAME to external DNS | Consuming SaaS by cluster DNS |

```yaml
apiVersion: v1
kind: Service
metadata:
  name: api
  labels:
    app: api
spec:
  type: ClusterIP
  selector:
    app: api
  ports:
    - name: http
      port: 80
      targetPort: 8080
      protocol: TCP
```

## How Selection Works

The service controller continuously matches `spec.selector` against pod labels and programs endpoint slices.

```bash
kubectl get endpointslices -l kubernetes.io/service-name=api
```

If the endpoint list is empty, the selector does not match — nine times out of ten this is your outage.

## DNS Behavior

- `api` → resolves to the ClusterIP (same namespace)
- `api.default.svc.cluster.local` → fully qualified
- Headless service (`clusterIP: None`) → returns **pod IPs** directly, for StatefulSets

## Sessions and Traffic Distribution

```yaml
sessionAffinity: ClientIP
sessionAffinityConfig:
  clientIP:
    timeoutSeconds: 10800
```

Default is `None` (random per connection). Use `ClientIP` sparingly — it hurts load distribution.

## ExternalName: The Careful Case

```yaml
apiVersion: v1
kind: ExternalName
metadata:
  name: payments.saas
spec:
  type: ExternalName
  externalName: api.stripe.com
```

> ExternalName does no validation or TLS termination. It only rewrites DNS — treat it as documentation, not a gateway.

## Ingress vs Service

- **Service** = L4 reachability inside/through the cluster
- **Ingress / Gateway API** = L7 routing, TLS termination, host/path rules

```yaml
apiVersion: networking.k8s.io/v1
kind: Ingress
metadata:
  name: api
spec:
  ingressClassName: alb
  rules:
    - host: api.example.com
      http:
        paths:
          - path: /
            pathType: Prefix
            backend:
              service:
                name: api
                port:
                  number: 80
```

## Troubleshooting Quick Reference

```bash
kubectl describe svc api
kubectl get endpointslices -l kubernetes.io/service-name=api
kubectl run debug --rm -it --image=busybox -- nslookup api.default.svc.cluster.local
```

1. Selector matches labels?
2. Pods Ready?
3. Named port exists on the pod?
4. NetworkPolicies allowing the flow?

## Key Takeaways

ClusterIP is the default and usually the right answer. Reach for NodePort only while debugging, LoadBalancer for public entry points, and the Gateway API when L7 routing rules grow past a single ingress.
