#!/usr/bin/env python3
"""Fetch latest stable versions from GitHub and update data/frameworks.json.

Each entry in frameworks.json can have an optional "github_repo" field
(e.g. "django/django"). This script calls the GitHub Releases API for those
entries and updates latest_stable_version when a newer tag is found.

Usage:
    GITHUB_TOKEN=<token> python scripts/refresh_versions.py

The script exits 0 always — let git detect whether the file changed.
"""

import json
import os
import re
import sys
import time
import urllib.error
import urllib.request

DATA_FILE = "data/frameworks.json"
GITHUB_API = "https://api.github.com"
# Match anything that looks like a version after stripping a leading non-digit prefix
SEMVER_RE = re.compile(r"^\d+\.\d+")


def fetch_json(url: str, token: str):
    req = urllib.request.Request(url)
    if token:
        req.add_header("Authorization", f"Bearer {token}")
    req.add_header("Accept", "application/vnd.github+json")
    req.add_header("X-GitHub-Api-Version", "2022-11-28")
    try:
        with urllib.request.urlopen(req, timeout=10) as resp:
            return json.loads(resp.read())
    except urllib.error.HTTPError as e:
        if e.code not in (404, 403):
            print(f"  HTTP {e.code} for {url}", file=sys.stderr)
        return None
    except Exception as e:
        print(f"  Error fetching {url}: {e}", file=sys.stderr)
        return None


def normalise(tag: str) -> str | None:
    """Strip any leading non-digit prefix (v, V, go, release-, etc.) and
    return the version string if it looks like semver, otherwise None."""
    tag = re.sub(r"^[^\d]+", "", tag.strip())
    return tag if SEMVER_RE.match(tag) else None


def latest_from_github(repo: str, token: str) -> str | None:
    # Try the latest release first
    data = fetch_json(f"{GITHUB_API}/repos/{repo}/releases/latest", token)
    if data and "tag_name" in data:
        v = normalise(data["tag_name"])
        if v:
            return v

    # Fall back to the most recent tag
    tags = fetch_json(f"{GITHUB_API}/repos/{repo}/tags?per_page=5", token)
    if tags and isinstance(tags, list):
        for tag in tags:
            v = normalise(tag.get("name", ""))
            if v:
                return v

    return None


def main() -> int:
    token = os.environ.get("GITHUB_TOKEN", "")
    if not token:
        print(
            "Warning: GITHUB_TOKEN not set — unauthenticated requests are limited to 60/hr",
            file=sys.stderr,
        )

    with open(DATA_FILE, encoding="utf-8") as f:
        frameworks = json.load(f)

    changed = 0
    skipped = 0
    for fw in frameworks:
        repo = fw.get("github_repo")
        if not repo:
            skipped += 1
            continue

        version = latest_from_github(repo, token)
        time.sleep(0.1)  # stay well under rate limit

        if not version:
            print(f"  {fw['slug']}: could not fetch version", file=sys.stderr)
            continue

        current = fw.get("latest_stable_version", "")
        if version != current:
            print(f"  {fw['name']}: {current!r} → {version!r}")
            fw["latest_stable_version"] = version
            changed += 1

    if changed:
        with open(DATA_FILE, "w", encoding="utf-8") as f:
            json.dump(frameworks, f, indent=2, ensure_ascii=False)
            f.write("\n")
        print(f"\n✓ Updated {changed} entr{'y' if changed == 1 else 'ies'}.")
    else:
        print("✓ No version changes.")

    if skipped:
        print(f"  ({skipped} entries have no github_repo and were skipped)")

    return 0


if __name__ == "__main__":
    sys.exit(main())
