#!/usr/bin/env python3
"""One-time script to add npm_package, pypi_package, maven_artifact,
and rubygems_package fields to frameworks.json entries."""
import json

NPM = {
    "expressjs":            "express",
    "fastify":              "fastify",
    "nestjs":               "@nestjs/core",
    "nextjs":               "next",
    "nuxtjs":               "nuxt",
    "sveltekit":            "@sveltejs/kit",
    "astro":                "astro",
    "remix":                "@remix-run/node",
    "jest":                 "jest",
    "vitest":               "vitest",
    "vite":                 "vite",
    "webpack":              "webpack",
    "esbuild":              "esbuild",
    "rollup":               "rollup",
    "typescript":           "typescript",
    "trpc":                 "@trpc/server",
    "prisma":               "prisma",
    "typeorm":              "typeorm",
    "sequelize":            "sequelize",
    "graphql":              "graphql",
    "bun":                  "bun",
}

PYPI = {
    "django":               "Django",
    "flask":                "Flask",
    "fastapi":              "fastapi",
    "starlette":            "starlette",
    "pytest":               "pytest",
    "scikit-learn":         "scikit-learn",
    "tensorflow":           "tensorflow",
    "pytorch":              "torch",
    "keras":                "keras",
    "langchain":            "langchain",
    "mlflow":               "mlflow",
    "opencv":               "opencv-python",
    "sqlalchemy":           "SQLAlchemy",
    "dbt":                  "dbt-core",
    "apache-airflow":       "apache-airflow",
    "hugging-face-transformers": "transformers",
}

MAVEN = {
    "spring-mvc":           "org.springframework:spring-webmvc",
    "spring-framework":     "org.springframework:spring-core",
    "spring-security":      "org.springframework.security:spring-security-core",
    "spring-cloud":         "org.springframework.cloud:spring-cloud-dependencies",
    "hibernate-orm":        "org.hibernate.orm:hibernate-core",
    "mybatis":              "org.mybatis:mybatis",
    "jooq":                 "org.jooq:jooq",
    "micronaut":            "io.micronaut:micronaut-core",
    "quarkus":              "io.quarkus:quarkus-core",
    "junit":                "org.junit.jupiter:junit-jupiter",
    "mockito":              "org.mockito:mockito-core",
    "testng":               "org.testng:testng",
    "apache-camel":         "org.apache.camel:camel-core",
    "apache-flink":         "org.apache.flink:flink-core",
    "apache-spark":         "org.apache.spark:spark-core_2.13",
    "apache-kafka":         "org.apache.kafka:kafka-clients",
    "netty":                "io.netty:netty-all",
    "vertx-web":            "io.vertx:vertx-web",
    "eclipse-vertx":        "io.vertx:vertx-core",
    "rxjava":               "io.reactivex.rxjava3:rxjava",
    "project-reactor":      "io.projectreactor:reactor-core",
    "keycloak":             "org.keycloak:keycloak-core",
    "helidon":              "io.helidon:helidon",
    "dropwizard":           "io.dropwizard:dropwizard-core",
    "grpc":                 "io.grpc:grpc-core",
    "morphia":              "dev.morphia.morphia:morphia-core",
    "spock":                "org.spockframework:spock-core",
    "cucumber-jvm":         "io.cucumber:cucumber-core",
    "apache-storm":         "org.apache.storm:storm-core",
    "apache-shiro":         "org.apache.shiro:shiro-core",
    "apache-maven":         "org.apache.maven:maven-core",
}

RUBYGEMS = {
    "ruby-on-rails":        "rails",
}

DATA_FILE = "data/frameworks.json"

with open(DATA_FILE, encoding="utf-8") as f:
    data = json.load(f)

counts = {"npm_package": 0, "pypi_package": 0, "maven_artifact": 0, "rubygems_package": 0}

for fw in data:
    slug = fw["slug"]
    if slug in NPM and "npm_package" not in fw:
        fw["npm_package"] = NPM[slug]
        counts["npm_package"] += 1
    if slug in PYPI and "pypi_package" not in fw:
        fw["pypi_package"] = PYPI[slug]
        counts["pypi_package"] += 1
    if slug in MAVEN and "maven_artifact" not in fw:
        fw["maven_artifact"] = MAVEN[slug]
        counts["maven_artifact"] += 1
    if slug in RUBYGEMS and "rubygems_package" not in fw:
        fw["rubygems_package"] = RUBYGEMS[slug]
        counts["rubygems_package"] += 1

with open(DATA_FILE, "w", encoding="utf-8") as f:
    json.dump(data, f, indent=2, ensure_ascii=False)
    f.write("\n")

for k, v in counts.items():
    print(f"  {k}: {v} added")

total = sum(
    1 for fw in data
    if any(fw.get(k) for k in ("npm_package", "pypi_package", "maven_artifact", "rubygems_package", "github_repo"))
)
print(f"\n{total}/{len(data)} entries now have at least one version source")
