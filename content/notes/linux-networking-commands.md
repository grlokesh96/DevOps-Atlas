---
title: "Linux Networking Commands"
description: "Quick-reference networking commands for Linux hosts — interfaces, routes, DNS, sockets and packet capture."
type: "note"
category: "Linux"
tags:
  - Linux
  - Networking
  - Troubleshooting
  - Commands
difficulty: "Beginner"
published: true
date: "2026-09-18"
---

# Linux Networking Commands

Reference note for day-to-day connectivity debugging on Linux hosts.

## Interfaces and Addresses

```bash
ip -br addr show          # compact interface list
ip addr show eth0         # detail for one interface
ip link set eth0 up       # enable interface
nmcli device status       # NetworkManager state
```

## Routes and Neighbors

```bash
ip route show             # routing table
ip route get 8.8.8.8      # which route/packet path
ip neigh show             # ARP/NDP cache
```

## DNS

```bash
resolvectl status          # systemd-resolved state
resolvectl query kubernetes.default.svc.cluster.local
cat /etc/resolv.conf
dig +short example.com @1.1.1.1
```

## Sockets and Ports

```bash
ss -tulpn                  # listening TCP/UDP sockets
ss -tn state established    # established connections
lsof -i :8080              # process holding a port
netstat -s | grep -i drop   # protocol counters (if netstat exists)
```

## Connectivity Testing

```bash
ping -c 3 10.0.1.10
nc -vz 10.0.1.10 6443
curl -sv https://example.com/healthz -o /dev/null
mtr -rw example.com        # continuous traceroute + loss
```

## Packet Capture

```bash
tcpdump -i eth0 -nn port 6443
tcpdump -i any -w capture.pcap 'host 10.0.1.10 and port 443'
```

## Troubleshooting Order

1. Link up? — `ip -br addr`
2. Address and route correct? — `ip route get`
3. DNS resolving? — `resolvectl query`
4. Port reachable? — `nc -vz`
5. What is actually on the wire? — `tcpdump`

> In Kubernetes, remember to check NetworkPolicies before blaming the host network stack.

## Quick Table

| Question | Command |
| --- | --- |
| What is my IP? | `ip -br addr` |
| Which port is open? | `ss -tulpn` |
| Who answered DNS? | `resolvectl query` |
| Is the packet leaving? | `tcpdump -i any` |
