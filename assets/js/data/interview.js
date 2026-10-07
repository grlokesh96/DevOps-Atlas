/* DevOps-Atlas — Interview Prep seed */
window.DA_SEED_INTERVIEW = [
{
  id: 'iv-aws', group: 'AWS', icon: '☁️', title: 'AWS',
  description: 'IAM, VPC, EKS, networking and cost questions asked most often.',
  questions: [
    { q: 'What is the difference between an IAM role and an IAM user?', a: 'A **user** has long-lived credentials (password, access keys). A **role** has no credentials of its own — it is assumed by someone else and issues **temporary** credentials. Roles are for workloads and cross-account access; users are for humans.' },
    { q: 'Explain VPC subnets: public vs private.', a: 'A **public** subnet has a route to an Internet Gateway. A **private** subnet has no IGW route — outbound traffic goes through a NAT Gateway. Control plane/worker tiers belong private; load balancers belong public.' },
    { q: 'How does an Application Load Balancer decide which target to use?', a: 'It evaluates **rules** (host, path, header) against listeners, picks a target group, then uses the **health check** to decide which targets in that group are eligible. Unhealthy targets are removed from rotation automatically.' },
    { q: 'What is the difference between horizontal and vertical scaling?', a: '**Horizontal** = add more instances (stateless, resilient). **Vertical** = bigger instance (simple, but a restart and a hard ceiling). Prefer horizontal for stateless services; vertical for databases.' },
    { q: 'How do you secure data at rest and in transit on S3?', a: 'At rest: SSE with KMS (`aws:kms`) plus bucket policy denying `aws:SecureTransport=false`. In transit: bucket policy with `"Bool": {"aws:SecureTransport": "false"}` → Deny, forcing HTTPS only.' },
    { q: 'What is the shared responsibility model?', a: 'AWS secures **of** the cloud (hardware, regions, hypervisor). You secure **in** the cloud (your data, IAM, network config, OS patching for EC2/EKS). For managed services the split moves further toward AWS.' },
    { q: 'How would you design a highly available static website?', a: 'S3 for origin + CloudFront with Origin Access Control, Route 53 for DNS, ACM certificate, and an error page mapping for SPAs. Optionally WAF in front. No servers, no patching.' },
    { q: 'What is an EKS node group and what does the CNI do?', a: 'A **node group** manages a set of EC2 instances with a shared AMI, IAM role and scaling config. The **AWS VPC CNI** assigns real VPC IPs to pods, so pods are first-class network citizens — which is why pod density is bounded by ENI limits.' },
    { q: 'How do you reduce AWS costs without breaking reliability?', a: 'Right-size from CloudWatch data, buy Savings Plans for steady-state compute, use S3 Intelligent-Tiering, delete unattached EBS and idle LBs, run stateless workloads on Spot with a 10–20% on-demand buffer, and set budget alerts.' }
  ]
},
{
  id: 'iv-kubernetes', group: 'Kubernetes', icon: '☸️', title: 'Kubernetes',
  description: 'Workloads, networking, scheduling, probes and troubleshooting.',
  questions: [
    { q: 'What happens when you run `kubectl apply`?', a: 'kubectl serialises the manifest → auth check via API server → admission controllers run → object persisted to **etcd** → controllers notice the new object and create pods → scheduler binds pods to nodes → kubelet on that node starts the containers.' },
    { q: 'Deployment vs StatefulSet vs DaemonSet?', a: '**Deployment**: stateless, rolling updates, interchangeable pods. **StatefulSet**: stable identity, ordered rollout, persistent storage. **DaemonSet**: exactly one pod per node (agents, log shippers, CNI).' },
    { q: 'Difference between readiness, liveness and startup probes?', a: '**Readiness** gates traffic. **Liveness** triggers restart. **Startup** protects slow-booting apps so liveness does not kill them during boot. Startup disables liveness until it succeeds.' },
    { q: 'How does a Service find its endpoints?', a: 'The **EndpointSlice** controller watches pods matching the Service selector and maintains the endpoint list. kube-proxy (iptables/eBPF) programs the rules that forward ClusterIP traffic to those endpoints.' },
    { q: 'What is a DaemonSet vs static pod?', a: 'A **DaemonSet** is cluster-managed by the controller plane. A **static pod** is defined directly on the node (`/etc/kubernetes/manifests`) and managed by kubelet only — that is how control-plane components run.' },
    { q: 'How do you troubleshoot a CrashLoopBackOff?', a: '1) `kubectl logs --previous`. 2) Read exit code (137 = OOM). 3) `describe` for events. 4) Check env/config mounts. 5) Reproduce locally. 6) Check probe timing if it dies right after becoming ready.' },
    { q: 'What are taints and tolerations?', a: 'A **taint** repels pods that do not tolerate it (e.g. `dedicated=batch:NoSchedule`). A **toleration** lets a pod opt in. Taints push workloads away; node **affinity** pulls them toward nodes.' },
    { q: 'Explain resource requests vs limits.', a: '**Requests** are what the scheduler reserves — they drive placement. **Limits** are the ceiling; exceeding memory triggers OOMKill, exceeding CPU causes throttling. Ratio between them decides how bursty a pod can be.' },
    { q: 'What is a Pod Disruption Budget?', a: '`minAvailable`/`maxUnavailable` constrains **voluntary** disruptions (drain, upgrade). It does not protect against node failure — that is what replicas and anti-affinity are for.' },
    { q: 'How do Secrets differ from ConfigMaps?', a: 'Both are key/value mounts. Secrets are base64, stored in etcd (optionally encrypted with KMS), and surfaced in API objects. ConfigMaps hold non-sensitive config. Neither is truly encrypted by default — treat Secrets as semi-sensitive, use External Secrets/Sealed Secrets for real material.' }
  ]
},
{
  id: 'iv-terraform', group: 'Terraform', icon: '🧱', title: 'Terraform',
  description: 'State, modules, plan/apply semantics and backend design.',
  questions: [
    { q: 'What is Terraform state and why does it exist?', a: 'State maps your config to real infrastructure IDs, tracks metadata, and lets Terraform compute diffs. Without it Terraform cannot know what it already created. It must be **shared**, **versioned** and **locked**.' },
    { q: 'How does state locking work?', a: 'Before any write, Terraform creates a lock entry (DynamoDB `LockID`, or the cloud provider equivalent). A second writer fails the conditional write and gets `Error acquiring the state lock`. The lock is released on completion or via `force-unlock`.' },
    { q: 'Plan vs Apply vs Destroy — and why save a plan?', a: '`plan` previews; `apply` executes; `destroy` removes. Saving with `-out=tfplan` freezes the exact set of actions so CI can `apply` the reviewed artifact rather than re-planning with different inputs.' },
    { q: 'How do you structure reusable Terraform code?', a: 'Root config per environment (small, explicit), **modules** for repeatable building blocks, `variables.tf` for inputs, `outputs.tf` for consumption. Avoid modules that hide the whole environment — keep the resource graph visible.' },
    { q: 'What is the difference between `count` and `for_each`?', a: '`count` is index-based and fragile when you reorder/delete items. `for_each` is keyed by a map/set, so removing one element only destroys that element. Prefer `for_each` for anything that can change independently.' },
    { q: 'How do you manage secrets in Terraform?', a: 'Never in `.tf` files or `tfvars`. Use data sources that read at plan time (`aws_secretsmanager_secret_version`), or SOPS/External Secrets for values, and mark sensitive outputs `sensitive = true`.' },
    { q: 'What causes "Provider configuration not present" errors?', a: 'Using `provider.x` inside a module with `configuration_aliases` that the root has not configured, or a `count`/`for_each` on the provider itself. Fix by declaring `providers = { aws = aws.replica }` when calling the module.' },
    { q: 'How do you test Terraform?', a: '1) `terraform validate` + `fmt -check` in CI. 2) `plan` against a real account in a sandbox and assert with `terraform show -json | jq`. 3) Terratest/OPA for policy checks. 4) `terraform plan` as a PR check to catch drift.' }
  ]
},
{
  id: 'iv-docker', group: 'Docker', icon: '🐳', title: 'Docker',
  description: 'Images, layers, networking, storage and security.',
  questions: [
    { q: 'Image vs container?', a: 'An **image** is a read-only set of layered filesystems plus metadata. A **container** is a running instance with a writable layer on top. You can run many containers from one image.' },
    { q: 'How does layer caching work?', a: 'Each instruction creates a layer. Docker reuses a cached layer **and all layers after it are skipped** if the instruction and its inputs are unchanged. That is why `COPY package*.json` must come before `COPY .`.' },
    { q: 'What does a multi-stage build give you?', a: 'Build tools stay in the earlier stage; only artifacts are copied forward. Result: a much smaller, cleaner runtime image and no compilers or secrets left behind.' },
    { q: 'Difference between `CMD` and `ENTRYPOINT`?', a: '`CMD` provides default arguments that `docker run args` **replaces**. `ENTRYPOINT` defines the executable; `docker run args` are **appended** to it. Combine them: entrypoint for the binary, cmd for defaults.' },
    { q: 'Bridge vs host vs none networking?', a: '**bridge** — default, isolated per-container veth pair with NAT. **host** — shares the host network namespace, fastest but no port isolation. **none** — no networking at all.' },
    { q: 'How do containers share data and why prefer volumes?', a: 'Bind mounts tie a host path (platform-dependent). **Volumes** are Docker-managed, portable, backed up by Docker, and outperform bind mounts on macOS/Windows.' },
    { q: 'How do you reduce image size and attack surface?', a: 'Alpine/distroless base, multi-stage, `.dockerignore`, drop unnecessary packages, run as non-root `USER`, pin digests, and scan with Trivy/Grype in CI.' },
    { q: 'What happens on `docker commit` vs a Dockerfile build?', a: '`commit` snapshots a running container into an opaque image (no history of what changed — avoid it). A Dockerfile build produces a reproducible, reviewable, cache-friendly image.' }
  ]
},
{
  id: 'iv-linux', group: 'Linux', icon: '🐧', title: 'Linux',
  description: 'Processes, filesystem, networking and performance basics.',
  questions: [
    { q: 'What is the difference between a thread and a process?', a: 'A process has its own address space; threads share the process address space but have their own stack and registers. Threads are cheaper to create and communicate via shared memory; processes isolate better.' },
    { q: 'Explain file descriptor 0, 1, 2.', a: '0 = stdin, 1 = stdout, 2 = stderr. That is why `2>&1` merges stderr into stdout and `>/dev/null 2>&1` silences everything.' },
    { q: '`kill -9` does not work. Why?', a: 'SIGKILL cannot be caught and the process dies — but if it is in **D** (uninterruptible) state waiting on I/O, it will not process the signal until the I/O completes. Fix the blocking call, not the signal.' },
    { q: 'What is load average really measuring?', a: 'The average number of tasks **running or in uninterruptible sleep** over 1/5/15 minutes. Load equal to core count means fully busy; load above that with high `iowait` usually means disk, not CPU.' },
    { q: 'What is a zombie process?', a: 'A process that exited but whose parent has not called `wait()` to read the exit status. It holds a PID but no memory. Fix by reaping (kill/ignore the parent) — it is harmless unless it accumulates.' },
    { q: 'How do you find which process owns a port?', a: '`ss -ltnp` or `lsof -i :PORT`. Both need privileges to show the PID of another user\'s process.' },
    { q: 'inode — what is it and what fills up?', a: 'An inode stores metadata (owner, permissions, size pointers) but not the filename. You can have free blocks but zero inodes — check with `df -i`. Typical culprits: millions of tiny files or orphaned logs.' },
    { q: 'What does `chmod 750 file` mean?', a: 'Owner rwx (7), group r-x (5), others --- (0). Numeric perms are octal sums of read=4, write=2, execute=1.' }
  ]
},
{
  id: 'iv-cicd', group: 'CI/CD', icon: '⚙️', title: 'CI/CD',
  description: 'Pipelines, branching, testing gates and deployment safety.',
  questions: [
    { q: 'What is the difference between CI and CD?', a: '**Continuous Integration**: every push is built and tested automatically. **Continuous Delivery**: every green build is releasable to production on demand. Continuous **Deployment** goes one step further — it releases automatically.' },
    { q: 'What should a good pipeline stages look like?', a: 'lint → unit tests → build image → scan → integration tests → push with digest → deploy to staging → smoke tests → manual/auto promotion to prod. Fail fast: cheapest checks first.' },
    { q: 'How do you make deployments safe?', a: 'Small batches, automated rollback, health checks, feature flags, canary/blue-green, and one-click revert tied to a commit SHA. Speed of recovery matters more than preventing every failure.' },
    { q: 'What is immutable infrastructure?', a: 'Never patch running servers — build a new image, replace the instances. It removes configuration drift and makes rollbacks trivial (`deploy the previous image`).' },
    { q: 'How should secrets be handled in CI?', a: 'Short-lived credentials via OIDC federation, scoped per environment, never in the repo or logs, and masked in output. Rotate automatically; never reuse a personal access key across pipelines.' },
    { q: 'What is the difference between artifact and image?', a: 'An **artifact** is a build output (jar, binary) stored in a registry like Artifactory/Nexus. An **image** is a container filesystem, versioned by tag/digest and deployed by the orchestrator. Most modern pipelines do both.' },
    { q: 'How do you keep CI fast?', a: 'Cache dependencies keyed on the lockfile, run jobs in parallel, fail-fast on the first error, use targeted test selection for PRs, and keep runners warm. Set `timeout-minutes` so a hung job does not consume the queue.' },
    { q: 'What is GitOps and how is it different from CI/CD?', a: 'CI/CD pipelines **push** changes into clusters. GitOps has an in-cluster agent **pull** from Git. Git becomes the single source of truth, drift is auto-corrected, and rollback is `git revert`.' }
  ]
},
{
  id: 'iv-devsecops', group: 'DevSecOps', icon: '🔐', title: 'DevSecOps',
  description: 'Shift-left security, scanning, supply chain and policy as code.',
  questions: [
    { q: 'What does "shift left" mean in security?', a: 'Move checks earlier — lint, SAST and dependency scanning in the IDE/PR instead of a security review weeks later. Cheaper to fix, faster feedback, and the developer still has context.' },
    { q: 'What is SAST vs DAST vs IAST?', a: '**SAST** — static, scans source/binaries without running it. **DAST** — dynamic, attacks a running app from outside. **IAST** — instruments the app and observes at runtime. You want all three at different stages.' },
    { q: 'How does container image signing work?', a: 'The build signs the image digest with a private key (cosign). Verifiers — CI or an admission webhook — check the signature against the public key (or a Fulcio/Rekor transparency log). Unsigned images are rejected at deploy time.' },
    { q: 'Explain a software bill of materials (SBOM).', a: 'A machine-readable inventory of every component in a build (name, version, license). It lets you answer "am I affected by CVE-X?" in seconds instead of reconstructing the dependency tree by hand.' },
    { q: 'What is least privilege and how do you enforce it?', a: 'Each identity gets only the actions it needs, on only the resources it needs. Enforce with scoped IAM policies, per-environment roles, permission boundaries, and periodic Access Analyzer reviews.' },
    { q: 'How do you prevent secrets from reaching Git?', a: '`gitleaks`/`trufflehog` as a pre-commit hook **and** a server-side scan, secret scanning enabled on the provider, and immediate rotation for anything that ever landed in history. Prevention is better, but rotation is mandatory.' },
    { q: 'What is policy as code?', a: 'Rules written as version-controlled, testable definitions — OPA/Rego, Kyverno, Checkov — evaluated in CI and at admission. Drift-free, reviewable, and they block bad infra the same way tests block bad code.' },
    { q: 'How do you handle a CVE in a base image?', a: 'Rebuild with the updated base, run the scan to confirm, push a new digest, roll out via GitOps, and verify. Pinning digests means you must rebuild deliberately — that is the trade-off for reproducibility.' }
  ]
},
{
  id: 'iv-sre', group: 'SRE', icon: '📈', title: 'SRE',
  description: 'SLOs, error budgets, incident response and postmortems.',
  questions: [
    { q: 'What is the difference between SLA, SLO and SLI?', a: '**SLI** is the measurement (e.g. availability %). **SLO** is the target for that measurement (99.9%). **SLA** is the contract with consequences (credits) if the SLO is missed. You set SLOs tighter than SLAs to leave headroom.' },
    { q: 'Explain error budgets.', a: 'A 99.9% SLO allows 43.2 minutes of downtime per month. That allowance is the budget — spend it on risky deploys while it exists, freeze changes when it is exhausted.' },
    { q: 'What is toil?', a: 'Manual, repetitive, automatable work that provides no lasting value. If it is not in a runbook an SRE can follow in minutes, it is not toil — it is a product gap.' },
    { q: 'How do you write a good alert?', a: 'It must be actionable, page a human, correlate to user impact, and have a documented response. Alert on **symptoms** (SLO burn rate), not causes (CPU). If nobody has ever acted on it, delete it.' },
    { q: 'What is a blameless postmortem?', a: 'A written review that focuses on **system conditions** that allowed a human mistake, not on who made it. Action items must be concrete, assigned and tracked to completion.' },
    { q: 'What is the difference between monitoring and observability?', a: 'Monitoring answers "is it broken?" with predefined dashboards and alerts. Observability answers "why?" by letting you ask new questions of high-cardinality data — logs, metrics and traces you can pivot through.' },
    { q: 'How do you measure reliability across services?', a: 'Define per-service SLOs, use **SLIs that reflect user experience** (successful requests, latency at the edge), track multi-window multi-burn-rate alerts, and aggregate into a service health score reviewed weekly.' },
    { q: 'What is MTTR and what actually reduces it?', a: 'Mean time to recovery. What reduces it: fast detection (good alerts), fast diagnosis (traces + structured logs), safe rollback (one command), and clear runbooks. Not — longer meetings.' }
  ]
},
{
  id: 'iv-platform', group: 'Platform Engineering', icon: '🛠️', title: 'Platform Engineering',
  description: 'Internal developer platforms, golden paths and self-service.',
  questions: [
    { q: 'What does a platform engineering team actually do?', a: 'Builds and maintains the paved road: CI templates, deployment tooling, environments, observability defaults and guardrails — so product teams ship without becoming infrastructure experts.' },
    { q: 'What is a golden path?', a: 'A supported, opinionated way to do a common task (new service, deploy, add a database). It is **paved**, not mandatory — teams may deviate, but they own the cost of doing so.' },
    { q: 'Internal Developer Platform — what are its components?', a: 'Self-service provisioning, service catalog, CI/CD templates, environments, secrets, observability, and golden-path scaffolding. Backed by IaC, GitOps and a developer portal (Backstage or similar).' },
    { q: 'How do you know the platform is working?', a: 'Leading indicators: time-to-first-deploy for a new team, lead time for changes, percentage of services on the golden path, support ticket volume, and developer NPS — not number of clusters.' },
    { q: 'Build vs buy for a platform?', a: 'Buy the undifferentiated heavy lifting (CI, registry, ingress, observability). Build the thin glue that encodes **your** conventions. Never build a bespoke CI — the maintenance cost dwarfs the licence.' },
    { q: 'How do you roll out a platform without forcing it?', a: 'Ship it to one willing team, measure the improvement, publish the results, and let adoption spread. Coercion creates shadow IT; a demonstrably faster path creates pull.' },
    { q: 'What is GitOps\'s role in a platform?', a: 'It gives every environment an auditable, reviewable source of truth, automated drift correction, and a rollback that is a `git revert`. The platform exposes this as a template so teams never touch YAML directly.' },
    { q: 'How do you handle multi-tenancy?', a: 'Namespace-per-team with ResourceQuotas and NetworkPolicies, separate accounts for prod/non-prod, scoped RBAC, and clear quotas. Isolate blast radius first, optimise density second.' }
  ]
},
{
  id: 'iv-scenario', group: 'Scenario Questions', icon: '🎯', title: 'Scenario Questions',
  description: 'Open-ended "what would you do" questions and how to structure the answer.',
  questions: [
    { q: 'Production is down and traffic is dropping. Walk me through your first five minutes.', a: '**1)** Check the deployment timeline — anything shipped in the last 30 min? **2)** Look at the RED metrics for the affected service. **3)** If a deploy correlates, roll back first, diagnose second. **4)** Announce in the incident channel with status and ETA. **5)** If no deploy, check dependencies (DB, upstream, certs) and autoscaling.' },
    { q: 'A service is suddenly 10x slower. How do you find the cause?', a: 'Narrow the scope: is it one instance or all? Is it CPU, memory, GC or I/O? Check traces for the slow span, then correlate with metrics (DB connections, cache hit rate, thread pool) and recent changes. Form one hypothesis at a time and test it.' },
    { q: 'You must migrate 100 services to a new ingress. How?', a: 'Do not do it by hand. Write a migration controller or templated PR generator, start with 2 canaries, publish a rollout dashboard by team, add a CI check that blocks new services on the old ingress, and let owner-driven migration complete the rest.' },
    { q: 'Terraform apply is taking 40 minutes and developers complain. What do you do?', a: 'Measure first — `terraform plan` timing per module. Common wins: split state so unrelated changes do not serialise, remove data-source lookups that force API calls, use `count`/`for_each` on slow resources, and cache provider plugins. Then split the stack by blast radius.' },
    { q: 'How would you design a CI pipeline for a monorepo with 40 services?', a: 'Path-based change detection to build only affected packages, a shared cache keyed on lockfiles, a reusable workflow template per language, concurrency groups to cancel superseded runs, and `dorny/paths-filter` or Nx/Turborepo for graph-aware builds.' },
    { q: 'Your cluster autoscaler is not scaling out during a traffic spike. Why?', a: 'Check: pod **requests** too high to fit any node, no matching instance type capacity (AZ exhausted), ASG max size reached, missing autoscaler tags, or the pods are not marked schedulable because of taints/tolerations. Look at `kubectl describe node` and autoscaler logs.' },
    { q: 'A developer says "it works on my machine". How do you respond constructively?', a: 'Treat it as a reproducibility gap. Containerise the exact run, pin dependency versions with a lockfile, add a `make ci` target that runs the same checks as the pipeline, and make the environment declarative so "my machine" is a build artifact.' },
    { q: 'How do you convince management to pay down tech debt?', a: 'Translate it into measurable cost: incident minutes, deploy lead time, engineer hours lost. Present a small, time-boxed experiment with a before/after metric. Avoid moral arguments; bring numbers and a low-risk pilot.' },
    { q: 'How would you handle a database migration with zero downtime?', a: 'Use expand/contract: add the new column/table (expand), dual-write, backfill in chunks with rate limiting, switch reads over, then remove the old schema (contract) in a later release. Never combine schema change and data migration in one deploy.' }
  ]
},
{
  id: 'iv-coding', group: 'Coding Questions', icon: '💻', title: 'Coding Questions',
  description: 'Shell, YAML and scripting tasks asked in DevOps screens.',
  questions: [
    { q: 'Write a shell script that finds the 10 largest files on a filesystem.', a: '`find / -type f -printf \'%s %p\\n\' 2>/dev/null | sort -nr | head -10 | awk \'{printf "%.1f MB  %s\\n", $1/1048576, $2}\'` — suppress permission errors, sort numerically descending, then human-format.' },
    { q: 'How do you safely read a JSON value in bash without jq?', a: 'Prefer `jq`, but if unavailable: `grep -o \'"key":"[^"]*"\' file | head -1 | cut -d\'"\' -f4`. For anything non-trivial, use `python3 -c "import json,sys; print(json.load(open(sys.argv[1]))[\'key\'])" file`.' },
    { q: 'Write a one-liner to count HTTP 5xx responses per URL from an NGINX access log.', a: '`awk \'$9 ~ /^5/ {c[$7]++} END {for (u in c) print c[u], u}\' access.log | sort -nr`.' },
    { q: 'Explain this: `cut -d: -f1 /etc/passwd | sort | uniq -d`.', a: 'Splits each line on `:`, takes the username field, sorts, and prints only **duplicated** usernames. Non-empty output means duplicate accounts exist — a real security issue.' },
    { q: 'How would you write a retry loop in bash with backoff?', a: '```bash\nretry() {\n  local n=1 max=5 delay=2\n  until "$@"; do\n    n=$((n+1))\n    [ $n -gt $max ] && return 1\n    sleep $delay\n    delay=$((delay*2))\n  done\n}\nretry curl -fsS https://health/ready\n```' },
    { q: 'Parse the output of `kubectl get pods` into a count of non-Running pods.', a: '`kubectl get pods -A --no-headers | awk \'$3 != "Running" {print $3}\' | sort | uniq -c` — or better, use `kubectl get pods -o json` and `jq` so you are not parsing presentation output.' },
    { q: 'Write YAML for a CronJob that runs nightly at 02:00.', a: '```yaml\napiVersion: batch/v1\nkind: CronJob\nmetadata: { name: nightly-report }\nspec:\n  schedule: "0 2 * * *"\n  jobTemplate:\n    spec:\n      template:\n        spec:\n          restartPolicy: OnFailure\n          containers:\n            - name: report\n              image: ghcr.io/acme/report:1.0\n```' },
    { q: 'How do you check whether a port is open on a remote host from bash?', a: '`timeout 3 bash -c "</dev/tcp/host/443" && echo open || echo closed` — uses bash\'s built-in TCP redirection. For more detail: `nc -zv host 443` or `curl -sI --connect-timeout 3 https://host`.' },
    { q: 'Sort a file by the second column numerically.', a: '`sort -k2,2 -n file.txt`. Add `-r` for descending and `-u` to deduplicate on that key.' },
    { q: 'What is the difference between `xargs` and `parallel`?', a: '`xargs` is POSIX, simple, and runs serially by default (GNU xargs has `-P`). `parallel` is purpose-built: job control, resume (`--joblog`), progress bars, and proper quoting of complex arguments. Use `parallel` for anything beyond trivial.' }
  ]
}
];
