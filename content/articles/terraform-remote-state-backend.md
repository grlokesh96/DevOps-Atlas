---
title: "Terraform Remote State Backends"
description: "Configure safe Terraform remote state with S3, state locking, encryption and a practical module layout."
type: "article"
category: "Terraform"
tags:
  - Terraform
  - AWS
  - S3
  - State Management
difficulty: "Intermediate"
published: true
featured: true
date: "2026-09-10"
---

# Terraform Remote State Backends

Local `terraform.tfstate` works until two people run apply at the same time. Remote state with locking turns Terraform into a safe multi-user tool.

## What State Actually Holds

- The mapping between your resources and real cloud objects
- Resource attributes you reference with `data` sources
- Sensitive values (sometimes) — treat state as a secret

## Recommended S3 Backend

```hcl
terraform {
  required_version = ">= 1.9"

  backend "s3" {
    bucket       = "atlas-tfstate"
    key          = "platform/terraform.tfstate"
    region       = "ap-south-1"
    encrypt      = true
    use_lockfile = true

    dynamodb_table = "atlas-tf-locks"
  }
}
```

### One-time Bootstrap

```bash
aws s3api create-bucket \
  --bucket atlas-tfstate \
  --region ap-south-1 \
  --create-bucket-configuration LocationConstraint=ap-south-1

aws s3api put-bucket-versioning \
  --bucket atlas-tfstate \
  --versioning-configuration Status=Enabled

aws s3api put-bucket-encryption \
  --bucket atlas-tfstate \
  --server-side-encryption-configuration '{
    "Rules": [{"ApplyServerSideEncryptionByDefault": {"SSEAlgorithm": "aws:kms"}}]
  }'
```

## State Locking

Locking prevents the classic failure: two applies racing and corrupting state.

| Backend | Locking | Notes |
| --- | --- | --- |
| S3 (legacy) | DynamoDB table | Requires extra table + IAM |
| S3 (`use_lockfile`) | Native lock object | Terraform ≥ 1.10, simpler |
| Terraform Cloud | Built-in | Managed offering |

```bash
# If a run dies and leaves a stale lock:
terraform force-unlock jh83K-92jf-3kk2
```

## Security Checklist

- [ ] Block all public access on the state bucket
- [ ] Bucket encryption with a customer-managed KMS key
- [ ] Versioning enabled for state history
- [ ] IAM policy restricting `s3:GetObject` on `platform/*` to platform teams
- [ ] `sensitive = true` on any secret outputs — and prefer Secrets Manager over state

## Module Layout

```text
infra/
├── envs/
│   ├── dev/
│   │   ├── backend.hcl
│   │   └── main.tf
│   └── prod/
│       ├── backend.hcl
│       └── main.tf
└── modules/
    ├── vpc/
    └── eks/
```

Partial backend configuration keeps environment differences out of module code:

```bash
terraform init -backend-config=envs/prod/backend.hcl
```

## Key Takeaways

Remote state is the foundation of safe Terraform usage: **one bucket, encryption on, locking on, versioning on, least-privilege IAM**. Everything else is detail.
