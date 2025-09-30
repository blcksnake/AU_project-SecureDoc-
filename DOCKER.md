# Docker Deployment Guide

This guide covers deploying SecureDoc using Docker and Docker Compose for both development and production environments.

## Prerequisites

- Docker 20.10+
- Docker Compose 2.0+
- 2GB+ available RAM
- 5GB+ available disk space

## Quick Start

### Development Deployment

1. **Clone and navigate to the project**
   ```bash
   git clone https://github.com/your-org/securedoc.git
   cd securedoc
   ```

2. **Start all services**
   ```bash
   docker-compose up --build -d
   ```

3. **Access the application**
   - Frontend: http://localhost:3000
   - Backend API: http://localhost:8080
   - Health Check: http://localhost:8080/health

4. **View logs**
   ```bash
   docker-compose logs -f
   ```

5. **Stop services**
   ```bash
   docker-compose down
   ```

## Architecture

### Container Overview

```
┌─────────────────┐    ┌─────────────────┐
│   Frontend      │    │   Backend       │
│   (React)       │◄──►│   (Node.js)     │
│   Port: 3000    │    │   Port: 8080    │
└─────────────────┘    └─────────────────┘
                                │
                                ▼
                       ┌─────────────────┐
                       │   SQLite DB     │
                       │   (audit.db)    │
                       └─────────────────┘
```

### Services

| Service | Image | Port | Description |
|---------|-------|------|-------------|
| frontend | securedoc-frontend | 3000 | React application |
| backend | securedoc-backend | 8080 | Node.js API server |

## Configuration

### Environment Variables

Create a `.env` file in the project root:

```bash
# Backend Configuration
NODE_ENV=production
PORT=8080

# Frontend Configuration
REACT_APP_API_URL=http://localhost:8080

# Database Configuration
DB_PATH=/app/audit.db

# Security
SESSION_SECRET=your-secure-session-secret-here
```

### Docker Compose Configuration

The `docker-compose.yml` file defines the services:

```yaml
services:
  backend:
    build:
      context: .
      dockerfile: Dockerfile.nodejs
    ports:
      - "8080:8080"
    volumes:
      - ./uploads:/app/uploads
      - ./logs:/app/logs
    environment:
      - NODE_ENV=production
      - PORT=8080

  frontend:
    build:
      context: ./frontend
      dockerfile: Dockerfile
    ports:
      - "3000:3000"
    environment:
      - REACT_APP_API_URL=http://localhost:8080
    depends_on:
      - backend
```

## Production Deployment

### 1. Production Docker Compose

Create `docker-compose.prod.yml`:

```yaml
version: '3.8'

services:
  backend:
    build:
      context: .
      dockerfile: Dockerfile.nodejs
    ports:
      - "8080:8080"
    volumes:
      - ./uploads:/app/uploads
      - ./logs:/app/logs
      - ./data:/app/data
    environment:
      - NODE_ENV=production
      - PORT=8080
      - SESSION_SECRET=${SESSION_SECRET}
    restart: unless-stopped
    healthcheck:
      test: ["CMD", "curl", "-f", "http://localhost:8080/health"]
      interval: 30s
      timeout: 10s
      retries: 3

  frontend:
    build:
      context: ./frontend
      dockerfile: Dockerfile
    ports:
      - "3000:3000"
    environment:
      - REACT_APP_API_URL=http://localhost:8080
    depends_on:
      - backend
    restart: unless-stopped
    healthcheck:
      test: ["CMD", "curl", "-f", "http://localhost:3000"]
      interval: 30s
      timeout: 10s
      retries: 3

  nginx:
    image: nginx:alpine
    ports:
      - "80:80"
      - "443:443"
    volumes:
      - ./nginx.conf:/etc/nginx/nginx.conf
      - ./ssl:/etc/nginx/ssl
    depends_on:
      - frontend
      - backend
    restart: unless-stopped
```

### 2. Nginx Configuration

Create `nginx.conf`:

```nginx
events {
    worker_connections 1024;
}

http {
    upstream backend {
        server backend:8080;
    }

    upstream frontend {
        server frontend:3000;
    }

    server {
        listen 80;
        server_name your-domain.com;

        # Redirect HTTP to HTTPS
        return 301 https://$server_name$request_uri;
    }

    server {
        listen 443 ssl;
        server_name your-domain.com;

        ssl_certificate /etc/nginx/ssl/cert.pem;
        ssl_certificate_key /etc/nginx/ssl/key.pem;

        # Frontend
        location / {
            proxy_pass http://frontend;
            proxy_set_header Host $host;
            proxy_set_header X-Real-IP $remote_addr;
            proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
            proxy_set_header X-Forwarded-Proto $scheme;
        }

        # Backend API
        location /api/ {
            proxy_pass http://backend;
            proxy_set_header Host $host;
            proxy_set_header X-Real-IP $remote_addr;
            proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
            proxy_set_header X-Forwarded-Proto $scheme;
        }

        # Health check
        location /health {
            proxy_pass http://backend/health;
        }
    }
}
```

### 3. Deploy to Production

```bash
# Set environment variables
export SESSION_SECRET="your-very-secure-secret-key"

# Deploy with production configuration
docker-compose -f docker-compose.prod.yml up --build -d

# Check status
docker-compose -f docker-compose.prod.yml ps

# View logs
docker-compose -f docker-compose.prod.yml logs -f
```

## Scaling

### Horizontal Scaling

