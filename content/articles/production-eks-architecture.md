---
title: "Production EKS Architecture"
description: "A production-ready AWS EKS architecture covering network topology, node groups, add-ons, ingress, autoscaling and observability."
type: "article"
category: "AWS"
tags:
  - AWS
  - EKS
  - Kubernetes
  - Networking
difficulty: "Advanced"
published: true
featured: true
date: "2026-10-07"
---

# Production EKS Architecture

Designing a production EKS cluster is mostly about **blast radius, networking and operability**. This article documents the architecture we run for multi-tenant workloads on AWS.

## Design Goals

- Multi-AZ by default, no single point of failure
- Private cluster endpoint with controlled access paths
- Clear separation between system, application and monitoring namespaces
- Autoscaling at every layer: pods, nodes and optional Fargate

## Network Topology

The control plane sits in AWS-managed subnets. Worker nodes and load balancers live in private subnets across three AZs.

| Layer | CIDR | Purpose |
| --- | --- | --- |
| VPC | 10.0.0.0/16 | Overall address space |
| Private subnets | 10.0.1.0/24 – 10.0.3.0/24 | Nodes, pods, internal services |
| Public subnets | 10.0.101.0/24 – 10.0.103.0/24 | NAT gateways, public ALBs |
| Pod subnet | 100.64.0.0/16 | VPC CNI secondary IPs |

```bash
aws eks create-cluster \
  --name atlas-prod \
  --version 1.31 \
  --role-arn arn:aws:iam::111122223333:role/AmazonEKSClusterRole \
  --resources-vpc-config subnetIds=subnet-aaa,subnet-bbb,subnet-ccc,endpointPublicAccess=false,endpointPrivateAccess=true
```

## Node Groups

Use three managed node groups instead of one giant group:

1. **system** — CoreDNS, CNI, metrics, small and steady
2. **general** — application workloads, mixed instance types
3. **spot** — interruptible batch workloads with a disruption budget

```yaml
apiVersion: eks.amazonaws.com/v1alpha5
kind: Config
metadata:
  name: atlas-general
managedNodeGroups:
  - name: general-3x
    instanceTypes: ["m6i.xlarge", "m6a.xlarge"]
    minSize: 3
    maxSize: 12
    desiredCapacity: 6
    labels:
      workload: general
    privateNetworking: true
```

## Cluster Add-ons

Keep the platform boring and managed:

- **VPC CNI** with prefix delegation for higher pod density
- **CoreDNS** with a 3-replica baseline and PDB
- **EBS CSI** driver for dynamic volumes
- **Cluster Autoscaler** or **Karpenter** — pick one, not both
- **AWS Load Balancer Controller** for ALB/NLB wiring

## Ingress and Traffic Flow

Internet traffic flows: Route 53 → WAF → public ALB → ingress controller → service → pod.

> Never expose the API server publicly. Use a bastion, SSM Session Manager or a VPN for kubectl access.

```bash
kubectl apply -f https://raw.githubusercontent.com/kubernetes-sigs/aws-load-balancer-controller/v2.7.2/config/awslbcontroller.yaml
```

## Autoscaling

```yaml
apiVersion: autoscaling/v2
kind: HorizontalPodAutoscaler
metadata:
  name: api-hpa
spec:
  scaleTargetRef:
    apiVersion: apps/v1
    kind: Deployment
    name: api
  minReplicas: 3
  maxReplicas: 30
  metrics:
    - type: Resource
      resource:
        name: cpu
        target:
          type: Utilization
          averageUtilization: 65
```

## Observability Baseline

- **Metrics** — kube-state-metrics, node-exporter, cAdvisor → Prometheus → Grafana
- **Logs** — Fluent Bit daemonset → CloudWatch Logs
- **Traces** — OTel collector sidecars for latency-sensitive services
- **Alerting** — error budget burn rate alerts, not raw CPU spikes

## Failure Domain Checklist

- [ ] PodDisruptionBudgets on every critical deployment
- [ ] anti-affinity spreading replicas across AZs
- [ ] readiness *and* liveness probes configured
- [ ] resource requests/limits on 100% of pods
- [ ] node OS AMI auto-upgrade pipeline

## Key Takeaways

A production EKS cluster is less about Kubernetes knobs and more about **defaults that fail safe**. Private networking, managed add-ons, spread-out node groups and disciplined autoscaling get you 90% of the way.
