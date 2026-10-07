---
title: "Kubernetes Interview Prep"
description: "Interview questions and model answers covering pods, networking, scheduling, security and troubleshooting."
type: "interview"
category: "Kubernetes"
tags:
  - Kubernetes
  - Interview
  - Career
  - Questions
difficulty: "Intermediate"
published: true
date: "2026-06-15"
---

# Kubernetes Interview Prep

Curated questions with concise model answers. Answer with **mechanics first, opinion second**.

## Core Objects

### What is the difference between a Deployment and a StatefulSet?

Deployment: identityless pods, rolling updates, horizontal scaling — for stateless services. StatefulSet: stable network identities (`pod-0`, `pod-1`), ordered rollout, stable storage via volume claim templates — for databases, Kafka, etc.

### What happens between `kubectl apply` and a pod running?

1. API server persists the object (etcd)
2. Deployment controller creates/updates a ReplicaSet
3. ReplicaSet controller creates pods
4. Scheduler binds pods to nodes
5. kubelet on the node pulls images and starts containers
6. Readiness probes gate Service endpoints

### Explain readiness vs liveness probes.

Readiness controls **traffic** — a failing readiness removes the pod from endpoints without restarting it. Liveness controls **restarts** — a failing liveness kills and restarts the container. Wrong liveness on a slow-starting app causes crash loops.

## Networking

### How does Service load balancing work?

kube-proxy programs iptables/IPVS rules that DNAT traffic to selected endpoint pods. Distribution is random (iptables) or per-mode (IPVS). For DNS-based discovery, CoreDNS answers with the ClusterIP; a headless service returns pod IPs directly.

### Why can't I reach my Service?

Checklist: selector matches pod labels → endpoints populated → named port exists → NetworkPolicy allows → target container listening on `0.0.0.0`.

### What is a NetworkPolicy?

A namespaced L3/L4 firewall for pod-to-pod traffic. Default deny requires an ingress policy with no pod selector choosing all pods as victims — policies are additive, and absence of policy means allow-all.

## Scheduling and Scaling

### How does the scheduler decide?

Filtering (taints, affinity, resource fit, volume constraints) → scoring (balanced resources, affinity preference, spread). Highest score wins; ties are broken randomly.

### Cluster Autoscaler vs Karpenter.

Cluster Autoscaler watches unschedulable pods and scales existing node groups. Karpenter provisions just-in-time nodes per pending pod with broader instance-type flexibility and consolidation. Run one, not both.

## Security

### How would you secure a multi-tenant cluster?

Namespaces + RBAC with minimal verbs, per-tenant ResourceQuotas, NetworkPolicies default-deny, image signing with admission policy, node isolation for sensitive workloads, audit logging.

### Where should secrets live?

Not in git, not in images. Use a secrets operator (ESO, Secrets Store CSI) backed by KMS/Vault, encrypt etcd at rest, restrict `get secrets` RBAC, prefer short-lived projected tokens.

## Troubleshooting

### Pod `CrashLoopBackOff` — your process?

```bash
kubectl logs <pod> --previous
kubectl describe pod <pod>   # last state + exit code
```

Exit 137 → OOMKilled (raise limits or fix leak); exit 1 → app config; `Error` on create → image pull or security context.

### Pod `Pending`?

Unschedulable events: insufficient CPU/memory, node selectors/affinity unsatisfiable, taints without tolerations, or a `Pending` PVC.

## Behavioral Question

### Tell me about an outage you fixed.

Use **situation → detection → action → root cause → prevention**. Emphasize what you automated afterward — interviewers remember the prevention more than the heroics.

## Final Checklist

- [ ] Can draw the request path: client → LB → ingress → service → pod
- [ ] Knows probes, requests/limits, PDB interplay
- [ ] Comfortable reading `describe` and events unaided
- [ ] Has a RBAC + NetworkPolicy story for security rounds
