---
title: "Troubleshooting: CI Pipeline Not Triggering"
description: "Structured runbook for pushes and merges that never start a pipeline — webhook, branch and path-filter causes."
type: "troubleshooting"
category: "CI/CD"
tags:
  - CI/CD
  - Troubleshooting
  - Webhooks
  - Automation
difficulty: "Beginner"
published: true
date: "2026-09-17"
---

# Troubleshooting: CI Pipeline Not Triggering

## Problem

You pushed code, PR updated, or merged to main — and no workflow run, no pipeline, no deploy appeared. The platform shows nothing for that commit.

## Symptoms

- Commit shows on GitHub/GitLab but no workflow run exists
- Badge on the README still shows the previous commit's status
- `workflow_dispatch` works when triggered manually
- Only some repositories/branches are affected
- Deploy job skipped while test job ran (or vice versa)

## How to Diagnose

### 1. Verify the commit actually reached the remote

```bash
git status && git log origin/main -1 --oneline
git push origin HEAD && git ls-remote origin main
```

### 2. Read the workflow/trigger configuration

```bash
# GitHub Actions — triggers, paths, branches
grep -A15 "^on:" .github/workflows/*.yml
```

Check: `branches` / `branches-ignore`, `paths` / `paths-ignore`, `if:` conditions, `workflow_run` dependencies.

### 3. Inspect the webhook delivery

```bash
# Settings → Webhooks → Recent Deliveries (browser), or:
gh api /repos/{owner}/{repo}/hooks --jq '.[] | {url: .config.url, active}'
gh api /repos/{owner}/{repo}/actions/runs --jq '.workflow_runs[0:5] | .[] | {name, status, head_branch}'
```

### 4. Runner / queue state

```bash
gh api /repos/{owner}/{repo}/actions/runners --jq '.runners[] | {name, status, busy}'
```

## Commands

```bash
# was the event delivered at all?
gh api "repos/{owner}/{repo}/actions/workflows/ci.yml/runs?per_page=5" \
  --jq '.workflow_runs[] | "\(.created_at) \(.status) \(.head_branch) \(.display_title)"'

# manually trigger to isolate trigger-vs-workflow problems
gh workflow run ci.yml -r main
gh run watch
```

## Possible Causes

| Cause | How to confirm |
| --- | --- |
| Push went to a different branch/fork | `git ls-remote` shows another SHA |
| `paths-ignore` matched the changed files | All changed files match the ignore list |
| Branch filter excludes the branch | `on.push.branches` lacks your branch |
| Webhook deleted / secret rotated | No recent deliveries in hook settings |
| Repo-level Actions disabled | Settings → Actions → Disabled |
| `concurrency` group cancelled the new run | Previous run shows `cancelled` for same group |
| Required label/`if:` condition false | Job shows `skipped` in the run |

## Solution

### Trigger config

```yaml
on:
  push:
    branches: [main, release/*]
    paths-ignore: ["**.md", "docs/**"]
  pull_request:
    branches: [main]
```

### Re-deliver / recreate the webhook

```bash
gh api -X POST repos/{owner}/{repo}/hooks \
  -f name=webhooks -f active=true \
  -f config[url]="https://example/hooks" -f config[content_type=json'
# or simply re-add the integration in the UI and test ping
```

### Enable Actions

```bash
gh api -X PUT repos/{owner}/{repo}/actions/permissions -f enabled=true
```

### Stuck concurrency

```yaml
concurrency:
  group: ${{ github.workflow }}-${{ github.ref }}
  cancel-in-progress: false
```

## Prevention

- Add a "smoke trigger" workflow that runs on `workflow_dispatch` and weekly cron
- Monitor webhook delivery failures (GitHub: hook redelivery alerts)
- Keep branch/path filters in one shared, reviewed workflow file
- Use a bot PR that touches a test file to verify the full path after any CI change

## Verification

```bash
gh workflow run ci.yml && gh run watch
gh run list --limit 3
```

A run appears for the newest SHA and completes (or at least starts) successfully.
