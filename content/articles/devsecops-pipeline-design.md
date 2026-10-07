---
title: "DevSecOps Pipeline Design"
description: "Design a DevSecOps CI/CD pipeline with SAST, dependency scanning, IaC checks, image scanning and signed deployments."
type: "article"
category: "DevSecOps"
tags:
  - DevSecOps
  - Security
  - CI/CD
  - GitHub Actions
  - Supply Chain
difficulty: "Advanced"
published: true
date: "2026-08-15"
---

# DevSecOps Pipeline Design

Security that lives in a separate quarterly review dies quietly. The fix is to move it into the pipeline as fast, blocking feedback.

## Pipeline Stages

```text
commit → lint/test → SAST → dependency audit → build → image scan → IaC scan → sign → deploy
```

Each stage is a quality gate: fail fast, fail cheap.

## Stage 1 — Tests and SAST

```yaml
jobs:
  static-analysis:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - name: Semgrep
        uses: semgrep/semgrep-ci@v1
        with:
          config: p/owasp-top-ten
      - name: Gitleaks
        uses: gitleaks/gitleaks-action@v2
```

## Stage 2 — Dependency Audit

```bash
# Node
npm audit --audit-level=high

# Python
pip-audit --strict

# Go
govulncheck ./...
```

Fail the build on **critical** CVEs with a fix available; open tickets for the rest.

## Stage 3 — Infrastructure as Code

```bash
checkov -d infra/ --framework terraform --soft-fail-on LOW
tfsec infra/ --minimum-severity HIGH
```

## Stage 4 — Image Scanning

```yaml
- name: Scan image
  uses: aquasecurity/trivy-action@0.24.0
  with:
    image-ref: "${{ env.IMAGE }}"
    format: table
    exit-code: "1"
    severity: CRITICAL,HIGH
    ignore-unfixed: true
```

## Stage 5 — Sign and Verify

Cosign keeps unsigned images out of production:

```bash
cosign sign --yes $IMAGE
cosign verify $IMAGE \
  --certificate-identity https://github.com/grlokek96/DevOps-Atlas/.github/workflows/deploy.yml \
  --certificate-oidc-issuer https://token.actions.githubusercontent.com
```

Then enforce it in the cluster with a Kyverno policy:

```yaml
apiVersion: kyverno.io/v1
kind: ClusterPolicy
metadata:
  name: require-signed-images
spec:
  validationFailureAction: Enforce
  rules:
    - name: verify-cosign
      match:
        any:
          - resources:
              kinds: ["Pod"]
      verifyImages:
        - imageReferences: ["*"]
          attestors:
            - keys:
                publicKeys: |
                  -----BEGIN PUBLIC KEY-----
                  MFkwEwYHKoZIzj0CAQYIKoZIzj0DAQcDQgAE...
                  -----END PUBLIC KEY-----
```

## Metrics That Matter

| Metric | Target |
| --- | --- |
| SAST duration | < 2 minutes |
| Block rate on critical CVEs | 100% |
| Unsigned images reaching prod | 0 |
| Mean time to patch critical | < 7 days |

## Cultural Rules

- Security findings are **comments, not blame** — same PR, same team
- Every gate must be automatable or it will be bypassed
- Document each exception with an owner and expiry

## Key Takeaways

A DevSecOps pipeline is a set of small, fast, non-negotiable checks. Start with secrets, dependencies, images and IaC scanning — four gates that pay for themselves immediately.
