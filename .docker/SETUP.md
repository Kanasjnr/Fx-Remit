# Docker Setup Instructions

## Prerequisites

### 1. Install Docker Desktop (if not already installed)

**For macOS:**
```bash
# Option 1: Using Homebrew
brew install --cask docker

# Option 2: Download from Docker website
# Visit: https://www.docker.com/products/docker-desktop/
```

**For Linux:**
```bash
# Follow official Docker installation guide
# https://docs.docker.com/engine/install/
```

**For Windows:**
- Download Docker Desktop from: https://www.docker.com/products/docker-desktop/

### 2. Start Docker Desktop

After installation:
1. Open Docker Desktop application
2. Wait for it to start (you'll see a Docker icon in your menu bar/taskbar)
3. Verify it's running:
   ```bash
   docker ps
   ```

### 3. Verify Docker Installation

```bash
# Check Docker version
docker --version

# Check Docker Compose version
docker compose version

# Test Docker is working
docker run hello-world
```

## What You DON'T Need to Install

 **No additional packages needed!** The Dockerfiles will install everything:
- Node.js (comes with the Docker image)
- pnpm (installed automatically)
- All npm packages (installed via `pnpm install`)
- Hardhat (comes with dependencies)

## Quick Start

Once Docker Desktop is running:

```bash
# Start the development environment
docker compose up

# Or run in background
docker compose up -d

# View logs
docker compose logs -f

# Stop services
docker compose down
```

## Troubleshooting

### "Cannot connect to Docker daemon"
**Solution:** Start Docker Desktop application

### "Permission denied"
**Solution:** Make sure Docker Desktop is running and your user has permissions

### Port already in use
**Solution:** Change ports in `docker-compose.yml` or stop the service using the port

## That's It!

Once Docker Desktop is running, you can use all the Docker commands. No need to install Node.js, pnpm, or any dependencies manually - Docker handles everything! 🐳

