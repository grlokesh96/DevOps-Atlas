---
title: "Troubleshooting: Docker Container Exits Immediately"
description: "Structured runbook for containers that start and instantly exit with code 0, 1 or 127."
type: "troubleshooting"
category: "Docker"
tags:
  - Docker
  - Troubleshooting
  - Containers
  - Debugging
difficulty: "Beginner"
published: true
date: "2026-07-02"
---

# Troubleshooting: Docker Container Exits Immediately

## Problem

`docker run` returns to the shell right away, `docker ps` never shows the container, and there is no output to inspect.

## Symptoms

- `docker ps -a` shows status `Exited (1) 2 seconds ago`
- The container ID prints but the shell prompt returns immediately
- Application never listens on its expected port
- `docker logs <id>` is empty or shows a short error line
- Restart loops appear in `docker inspect` (`RestartCount` climbing)

## How to Diagnose

### 1. Read the exit code and logs

```bash
docker ps -a --filter id=<id>
docker logs -t <id>
docker inspect <id> --format='exit={{.State.ExitCode}} error={{.State.Error}} oom={{.State.OOMKilled}}'
```

### 2. Check the command the image actually runs

```bash
docker inspect <image> --format='{{json .Config.Cmd}} {{json .Config.Entrypoint}} {{.Config.WorkingDir}}'
```

### 3. Start an interactive shell instead

```bash
docker run --rm -it --entrypoint sh <image>
# or for distroless-ish images, override the command
docker run --rm -it <image> sh
```

### 4. Confirm required files exist

```bash
docker run --rm <image> ls -la /app
```

## Commands

```bash
# one-shot triage
ID=$(docker run -d --name probe <image> 2>/dev/null || true)
sleep 2
docker ps -a --filter name=probe
docker logs probe
docker inspect probe --format='{{.State.ExitCode}} {{.State.Error}}'
docker rm -f probe
```

## Possible Causes

| Exit code | Cause |
| --- | --- |
| `0` | CMD ran a one-shot task (script finished) — expected behavior |
| `1` | App crashed: missing env var, bad config, unhandled exception |
| `126` | Entrypoint not executable (wrong file mode) |
| `127` | Command or shared library not found (`python` vs `python3`) |
| `139` | Segfault inside the app |
| `137` | OOMKilled — container exceeded memory limit |

## Solution

### One-shot CMD (exit 0)

Make the process stay in the foreground:

```dockerfile
CMD ["nginx", "-g", "daemon off;"]
# instead of CMD ["nginx"] which daemonizes and exits
```

### Missing dependency or wrong command (126/127)

```dockerfile
RUN chmod +x /app/entrypoint.sh
# install the runtime the CMD expects
RUN apt-get update && apt-get install -y --no-install-recommends curl
```

### Crash on boot (exit 1)

```bash
docker run --rm -e ENV_NOT_SET=1 <image>   # add missing vars
docker logs <id> 2>&1 | head -50           # fix the reported error
```

### OOMKilled (137)

```bash
docker run -m 512m <image>     # raise the limit, or reduce app usage
```

## Prevention

- Run long-running services in the foreground; use a proper init (`--init`) for signal handling
- Pin runtime versions in the image (`python3.12` not `python`)
- Add a `HEALTHCHECK` and let orchestration restart on failure
- Validate required env vars at container start with a clear error message
- Keep image layers small so `docker run` cycles stay fast during debugging

## Verification

```bash
docker run -d --name check <image>
sleep 5
docker ps --filter name=check   # STATUS: Up (healthy)
docker logs check               # startup messages, no stack traces
docker rm -f check
```

The container stays `Up` and passes its health check.
