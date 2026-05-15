#!/usr/bin/env python3
"""One-time script to seed github_repo fields in frameworks.json."""
import json
import re

REPOS = {
    # Java Web
    "spring-mvc":           "spring-projects/spring-framework",
    "apache-struts":        "apache/struts",
    "apache-struts-2":      "apache/struts",
    "apache-wicket":        "apache/wicket",
    "apache-tapestry":      "apache/tapestry-5",
    "play-framework":       "playframework/playframework",
    "grails":               "grails/grails-core",
    "dropwizard":           "dropwizard/dropwizard",
    "micronaut":            "micronaut-projects/micronaut-core",
    "quarkus":              "quarkusio/quarkus",
    "helidon":              "helidon-io/helidon",
    "spark-java":           "perwendel/spark",
    "ratpack":              "ratpack/ratpack",
    "vertx-web":            "eclipse-vertx/vert.x",
    "vaadin":               "vaadin/flow",
    "primefaces":           "primefaces/primefaces",
    # Java IoC / DI
    "spring-framework":     "spring-projects/spring-framework",
    "google-guice":         "google/guice",
    "dagger":               "google/dagger",
    "weld":                 "weld/core",
    # Java ORM / data
    "hibernate-orm":        "hibernate/hibernate-orm",
    "mybatis":              "mybatis/mybatis-3",
    "jooq":                 "jOOQ/jOOQ",
    "morphia":              "MorphiaOrg/morphia",
    # Reactive / async
    "project-reactor":      "reactor/reactor-core",
    "rxjava":               "ReactiveX/RxJava",
    "eclipse-vertx":        "eclipse-vertx/vert.x",
    "akka":                 "akka/akka",
    "netty":                "netty/netty",
    "mutiny":               "smallrye/smallrye-mutiny",
    # Security
    "spring-security":      "spring-projects/spring-security",
    "apache-shiro":         "apache/shiro",
    "keycloak":             "keycloak/keycloak",
    "pac4j":                "pac4j/pac4j",
    # Game / graphics
    "libgdx":               "libgdx/libgdx",
    "jmonkeyengine":        "jMonkeyEngine/jmonkeyengine",
    "lwjgl":                "LWJGL/lwjgl3",
    # Build tools
    "apache-maven":         "apache/maven",
    "gradle":               "gradle/gradle",
    "sbt":                  "sbt/sbt",
    "bazel":                "bazelbuild/bazel",
    "pants":                "pantsbuild/pants",
    # Java testing
    "junit":                "junit-team/junit5",
    "testng":               "cbeust/testng",
    "spock":                "spockframework/spock",
    "mockito":              "mockito/mockito",
    "easymock":             "easymock/easymock",
    "cucumber-jvm":         "cucumber/cucumber-jvm",
    "serenity-bdd":         "serenity-bdd/serenity-core",
    # Cloud / distributed (Java)
    "spring-cloud":         "spring-cloud/spring-cloud-build",
    "apache-camel":         "apache/camel",
    "apache-storm":         "apache/storm",
    "apache-flink":         "apache/flink",
    # Languages
    "python":               "python/cpython",
    "typescript":           "microsoft/TypeScript",
    "rust":                 "rust-lang/rust",
    "kotlin":               "JetBrains/kotlin",
    "swift":                "swiftlang/swift",
    "scala":                "scala/scala",
    "elixir":               "elixir-lang/elixir",
    "dart":                 "dart-lang/sdk",
    "go":                   "golang/go",
    # Python web
    "django":               "django/django",
    "flask":                "pallets/flask",
    "fastapi":              "fastapi/fastapi",
    "starlette":            "encode/starlette",
    # JS / Node web
    "expressjs":            "expressjs/express",
    "fastify":              "fastify/fastify",
    "nestjs":               "nestjs/nest",
    "nextjs":               "vercel/next.js",
    "nuxtjs":               "nuxt/nuxt",
    "sveltekit":            "sveltejs/kit",
    "astro":                "withastro/astro",
    "remix":                "remix-run/remix",
    # Other web
    "ruby-on-rails":        "rails/rails",
    "laravel":              "laravel/framework",
    "aspnet-core":          "dotnet/aspnetcore",
    "gin":                  "gin-gonic/gin",
    "fiber":                "gofiber/fiber",
    "echo":                 "labstack/echo",
    # DevOps / infra
    "docker":               "moby/moby",
    "kubernetes":           "kubernetes/kubernetes",
    "terraform":            "hashicorp/terraform",
    "ansible":              "ansible/ansible",
    "helm":                 "helm/helm",
    "jenkins":              "jenkinsci/jenkins",
    "argocd":               "argoproj/argo-cd",
    # ML / AI
    "tensorflow":           "tensorflow/tensorflow",
    "pytorch":              "pytorch/pytorch",
    "scikit-learn":         "scikit-learn/scikit-learn",
    "keras":                "keras-team/keras",
    "hugging-face-transformers": "huggingface/transformers",
    "langchain":            "langchain-ai/langchain",
    "opencv":               "opencv/opencv",
    "mlflow":               "mlflow/mlflow",
    # ORM / API / tooling
    "sqlalchemy":           "sqlalchemy/sqlalchemy",
    "prisma":               "prisma/prisma",
    "typeorm":              "typeorm/typeorm",
    "sequelize":            "sequelize/sequelize",
    "gorm":                 "go-gorm/gorm",
    "trpc":                 "trpc/trpc",
    "aws-cdk":              "aws/aws-cdk",
    "pulumi":               "pulumi/pulumi",
    "serverless-framework": "serverless/serverless",
    "supabase":             "supabase/supabase",
    # Testing / build tooling
    "jest":                 "jestjs/jest",
    "pytest":               "pytest-dev/pytest",
    "cypress":              "cypress-io/cypress",
    "playwright":           "microsoft/playwright",
    "vitest":               "vitest-dev/vitest",
    "vite":                 "vitejs/vite",
    "webpack":              "webpack/webpack",
    "esbuild":              "evanw/esbuild",
    "rollup":               "rollup/rollup",
    "bun":                  "oven-sh/bun",
    # Data / big data
    "apache-spark":         "apache/spark",
    "apache-kafka":         "apache/kafka",
    "apache-hive":          "apache/hive",
    "trino":                "trinodb/trino",
    "dbt":                  "dbt-labs/dbt-core",
    "apache-airflow":       "apache/airflow",
    "delta-lake":           "delta-io/delta",
    "apache-iceberg":       "apache/iceberg",
    "redis":                "redis/redis",
    "elasticsearch":        "elastic/elasticsearch",
    "clickhouse":           "ClickHouse/ClickHouse",
    "mongodb":              "mongodb/mongo",
    "apache-cassandra":     "apache/cassandra",
}

DATA_FILE = "data/frameworks.json"

with open(DATA_FILE, encoding="utf-8") as f:
    data = json.load(f)

added = 0
for fw in data:
    slug = fw["slug"]
    # Auto-extract from existing GitHub website_or_repo if not in manual map
    if slug not in REPOS:
        url = fw.get("website_or_repo", "")
        m = re.match(r"https?://github\.com/([^/]+/[^/?#\s]+)", url)
        if m:
            REPOS[slug] = m.group(1).rstrip("/")

    if slug in REPOS and "github_repo" not in fw:
        fw["github_repo"] = REPOS[slug]
        added += 1

with open(DATA_FILE, "w", encoding="utf-8") as f:
    json.dump(data, f, indent=2, ensure_ascii=False)
    f.write("\n")

covered = sum(1 for fw in data if fw.get("github_repo"))
print(f"Added github_repo to {added} entries ({covered}/{len(data)} total covered)")
