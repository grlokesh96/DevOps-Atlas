---
title: "Linux Shell Scripting Essentials"
description: "Practical bash patterns for DevOps automation — strict mode, argument parsing, logging, error handling and safe file handling."
type: "article"
category: "Linux"
tags:
  - Linux
  - Bash
  - Automation
  - Scripting
difficulty: "Beginner"
published: true
date: "2026-07-20"
---

# Linux Shell Scripting Essentials

Most infrastructure glue is bash. Written carefully, it is short, portable and debuggable.

## Strict Mode Is Non-negotiable

```bash
#!/usr/bin/env bash
set -euo pipefail
IFS=$'\n\t'
```

- `-e` — exit on any command failure
- `-u` — treat unset variables as errors
- `-o pipefail` — a failure anywhere in a pipeline fails the pipeline

## Argument Parsing

```bash
usage() { echo "Usage: $0 [-e env] [-t tag]" >&2; exit 1; }

env="dev"
tag="latest"
while getopts "e:t:h" opt; do
  case "$opt" in
    e) env="$OPTARG" ;;
    t) tag="$OPTARG" ;;
    h|*) usage ;;
  esac
done
```

## Logging Helper

```bash
log()  { printf '%s [INFO] %s\n'  "$(date -u +%FT%TZ)" "$*" >&2; }
err()  { printf '%s [ERROR] %s\n' "$(date -u +%FT%TZ)" "$*" >&2; }

log "deploying $env with tag $tag"
```

## Error Handling With Traps

```bash
cleanup() { rm -rf "$tmpdir"; }
trap cleanup EXIT INT TERM

tmpdir="$(mktemp -d)"
```

## Safe File Processing

```bash
while IFS= read -r line; do
  echo "$line"
done < servers.txt
```

> Never `for line in $(cat file)`. Word splitting will corrupt anything with spaces.

## Idempotent Operations

```bash
ensure_user() {
  id -u "$1" &>/dev/null || useradd -m -s /bin/bash "$1"
}
```

Run it a hundred times; state stays the same.

## Testing Scripts

```bash
bash -n deploy.sh      # syntax check
shellcheck deploy.sh   # lint
shfmt -d deploy.sh     # formatting
```

## Quick Reference

| Pattern | Purpose |
| --- | --- |
| `set -euo pipefail` | Strict error handling |
| `trap cleanup EXIT` | Guaranteed cleanup |
| `command -v x` | Portable existence check |
| `${var:-default}` | Default value |
| `[[ ... ]]` | Safe string/glob tests |

## Key Takeaways

Strict mode, `shellcheck`, traps and quoted variables prevent most production bash incidents. Automate the boring stuff — but let a real language own complex logic.