Scale the backend service:

```bash
# Scale backend to 3 instances
docker-compose up --scale backend=3 -d

# Check running containers
docker-compose ps
```

### Load Balancing

Update `docker-compose.yml` to include a load balancer:

```yaml
services:
  nginx:
    image: nginx:alpine
    ports:
      - "80:80"
    volumes:
      - ./nginx-lb.conf:/etc/nginx/nginx.conf
    depends_on:
      - backend
      - frontend

  backend:
    # ... existing configuration
    deploy:
      replicas: 3
```

## Monitoring

### Health Checks

Check service health:

```bash
# Check all services
docker-compose ps

# Check specific service
docker-compose exec backend curl http://localhost:8080/health

# View service logs
docker-compose logs backend
```

### Log Management

```bash
# Follow logs in real-time
docker-compose logs -f

# View logs for specific service
docker-compose logs -f backend

# View last 100 lines
docker-compose logs --tail=100 backend
```

### Resource Monitoring

```bash
# View resource usage
docker stats

# View container details
docker-compose exec backend top
```

## Backup and Recovery

### Database Backup

```bash
# Backup SQLite database
docker-compose exec backend cp /app/audit.db /app/backup/audit-$(date +%Y%m%d).db

# Copy backup to host
docker cp $(docker-compose ps -q backend):/app/backup/audit-20240101.db ./backups/
```

### File Storage Backup

```bash
# Backup uploads directory
tar -czf uploads-backup-$(date +%Y%m%d).tar.gz uploads/

# Restore from backup
tar -xzf uploads-backup-20240101.tar.gz
```

### Complete Backup Script

Create `backup.sh`:

```bash
#!/bin/bash
BACKUP_DIR="./backups"
DATE=$(date +%Y%m%d_%H%M%S)

mkdir -p $BACKUP_DIR

# Backup database
docker-compose exec backend cp /app/audit.db /app/backup/audit-$DATE.db
docker cp $(docker-compose ps -q backend):/app/backup/audit-$DATE.db $BACKUP_DIR/

# Backup uploads
tar -czf $BACKUP_DIR/uploads-$DATE.tar.gz uploads/

# Backup logs
tar -czf $BACKUP_DIR/logs-$DATE.tar.gz logs/

echo "Backup completed: $BACKUP_DIR"
```

## Troubleshooting

### Common Issues

#### Container Won't Start
```bash
# Check logs
docker-compose logs backend

# Check container status
docker-compose ps

# Restart specific service
docker-compose restart backend
```

#### Port Conflicts
```bash
# Check port usage
netstat -tulpn | grep :8080

# Change ports in docker-compose.yml
ports:
  - "8081:8080"  # Use port 8081 instead
```

#### Permission Issues
```bash
# Fix upload directory permissions
sudo chown -R 1000:1000 uploads/
sudo chmod -R 755 uploads/
```

#### Database Issues
```bash
# Access database directly
docker-compose exec backend sqlite3 /app/audit.db

# Check database integrity
docker-compose exec backend sqlite3 /app/audit.db "PRAGMA integrity_check;"
```

### Debug Mode

Run in debug mode:

```bash
# Enable debug logging
docker-compose -f docker-compose.yml -f docker-compose.debug.yml up

# Create docker-compose.debug.yml
version: '3.8'
services:
  backend:
    environment:
      - DEBUG=*
      - NODE_ENV=development
```

## Security Considerations

### Container Security

1. **Use non-root user**
   ```dockerfile
   USER node
   ```

2. **Minimize attack surface**
   ```dockerfile
   RUN apk del build-dependencies
   ```

3. **Regular updates**
   ```bash
   docker-compose pull
   docker-compose up --build -d
   ```

### Network Security

1. **Use internal networks**
   ```yaml
   networks:
     securedoc-internal:
       driver: bridge
   ```

2. **Limit exposed ports**
   ```yaml
   ports:
     - "127.0.0.1:8080:8080"  # Only localhost
   ```

### Data Security

1. **Encrypt sensitive data**
   ```bash
   # Use encrypted volumes
   docker volume create --driver local \
     --opt type=tmpfs \
     --opt device=tmpfs \
     --opt o=size=1g,uid=1000 \
     securedoc-tmp
   ```

2. **Regular backups**
   ```bash
   # Automated daily backups
   0 2 * * * /path/to/backup.sh
   ```

## Performance Tuning

### Resource Limits

```yaml
services:
  backend:
    deploy:
      resources:
        limits:
          memory: 512M
          cpus: '0.5'
        reservations:
          memory: 256M
          cpus: '0.25'
```

### Database Optimization

```bash
# Optimize SQLite database
docker-compose exec backend sqlite3 /app/audit.db "VACUUM;"
docker-compose exec backend sqlite3 /app/audit.db "ANALYZE;"
```

## Maintenance

### Regular Maintenance Tasks

1. **Update dependencies**
   ```bash
   docker-compose pull
   docker-compose up --build -d
   ```

2. **Clean up old images**
   ```bash
   docker system prune -a
   ```

3. **Rotate logs**
   ```bash
   docker-compose exec backend find /app/logs -name "*.log" -mtime +7 -delete
   ```

4. **Database maintenance**
   ```bash
   docker-compose exec backend sqlite3 /app/audit.db "VACUUM;"
   ```

## Support

For Docker deployment issues:
- Check the logs: `docker-compose logs -f`
- Review this documentation
- Open an issue on GitHub
- Contact the development team
