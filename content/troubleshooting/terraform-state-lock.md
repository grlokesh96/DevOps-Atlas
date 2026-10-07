---
title: "Troubleshooting: Terraform State Lock Conflict"
description: "Structured runbook for 'Error acquiring the state lock' and stuck DynamoDB locks in Terraform."
type: "troubleshooting"
category: "Terraform"
tags:
  - Terraform
  - Troubleshooting
  - State
  - Collaboration
difficulty: "Intermediate"
published: true
date: "2026-08-27"
---

# Troubleshooting: Terraform State Lock Conflict

## Problem

`terraform apply` fails with `Error acquiring the state lock` / `ConditionalCheckFailedException: The conditional request failed`, and no one on the team knows who holds the lock.

## Symptoms

- `Error acquiring the state lock: ConditionalCheckFailedException`
- CI job hangs at `backend "s3" { ... }` initialization
- A crashed `apply` left the lock behind after a laptop restart
- `terraform force-unlock` prompts for an ID you do not have
- Two pipelines race after a merge to main

## How to Diagnose

### 1. Read the lock holder from the error / backend

```bash
terraform plan 2>&1 | head -10     # error message includes Lock ID
```

### 2. S3 + DynamoDB backend: inspect the lock item

```bash
aws dynamodb get-item --table-name <tf-locks-table> \
  --key '{"LockID": {"S": "<state-key>"}}' \
  --output json | python3 -m json.tool
```

Fields to read: `LockID`, `Who` (caller ARN), `Operation` (`Action=ActionApply`), `Info`, `Created`.

### 3. Local backend

```bash
ls -la terraform.tfstate.lock
cat terraform.tfstate.lock.info   # username + operation
```

### 4. Confirm no active process still runs

```bash
ps aux | grep -i terraform | grep -v grep
# CI: check the job that started the apply
```

## Commands

```bash
# full lock state
aws dynamodb scan --table-name <tf-locks-table> --output table

# release a stale lock (ONLY after confirming the holder is dead)
terraform force-unlock <LOCK-ID>

# backend-native unlock for remote state
terraform force-unlock $(aws dynamodb get-item ... --query Item.LockID.S --output text)
```

## Possible Causes

| Cause | How to confirm |
| --- | --- |
| Crashed/aborted apply left a stale lock | Lock `Created` is old, no matching process/job |
| Two CI jobs started simultaneously | Two pipeline runs overlap in time |
| Developer plan running while CI applies | `Who` shows an IAM user, not the CI role |
| Backend table misconfigured | Lock table name differs across workspaces |
| Clock/workspace mismatch on local lock | `.lock.info` from another checkout |

## Solution

### Stale lock — safe force-unlock

```bash
# 1. verify nothing is running (step 2 above)
# 2. capture the ID from the plan error or DynamoDB item
terraform force-unlock "abc123-def456"
```

### Racing pipelines — serialize applies

- Use a concurrency group in GitHub Actions / GitLab so only one apply runs per environment
- Queue plans; only the merge commit triggers apply

```yaml
# GitHub Actions
concurrency:
  group: prod-terraform
  cancel-in-progress: false
```

### Fix backend configuration

```hcl
terraform {
  backend "s3" {
    bucket         = "tf-state"
    key            = "prod/terraform.tfstate"
    region         = "eu-west-1"
    dynamodb_table = "tf-locks"     # must match reality
    encrypt        = true
  }
}
```

## Prevention

- CI-only applies in shared environments; developers run read-only plans
- Always run inside wrappers that trap signals and release locks
- Alert on lock items older than 30 minutes
- One state file per environment, consistent workspace naming

## Verification

```bash
terraform plan          # proceeds past lock acquisition
aws dynamodb scan --table-name <tf-locks-table> --query 'Count'
```

Plan runs normally and the lock table only shows locks held by active jobs.
