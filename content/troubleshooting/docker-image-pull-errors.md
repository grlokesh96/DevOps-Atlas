---
title: "Troubleshooting: Docker Image Pull Errors"
description: "Structured runbook for manifest unknown, unauthorised, timeout and platform errors when pulling images."
type: "troubleshooting"
category: "Docker"
tags:
  - Docker
  - Troubleshooting
  - Registry
  - Networking
difficulty: "Beginner"
published: true
date: "2026-07-09"
---

# Troubleshooting: Docker Image Pull Errors

## Problem

`docker pull` or a workload using the image fails with errors such as `manifest unknown`, `unauthorized`, `timeout` or `no matching manifest`, so the image never becomes available.

## Symptoms

- `Error response from daemon: manifest for <repo>:<tag> not found`
- `unauthorized: authentication required` or `access denied`
- `Get "https://registry-1.docker.io/v2/": net/http: request canceled (Client.Timeout)`
- `no matching manifest for linux/arm64 in the manifest list entries`
- Pulls work on one machine but fail on another

## How to Diagnose

### 1. Capture the exact error

```bash
docker pull <repo>:<tag> 2>&1 | tail -5
```

### 2. Check auth state

```bash
cat ~/.docker/config.json | grep -A2 "auths" || echo "not logged in"
docker login <registry>   # re-authenticate and read the response
```

### 3. Inspect registry connectivity and TLS

```bash
curl -sI https://registry-1.docker.io/v2/ | head -3
nslookup registry-1.docker.io
echo $HTTPS_PROXY $https_proxy
```

### 4. Check which platform you requested

```bash
docker manifest inspect <repo>:<tag>
docker version --format '{{.Server.Os}}/{{.Server.Arch}}'
```

## Commands

```bash
# tagged, digest, and platform in one go
docker pull --platform linux/amd64 <repo>:<tag>
docker image inspect <repo>:<tag> --format '{{.RepoDigests}} {{.Os}}/{{.Architecture}}'

# bypass a flaky proxy temporarily
HTTPS_PROXY= HTTP_PROXY= https_proxy= http_proxy= docker pull <repo>:<tag>

# clean partial layers then retry
docker system df
docker image prune -f
```

## Possible Causes

| Error | Cause |
| --- | --- |
| `manifest unknown` | Wrong tag, deleted image, or pushed to a different repo |
| `unauthorized` / `access denied` | Not logged in, expired token, or private repo without rights |
| `timeout` / `EOF` | Proxy, firewall, DNS or upstream registry outage |
| `no matching manifest` | Image has no layer for your platform (arm64 vs amd64) |
| `unknown: bad request` | HTTP registry or mirror configured with HTTPS URL (or vice versa) |
| `toomanyrequests` | Anonymous rate limit from the registry |

## Solution

### Wrong tag or repo

```bash
docker pull <repo>@sha256:<digest>   # pin by digest instead of tag
docker manifest inspect <repo>:<tag> # verify the tag exists
```

### Auth failure

```bash
docker login <registry> --username <user> --password-stdin <<< "$TOKEN"
# Kubernetes: create the pull secret
kubectl create secret docker-registry regcred \
  --docker-server=<registry> --docker-username=<user> --docker-password=<token>
```

### Timeout or proxy

```bash
# use a registry mirror
# /etc/docker/daemon.json
{ "registry-mirrors": ["https://mirror.example.com"] }
sudo systemctl restart docker
```

### Platform mismatch

```bash
docker pull --platform linux/amd64 <repo>:<tag>   # force the right arch
```

### Rate limiting

Log in to the registry, or pull through a proxy/mirror with authenticated quotas.

## Prevention

- Pin production images by digest, not floating tags
- Always `docker login` in CI with a scoped, expiring token
- Configure a registry mirror inside restricted networks
- Multi-arch builds (`docker buildx --platform linux/amd64,linux/arm64`) avoid surprises
- Monitor registry error rates and quota usage

## Verification

```bash
docker pull <repo>:<tag>
docker image inspect <repo>:<tag> --format '{{.Id}} {{.RepoDigests}}'
```

Pull completes without errors and the image lists under `docker images`.
