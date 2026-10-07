---
title: "GitHub Actions OIDC Federation"
description: "Replace long-lived AWS access keys in CI/CD with short-lived credentials using GitHub Actions OIDC federation."
type: "article"
category: "CI/CD"
tags:
  - GitHub Actions
  - OIDC
  - AWS
  - Security
  - CI/CD
difficulty: "Intermediate"
published: true
featured: true
date: "2026-09-24"
---

# GitHub Actions OIDC Federation

Long-lived AWS keys in CI are a liability. With **OpenID Connect (OIDC)**, GitHub Actions exchanges a workflow identity for short-lived AWS credentials — no secrets to rotate, no keys to leak.

## Why OIDC?

| Approach | Credential lifetime | Rotation | Leak impact |
| --- | --- | --- | --- |
| Access keys in secrets | 90+ days | Manual | Full account risk |
| OIDC federation | ~15 minutes | Automatic | Minutes of exposure |

## How It Works

1. The workflow requests a JWT from GitHub's OIDC endpoint
2. AWS STS `AssumeRoleWithWebIdentity` validates the token
3. STS returns temporary credentials scoped to the role's trust policy

## Step 1 — GitHub Provider in AWS

```bash
aws iam create-open-id-connect-provider \
  --url https://token.actions.githubusercontent.com \
  --client-id-list sts.amazonaws.com
```

## Step 2 — Trust Policy With Claims

Scope the role to a single repository and branch. This is the important part — the `sub` claim is your authorization boundary.

```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Principal": {
        "Federated": "arn:aws:iam::111122223333:oidc-provider/token.actions.githubusercontent.com"
      },
      "Action": "sts:AssumeRoleWithWebIdentity",
      "Condition": {
        "StringEquals": {
          "token.actions.githubusercontent.com:aud": "sts.amazonaws.com"
        },
        "StringLike": {
          "token.actions.githubusercontent.com:sub": "repo:grlokesh96/DevOps-Atlas:ref:refs/heads/main"
        }
      }
    }
  ]
}
```

## Step 3 — Workflow Configuration

```yaml
name: deploy
on:
  push:
    branches: [main]

permissions:
  id-token: write
  contents: read

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: aws-actions/configure-aws-credentials@v4
        with:
          role-to-assume: arn:aws:iam::111122223333:role/github-actions-deploy
          aws-region: ap-south-1
      - run: aws sts get-caller-identity
```

> The `id-token: write` permission is mandatory. Without it GitHub never issues a JWT and the exchange fails silently at first glance.

## Hardening Tips

- Use environment-scoped roles: `role-for-production` trusted only by `environment:production`
- Prefer `StringLike` on `sub` over broad wildcards like `repo:*`
- Add a `aws:PrincipalTag` condition for defense in depth
- Log `GetCallerIdentity` in every job so identity is auditable

## Troubleshooting

- **`Not authorized to perform sts:AssumeRoleWithWebIdentity`** — the `sub` claim does not match your trust policy
- **`invalid_client: Invalid client_id`** — provider `aud` list does not include `sts.amazonaws.com`
- **Missing JWT** — `permissions: id-token: write` absent from the workflow

## Key Takeaways

OIDC federation removes your riskiest CI secret in an afternoon of work. The trust policy *is* the security model, so write it narrowly and review it like code.
