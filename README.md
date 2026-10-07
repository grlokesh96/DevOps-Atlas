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
