---
title: "Troubleshooting: Disk Full (No Space Left on Device)"
description: "Structured runbook for Linux hosts and containers failing with ENOSPC / No space left on device."
type: "troubleshooting"
category: "Linux"
tags:
  - Linux
  - Troubleshooting
  - Storage
  - Debugging
difficulty: "Beginner"
published: true
date: "2026-06-18"
---

# Troubleshooting: Disk Full (No Space Left on Device)

## Problem

Writes fail with `No space left on device`, builds and deploys break, and services stop accepting new data even though the filesystem looks like it has room — or `df -h` shows 100%.

## Symptoms

- `No space left on device` in application, CI or `docker build` logs
- `df -h` shows a mount at 100%, or at low usage while writes still fail
- Logs stop rotating; `/var/log/syslog` grows unbounded
- Databases refuse writes (PostgreSQL `could not write to file "..."`)
- `docker pull` or `journald` fails with ENOSPC

## How to Diagnose

### 1. Distinguish filesystem vs inode exhaustion

```bash
df -h
df -i          # inodes at 100% even when space is free
```

### 2. Find what consumes the space

```bash
du -xh --max-depth=2 / 2>/dev/null | sort -rh | head -20
du -sh /var/log /var/lib/docker /var/lib/journal 2>/dev/null
```

### 3. Find deleted-but-open files (space not released)

```bash
sudo lsof +L1 | awk '$7 > 1048576 {printf "%-20s %8.1fGB %s\n", $1, $7/1073741824, $NF}'
```

### 4. Docker-specific check

```bash
docker system df -v | head -30
```

## Commands

```bash
# quick sweep
df -h && df -i
du -xh --max-depth=2 / 2>/dev/null | sort -rh | head -20

# truncate a log held open by a process without restarting it
sudo truncate -s 0 /var/log/syslog

# reclaim docker space (verify what you delete first!)
docker system df
docker container prune -f
docker image prune -f
```

## Possible Causes

| Cause | How to confirm |
| --- | --- |
| Log growth without rotation | `/var/log/*` dominates `du` output |
| Inode exhaustion (many tiny files) | `df -i` at 100% |
| Deleted files still held open | `lsof +L1` shows large deleted files |
| Docker images/build cache | `/var/lib/docker` large, `docker system df` heavy |
| Full journal | `journalctl --disk-usage` near limit |
| No space on `/tmp` or `/var` partition | Separate small mount at 100% |
| Log volume full in a pod | Pod event `Failed to write to log file` |

## Solution

### Logs

```bash
sudo journalctl --vacuum-size=500M
sudo truncate -s 0 /var/log/syslog
# enforce rotation in /etc/logrotate.d/app
sudo logrotate -f /etc/logrotate.conf
```

### Docker reclaim

```bash
docker container prune -f
docker image prune -a -f --filter "until=168h"
docker builder prune -f
```

### Held-open deleted files

```bash
# restart the owning service so the inode is released
sudo systemctl restart <service>
```

### Inodes

```bash
find /var/lib/<dir> -type f -mtime +90 -delete   # target the many-small-files dir
```

### Structural fix

```bash
sudo lvextend -L+10G /dev/mapper/vg0-root && sudo resize2fs /dev/mapper/vg0-root
# or mount a dedicated volume / grow the node volume
```

## Prevention

- Enable `logrotate` for every service and cap journald (`SystemMaxUse=500M`)
- Set Docker `log-driver: json-file` with `max-size`/`max-file` in `daemon.json`
- Alert at 80% disk and 80% inodes (`node_filesystem_avail_bytes`, `node_filesystem_files_free`)
- Run `docker system prune` on a weekly schedule
- Give `/var/lib/docker` and logs their own partitions

## Verification

```bash
df -h / && df -i /
journalctl --disk-usage
docker system df
```

Usage drops below the alert threshold and the failing write succeeds.
