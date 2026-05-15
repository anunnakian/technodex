#!/usr/bin/env python3
"""Download missing logos from devicons / Simple Icons CDN and update frameworks.json.

Priority per entry:
  1. devicons — original variant, then plain, then original-wordmark
  2. Simple Icons — cdn.simpleicons.org/{slug}
  3. Placeholder — ./assets/images/placeholder.png (no download)

Run from the repo root:
    python scripts/fetch_missing_logos.py
"""

import json
import os
import time
import urllib.error
import urllib.request

DATA_FILE  = "data/frameworks.json"
LOGO_DIR   = "assets/images/tech"
PLACEHOLDER = "./assets/images/placeholder.png"

DEVICONS_BASE = "https://cdn.jsdelivr.net/gh/devicons/devicon@latest/icons"
SIMPLEICONS_BASE = "https://cdn.jsdelivr.net/npm/simple-icons@latest/icons"

# slug → devicon name (looks up {name}-original.svg, then -plain.svg, then -original-wordmark.svg)
DEVICONS: dict[str, str] = {
    # Languages
    "python":        "python",
    "javascript":    "javascript",
    "typescript":    "typescript",
    "rust":          "rust",
    "go":            "go",
    "kotlin":        "kotlin",
    "swift":         "swift",
    "csharp":        "csharp",
    "ruby":          "ruby",
    "php":           "php",
    "dart":          "dart",
    "scala":         "scala",
    "elixir":        "elixir",
    "haskell":       "haskell",
    # Python web
    "django":        "django",
    "flask":         "flask",
    "fastapi":       "fastapi",
    # Node / JS web
    "expressjs":     "express",
    "nestjs":        "nestjs",
    "nextjs":        "nextjs",
    "nuxtjs":        "nuxtjs",
    "sveltekit":     "svelte",
    "astro":         "astro",
    "remix":         "remix",
    # Other web
    "ruby-on-rails": "rails",
    "laravel":       "laravel",
    "aspnet-core":   "dotnetcore",
    # DevOps / infra
    "docker":        "docker",
    "kubernetes":    "kubernetes",
    "terraform":     "terraform",
    "ansible":       "ansible",
    "jenkins":       "jenkins",
    "argocd":        "argocd",
    # ML / AI
    "tensorflow":    "tensorflow",
    "pytorch":       "pytorch",
    "opencv":        "opencv",
    "keras":         "keras",
    # Testing / build
    "jest":          "jest",
    "webpack":       "webpack",
    "gradle":        "gradle",
    "apache-maven":  "maven",
    "junit":         "junit",
    # Data / DB
    "mongodb":       "mongodb",
    "redis":         "redis",
    "postgresql":    "postgresql",
    "mysql":         "mysql",
    "elasticsearch": "elasticsearch",
    "apache-kafka":  "apachekafka",
    "apache-spark":  "apachespark",
    "apache-airflow":"apacheairflow",
    "apache-cassandra": "apachecassandra",
    # Cloud
    "aws":                "amazonwebservices",
    "microsoft-azure":    "azure",
    "google-cloud-platform": "googlecloud",
    "digitalocean":       "digitalocean",
    "firebase":           "firebase",
    # Tooling / misc
    "android-sdk":  "android",
    "graphql":      "graphql",
    "sequelize":    "sequelize",
    "sqlalchemy":   "sqlalchemy",
    "scikit-learn": "scikitlearn",
    "github-actions": "github",
    "snowflake":    "snowflake",
    "bun":          "bun",
    "vite":         "vitejs",
    "vitest":       "vitest",
    "pytest":       "pytest",
    "cmake":        "cmake",
    "sbt":          "scala",
    # JVM / Java ecosystem
    "hibernate-orm": "hibernate",
    "spring-security": "spring",
    "spring-cloud":  "spring",
    "project-reactor": "spring",
    "netty":         "java",
    "mockito":       "java",
    "libgdx":        "java",
}

