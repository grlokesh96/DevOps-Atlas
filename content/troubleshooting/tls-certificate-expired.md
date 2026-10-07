---
title: "Troubleshooting: TLS / SSL Certificate Expired"
description: "Structured runbook for curl and browser certificate errors — expiry, chain, SAN and clock problems."
type: "troubleshooting"
category: "DevSecOps"
tags:
  - DevSecOps
  - TLS
  - Troubleshooting
  - Security
difficulty: "Intermediate"
published: true
date: "2026-09-24"
---

# Troubleshooting: TLS / SSL Certificate Expired

## Problem

Clients fail with `certificate has expired`, `SSL certificate problem: certificate has expired`, or `NET::ERR_CERT_DATE_INVALID`, so HTTPS traffic is refused or browsers show a full-page warning.

## Symptoms

- `curl: (60) SSL certificate problem: certificate has expired`
- Browser: `Your connection is not private` with a date error
- Go/Java clients log `x509: certificate has expired or is not yet valid`
- Ingress/ALB health checks fail on HTTPS backends
- Wildcard or SAN certificate fine for one domain, broken for another

## How to Diagnose

### 1. Read the certificate dates and chain

```bash
echo | openssl s_client -connect example.com:443 -servername example.com 2>/dev/null | \
  openssl x509 -noout -subject -issuer -dates
```

### 2. Check the full chain, not just the leaf

```bash
echo | openssl s_client -connect example.com:443 -servername example.com 2>&1 | \
  grep -E "Verify return code|s:|i:"
```

`Verify return code: 10 (certificate has expired)` — expired; `21 (unable to verify first certificate)` — missing intermediates.

### 3. Compare with your machine's clock

```bash
date -u
curl -sI https://example.com | grep -i date      # server Date header
```

### 4. Platform stores

```bash
# Kubernetes ingress controller cert
kubectl get secret tls-cert -n ingress -o jsonpath='{.data.tls\.crt}' | base64 -d | \
  openssl x509 -noout -dates
# CA bundle freshness
sudo update-ca-certificates --verbose 2>&1 | tail -3
```

## Commands

```bash
# quick expiry probe for a list of hosts
for h in example.com api.example.com; do
  printf "%-20s " "$h"
  echo | openssl s_client -connect "$h":443 -servername "$h" 2>/dev/null | \
    openssl x509 -noout -enddate
done

# test with verbose reason
curl -vI https://example.com 2>&1 | grep -E "expire|SSL|subject|issuer"
```

## Possible Causes

| Error / sign | Cause |
| --- | --- |
| `certificate has expired` | ACME renewal failed; manual cert never renewed |
| `not yet valid` | Client clock skewed forward/backward |
| `unable to verify first certificate` | Server serves leaf without intermediates |
| `Hostname mismatch` | SAN list lacks the requested name |
| `self-signed certificate` | Internal CA not in the client trust store |
| Works with `curl -k`, fails in app | App uses strict verification (correct) — fix the chain |

## Solution

### Renew (Let's Encrypt / cert-manager)

```bash
# cert-manager
kubectl annotate cert example-cert -n prod \
  cert-manager.io/issue-temporary-certificate="true" --overwrite
kubectl delete secret example-tls -n prod      # triggers re-issue
kubectl get cert -n prod

# acme.sh on a host
acme.sh --renew -d example.com --force && sudo systemctl reload nginx
```

### Missing intermediates

Serve the full chain (leaf + intermediates) concatenated, or fix the controller:

```bash
cat fullchain.pem > /etc/ssl/private/chain.pem && cat privkey.pem >> /etc/ssl/private/chain.pem
sudo nginx -t && sudo systemctl reload nginx
```

### Clock skew

```bash
sudo timedatectl set-ntp true && sudo systemctl restart chronyd || sudo systemctl restart ntp
```

### Trust store

```bash
sudo cp internal-ca.crt /usr/local/share/ca-certificates/internal-ca.crt
sudo update-ca-certificates
```

## Prevention

- Automate renewals at 2/3 lifetime; alert at 21 days to expiry
- Synthetic HTTPS checks that assert `notAfter` (not just HTTP 200)
- Always deploy fullchain; verify with `openssl s_client ... | grep "Verify return code"`
- Keep NTP enabled on every host and container base image

## Verification

```bash
echo | openssl s_client -connect example.com:443 -servername example.com 2>&1 | grep "Verify return code"
curl -sI https://example.com | head -1          # HTTP/2 200
```

`Verify return code: 0 (ok)` and clients connect without warnings.
