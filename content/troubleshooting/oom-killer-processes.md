---
title: "Troubleshooting: OOM Killer Terminating Processes"
description: "Structured runbook for processes killed with exit 137 / Segmentation fault and dmesg OOM-killer events."
type: "troubleshooting"
category: "Linux"
tags:
  - Linux
  - Troubleshooting
  - Memory
  - Debugging
difficulty: "Intermediate"
published: true
date: "2026-07-16"
---

# Troubleshooting: OOM Killer Terminating Processes

## Problem

Services die unexpectedly with exit code 137, `Killed`, or `OOMKilled`, especially under load. The kernel's OOM killer selects a victim and terminates it to protect the system.

## Symptoms

- Process exits with status `137` or shell prints `Killed`
- `dmesg -T | grep -i "out of memory"` shows `Killed process ... (oom-kill)`
- `kubectl describe pod` shows `Last State: Terminated, Reason: OOMKilled`
- Memory graphs show usage climbing to the limit before each restart
- Swap heavily used (`free -h` shows swap filling)

## How to Diagnose

### 1. Confirm the kernel killed it

```bash
dmesg -T | grep -iE "oom|killed process" | tail -20
journalctl -k --since "1 hour ago" | grep -i oom
```

### 2. Compare usage against limits

```bash
free -h
ps -eo pid,rss,pmem,cmd --sort=-rss | head -15
systemctl status <service> | grep -E "Memory|Tasks"
```

### 3. Container / Kubernetes check

```bash
kubectl describe pod <pod> -n <ns> | grep -A4 "Last State"
kubectl get pod <pod> -n <ns> -o jsonpath='{.status.containerStatuses[0].lastState.terminated}'; echo
kubectl top pod <pod> -n <ns> --containers
```

### 4. Watch the climb

```bash
# host
watch -n2 'free -m; ps -eo pid,rss,cmd --sort=-rss | head -8'
# pod
kubectl top pod <pod> -n <ns> --watch
```

## Commands

```bash
# history of oom kills
sudo dmesg -T | grep -i "out of memory"

# who is eating memory now
ps -eo pid,user,rss,cmd --sort=-rss | awk 'NR<=16 {printf "%-8s %-8s %6.1fGB %s\n", $1,$2,$3/1048576, substr($0,index($0,$4))}'

# cgroup limits (containers)
cat /sys/fs/cgroup/memory.max 2>/dev/null || cat /sys/fs/cgroup/memory/memory.limit_in_bytes
cat /sys/fs/cgroup/memory.current 2>/dev/null || cat /sys/fs/cgroup/memory/memory.usage_in_bytes
```

## Possible Causes

| Cause | How to confirm |
| --- | --- |
| Container limit too low | RSS near `memory.max`; `OOMKilled` in pod state |
| Memory leak | RSS grows linearly over time without traffic correlation |
| Host genuinely full | `free -h` near zero, multiple processes large |
| Fork bomb / task storm | `ps` shows huge process count; `max tasks` events |
| Swap thrash on host | `si/so` high in `vmstat 1` |
| Shared memory `/dev/shm` too small | App errors on mmap before the kill |

## Solution

### Raise or right-size the limit

```bash
# Kubernetes
kubectl set resources deploy/<name> --limits=memory=1Gi --requests=memory=512Mi -n <ns>
# systemd
sudo systemctl set-property <service>.service MemoryMax=2G MemoryHigh=1800M
```

### Fix the leak

```bash
py-spy dump --pid <pid>              # Python
jmap -histo:live <pid> | head -20    # Java
```

Reproduce under load with `--max-old-space-size` (Node) or heap profiling, fix the retained objects.

### Host-level pressure

```bash
sudo swapoff -a && sudo swapon -a    # only with a plan; better: add RAM
sudo systemctl restart <heavy-service>
```

## Prevention

- Always set memory requests/limits; leave ~20% headroom below the limit
- Alert on container restarts with `OOMKilled` reason
- Set `vm.overcommit_memory=2` on stateful hosts
- Use heap/RSS limits inside the runtime (`--max-old-space-size`, `-Xmx`) aligned to cgroup limits
- Keep `memory.high` below `memory.max` to throttle instead of kill

## Verification

```bash
dmesg -T | grep -ci oom            # no new lines after the fix
kubectl get pod <pod> -n <ns>      # RESTARTS stops increasing
free -h                            # stable headroom
```

No new OOM events appear and restart counts freeze.
