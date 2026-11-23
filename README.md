# DevOps-Atlas

**Navigate. Learn. Build. Operate.**

A practical knowledge base for DevOps, Cloud & Platform Engineering — articles, blogs, notes, posts, labs, troubleshooting guides, command references and interview prep.

## Tech Stack

- [Next.js](https://nextjs.org) (App Router, Server Components)
- TypeScript
- Tailwind CSS
- [Lucide React](https://lucide.dev) icons
- Markdown content (`gray-matter` + `marked` + `highlight.js`)

## Getting Started

```bash
npm install
npm run dev      # http://localhost:3000
npm run build    # production build
npm start        # serve production build
npm run lint     # ESLint (next/core-web-vitals + next/typescript)
npm test         # Vitest unit tests
```

## Content

Content lives as Markdown files in `content/`:

```text
content/
├── articles/
├── blogs/
├── notes/
├── posts/
├── labs/
├── troubleshooting/
├── commands/
└── interview/
```

Frontmatter example:

```yaml
---
title: "Production EKS Architecture"
description: "Production-ready AWS EKS architecture."
type: "article"
category: "AWS"
tags: [AWS, EKS, Kubernetes]
difficulty: "Advanced"
published: true
featured: true
date: "2026-10-07"
---
```

Set `published: false` to keep a draft out of the site. Add a new `.md` file to the matching folder and it is picked up automatically.

## Features

- Create → Preview → Publish → Browse → Search → Download
- Global search (`/` shortcut) across title, description, content, category and tags
- Category and tag pages, related content, table of contents, reading time
- Download any entry as Markdown
- Responsive layout: mobile hamburger menu, tablet two-column, desktop sidebar
- Static-first rendering, SEO metadata, sitemap and robots.txt
- Accessible: keyboard navigation, focus states, semantic HTML

## Environment

| Variable | Purpose | Default |
| --- | --- | --- |
| `SITE_URL` | Canonical base URL for SEO/sitemap | `https://devops-atlas.vercel.app` |

## Docker

The app builds to a self-contained Next.js `standalone` image.

```bash
docker build -t devops-atlas .
docker run --rm -p 3000:3000 devops-atlas
```

Override the canonical URL at build time:

```bash
docker build --build-arg SITE_URL=https://atlas.example.com -t devops-atlas .
```

## CI/CD

`.github/workflows/ci-cd.yml` runs on pull requests, pushes to `main` and `v*` tags:

1. **Lint** — `npm run lint` (ESLint, Next.js core-web-vitals + TypeScript rules)
2. **Test** — `npm test` (Vitest unit tests)
3. **Docker build** — builds the production image with Buildx layer caching
4. **Trivy scan** — scans the image for `CRITICAL`/`HIGH` vulnerabilities, uploads a SARIF report to code scanning, and fails the build on findings
5. **Docker Hub push** — pushes `latest`, branch, semver and `sha-*` tags (only on `main` / `v*` tags, never on PRs)

Configure these repository secrets to enable the push stage:

| Secret | Purpose |
| --- | --- |
| `DOCKERHUB_USERNAME` | Docker Hub account/namespace |
| `DOCKERHUB_TOKEN` | Docker Hub access token (read/write) |

If the secrets are absent, the push stage is skipped with a warning instead of failing the pipeline.
