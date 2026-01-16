# Docker Deployment Guide

## Overview

This guide covers Docker containerization and deployment of the Glovo Dish Scraper API.

## Files

- **Dockerfile** - Multi-stage container image definition
- **.dockerignore** - Files to exclude from Docker build context
- **docker-compose.yml** - Local development with Docker Compose

## Docker Setup

### Prerequisites

- Docker (20.10+)
- Docker Compose (2.0+)

### Build Image

```bash
# Build Docker image
docker build -t glovo-scraper-api:latest .

# Build with specific tag
docker build -t glovo-scraper-api:v1.0.0 .

# Build with build arguments
docker build \
  --build-arg NODE_ENV=production \
  -t glovo-scraper-api:latest .
```

### Run Container

```bash
# Run with default settings
docker run -d -p 3000:3000 glovo-scraper-api:latest

# Run with environment variables
docker run -d -p 3000:3000 \
  -e NODE_ENV=production \
  -e PORT=3000 \
  glovo-scraper-api:latest

# Run with volume mounts
docker run -d -p 3000:3000 \
  -v $(pwd)/data:/app/data \
  -v $(pwd)/assets/screenshots:/app/assets/screenshots \
  glovo-scraper-api:latest

# Run with all options
docker run -d \
  --name glovo-api \
  -p 3000:3000 \
  -e NODE_ENV=production \
  -v $(pwd)/data:/app/data \
  -v $(pwd)/assets/screenshots:/app/assets/screenshots \
  --restart unless-stopped \
  --health-cmd='node -e "require(\"http\").get(\"http://localhost:3000/api/stores\", (r) => {if (r.statusCode !== 200) throw new Error(r.statusCode)})"' \
  --health-interval=30s \
  --health-timeout=10s \
  --health-retries=3 \
  glovo-scraper-api:latest
```

### Verify Container

```bash
# Check container status
docker ps | grep glovo

# View container logs
docker logs glovo-api

# Check container health
docker inspect --format='{{.State.Health}}' glovo-api

# Access container shell
docker exec -it glovo-api /bin/sh
```

## Docker Compose

### Local Development

```bash
# Start services
docker-compose up -d

# View logs
docker-compose logs -f api

# Stop services
docker-compose down

# Stop and remove volumes
docker-compose down -v
```

### Testing with Docker Compose

```bash
# Test API endpoint
curl http://localhost:3000/api-docs

# Test stores endpoint
curl http://localhost:3000/api/stores

# Test recommendations
curl -X POST http://localhost:3000/api/recommendations \
  -H "Content-Type: application/json" \
  -d '{
    "budget": "100 MAD",
    "numPlates": 2,
    "algorithm": "optimized"
  }'
```

### Scale Services

```bash
# Scale API service to 3 instances
docker-compose up -d --scale api=3

# Note: With docker-compose, you'll need to use a load balancer
# For production, use Kubernetes or Docker Swarm
```

## Image Optimization

### Current Dockerfile Strategy

1. **Alpine Base** - Lightweight Linux distribution
2. **Minimal Dependencies** - Only required packages
3. **Single Process** - No unnecessary services
4. **Health Checks** - Built-in container health monitoring
5. **Non-Root User** - Security best practice

### Image Size

```bash
# Check image size
docker images | grep glovo-scraper-api

# Typical size: ~600MB (with chromium browser)
# Can be reduced with:
# - Removing dev dependencies
# - Using smaller base image
# - Implementing multi-stage builds
```

### Multi-Stage Build Example

```dockerfile
# Build stage
FROM node:16-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production

# Runtime stage
FROM node:16-alpine
WORKDIR /app
COPY --from=builder /app/node_modules ./node_modules
COPY . .
EXPOSE 3000
CMD ["node", "index.js"]
```

## Registry Management

### Docker Hub

```bash
# Tag image for Docker Hub
docker tag glovo-scraper-api:latest username/glovo-scraper-api:latest

# Login to Docker Hub
docker login

# Push image
docker push username/glovo-scraper-api:latest

# Pull image
docker pull username/glovo-scraper-api:latest
```

### Private Registry

```bash
# Login to private registry
docker login registry.example.com

# Tag for private registry
docker tag glovo-scraper-api:latest registry.example.com/glovo-scraper-api:latest

# Push to private registry
docker push registry.example.com/glovo-scraper-api:latest
```

## Networking

### Container to Host Communication

```bash
# On Linux, use host network
docker run -d --network host glovo-scraper-api:latest

# On Windows/Mac, use docker.host.internal
docker run -d -p 3000:3000 \
  -e DATABASE_URL=mysql://docker.host.internal:3306/db \
  glovo-scraper-api:latest
```

### Container Linking

