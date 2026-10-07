---
title: "kubectl Essential Commands"
description: "The kubectl commands used daily — inspection, debugging, logs, networking and safe deletions."
type: "command"
category: "Kubernetes"
tags:
  - Kubernetes
  - kubectl
  - Commands
  - Debugging
difficulty: "Beginner"
published: true
date: "2026-09-12"
---

# kubectl Essential Commands

Daily-driver kubectl reference. Assumes `kubectl config use-context <cluster>` has been checked twice.

## Context and Situational Awareness

```bash
kubectl config get-contexts
kubectl config use-context prod-ap-south-1
kubectl cluster-info
kubectl get nodes -o wide
```

## Inspecting Workloads

```bash
kubectl get pods -A -o wide
kubectl get deploy,svc,ing -n prod
kubectl describe pod api-7d9f8 -n prod
kubectl get events -n prod --sort-by=.lastTimestamp
kubectl top pods -n prod --sort-by=memory
```

## Logs

```bash
kubectl logs -f deploy/api -n prod --all-containers
kubectl logs api-7d9f8 -n prod --previous        # crashed container
kubectl logs -l app=api -n prod --max-log-requests=5
```

## Interactive Debugging

```bash
kubectl run debug --rm -it --image=nicolaka/netshoot -- bash
kubectl debug -it api-7d9f8 -n prod --image=busybox --target=app
kubectl exec -it api-7d9f8 -n prod -- env
```

`kubectl debug` with `--target` attaches a sidecar to a *running* container without restarting it.

## Networking Checks

```bash
kubectl get svc api -n prod
kubectl get endpointslices -l kubernetes.io/service-name=api
kubectl run netshoot --rm -it --image=nicolaka/netshoot -- curl -sv http://api.prod.svc:80
```

## Scaling and Rollouts

```bash
kubectl scale deploy/api --replicas=5 -n prod
kubectl set image deploy/api api=registry/api:1.4.2 -n prod
kubectl rollout status deploy/api -n prod
kubectl rollout history deploy/api -n prod
kubectl rollout undo deploy/api -n prod
```

## Safe Deletion

```bash
kubectl delete pod api-7d9f8 -n prod --grace-period=60
kubectl delete deploy api -n prod --dry-run=server
kubectl drain node-3 --ignore-daemonsets --delete-emptydir-data
```

## Useful Output Formats

```bash
kubectl get pods -n prod -o jsonpath='{range .items[*]}{.metadata.name}{"\t"}{.status.phase}{"\n"}{end}'
kubectl get pods -A --field-selector=status.phase=Running
kubectl get ingress -A -o custom-columns=NAME:.metadata.name,HOST:.spec.rules[*].host
```

## Kubectl Aliases

```bash
alias k=k
alias kx='kubectl config use-context'
alias kgp='kubectl get pods -A'
alias kdp='kubectl describe pod'
alias klp='kubectl logs -f --tail=200'
```

## Safety Rules

1. Never pipe `kubectl delete` from unreviewed scripts
2. Always `--dry-run=server` before first-time destructive commands
3. Confirm context with `kubectl config current-context` before prod work
