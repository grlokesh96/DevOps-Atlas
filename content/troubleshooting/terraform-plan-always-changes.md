---
title: "Troubleshooting: Terraform Plan Never Stays the Same"
description: "Structured runbook for perpetual diffs — plan output changes every run even when nothing was touched."
type: "troubleshooting"
category: "Terraform"
tags:
  - Terraform
  - Troubleshooting
  - State
  - Drift
difficulty: "Intermediate"
published: true
date: "2026-09-03"
---

# Troubleshooting: Terraform Plan Never Stays the Same

## Problem

`terraform plan` shows changes for resources nobody modified. Running `apply` fixes them, and the next plan immediately wants to change them again — an endless diff loop.

## Symptoms

- Plan output is non-empty on every run with no input changes
- Same block appears as `~` then flips back after apply
- `tags` or `name_prefix` fields oscillate between values
- Drift detection jobs always report changes
- Provider upgrades made the diffs appear suddenly

## How to Diagnose

### 1. Read which attribute flips

```bash
terraform plan -detailed-exitcode -out=tf.plan
terraform show -json tf.plan | python3 -m json.tool > plan.json
grep -B5 -A5 '"change"' plan.json | head -80
```

### 2. Compare state against reality

```bash
terraform plan -refresh=true
terraform state list | head
terraform state show aws_s3_bucket.data   # what state believes
```

### 3. Check the classic culprits

```bash
# timestamps / random values in config
grep -rn "timestamp()\|uuid()\|random_string" .

# ordering-sensitive lists (security_groups, subnets)
grep -rn "aws_security_group" *.tf

# computed values written back by the provider
grep -rn "tags_all\|name_prefix\|depends_on" *.tf
```

### 4. Provider and version context

```bash
terraform version
terraform providers schema -json > schema.json
```

## Commands

```bash
# isolate one resource's diff loop
terraform plan -target=aws_s3_bucket.data -out=p1
terraform apply p1
terraform plan -target=aws_s3_bucket.data    # empty? loop reproduced elsewhere

# show state vs config for a flapping attribute
terraform state show -no-color aws_iam_role.app | grep -i tag
```

## Possible Causes

| Pattern | Fix direction |
| --- | --- |
| `timestamp()` / `uuid()` in config | Remove or `ignore_changes` |
| Unordered list (SGs, subnets) | `toset()` / sort in config |
| Provider computed field written to config | Remove from config; rely on read-only |
| Drift from console/CLI changes | Import/update state, then own it in TF |
| `ignore_changes` removed by refactor | Restore the lifecycle block |
| Lambda env/`tags_all` churn | Provider version pin / upgrade notes |

## Solution

### Non-deterministic values

```hcl
# BAD — changes every plan
locals { build_time = timestamp() }

# keep dynamic values out of diffed fields, or:
lifecycle {
  ignore_changes = [tags["built_at"]]
}
```

### Unordered collections

```hcl
# BAD — order flips
security_group_ids = [aws_security_group.a.id, aws_security_group.b.id]

# GOOD
security_group_ids = sort([
  aws_security_group.a.id,
  aws_security_group.b.id,
])
# or convert when the API returns sets
```

### Real drift, now owned by Terraform

```bash
terraform refresh
terraform apply    # re-align reality to config, or update config to reality
```

### Pin the provider

```hcl
terraform {
  required_providers {
    aws = { source = "hashicorp/aws", version = "~> 5.60" }
  }
}
```

## Prevention

- CI gate: fail the pipeline if `terraform plan -detailed-exitcode` returns `2` with an empty expected-change allowlist
- Never put clock/UUID values into diffed attributes
- Use `toset()`/`sort()` for every order-insensitive list
- Run `terraform plan` refresh-only drift jobs weekly

## Verification

```bash
terraform plan -detailed-exitcode; echo "exit=$?"
```

Exit code `0` — plan is empty and stays empty across repeated runs.
