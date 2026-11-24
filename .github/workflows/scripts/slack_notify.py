
#!/usr/bin/env python3

"""
DevOps Atlas - Enterprise CI/CD Slack Notifications.

Features:
- Slack Block Kit messages
- Dynamic job status aggregation
- Security gate reporting
- Docker image publication details
- Expected PR skip handling
- Secure payload generation
- HTTP timeout and retry handling
"""

import os
import json
import time
import sys
import urllib.request
import urllib.error
from urllib.parse import urlparse, quote


# ==========================================================
# Configuration
# ==========================================================

WEBHOOK_URL = os.getenv("SLACK_WEBHOOK_URL", "")
NEEDS = json.loads(os.getenv("NEEDS_JSON", "{}"))

REPOSITORY = os.getenv("REPOSITORY", "Unknown")
REF_NAME = os.getenv("REF_NAME", "Unknown")
SHA = os.getenv("SHA", "")
ACTOR = os.getenv("ACTOR", "Unknown")
EVENT_NAME = os.getenv("EVENT_NAME", "Unknown")
RUN_ID = os.getenv("RUN_ID", "")
RUN_NUMBER = os.getenv("RUN_NUMBER", "")
SERVER_URL = os.getenv("SERVER_URL", "https://github.com")

PUBLISHED_IMAGE = os.getenv("PUBLISHED_IMAGE", "")
PUBLISHED_DIGEST = os.getenv("PUBLISHED_DIGEST", "")

RUN_URL = f"{SERVER_URL}/{REPOSITORY}/actions/runs/{RUN_ID}"
COMMIT_URL = f"{SERVER_URL}/{REPOSITORY}/commit/{SHA}"


# ==========================================================
# Job configuration
# ==========================================================

JOB_NAMES = {
    "lint": "ESLint",
    "test": "Unit Tests",
    "secrets": "Gitleaks",
    "sast": "Semgrep",
    "dependencies": "npm Audit",
    "dockerfile": "Hadolint",
    "docker-build": "Docker Build",
    "trivy-scan": "Trivy",
    "syft-zap": "Syft SBOM & OWASP ZAP",
    "publish": "Docker Hub Push",
}

SECURITY_JOBS = {
    "secrets",
    "sast",
    "dependencies",
    "dockerfile",
    "trivy-scan",
    "syft-zap",
}

STATUS_ICONS = {
    "success": "🟢",
    "failure": "🔴",
    "cancelled": "⚪",
    "skipped": "⚫",
}


# ==========================================================
# Security helpers
# ==========================================================

def escape(value):
    return (
        str(value)
        .replace("&", "&amp;")
        .replace("<", "&lt;")
        .replace(">", "&gt;")
    )


def validate_webhook():
    parsed = urlparse(WEBHOOK_URL)

    return (
        parsed.scheme == "https"
        and parsed.netloc in {
            "hooks.slack.com",
            "hooks.slack-gov.com",
        }
        and parsed.path.startswith("/services/")
    )


# ==========================================================
# Pipeline status aggregation
# ==========================================================

failed_jobs = [
    job for job, data in NEEDS.items()
    if data.get("result") == "failure"
]

cancelled_jobs = [
    job for job, data in NEEDS.items()
    if data.get("result") == "cancelled"
]

unexpected_skips = [
    job for job, data in NEEDS.items()
    if data.get("result") == "skipped"
    and not (
        job == "publish"
        and EVENT_NAME == "pull_request"
    )
]

security_failures = [
    job for job in failed_jobs
    if job in SECURITY_JOBS
]

publish_status = NEEDS.get("publish", {}).get(
    "result", "unavailable"
)

if security_failures:
    status = "SECURITY GATE FAILED"
    status_icon = "🛡️"
    color = "#DC2626"

elif failed_jobs:
    status = "FAILED"
    status_icon = "🔴"
    color = "#DC2626"

elif cancelled_jobs:
    status = "CANCELLED"
    status_icon = "⚪"
    color = "#6B7280"

elif unexpected_skips or not NEEDS:
    status = "PARTIAL"
    status_icon = "🟡"
    color = "#F59E0B"

elif publish_status == "success":
    status = "RELEASE PUBLISHED"
    status_icon = "🚀"
    color = "#16A34A"

else:
    status = "SUCCESS"
    status_icon = "🟢"
    color = "#16A34A"


# ==========================================================
# Job execution summary
# ==========================================================

job_lines = []

for job, data in NEEDS.items():

    result = data.get("result", "unknown")
    name = JOB_NAMES.get(job, job)
    icon = STATUS_ICONS.get(result, "❔")

    if (
        job == "publish"
        and result == "skipped"
        and EVENT_NAME == "pull_request"
    ):
        result = "skipped (expected for PR)"

    job_lines.append(
        f"{icon} *{escape(name)}* — {escape(result.upper())}"
    )

job_summary = "\n".join(job_lines) or "No job results available."


# ==========================================================
# Security summary
# ==========================================================

security_lines = []

for job, data in NEEDS.items():

    if job not in SECURITY_JOBS:
        continue

    result = data.get("result", "unknown")
    icon = STATUS_ICONS.get(result, "❔")
    name = JOB_NAMES.get(job, job)

    security_lines.append(
        f"{icon} {escape(name)} — {escape(result.upper())}"
    )

security_summary = (
    "\n".join(security_lines)
    or "Security results unavailable."
)


# ==========================================================
# Slack Block Kit helpers
# ==========================================================

def markdown(text):
    return {
        "type": "mrkdwn",
        "text": text[:3000],
    }


