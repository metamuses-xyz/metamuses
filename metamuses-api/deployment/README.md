# MetaMuses API - Deployment Files

This directory contains all necessary files for deploying the MetaMuses API to production on Hetzner Cloud with Docker, Nginx, and Cloudflare.

## Directory Structure

```
deployment/
├── docker/
│   ├── Dockerfile                        # Multi-stage production Dockerfile
│   └── docker-compose.production.yml     # Production Docker Compose configuration
├── nginx/
│   └── api.metamuses.xyz.conf           # Nginx reverse proxy configuration
├── monitoring/
│   ├── prometheus.yml                    # Prometheus metrics configuration
│   └── grafana/
│       ├── dashboards/                   # Grafana dashboard provisioning
│       └── datasources/                  # Grafana datasource configuration
├── scripts/
│   ├── setup-server.sh                   # Initial server setup (run once)
│   ├── deploy.sh                         # Deployment script
│   ├── backup.sh                         # Backup script
│   └── restore.sh                        # Restore script
└── README.md                             # This file
```

## Quick Start

### 1. Initial Server Setup (One-time)

On your fresh Hetzner Ubuntu 24.04 server:

```bash
# As root user
cd /opt/metamuses
bash deployment/scripts/setup-server.sh
```

This script will:
- Update system packages
- Install Docker & Docker Compose
- Create deploy user
- Configure firewall (UFW)
- Install and configure Fail2Ban
- Harden SSH (disable root login, disable password auth)
- Install Nginx
- Setup directory structure

### 2. Upload Application Files

```bash
# On your local machine
scp -r metamuses-api/ deploy@<SERVER_IP>:/opt/metamuses/

# Upload model files (GGUF files)
scp -r models/* deploy@<SERVER_IP>:/mnt/models/
```

### 3. Configure Environment Variables

```bash
# On server, as deploy user
cd /opt/metamuses
cp .env.example .env
nano .env

# Edit with your actual values:
# - REDIS_PASSWORD
# - PRIVATE_KEY
# - IPFS_JWT_TOKEN
# - GRAFANA_ADMIN_PASSWORD
```

### 4. Configure Nginx

```bash
# Copy Nginx configuration
sudo cp deployment/nginx/api.metamuses.xyz.conf /etc/nginx/sites-available/
sudo ln -s /etc/nginx/sites-available/api.metamuses.xyz.conf /etc/nginx/sites-enabled/
sudo rm /etc/nginx/sites-enabled/default

# Test configuration
sudo nginx -t

# Reload Nginx
sudo systemctl reload nginx
```

### 5. Setup SSL Certificate

**Option A: Cloudflare Origin Certificate (Recommended)**

1. Go to Cloudflare → SSL/TLS → Origin Server
2. Create Origin Certificate
3. Copy certificate and private key:

```bash
sudo mkdir -p /etc/cloudflare-ssl
sudo nano /etc/cloudflare-ssl/metamuses.crt  # Paste certificate
sudo nano /etc/cloudflare-ssl/metamuses.key  # Paste private key
sudo chmod 600 /etc/cloudflare-ssl/metamuses.key
sudo chmod 644 /etc/cloudflare-ssl/metamuses.crt
```

**Option B: Let's Encrypt**

```bash
sudo apt install certbot python3-certbot-nginx
sudo certbot --nginx -d api.metamuses.xyz
```

### 6. Deploy Application

```bash
# As deploy user
cd /opt/metamuses
bash deployment/scripts/deploy.sh
```

This will:
- Check prerequisites
- Create backup
- Build Docker images
- Deploy services
- Run health checks
- Clean up old images

### 7. Verify Deployment

```bash
# Check service status
docker compose -f deployment/docker/docker-compose.production.yml ps

# Check API health
curl http://localhost:8080/health
curl https://api.metamuses.xyz/health

# View logs
docker compose -f deployment/docker/docker-compose.production.yml logs -f api
```

## Daily Operations

### View Logs

```bash
# View all logs
docker compose -f deployment/docker/docker-compose.production.yml logs -f

# View API logs only
docker compose -f deployment/docker/docker-compose.production.yml logs -f api

# View last 100 lines
docker compose -f deployment/docker/docker-compose.production.yml logs --tail=100 api
```

### Restart Services

```bash
# Restart API only
docker compose -f deployment/docker/docker-compose.production.yml restart api

# Restart all services
docker compose -f deployment/docker/docker-compose.production.yml restart
```

### Stop/Start Services

```bash
# Stop all services
docker compose -f deployment/docker/docker-compose.production.yml down

# Start all services
docker compose -f deployment/docker/docker-compose.production.yml up -d

# Stop specific service
docker compose -f deployment/docker/docker-compose.production.yml stop api
```

### Check Resource Usage

```bash
# Docker stats
docker stats

# System resources
htop

# Disk usage
df -h
```

## Backup & Restore

### Create Backup

```bash
# Manual backup
bash deployment/scripts/backup.sh

# Setup automated backups (crontab)
crontab -e
# Add: 0 3 * * * /opt/metamuses/deployment/scripts/backup.sh >> /opt/metamuses/logs/backup.log 2>&1
```

Backups are stored in `/opt/metamuses/backups/` and retained for 7 days.

### Restore from Backup

```bash
# List available backups
ls -lh /opt/metamuses/backups/

# Restore
bash deployment/scripts/restore.sh metamuses_backup_YYYYMMDD_HHMMSS.tar.gz
```

## Monitoring

### Access Monitoring Tools

- **Grafana**: http://<SERVER_IP>:3000 or https://api.metamuses.xyz/grafana
  - Username: `admin`
  - Password: (from GRAFANA_ADMIN_PASSWORD in .env)

