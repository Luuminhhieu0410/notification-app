#!/usr/bin/env bash
set -Eeuo pipefail

usage() {
  printf 'Usage: %s <backend-image>\n' "$(basename "$0")" >&2
}

if [[ "$#" -ne 1 || -z "$1" ]]; then
  usage
  exit 64
fi

deployment_dir="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$deployment_dir"

if [[ ! -f docker-compose.yml ]]; then
  printf 'Missing %s/docker-compose.yml\n' "$deployment_dir" >&2
  exit 66
fi

if [[ ! -f .env ]]; then
  printf 'Missing %s/.env\n' "$deployment_dir" >&2
  exit 66
fi

new_image="$1"
previous_image=""

if [[ -f .release.env ]]; then
  while IFS='=' read -r key value; do
    if [[ "$key" == "BACKEND_IMAGE" ]]; then
      previous_image="$value"
      break
    fi
  done < .release.env
fi

compose=(docker compose --env-file .env)
export BACKEND_IMAGE="$new_image"

printf 'Preparing dependencies for %s\n' "$new_image"
"${compose[@]}" up -d --wait postgres redis
"${compose[@]}" pull backend

printf 'Applying Prisma migrations\n'
"${compose[@]}" run --rm backend yarn db:migrate:deploy

printf 'Starting backend %s\n' "$new_image"
if "${compose[@]}" up -d --wait --wait-timeout 60 --no-deps backend; then
  release_tmp="$(mktemp .release.env.XXXXXX)"
  printf 'BACKEND_IMAGE=%s\n' "$new_image" > "$release_tmp"
  mv "$release_tmp" .release.env
  printf 'Deployment succeeded: %s\n' "$new_image"
  exit 0
fi

printf 'Backend health check failed: %s\n' "$new_image" >&2

if [[ -z "$previous_image" ]]; then
  printf 'No previous image is recorded; automatic rollback is unavailable\n' >&2
  exit 1
fi

printf 'Rolling back to %s\n' "$previous_image" >&2
export BACKEND_IMAGE="$previous_image"
"${compose[@]}" pull backend

if "${compose[@]}" up -d --wait --wait-timeout 60 --no-deps backend; then
  printf 'Rollback succeeded: %s\n' "$previous_image" >&2
else
  printf 'Rollback failed: %s\n' "$previous_image" >&2
fi

exit 1

