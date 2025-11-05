# Docker Setup for FX-Remit

## Why Docker?

Docker provides:
1. **Consistent Development Environment** - Same environment for all developers
2. **Easy Onboarding** - New developers can start in minutes
3. **Isolated Testing** - Clean environment for running tests
4. **CI/CD Consistency** - Same environment locally and in CI
5. **Production-like Testing** - Test production builds locally

## Quick Start

### Development

```bash
# Start frontend and Hardhat node
docker-compose up

# Run in background
docker-compose up -d

# View logs
docker-compose logs -f

# Stop services
docker-compose down
```

### Running Tests

```bash
# Run all tests
docker-compose --profile test run test

# Run specific test suite
docker-compose run --rm frontend pnpm hardhat:test
docker-compose run --rm frontend pnpm react-app:test
```

### Production Build

```bash
# Build production image
docker build -t fx-remit:latest .

# Run production container
docker run -p 3000:3000 --env-file .env.production fx-remit:latest

# Or use docker-compose for production
docker-compose -f docker-compose.prod.yml up
```

## Services

### Frontend (Port 3000)
- Next.js development server
- Hot reload enabled
- Connected to Hardhat node

### Hardhat Node (Port 8545)
- Local blockchain node
- Pre-funded test accounts
- Fast transactions

## Environment Variables

Create a `.env` file in the root directory:

```env
NEXT_PUBLIC_WC_PROJECT_ID=your_walletconnect_project_id
NEXT_PUBLIC_FXREMIT_CONTRACT=0x...
# Add other required variables
```

## Troubleshooting

### Port Already in Use
```bash
# Change ports in docker-compose.yml
ports:
  - "3001:3000"  # Use different host port
```

### Container Not Starting
```bash
# Rebuild containers
docker-compose down
docker-compose build --no-cache
docker-compose up
```

### Permission Issues
```bash
# Fix file permissions
sudo chown -R $USER:$USER .
```

## Docker Commands Cheat Sheet

```bash
# Build images
docker-compose build

# Start services
docker-compose up

# Stop services
docker-compose down

# View logs
docker-compose logs -f [service-name]

# Execute commands in container
docker-compose exec frontend pnpm install

# Clean up
docker-compose down -v  # Remove volumes too
docker system prune -a  # Remove all unused containers/images
```

