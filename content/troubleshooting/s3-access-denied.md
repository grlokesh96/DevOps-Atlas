---
title: "Troubleshooting: S3 Access Denied (403)"
description: "Structured runbook for S3 403 errors — bucket policy, IAM permissions, KMS and public access blocks."
type: "troubleshooting"
category: "AWS"
tags:
  - AWS
  - S3
  - Troubleshooting
  - IAM
difficulty: "Intermediate"
published: true
date: "2026-07-30"
---

# Troubleshooting: S3 Access Denied (403)

## Problem

Requests to an S3 bucket return `403 Forbidden` / `AccessDenied` even though credentials are valid and the caller "should" have access.

## Symptoms

- `aws s3 ls s3://bucket/` returns `An error occurred (403): Forbidden`
- App logs show `AccessDenied` on `GetObject` or `PutObject`
- Browser/SDK uploads fail while CLI works (or vice versa)
- DataSync/backup jobs suddenly start failing after a policy change
- Anonymous requests return `AccessDenied` instead of `404`

## How to Diagnose

### 1. Test the exact call and read the error detail

```bash
aws s3api get-object --bucket my-bucket --key test.txt /tmp/t 2>&1 | head -5
aws s3api head-bucket --bucket my-bucket
```

### 2. Evaluate the identity policy

```bash
aws sts get-caller-identity
aws iam simulate-principal-policy \
  --policy-source-arn <arn-of-caller> \
  --action-names s3:GetObject \
  --resource-arns 'arn:aws:s3:::my-bucket/*'
```

### 3. Read the bucket policy and public-access state

```bash
aws s3api get-bucket-policy --bucket my-bucket --query Policy --output text | python3 -m json.tool
aws s3api get-public-access-block --bucket my-bucket
aws s3api get-bucket-policy-status --bucket my-bucket
```

### 4. Encryption and object ownership

```bash
aws s3api get-bucket-encryption --bucket my-bucket
aws s3api get-object-acl --bucket my-bucket --key test.txt
```

## Commands

```bash
# who am I, what can I do
aws sts get-caller-identity
aws s3api list-buckets --query 'Buckets[].Name' --output text

# one-line bucket policy check
aws s3api get-bucket-policy --bucket my-bucket --query Policy --output text | \
  python3 -c 'import json,sys; print(json.dumps(json.loads(sys.stdin.read()), indent=2))'
```

## Possible Causes

| Cause | Signature |
| --- | --- |
| IAM policy missing the action/resource | `SimulatePrincipalPolicy` returns implicit deny |
| Resource policy (bucket policy) denies | Deny statement matches the caller |
| KMS key denies `kms:Decrypt/GenerateDataKey` | Error mentions `KMS` or `HeadObject` encryption |
| Block Public Access on anonymous access | Anonymous call + `AccessDenied` |
| Wrong bucket/key (typo, missing prefix) | 403 instead of 404 (S3 hides existence) |
| VPC endpoint policy | Works outside VPC, fails inside |
| Object ACL `private` + non-owner account | `GetObject` denied across accounts |

## Solution

### Grant the identity

```bash
aws iam put-role-policy --role-name app-role --policy-name s3-app \
  --policy-document '{
    "Version":"2012-10-17",
    "Statement":[{
      "Effect":"Allow",
      "Action":["s3:GetObject","s3:PutObject"],
      "Resource":"arn:aws:s3:::my-bucket/uploads/*"
    }]}' 
```

### Fix the bucket policy (cross-account or service access)

```json
{
  "Effect": "Allow",
  "Principal": { "AWS": "arn:aws:iam::123456789012:role/app-role" },
  "Action": "s3:*",
  "Resource": ["arn:aws:s3:::my-bucket", "arn:aws:s3:::my-bucket/*"]
}
```

### KMS

```bash
aws kms put-key-policy --key-id alias/my-key --policy file://key-policy.json
# ensure the caller has kms:Decrypt + kms:GenerateDataKey
```

### Public access block

```bash
aws s3api delete-public-access-block --bucket my-bucket   # only if intentionally public
```

## Prevention

- Grant least-privilege at the object-prefix level, not `s3:*` on `*`
- Use `aws iam simulate-principal-policy` in CI for new policies
- Keep Block Public Access on unless explicitly required
- Version bucket policies and review them in PRs like code
- Prefer bucket-owner-enforced object ownership to avoid ACL surprises

## Verification

```bash
aws s3api get-object --bucket my-bucket --key test.txt /tmp/t && echo OK
```

The previously failing call returns data and app logs stop showing `AccessDenied`.