# slug → Simple Icons slug (https://simpleicons.org/ for the right slug)
SIMPLE_ICONS: dict[str, str] = {
    "trpc":           "trpc",
    "prisma":         "prisma",
    "supabase":       "supabase",
    "esbuild":        "esbuild",
    "rollup":         "rollupdotjs",
    "vitest":         "vitest",
    "cypress":        "cypress",
    "playwright":     "playwright",
    "dbt":            "dbt",
    "langchain":      "langchain",
    "hugging-face-transformers": "huggingface",
    "mlflow":         "mlflow",
    "databricks":     "databricks",
    "clickhouse":     "clickhouse",
    "cloudflare":     "cloudflare",
    "helm":           "helm",
    "pulumi":         "pulumi",
    "serverless-framework": "serverless",
    "openapi":        "openapiinitiative",
    "grpc":           "grpc",
    "typeorm":        "typeorm",
    "gorm":           "go",
    "gin":            "go",
    "fiber":          "go",
    "echo":           "go",
    "aws-cdk":        "amazonaws",
    "trino":          "trino",
    "delta-lake":     "delta",
    "apache-iceberg": "apacheiceberg",
    "apache-hive":    "apachehive",
    "apache-storm":   "apache",
    "apache-hadoop-mapreduce": "apache",
    "apache-ant":     "apache",
    "apache-karaf":   "apache",
    "apache-camel":   "apache",
    "dagger":         "dagger",
    "google-guice":   "google",
    "jooq":           "jooq",
    "gradle":         "gradle",
    "bazel":          "bazel",
    "kubernetes":     "kubernetes",
    "swift":          "swift",
    "starlette":      "starlette",
    "fastify":        "fastify",
    "weld":           "jakarta",
    "keycloak":       "keycloak",
    "rxjava":         "reactivex",
    "akka":           "akka",
    "eclipse-vertx":  "eclipsevertx",
    "vertx-web":      "eclipsevertx",
    "aws-lambda":     "awslambda",
    "amazon-s3":      "amazons3",
    "amazon-ec2":     "amazonec2",
    "amazon-rds":     "amazonrds",
    "amazon-dynamodb":"amazondynamodb",
    "amazon-redshift":"amazonredshift",
    "amazon-emr":     "amazonemr",
    "amazon-sagemaker":"amazonsagemaker",
    "aws-cloudformation": "amazonaws",
    "azure-functions": "azurefunctions",
    "azure-kubernetes-service": "microsoftazure",
    "azure-devops":   "azuredevops",
    "azure-machine-learning": "microsoftazure",
    "azure-cosmos-db": "microsoftazure",
    "google-bigquery": "googlebigquery",
    "google-cloud-run": "googlecloud",
    "vertex-ai":      "googlecloud",
    "google-kubernetes-engine": "googlecloud",
    "cloudera":       "cloudera",
    "snowflake":      "snowflake",
}


def try_url(url: str) -> bytes | None:
    try:
        with urllib.request.urlopen(url, timeout=8) as resp:
            if resp.status == 200:
                return resp.read()
    except Exception:
        pass
    return None


def download_devicon(name: str) -> bytes | None:
    for variant in ("original", "plain", "original-wordmark", "plain-wordmark"):
        data = try_url(f"{DEVICONS_BASE}/{name}/{name}-{variant}.svg")
        if data:
            return data
    return None


def download_simpleicon(slug: str) -> bytes | None:
    return try_url(f"{SIMPLEICONS_BASE}/{slug}.svg")


def save_svg(slug: str, content: bytes) -> str:
    os.makedirs(LOGO_DIR, exist_ok=True)
    path = os.path.join(LOGO_DIR, f"{slug}.svg")
    with open(path, "wb") as f:
        f.write(content)
    return f"./{LOGO_DIR}/{slug}.svg"


def main():
    with open(DATA_FILE, encoding="utf-8") as f:
        frameworks = json.load(f)

    to_fix = [
        fw for fw in frameworks
        if not fw.get("logo_url") or (
            fw.get("logo_url") != PLACEHOLDER
            and not os.path.exists(fw["logo_url"].lstrip("./"))
        )
    ]

    print(f"{len(to_fix)} entries need logos\n")
    changed = 0

    for fw in to_fix:
        slug = fw["slug"]
        logo_url = None

        # 1. devicons
        if slug in DEVICONS:
            data = download_devicon(DEVICONS[slug])
            if data:
                logo_url = save_svg(slug, data)
                print(f"  + {slug} [devicons/{DEVICONS[slug]}]")

        # 2. Simple Icons
        if not logo_url and slug in SIMPLE_ICONS:
            data = download_simpleicon(SIMPLE_ICONS[slug])
            if data:
                logo_url = save_svg(slug, data)
                print(f"  + {slug} [simpleicons/{SIMPLE_ICONS[slug]}]")

        # 3. Placeholder
        if not logo_url:
            logo_url = PLACEHOLDER
            print(f"  – {slug} [placeholder]")

        if fw.get("logo_url") != logo_url:
            fw["logo_url"] = logo_url
            changed += 1

        time.sleep(0.05)

    if changed:
        with open(DATA_FILE, "w", encoding="utf-8") as f:
            json.dump(frameworks, f, indent=2, ensure_ascii=False)
            f.write("\n")

    print(f"\nDone — {changed} entries updated.")


if __name__ == "__main__":
    main()
