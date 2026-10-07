---
title: "Troubleshooting: High CPU Load on Linux"
description: "Structured runbook for load averages and CPU saturation — finding the process that is burning cycles."
type: "troubleshooting"
category: "Linux"
tags:
  - Linux
  - Troubleshooting
  - Performance
  - Monitoring
difficulty: "Intermediate"
published: true
date: "2026-06-25"
---

# Troubleshooting: High CPU Load on Linux

## Problem

The host feels slow, load average far exceeds core count, and latency-sensitive services time out. Sometimes the box is fine and only one process hogs the CPU.

## Symptoms

- `uptime` shows load average much higher than CPU core count
- `top` shows one or more processes at 90–1000% CPU
- Application p99 latency rises; health checks time out
- `run queue` non-empty (`r` column high in `top`)
- CPU steal high on virtualised/cloud instances

## How to Diagnose

### 1. Confirm saturation vs single-process hog

```bash
uptime
mpstat -P ALL 1 5
vmstat 1 5
```

| Metric | Reading |
| --- | --- |
| `load > cores`, `r` queue deep | Real saturation |
| One PID at many 100% | Single-threaded hog |
| `st` high in `mpstat` | Hypervisor CPU steal — noisy neighbour |
| `wa` high | Disk-bound, not CPU-bound |

### 2. Identify the culprits

```bash
top -o %CPU -bn1 | head -20
ps -eo pid,ppid,user,pcpu,pmem,etime,cmd --sort=-pcpu | head -15
pidstat 1 5
```

### 3. Profile deeper if it is one process

```bash
# Java
jstack <pid> > stack.txt      # sample twice, diff

# native / Python / Node — FlameGraph or perf
perf top -p <pid>
perf record -g -p <pid> -- sleep 30 && perf report

# Python
py-spy dump --pid <pid>
```

### 4. Check throttling (containers)

```bash
cat /sys/fs/cgroup/cpu.stat    # nr_throttled climbing = CPU quota hit
kubectl top pod -n <ns> --containers
```

## Commands

```bash
# 30-second triage script
uptime; echo ---
mpstat -P ALL 1 3 | tail -4; echo ---
ps -eo pid,pcpu,pmem,etime,cmd --sort=-pcpu | head -10; echo ---
pidstat 1 3 2>/dev/null | tail -15 || true
```

## Possible Causes

| Cause | Confirmation |
| --- | --- |
| Runaway process / infinite loop | One PID pinned at 100%+ |
| Traffic spike or DoS | Correlate with RPS metrics; many worker threads busy |
| CPU quota too low for the pod | `cpu.stat` throttling, no single hot thread |
| Cryptominer or noisy neighbour | Unexpected binary, high `st` in `mpstat` |
| GC storm (JVM) or event-loop block | `jstack`/`py-spy` shows GC or hot function |
| Missing resource limits | Multiple pods each using unbounded CPU |

## Solution

### Single runaway process

```bash
kill -TERM <pid>          # graceful first
kill -9 <pid>             # only if it ignores TERM
sudo systemctl restart <service>
```

### Quota / limits

```bash
# Kubernetes
kubectl set resources deploy/<name> --limits=cpu=1 --requests=cpu=500m -n <ns>
# systemd
sudo systemctl set-property <service>.service CPUQuota=200%
```

### Code-level hot spot

- Fix the hot function (N+1 queries, unbounded loops, regex backtracking)
- Add caching or horizontal replicas
- For GC: raise heap or reduce allocation rate

### Cloud instance noise

```bash
# move to a dedicated/burstable-free instance type, or another host
```

## Prevention

- Set CPU requests/limits on every workload and alert on throttling
- Track load vs cores (`load1 / cores`) with an alert at 0.8
- Enable continuous profiling in staging/prod
- Rate-limit expensive endpoints; keep autoscaling policies tuned

## Verification

```bash
uptime                        # load back under core count
mpstat 1 5 | tail -1          # idle high, no single core pegged
kubectl top pods -n <ns>      # usage under limits, no throttling spikes
```

Latency metrics return to baseline.
