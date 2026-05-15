#!/usr/bin/env python3
"""Fetch latest stable versions from package registries and update frameworks.json.

Each entry can carry one or more optional source fields:
  npm_package      e.g. "express" or "@nestjs/core"
  pypi_package     e.g. "Django"
  maven_artifact   e.g. "org.springframework:spring-webmvc"
  rubygems_package e.g. "rails"
  github_repo      e.g. "rails/rails"  (fallback / catch-all)

The script uses the first source it finds (in the order above) and
updates latest_stable_version when a newer version is detected.

Usage:
    GITHUB_TOKEN=<token> python scripts/refresh_versions.py
"""

import json
import os
import re
import sys
import time
import urllib.error
import urllib.request
from datetime import datetime, timezone

DATA_FILE = "data/frameworks.json"
SEMVER_RE = re.compile(r"^\d+\.\d+")


# ── HTTP helper ────────────────────────────────────────────────────────────────

def fetch_json(url: str, headers: dict | None = None):
    req = urllib.request.Request(url, headers=headers or {})
    try:
        with urllib.request.urlopen(req, timeout=10) as resp:
            return json.loads(resp.read())
    except urllib.error.HTTPError as e:
        if e.code not in (404, 403):
            print(f"  HTTP {e.code}: {url}", file=sys.stderr)
        return None
    except Exception as e:
        print(f"  Error fetching {url}: {e}", file=sys.stderr)
        return None


def normalise(raw: str) -> str | None:
    """Strip any leading non-digit prefix (v, go, release-, …) and return
    the version if it looks like semver, otherwise None."""
    v = re.sub(r"^[^\d]+", "", raw.strip())
    return v if SEMVER_RE.match(v) else None


# ── Per-registry fetchers ──────────────────────────────────────────────────────

def from_npm(package: str) -> str | None:
    # Scope packages need URL-encoding of the slash: @nestjs/core → @nestjs%2Fcore
    encoded = package.replace("/", "%2F")
    data = fetch_json(f"https://registry.npmjs.org/{encoded}/latest")
    return data.get("version") if data else None


def from_pypi(package: str) -> str | None:
    data = fetch_json(f"https://pypi.org/pypi/{package}/json")
    if data:
        return data.get("info", {}).get("version")
    return None


def from_maven(artifact: str) -> str | None:
    """artifact format: groupId:artifactId"""
    if ":" not in artifact:
        return None
    group, art = artifact.split(":", 1)
    q = f"g:{group}+AND+a:{art}"
    url = f"https://search.maven.org/solrsearch/select?q={q}&rows=1&wt=json"
    data = fetch_json(url)
    if data:
        docs = data.get("response", {}).get("docs", [])
        if docs:
            return docs[0].get("latestVersion")
    return None


def from_rubygems(package: str) -> str | None:
    data = fetch_json(f"https://rubygems.org/api/v1/gems/{package}.json")
    return data.get("version") if data else None


def from_github(repo: str, token: str) -> str | None:
    headers = {}
    if token:
        headers["Authorization"] = f"Bearer {token}"
    headers["Accept"] = "application/vnd.github+json"
    headers["X-GitHub-Api-Version"] = "2022-11-28"

    data = fetch_json(f"https://api.github.com/repos/{repo}/releases/latest", headers)
    if data and "tag_name" in data:
        v = normalise(data["tag_name"])
        if v:
            return v

    tags = fetch_json(f"https://api.github.com/repos/{repo}/tags?per_page=5", headers)
    if tags and isinstance(tags, list):
        for tag in tags:
            v = normalise(tag.get("name", ""))
            if v:
                return v
    return None


# ── Main ───────────────────────────────────────────────────────────────────────

def resolve_version(fw: dict, token: str) -> str | None:
    """Try each source in priority order and return the first version found."""
    if pkg := fw.get("npm_package"):
        return from_npm(pkg)
    if pkg := fw.get("pypi_package"):
        return from_pypi(pkg)
    if pkg := fw.get("maven_artifact"):
        return from_maven(pkg)
    if pkg := fw.get("rubygems_package"):
        return from_rubygems(pkg)
    if repo := fw.get("github_repo"):
        return from_github(repo, token)
    return None


def main() -> int:
    token = os.environ.get("GITHUB_TOKEN", "")
    if not token:
        print("Warning: GITHUB_TOKEN not set — GitHub requests limited to 60/hr", file=sys.stderr)

    with open(DATA_FILE, encoding="utf-8") as f:
        frameworks = json.load(f)

    changed = skipped = 0
    for fw in frameworks:
        has_source = any(fw.get(k) for k in ("npm_package", "pypi_package", "maven_artifact", "rubygems_package", "github_repo"))
        if not has_source:
            skipped += 1
            continue

        version = resolve_version(fw, token)
        time.sleep(0.1)

        if not version:
            print(f"  {fw['slug']}: could not fetch version", file=sys.stderr)
            continue

        current = fw.get("latest_stable_version", "")
        if version != current:
            src = next(k for k in ("npm_package", "pypi_package", "maven_artifact", "rubygems_package", "github_repo") if fw.get(k))
            print(f"  {fw['name']}: {current!r} -> {version!r}  [{src}]")
            fw["latest_stable_version"] = version
            fw["version_updated_at"] = datetime.now(timezone.utc).strftime("%Y-%m-%d")
            changed += 1

    if changed:
        with open(DATA_FILE, "w", encoding="utf-8") as f:
            json.dump(frameworks, f, indent=2, ensure_ascii=False)
            f.write("\n")
        print(f"\n✓ Updated {changed} entr{'y' if changed == 1 else 'ies'}.")
    else:
        print("✓ No version changes.")

    if skipped:
        print(f"  ({skipped} entries have no version source and were skipped)")

    return 0


if __name__ == "__main__":
    sys.exit(main())
