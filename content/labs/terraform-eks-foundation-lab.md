---
title: "Lab: Terraform EKS Foundation"
description: "Hands-on lab: build a minimal EKS cluster with Terraform — VPC, subnets, cluster, node group and a verified deploy."
type: "lab"
category: "Terraform"
tags:
  - Terraform
  - AWS
  - EKS
  - Kubernetes
  - Hands-on
difficulty: "Advanced"
published: true
date: "2026-09-05"
---

# Lab: Terraform EKS Foundation

Goal: from empty AWS account to a working cluster in ~40 minutes. Costs a few dollars if you tear down afterward.

## Prerequisites

- AWS account + admin-capable credentials
- Terraform ≥ 1.9, kubectl, aws-cli v2
- ~40 minutes

```bash
aws sts get-caller-identity
terraform version
```

## Step 1 — Provider and Backend

```hcl
terraform {
  required_version = ">= 1.9"
  required_providers {
    aws = { source = "hashicorp/aws", version = "~> 5.60" }
  }
  backend "s3" {
    bucket = "atlas-tfstate-lab"
    key    = "lab/eks/terraform.tfstate"
    region = "ap-south-1"
    encrypt = true
  }
}

provider "aws" {
  region = var.region
  default_tags {
    tags = { Project = "atlas-lab", ManagedBy = "terraform" }
  }
}
```

## Step 2 — VPC Module

```hcl
module "vpc" {
  source  = "terraform-aws-modules/vpc/aws"
  version = "~> 5.13"

  name = "atlas-lab-vpc"
  cidr = "10.20.0.0/16"

  azs             = ["${var.region}a", "${var.region}b", "${var.region}c"]
  private_subnets = ["10.20.1.0/24", "10.20.2.0/24", "10.20.3.0/24"]
  public_subnets  = ["10.20.101.0/24", "10.20.102.0/24", "10.20.103.0/24"]

  enable_nat_gateway   = true
  single_nat_gateway   = true
  enable_dns_hostnames = true

  public_subnet_tags = {
    "kubernetes.io/role/elb" = "1"
  }
  private_subnet_tags = {
    "kubernetes.io/role/internal-elb" = "1"
  }
}
```

## Step 3 — Cluster

```hcl
module "eks" {
  source          = "terraform-aws-modules/eks/aws"
  version         = "~> 20.24"
  cluster_name    = "atlas-lab"
  cluster_version = "1.31"

  vpc_id     = module.vpc.vpc_id
  subnet_ids = module.vpc.private_subnets

  eks_managed_node_groups = {
    default = {
      min_size     = 2
      max_size     = 4
      desired_size = 2
      instance_types = ["t3.medium"]
    }
  }
}
```

> The EKS module creates IAM, security groups and the control plane. Expect 12–15 minutes on first apply.

## Step 4 — Apply

```bash
terraform init
terraform plan -out=tfplan
terraform apply tfplan
aws eks update-kubeconfig --name atlas-lab --region ap-south-1
kubectl get nodes
```

Expected: 2 nodes `Ready`.

## Step 5 — Verify With a Workload

```bash
kubectl create deployment web --image=nginx --replicas=2
kubectl expose deployment web --port=80 --type=LoadBalancer
kubectl get svc web -w
```

```bash
curl "http://$(kubectl get svc web -o jsonpath='{.status.loadBalancer.ingress[0].hostname}')"
```

## Step 6 — Tear Down

```bash
kubectl delete deployment web; kubectl delete svc web
terraform destroy -auto-approve
```

## Troubleshooting

| Symptom | Likely cause |
| --- | --- |
| `AccessDenied` on EKS | Missing IAM permissions for caller |
| Stuck `CREATING` 20+ min | Public subnets missing `kubernetes.io/role/elb` tag |
| Nodes `NotReady` | CNI add-on not installed / private subnets without NAT |

## Key Takeaways

You now have a reproducible cluster: VPC module, EKS module, remote state and a verified workload path. Version the code, destroy the lab, repeat until boring.
