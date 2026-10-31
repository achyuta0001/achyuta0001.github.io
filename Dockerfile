# syntax=docker/dockerfile:1
# Multi-stage build: a big Node image builds the site, a tiny nginx image serves it.
# Only what is COPY'd --from=build into the last stage ends up in the final image.

# ---- Stage 1: build ---------------------------------------------------------
# Pinned exact version (not node:latest or node:22) so builds are reproducible.
FROM node:22.23.4-slim AS build
WORKDIR /app

# Copy only the dependency manifests first. This layer (and the slow npm ci
# below) is reused from cache until package*.json changes, so editing
# source files doesn't reinstall node_modules.
COPY package.json package-lock.json ./
# npm ci installs exactly what's in the lockfile (and fails if it's out of
# sync with package.json); npm install could silently resolve newer versions.
RUN npm ci

# Now the rest of the source (filtered by .dockerignore)
COPY . .

# The build fetches live repo data from the GitHub API (src/data/github.ts).
# Pass --build-arg GITHUB_ACTIVITY=off for an offline / deterministic build.
ARG GITHUB_ACTIVITY=on
ENV GITHUB_ACTIVITY=${GITHUB_ACTIVITY}
RUN npm run build

# ---- Stage 2: serve ---------------------------------------------------------
# nginx-unprivileged runs as uid 101 (not root) and listens on 8080, since
# ports < 1024 need root. Required later for runAsNonRoot in Kubernetes.
FROM nginxinc/nginx-unprivileged:1.30.6-alpine

LABEL org.opencontainers.image.source="https://github.com/achyuta0001/achyuta0001.github.io" \
      org.opencontainers.image.title="site"

# The only thing taken from stage 1: the static output
COPY --from=build /app/dist /usr/share/nginx/html

# Documentation only: tells humans and tools which port the app uses.
# It does not publish the port; that's -p (nerdctl) or a Service (Kubernetes).
EXPOSE 8080