```bash
# Create network
docker network create glovo-network

# Run containers on network
docker run -d --network glovo-network --name api glovo-scraper-api:latest
docker run -d --network glovo-network --name nginx nginx:latest
```

## Environment Variables

### Configure via .env File

```bash
# Create .env file
echo "NODE_ENV=production" > .env
echo "PORT=3000" >> .env

# Load in docker-compose.yml
env_file: .env
```

### Configure via Command Line

```bash
docker run -d \
  -e NODE_ENV=production \
  -e PORT=3000 \
  -e GLOVO_BASE_URL=https://glovoapp.com \
  glovo-scraper-api:latest
```

## Volumes and Data Persistence

### Named Volumes

```bash
# Create named volume
docker volume create glovo-data

# Use in container
docker run -d \
  -v glovo-data:/app/data \
  glovo-scraper-api:latest

# Inspect volume
docker volume inspect glovo-data

# Remove volume
docker volume rm glovo-data
```

### Bind Mounts

```bash
# Mount host directory
docker run -d \
  -v /path/to/data:/app/data \
  glovo-scraper-api:latest

# Windows PowerShell
docker run -d `
  -v "$PWD/data`:C:/app/data" `
  glovo-scraper-api:latest
```

## Logging

### View Logs

```bash
# Real-time logs
docker logs -f glovo-api

# Last 100 lines
docker logs --tail 100 glovo-api

# With timestamps
docker logs -t glovo-api

# Since specific time
docker logs --since 2024-01-14 glovo-api
```

### Log Drivers

```bash
# JSON file logging (default)
docker run -d glovo-scraper-api:latest

# Syslog
docker run -d --log-driver syslog glovo-scraper-api:latest

# Splunk
docker run -d --log-driver splunk glovo-scraper-api:latest
```

## Security

### Run as Non-Root

```dockerfile
# In Dockerfile
USER node  # or USER 1000

# Run without sudo
docker run -d glovo-scraper-api:latest
```

### Resource Limits

```bash
docker run -d \
  --memory 1g \
  --memory-swap 1.5g \
  --cpus 1 \
  glovo-scraper-api:latest
```

### Read-Only File System

```bash
docker run -d \
  --read-only \
  --tmpfs /tmp \
  --tmpfs /run \
  glovo-scraper-api:latest
```

## Health Checks

### Docker HEALTHCHECK

```dockerfile
HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
  CMD node -e "require('http').get('http://localhost:3000/api/stores', (r) => {if (r.statusCode !== 200) throw new Error(r.statusCode)})"
```

### Check Health Status

```bash
# Get health status
docker inspect --format='{{.State.Health.Status}}' glovo-api

# Get health details
docker inspect --format='{{json .State.Health}}' glovo-api | jq
```

## Troubleshooting

### Container Won't Start

```bash
# Check logs
docker logs glovo-api

# Inspect container
docker inspect glovo-api

# Check running processes
docker top glovo-api
```

### High Memory Usage

```bash
# Check memory stats
docker stats glovo-api

# Limit memory
docker update --memory 1g glovo-api

# Restart container
docker restart glovo-api
```

### Port Already in Use

```bash
# Find process using port
lsof -i :3000  # macOS/Linux
netstat -ano | findstr :3000  # Windows

# Use different port
docker run -d -p 3001:3000 glovo-scraper-api:latest
```

## Cleaning Up

### Remove Images and Containers

```bash
# Remove container
docker rm glovo-api

# Remove image
docker rmi glovo-scraper-api:latest

# Remove all stopped containers
docker container prune

# Remove dangling images
docker image prune

# Remove everything (containers, images, volumes)
docker system prune -a --volumes
```

## CI/CD Integration

### GitHub Actions

```yaml
- name: Build Docker image
  run: docker build -t glovo-scraper-api:${{ github.sha }} .

- name: Push to registry
  run: docker push glovo-scraper-api:${{ github.sha }}
```

### GitLab CI

```yaml
build:docker:
  stage: build
  script:
    - docker build -t glovo-scraper-api:$CI_COMMIT_SHA .
    - docker push glovo-scraper-api:$CI_COMMIT_SHA
```

## Performance Tips

1. **Layer Caching**: Order Dockerfile commands by change frequency
2. **Multi-Stage Build**: Separate build and runtime stages
3. **Alpine Base**: Use lightweight distributions
4. **Small Libraries**: Minimize base image size
5. **Remove Unnecessary Files**: Use .dockerignore

## Security Best Practices

✅ Non-root user
✅ Read-only filesystem where possible
✅ Security scanning (docker scan)
✅ Updated base images
✅ Resource limits
✅ Health checks
✅ Minimal dependencies

## References

- [Docker Documentation](https://docs.docker.com/)
- [Docker Security Best Practices](https://docs.docker.com/engine/security/)
- [Docker Compose Reference](https://docs.docker.com/compose/compose-file/)