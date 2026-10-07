export interface AtlasCommand {
  id: string;
  group: string;
  command: string;
  description: string;
}

export const COMMAND_ATLAS: AtlasCommand[] = [
  // Kubernetes
  { id: "k1", group: "Kubernetes", command: "kubectl get pods -A -o wide", description: "List every pod across namespaces with node and IP details." },
  { id: "k2", group: "Kubernetes", command: "kubectl describe pod <pod> -n <ns>", description: "Full pod spec plus events — first stop for any pod issue." },
  { id: "k3", group: "Kubernetes", command: "kubectl logs <pod> -n <ns> --previous --tail=100", description: "Logs from the previous container before the last restart." },
  { id: "k4", group: "Kubernetes", command: "kubectl top pods -A --sort-by=memory", description: "Real CPU/memory usage per pod (requires metrics-server)." },
  { id: "k5", group: "Kubernetes", command: "kubectl get events -n <ns> --sort-by=.lastTimestamp", description: "Chronological cluster events for a namespace." },
  { id: "k6", group: "Kubernetes", command: "kubectl rollout status deploy/<name> -n <ns>", description: "Watch a deployment rollout until it completes or fails." },
  { id: "k7", group: "Kubernetes", command: "kubectl rollout undo deploy/<name> -n <ns>", description: "Roll back a deployment to its previous revision." },
  { id: "k8", group: "Kubernetes", command: "kubectl set image deploy/<name> app=<repo>:<tag> -n <ns>", description: "Change the image tag for the container named app." },
  { id: "k9", group: "Kubernetes", command: "kubectl exec -it <pod> -n <ns> -- sh", description: "Interactive shell inside a running container." },
  { id: "k10", group: "Kubernetes", command: "kubectl port-forward svc/<name> 8080:80 -n <ns>", description: "Forward a local port to a service for quick testing." },
  { id: "k11", group: "Kubernetes", command: "kubectl get ingress -A -o custom-columns=NAME:.metadata.name,HOST:.spec.rules[*].host", description: "List all ingress hosts in the cluster." },
  { id: "k12", group: "Kubernetes", command: "kubectl apply -f manifest.yaml --dry-run=server", description: "Server-side validation of a manifest without changing anything." },
  { id: "k13", group: "Kubernetes", command: "kubectl get deploy,statefulset,daemonset -A", description: "Overview of all workload controllers." },
  { id: "k14", group: "Kubernetes", command: "kubectl scale deploy/<name> --replicas=3 -n <ns>", description: "Scale a deployment up or down." },
  { id: "k15", group: "Kubernetes", command: "kubectl get pod <pod> -o jsonpath='{.status.containerStatuses[0].lastState}'", description: "Inspect why the container last terminated." },
  { id: "k16", group: "Kubernetes", command: "kubectl config use-context <context>", description: "Switch the active cluster context." },

  // Docker
  { id: "d1", group: "Docker", command: "docker ps -a --format 'table {{.Names}}\t{{.Status}}\t{{.Image}}'", description: "Readable table of all containers including stopped ones." },
  { id: "d2", group: "Docker", command: "docker logs -f --tail=100 <container>", description: "Follow the last 100 lines of container logs." },
  { id: "d3", group: "Docker", command: "docker exec -it <container> sh", description: "Open a shell in a running container." },
  { id: "d4", group: "Docker", command: "docker stats --no-stream", description: "One-shot snapshot of container CPU/memory usage." },
  { id: "d5", group: "Docker", command: "docker system df -v", description: "Detailed image, container and cache disk usage." },
  { id: "d6", group: "Docker", command: "docker image prune -a --filter 'until=168h'", description: "Remove images unused for more than 7 days." },
  { id: "d7", group: "Docker", command: "docker build -t app:1.0.0 --target runtime .", description: "Build a specific multi-stage target." },
  { id: "d8", group: "Docker", command: "docker compose up -d --build", description: "Rebuild and start the compose stack detached." },
  { id: "d9", group: "Docker", command: "docker compose logs -f <service>", description: "Follow logs for one compose service." },
  { id: "d10", group: "Docker", command: "docker inspect <container> --format '{{json .State}}'", description: "Exit code, OOM flag and error of a container." },
  { id: "d11", group: "Docker", command: "docker run --rm -it --entrypoint sh <image>", description: "Debug an image by dropping into a shell." },
  { id: "d12", group: "Docker", command: "docker cp <container>:/path/file ./file", description: "Copy a file out of a container." },
  { id: "d13", group: "Docker", command: "docker tag <image> <registry>/<repo>:<tag>", description: "Tag an image for pushing to a registry." },
  { id: "d14", group: "Docker", command: "docker push <registry>/<repo>:<tag>", description: "Push a tagged image to its registry." },

  // Linux
  { id: "l1", group: "Linux", command: "df -h && df -i", description: "Filesystem space and inode usage at a glance." },
  { id: "l2", group: "Linux", command: "du -xh --max-depth=2 / 2>/dev/null | sort -rh | head -20", description: "Find what is consuming disk space." },
  { id: "l3", group: "Linux", command: "ps -eo pid,pcpu,pmem,etime,cmd --sort=-pcpu | head", description: "Top CPU consumers with elapsed run time." },
  { id: "l4", group: "Linux", command: "ss -tulpn", description: "Listening sockets with owning processes." },
  { id: "l5", group: "Linux", command: "journalctl -u <service> -n 100 --no-pager", description: "Last 100 log lines of a systemd unit." },
  { id: "l6", group: "Linux", command: "journalctl --since '1 hour ago' -p err", description: "Error-level journal entries from the last hour." },
  { id: "l7", group: "Linux", command: "top -o %CPU", description: "Live process view sorted by CPU." },
  { id: "l8", group: "Linux", command: "lsof +L1 | head", description: "Processes holding deleted-but-open files." },
  { id: "l9", group: "Linux", command: "tail -f /var/log/syslog", description: "Follow the system log in real time." },
  { id: "l10", group: "Linux", command: "uptime && vmstat 1 5", description: "Load average plus CPU/IO run queue samples." },
  { id: "l11", group: "Linux", command: "free -h", description: "Memory and swap usage in human units." },
  { id: "l12", group: "Linux", command: "sudo lsof -i :443", description: "Which process owns port 443." },
  { id: "l13", group: "Linux", command: "chmod +x script.sh && chown user:group file", description: "Fix executable bit and ownership." },
  { id: "l14", group: "Linux", command: "tar -czf backup.tar.gz /data && tar -xzf backup.tar.gz", description: "Create and extract gzip archives." },

  // Git
  { id: "g1", group: "Git", command: "git log --oneline --graph --decorate -15", description: "Compact decorated history graph." },
  { id: "g2", group: "Git", command: "git status -sb", description: "Short branch-aware working tree status." },
  { id: "g3", group: "Git", command: "git fetch --prune origin", description: "Update remotes and drop deleted branches." },
  { id: "g4", group: "Git", command: "git diff --staged", description: "Review exactly what will be committed." },
  { id: "g5", group: "Git", command: "git rebase -i origin/main", description: "Interactive rebase to clean up commits." },
  { id: "g6", group: "Git", command: "git reset --soft HEAD~1", description: "Undo last commit, keep changes staged." },
  { id: "g7", group: "Git", command: "git blame -L 10,30 file.py", description: "Who changed which lines of a file." },
  { id: "g8", group: "Git", command: "git stash push -u -m 'wip'", description: "Stash tracked and untracked changes with a message." },
  { id: "g9", group: "Git", command: "git cherry-pick <sha>", description: "Apply a specific commit onto the current branch." },
  { id: "g10", group: "Git", command: "git clean -nd", description: "Dry-run of untracked files that would be deleted." },
  { id: "g11", group: "Git", command: "git remote -v", description: "Show configured remote URLs." },
  { id: "g12", group: "Git", command: "git bisect start && git bisect bad && git bisect good <sha>", description: "Binary-search history for the commit that broke something." },

  // Networking
  { id: "n1", group: "Networking", command: "curl -sv https://example.com -o /dev/null", description: "Verbose request showing DNS, TLS and headers." },
  { id: "n2", group: "Networking", command: "dig +short example.com A", description: "Quick A-record lookup." },
  { id: "n3", group: "Networking", command: "nslookup example.com", description: "DNS lookup with resolver diagnostics." },
  { id: "n4", group: "Networking", command: "ss -tulpn | grep :8080", description: "Check whether port 8080 is in use and by what." },
  { id: "n5", group: "Networking", command: "traceroute -T -p 443 example.com", description: "TCP traceroute to find where traffic drops." },
  { id: "n6", group: "Networking", command: "ping -c 4 10.0.0.1", description: "Four-packet latency and loss check." },
  { id: "n7", group: "Networking", command: "ip addr show && ip route", description: "Interfaces, addresses and routing table." },
  { id: "n8", group: "Networking", command: "tcpdump -i eth0 port 443 -nn -c 50", description: "Capture 50 HTTPS packets without name resolution." },
  { id: "n9", group: "Networking", command: "openssl s_client -connect example.com:443 -servername example.com", description: "Inspect the served TLS certificate and chain." },
  { id: "n10", group: "Networking", command: "nc -vz host 5432", description: "Test TCP connectivity to a database port." },
  { id: "n11", group: "Networking", command: "mtr --report example.com", description: "Combined ping/traceroute report per hop." },
  { id: "n12", group: "Networking", command: "curl -sI http://example.com | head", description: "Fetch response headers only." },

  // AWS CLI
  { id: "a1", group: "AWS CLI", command: "aws sts get-caller-identity", description: "Who am I — account, ARN and user ID." },
  { id: "a2", group: "AWS CLI", command: "aws ec2 describe-instances --filters Name=instance-state-name,Values=running --query 'Reservations[].Instances[].{Id:InstanceId,Ip:PublicIpAddress,Name:Tags[?Key==`Name`].Value|[0]}' --output table", description: "Table of running instances with name and public IP." },
  { id: "a3", group: "AWS CLI", command: "aws s3 ls s3://bucket/ --recursive --human-readable", description: "List bucket contents with sizes." },
  { id: "a4", group: "AWS CLI", command: "aws logs tail /aws/lambda/fn --since 30m --follow", description: "Follow recent CloudWatch logs of a function." },
  { id: "a5", group: "AWS CLI", command: "aws eks update-kubeconfig --name <cluster> --region <region>", description: "Fetch cluster credentials into kubeconfig." },
  { id: "a6", group: "AWS CLI", command: "aws cloudformation describe-stacks --stack-name <stack>", description: "Stack status, outputs and failure reason." },
  { id: "a7", group: "AWS CLI", command: "aws iam simulate-principal-policy --policy-source-arn <arn> --action-names s3:GetObject --resource-arns 'arn:aws:s3:::bucket/*'", description: "Does this identity actually have this permission?" },
  { id: "a8", group: "AWS CLI", command: "aws ec2 describe-security-groups --group-ids <sg> --query 'SecurityGroups[].IpPermissions'", description: "Show inbound rules of a security group." },
  { id: "a9", group: "AWS CLI", command: "aws route53 list-resource-record-sets --hosted-zone-id <zone>", description: "Dump DNS records of a hosted zone." },
  { id: "a10", group: "AWS CLI", command: "aws rds describe-db-instances --query 'DBInstances[].{Id:DBInstanceIdentifier,Status:DBInstanceStatus,Class:DBInstanceClass}' --output table", description: "RDS instance status table." },

  // Terraform
  { id: "t1", group: "Terraform", command: "terraform init -upgrade", description: "Initialise and pull newest allowed provider versions." },
  { id: "t2", group: "Terraform", command: "terraform plan -detailed-exitcode -out=tf.plan", description: "Plan to file; exit 2 means changes present." },
  { id: "t3", group: "Terraform", command: "terraform show -json tf.plan | jq '.resource_changes[].change.actions'", description: "Machine-readable list of planned actions." },
  { id: "t4", group: "Terraform", command: "terraform state list | grep <name>", description: "Find whether a resource is in state." },
  { id: "t5", group: "Terraform", command: "terraform state show <address>", description: "Attributes Terraform has stored for a resource." },
  { id: "t6", group: "Terraform", command: "terraform import <address> <id>", description: "Bring an existing cloud resource into state." },
  { id: "t7", group: "Terraform", command: "terraform apply tf.plan", description: "Apply exactly the plan that was reviewed." },
  { id: "t8", group: "Terraform", command: "terraform force-unlock <LOCK-ID>", description: "Release a stale state lock after verifying no one is running." },
  { id: "t9", group: "Terraform", command: "terraform validate", description: "Syntax and internal consistency check." },
  { id: "t10", group: "Terraform", command: "terraform fmt -recursive -check", description: "CI check that all HCL is formatted." },
  { id: "t11", group: "Terraform", command: "terraform output -raw <name>", description: "Read one output value without decoration." },
  { id: "t12", group: "Terraform", command: "terraform providers schema -json > schema.json", description: "Dump provider schemas for attribute lookups." },

  // Observability
  { id: "o1", group: "Observability", command: "promtool check config prometheus.yml", description: "Validate Prometheus config before reloading." },
  { id: "o2", group: "Observability", command: "curl -sX POST localhost:9090/-/reload", description: "Hot-reload Prometheus configuration." },
  { id: "o3", group: "Observability", command: "promtool query instant http://localhost:9090 'up == 0'", description: "Find targets currently down." },
  { id: "o4", group: "Observability", command: "curl -s localhost:9090/api/v1/targets | jq '.data.activeTargets[] | select(.health!=\"up\") | {job: .labels.job, err: .lastError}'", description: "Scrape errors for every unhealthy target." },
  { id: "o5", group: "Observability", command: "journalctl -u prometheus --since today | grep -i error", description: "Prometheus server errors today." },
  { id: "o6", group: "Observability", command: "kubectl get prometheusrule -A", description: "List PrometheusRule files (alerting rules) in the cluster." },
  { id: "o7", group: "Observability", command: "amtool silences --alertmanager.url=http://localhost:9093", description: "List active alertmanager silences." },
  { id: "o8", group: "Observability", command: "logcli query '{app=\"api\"} |= \"error\"' --limit=20", description: "Query Loki logs from the CLI." },
];

export const COMMAND_GROUPS: string[] = Array.from(
  new Set(COMMAND_ATLAS.map((c) => c.group)),
);
