---
title: "Docker Multi-stage Builds"
description: "Shrink image size and harden production containers with multi-stage builds, distroless bases and build caching."
type: "article"
category: "Docker"
tags:
  - Docker
  - Containers
  - CI/CD
  - Security
difficulty: "Beginner"
published: true
date: "2026-08-28"
---

# Docker Multi-stage Builds

A multi-stage build lets you compile in a fat builder image and ship only the artifacts in a slim final image.

## The Problem With One-stage Dockerfiles

A typical app Dockerfile copies source, installs compilers and leaves build tools, caches and even `.git` in production. Result: multi-gigabyte images and a larger attack surface.

## A Real Go Example

```dockerfile
# syntax=docker/dockerfile:1

FROM golang:1.23 AS builder
WORKDIR /src
COPY go.mod go.sum ./
RUN go mod download
COPY . .
RUN CGO_ENABLED=0 GOOS=linux go build -ldflags="-s -w" -o /out/api ./cmd/api

FROM gcr.io/distroless/static-debian12:nonroot
COPY --from=builder /out/api /api
EXPOSE 8080
USER nonroot:nonroot
ENTRYPOINT ["/api"]
```

Builder stage: toolchain, compilers, cache. Final stage: one static binary on a distroless base.

## Node.js Variant

```dockerfile
FROM node:22-alpine AS deps
WORKDIR /app
COPY package*.json ./
RUN npm ci --omit=dev

FROM node:22-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production
COPY --from=deps /app/node_modules ./node_modules
COPY . .
USER node
CMD ["node", "server.js"]
```

## Layer Caching Rules

Order layers from least to most frequently changing:

1. Dependency manifests (`go.mod`, `package.json`)
2. Dependency installation
3. Application source

```bash
# Use BuildKit cache mounts for package managers
RUN --mount=type=cache,target=/go/pkg/mod go mod download
```

## Image Hygiene Checklist

- Pin base images by digest for reproducible builds
- Run as a non-root `USER`
- Add a `.dockerignore` for `node_modules`, `.git`, `*.md`
- Scan results before pushing: `docker scout quickviews`
- Keep the final stage distroless, scratch or alpine

## Measuring the Win

| Strategy | Typical size |
| --- | --- |
| Single stage, full base | 1.2 GB |
| Alpine final stage | 180 MB |
| Distroless / scratch | 12–40 MB |

```bash
docker buildx build --target builder -t app:builder .
docker buildx build -t app:1.0.0 .
docker images app
```

## Key Takeaways

Multi-stage builds are the single highest-leverage Docker habit: smaller pulls, faster deploys, fewer CVEs — with no change to your build process.
