---
title: "Troubleshooting: EC2 SSH Connection Timeout"
description: "Structured runbook for SSH to EC2 instances timing out — network, security group, key and route causes."
type: "troubleshooting"
category: "AWS"
tags:
  - AWS
  - EC2
  - Troubleshooting
  - Networking
difficulty: "Beginner"
published: true
date: "2026-07-23"
---

# Troubleshooting: EC2 SSH Connection Timeout

## Problem

`ssh -i key.pem ec2-user@<ip>` hangs until it times out (`Connection timed out` or `Operation timed out`), while the instance is supposed to be running.

## Symptoms

- `ssh` prints `connect to host <ip> port 22: Connection timed out`
- AWS console shows the instance `running`
- `curl`/`ping` to the instance also fail from your network
- The instance works from inside the VPC (via SSM/bastion)
- Previously worked, then stopped after a change

## How to Diagnose

### 1. Confirm instance state and reachability

```bash
aws ec2 describe-instances --instance-ids i-0abc \
  --query 'Reservations[].Instances[].{State:State.Name,PublicIp:PublicIpAddress,Key:KeyName}'
aws ec2 get-instance-connect-endpoint? 2>/dev/null || true
```

### 2. Check the security group path

```bash
SG=$(aws ec2 describe-instances --instance-ids i-0abc \
  --query 'Reservations[].Instances[].SecurityGroups[].GroupId' --output text)
aws ec2 describe-security-group-ids --group-ids $SG \
  --query 'SecurityGroups[].IpPermissions[?FromPort==`22`]'
```

Verify: port 22 open, source is *your* current public IP (`curl https://checkip.amazonaws.com`), not `0.0.0.0/0` of a stale IP.

### 3. Check route / NACL / public IP

```bash
aws ec2 describe-route-tables --filters Name=association.subnet-id,Values=<subnet-id>
aws ec2 describe-network-acls --filters Name=association.subnet-id,Values=<subnet-id>
aws ec2 describe-instances --instance-ids i-0abc --query 'Reservations[].Instances[].PublicIpAddress'
```

### 4. Instance-side logs

```bash
# via Serial Console or SSM
aws ssm start-session --target i-0abc
sudo journalctl -u sshd -n 50
```

## Commands

```bash
# quick external probe
nc -vz -w 5 <public-ip> 22 || echo "blocked"
traceroute -T -p 22 <public-ip>

# fix source range temporarily (then restrict it!)
aws ec2 authorize-security-group-ingress --group-id $SG \
  --protocol tcp --port 22 --cidr "$(curl -s https://checkip.amazonaws.com)/32"
```

## Possible Causes

| Cause | How to confirm |
| --- | --- |
| Security group blocks your IP | No inbound rule matching `checkip` result |
| No public IP / auto-assign disabled | `PublicIpAddress` is empty |
| Route table missing IGW route | `0.0.0.0/0` does not target `igw-...` |
| NACL denies port 22 | Network ACL `DENY` entries precede allow |
| Wrong key / host moved to new IP | `UNPROTECTED PRIVATE KEY` warning, or IP reused by another instance |
| sshd not running / disk full | SSM/serial console shows sshd down or ENOSPC |
| Corporate VPN/firewall blocking 22 | Works from home network, not from office |

## Solution

### Security group

```bash
aws ec2 authorize-security-group-ingress --group-id sg-xxx \
  --ip-permissions '[{"IpProtocol":"tcp","FromPort":22,"ToPort":22,
   "IpRanges":[{"CidrIp":"<your-ip>/32"}]}]'
```

### No public IP

```bash
aws ec2 associate-address --instance-id i-0abc --allocation-id eipalloc-xxx
# or stop/start with "Auto-assign public IP" enabled on the subnet
```

### Broken route

```bash
IGW=$(aws ec2 describe-internet-gateways --query 'InternetGateways[].InternetGatewayId' --output text)
aws ec2 create-route --route-table-id rtb-xxx --destination-cidr-block 0.0.0.0/0 --gateway-id $IGW
```

### sshd down — use SSM instead

```bash
aws ssm start-session --target i-0abc
sudo systemctl enable --now sshd
```

## Prevention

- Lock SG rules to known CIDRs / prefix lists, never broad ranges
- Use AWS Systems Manager Session Manager (no port 22 needed at all)
- Tag EIPs and avoid reusing addresses across instances
- Monitor `Lost connection` / SSH auth failures in CloudTrail

## Verification

```bash
ssh -i key.pem -o ConnectTimeout=5 ec2-user@<ip> 'hostname && uptime'
```

Connection succeeds within a few seconds.
