#!/bin/bash

# Docker build and push script for BMKG Cuaca (public)
# Usage: ./docker.sh [registry]

set -e

REGISTRY=${1:-"registry-dev.rumahaplikasi.com:5000/bmkg"}
APP_NAME="fe-public"

echo " Building ${APP_NAME}..."

# Build context = folder ini (app standalone, tanpa workspace root)
cd "$(dirname "$0")"

# Stop and remove existing container
docker stop ${APP_NAME} 2>/dev/null || true
docker rm ${APP_NAME} 2>/dev/null || true

# Remove old image
docker rmi ${APP_NAME} 2>/dev/null || true

# Build new image
docker build --platform=linux/amd64 -t ${APP_NAME} .

# Tag for registry
docker tag ${APP_NAME} ${REGISTRY}/${APP_NAME}:latest

# Push to registry
docker push ${REGISTRY}/${APP_NAME}:latest

echo "✅ Build complete: ${APP_NAME}"
echo " Pushed to: ${REGISTRY}/${APP_NAME}:latest"