---
title: "Linux Troubleshooting Commands"
description: "A field guide of Linux commands for CPU, memory, disk and network incidents on servers and nodes."
type: "command"
category: "Linux"
tags:
  - Linux
  - Commands
  - Troubleshooting
  - Performance
difficulty: "Beginner"
published: true
date: "2026-07-26"
---

# Linux Troubleshooting Commands

Field guide for incident response on Linux hosts — ordered by subsystem.

## First 60 Seconds

```bash
uptime                          # load average vs core count
dmesg -T | tail -50             # kernel messages
journalctl -p err -b --no-pager # errors since boot
free -h && df -h                # memory and disk at a glance
```

## CPU

```bash
top -o %CPU                     # or htop
pidstat 1 5                     # per-process CPU over 5 samples
mpstat -P ALL 1                 # per-core saturation
perf top                        # hot functions (if installed)
```

Load high but CPU idle? Look at iowait (`iostat -x 1`) or uninterruptible tasks (`ps -eo state,pid,cmd | grep D`).

## Memory

```bash
free -h
smem -t -k -s rss               # proportional memory per process
cat /proc/meminfo | head
dmesg | grep -i oom             # OOM killer events
```

## Disk

```bash
df -hT
iostat -x 1                     # %util, await
lsof +L1                        # deleted-but-open files eating space
du -xhd1 /var/log | sort -h     # where the space went
fuser -v /mount/point           # who is blocking unmount
```

## Network

```bash
ss -tulpn
ip route get 8.8.8.8
nstat -az | grep -i drop        # kernel drop counters
conntrack -C                    # conntrack table usage vs limit
tcpdump -i any -nn 'port 443'   # on-the-wire truth
```

## Process and File Descriptors

```bash
ps -eo pid,ppid,stat,etime,cmd --sort=-etime
cat /proc/$(pgrep -f app)/limits | grep -i 'open files'
lsof -p $(pgrep -f app) | wc -l
```

## Service State

```bash
systemctl status app --no-pager
journalctl -u app --since "10 min ago" -f
```

## Incident Checklist

| Symptom | First command |
| --- | --- |
| Service unreachable | `ss -tulpn` |
| Slow disk | `iostat -x 1` |
| OOM kills | `dmesg \| grep -i oom` |
| DNS failures | `resolvectl query <name>` |
| High load, idle CPU | `ps -eo state,cmd \| grep ^D` |
| Node NotReady | `journalctl -u kubelet -b` |

> Capture evidence before restarting: `journalctl -b > boot.log`. Restarting first destroys the only clue you had.