def field(label, value):
    return {
        "type": "mrkdwn",
        "text": f"*{label}*\n{escape(value)}"[:2000],
    }


# ==========================================================
# Slack Block Kit payload
# ==========================================================

blocks = [
    {
        "type": "header",
        "text": {
            "type": "plain_text",
            "text": f"{status_icon} DevOps Atlas | {status}",
            "emoji": True,
        },
    },
    {
        "type": "context",
        "elements": [
            markdown(
                "CI/CD Pipeline • DevSecOps • Automated Reporting"
            )
        ],
    },
    {"type": "divider"},
    {
        "type": "section",
        "fields": [
            field("Repository", REPOSITORY),
            field("Pipeline Status", status),
            field("Branch / Tag", REF_NAME),
            field("Triggered By", ACTOR),
            field("Event", EVENT_NAME),
            field("Run Number", f"#{RUN_NUMBER}"),
            markdown(
                f"*Commit*\n<{COMMIT_URL}|{escape(SHA[:7])}>"
            ),
            field("Environment", "CI/CD"),
        ],
    },
    {"type": "divider"},
    {
        "type": "section",
        "text": markdown(
            f"*📋 Pipeline Execution Summary*\n\n{job_summary}"
        ),
    },
    {"type": "divider"},
    {
        "type": "section",
        "text": markdown(
            f"*🛡️ DevSecOps Security Gates*\n\n{security_summary}"
        ),
    },
]


# ==========================================================
# Failure details
# ==========================================================

if failed_jobs:

    failed_names = "\n".join(
        f"• {escape(JOB_NAMES.get(job, job))}"
        for job in failed_jobs
    )

    blocks.extend([
        {"type": "divider"},
        {
            "type": "section",
            "text": markdown(
                "*🚨 Failed Jobs*\n"
                f"{failed_names}\n\n"
                "*Recommended Action*\n"
                "Review the failed job logs and available "
                "security reports before retrying."
            ),
        },
    ])


# ==========================================================
# Docker image publication
# ==========================================================

if publish_status == "success":

    blocks.extend([
        {"type": "divider"},
        {
            "type": "section",
            "text": markdown("*🚀 Container Image Published*"),
            "fields": [
                field(
                    "Image",
                    PUBLISHED_IMAGE or "Not reported"
                ),
                field("Publication", "Successful"),
                field("Commit", SHA[:7]),
                field("Registry", "Docker Hub"),
            ],
        },
        {
            "type": "section",
            "text": markdown(
                "*Image Digest*\n"
                f"{escape(PUBLISHED_DIGEST or 'Not reported')}"
            ),
        },
    ])


# ==========================================================
# Action buttons
# ==========================================================

blocks.extend([
    {"type": "divider"},
    {
        "type": "actions",
        "elements": [
            {
                "type": "button",
                "text": {
                    "type": "plain_text",
                    "text": "View Pipeline",
                },
                "url": RUN_URL,
                "style": "primary",
                "action_id": "view_pipeline",
            },
            {
                "type": "button",
                "text": {
                    "type": "plain_text",
                    "text": "Reports & Artifacts",
                },
                "url": f"{RUN_URL}#artifacts",
                "action_id": "view_artifacts",
            },
            {
                "type": "button",
                "text": {
                    "type": "plain_text",
                    "text": "View Commit",
                },
                "url": COMMIT_URL,
                "action_id": "view_commit",
            },
        ],
    },
    {
        "type": "context",
        "elements": [
            markdown(
                "⚙️ Automated by GitHub Actions | DevOps Atlas"
            )
        ],
    },
])

payload = {
    "text": f"DevOps Atlas CI/CD: {status}",
    "unfurl_links": False,
    "unfurl_media": False,
    "attachments": [
        {
            "color": color,
            "blocks": blocks,
        }
    ],
}


# ==========================================================
# Send Slack notification with retries
# ==========================================================

def send_notification():

    if not WEBHOOK_URL:
        print("::error::SLACK_WEBHOOK_URL is not configured.")
        return False

    if not validate_webhook():
        print("::error::Invalid Slack webhook configuration.")
        return False

    body = json.dumps(payload).encode("utf-8")

    request = urllib.request.Request(
        WEBHOOK_URL,
        data=body,
        headers={"Content-Type": "application/json"},
        method="POST",
    )

    max_attempts = 3

    for attempt in range(1, max_attempts + 1):

        try:
            with urllib.request.urlopen(
                request, timeout=15
            ) as response:

                result = response.read().decode().strip()

                if response.status == 200 and result == "ok":
                    print("Slack notification sent successfully.")
                    return True

                print("::error::Unexpected Slack response.")
                return False

        except urllib.error.HTTPError as error:

            print(
                f"::warning::Slack HTTP {error.code} "
                f"(attempt {attempt}/{max_attempts})"
            )

            if error.code != 429 and error.code < 500:
                return False

            delay = 2 ** attempt

            if error.code == 429:
                try:
                    delay = max(
                        delay,
                        int(error.headers.get("Retry-After", delay))
                    )
                except (ValueError, TypeError):
                    pass

        except (urllib.error.URLError, TimeoutError):
            print(
                f"::warning::Slack connection failed "
                f"(attempt {attempt}/{max_attempts})"
            )
            delay = 2 ** attempt

        if attempt < max_attempts:
            if delay > 60:
                print("::error::Slack retry delay exceeds limit.")
                return False
            time.sleep(delay)

    return False


# ==========================================================
# Entry point
# ==========================================================

if __name__ == "__main__":

    print(f"Pipeline status: {status}")

    if send_notification():
        sys.exit(0)

    print("::error::Slack notification delivery failed.")
    sys.exit(1)