- **Prometheus**: http://<SERVER_IP>:9090

### Key Metrics to Monitor

1. **API Health**: `/health` endpoint
2. **Request Rate**: Requests per second
3. **Response Time**: P50, P95, P99 latencies
4. **Error Rate**: 4xx, 5xx responses
5. **Cache Hit Rate**: Semantic cache effectiveness
6. **Resource Usage**: CPU, memory, disk

## Troubleshooting

### API Not Responding

```bash
# Check if container is running
docker ps | grep metamuses-api

# Check logs
docker compose -f deployment/docker/docker-compose.production.yml logs api --tail=100

# Check health
docker exec metamuses-api curl -f http://localhost:8080/health

# Restart
docker compose -f deployment/docker/docker-compose.production.yml restart api
```

### Redis Connection Issues

```bash
# Check Redis
docker exec metamuses-redis redis-cli ping

# Check logs
docker compose -f deployment/docker/docker-compose.production.yml logs redis

# Restart Redis
docker compose -f deployment/docker/docker-compose.production.yml restart redis
```

### Qdrant Issues

```bash
# Check Qdrant health
curl http://localhost:6334/health

# View collections
curl http://localhost:6334/collections

# Check logs
docker compose -f deployment/docker/docker-compose.production.yml logs qdrant
```

### High Memory Usage

```bash
# Check memory
free -h
docker stats

# Reduce worker counts
nano .env
# Lower FAST_TIER_WORKERS, MEDIUM_TIER_WORKERS

# Restart
docker compose -f deployment/docker/docker-compose.production.yml restart api
```

### SSL Certificate Issues

```bash
# Test SSL
curl -vI https://api.metamuses.xyz

# Check certificate expiry
echo | openssl s_client -servername api.metamuses.xyz -connect api.metamuses.xyz:443 2>/dev/null | openssl x509 -noout -dates

# Renew Let's Encrypt
sudo certbot renew --nginx
```

## Security

### Update Firewall Rules

```bash
# List current rules
sudo ufw status verbose

# Add rule
sudo ufw allow from <IP_ADDRESS> to any port 3000 comment 'Grafana access'

# Delete rule
sudo ufw delete allow 3000
```

### View Fail2Ban Status

```bash
# Check status
sudo fail2ban-client status

# Check specific jail
sudo fail2ban-client status sshd

# Unban IP
sudo fail2ban-client set sshd unbanip <IP_ADDRESS>
```

### Review Security Logs

```bash
# SSH attempts
sudo grep "Failed password" /var/log/auth.log | tail -50

# Nginx errors
sudo tail -f /var/log/nginx/api.metamuses.xyz.error.log

# Fail2Ban logs
sudo tail -f /var/log/fail2ban.log
```

## Updating

### Update Application Code

```bash
# Pull latest code
cd /opt/metamuses
git pull origin main

# Deploy
bash deployment/scripts/deploy.sh
```

### Update System Packages

```bash
# Update packages
sudo apt update && sudo apt upgrade -y

# Reboot if needed
sudo reboot
```

### Update Docker Images

```bash
# Pull latest images
docker compose -f deployment/docker/docker-compose.production.yml pull

# Restart services
docker compose -f deployment/docker/docker-compose.production.yml up -d
```

## Maintenance

### Weekly Tasks

- Review backups: `ls -lh /opt/metamuses/backups/`
- Check disk space: `df -h`
- Review logs for errors
- Check Grafana dashboards

### Monthly Tasks

- Update system packages
- Review and optimize Docker images
- Review security logs
- Test disaster recovery procedure
- Rotate API keys if needed

## Performance Tuning

### Adjust Worker Counts

Edit `.env`:

```bash
# For budget server (16GB RAM)
FAST_TIER_WORKERS=5
MEDIUM_TIER_WORKERS=3
HEAVY_TIER_WORKERS=0

# For production server (32GB RAM)
FAST_TIER_WORKERS=10
MEDIUM_TIER_WORKERS=5
HEAVY_TIER_WORKERS=2
```

### Adjust Cache Settings

```bash
# More aggressive caching
CACHE_SIMILARITY_THRESHOLD=0.90

# Stricter caching
CACHE_SIMILARITY_THRESHOLD=0.98
```

### Enable/Disable Model Tiers

```bash
# Disable heavy tier to save resources
ENABLE_HEAVY_TIER=false
```

## Support

### Useful Commands

```bash
# Quick health check
curl -f https://api.metamuses.xyz/health && echo "✓ API is healthy" || echo "✗ API is down"

# View all containers
docker ps -a

# Clean up Docker
docker system prune -af --volumes

# Check Nginx status
sudo systemctl status nginx

# Reload Nginx without downtime
sudo nginx -t && sudo systemctl reload nginx
```

### Log Locations

- Nginx Access: `/var/log/nginx/api.metamuses.xyz.access.log`
- Nginx Error: `/var/log/nginx/api.metamuses.xyz.error.log`
- Application: `docker compose logs api`
- System: `/var/log/syslog`
- Auth: `/var/log/auth.log`
- Fail2Ban: `/var/log/fail2ban.log`

## Additional Resources

- **Full Documentation**: See `PRODUCTION_DEPLOYMENT.md` in root directory
- **Hetzner Cloud Docs**: https://docs.hetzner.com/cloud/
- **Cloudflare Docs**: https://developers.cloudflare.com/
- **Docker Docs**: https://docs.docker.com/
- **Nginx Docs**: https://nginx.org/en/docs/

---

**For detailed deployment guide and architecture, see: `PRODUCTION_DEPLOYMENT.md`**
