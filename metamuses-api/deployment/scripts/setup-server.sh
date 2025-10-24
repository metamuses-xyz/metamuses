#!/bin/bash
# ============================================================================
# MetaMuses API - Initial Server Setup Script
# Run this script on a fresh Hetzner Ubuntu 24.04 server
# ============================================================================

set -euo pipefail

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Logging function
log() {
    echo -e "${GREEN}[$(date +'%Y-%m-%d %H:%M:%S')]${NC} $1"
}

error() {
    echo -e "${RED}[ERROR]${NC} $1" >&2
}

warn() {
    echo -e "${YELLOW}[WARN]${NC} $1"
}

# Check if running as root
if [[ $EUID -ne 0 ]]; then
   error "This script must be run as root"
   exit 1
fi

log "Starting MetaMuses API server setup..."

# ============================================================================
# 1. System Update
# ============================================================================
log "Updating system packages..."
apt update && apt upgrade -y

# ============================================================================
# 2. Install Essential Packages
# ============================================================================
log "Installing essential packages..."
apt install -y \
    curl \
    wget \
    git \
    vim \
    htop \
    ufw \
    fail2ban \
    unattended-upgrades \
    ca-certificates \
    gnupg \
    lsb-release \
    software-properties-common \
    apt-transport-https \
    build-essential

# ============================================================================
# 3. Configure Hostname
# ============================================================================
log "Setting hostname..."
hostnamectl set-hostname metamuses-api-prod

# ============================================================================
# 4. Configure Timezone
# ============================================================================
log "Setting timezone to UTC..."
timedatectl set-timezone UTC

# ============================================================================
# 5. Create Deploy User
# ============================================================================
log "Creating deploy user..."
if id "deploy" &>/dev/null; then
    warn "User 'deploy' already exists, skipping..."
else
    useradd -m -s /bin/bash deploy
    usermod -aG sudo deploy
    log "User 'deploy' created successfully"
fi

# ============================================================================
# 6. Setup SSH for Deploy User
# ============================================================================
log "Setting up SSH for deploy user..."
mkdir -p /home/deploy/.ssh
if [ -f /root/.ssh/authorized_keys ]; then
    cp /root/.ssh/authorized_keys /home/deploy/.ssh/
fi
chown -R deploy:deploy /home/deploy/.ssh
chmod 700 /home/deploy/.ssh
chmod 600 /home/deploy/.ssh/authorized_keys 2>/dev/null || true

# ============================================================================
# 7. Install Docker
# ============================================================================
log "Installing Docker..."
if command -v docker &> /dev/null; then
    warn "Docker is already installed, skipping..."
else
    curl -fsSL https://get.docker.com -o get-docker.sh
    sh get-docker.sh
    rm get-docker.sh

    # Add deploy user to docker group
    usermod -aG docker deploy

    # Enable Docker to start on boot
    systemctl enable docker
    systemctl start docker

    log "Docker installed successfully"
fi

# ============================================================================
# 8. Install Docker Compose V2
# ============================================================================
log "Installing Docker Compose..."
DOCKER_CONFIG=/usr/local/lib/docker
mkdir -p $DOCKER_CONFIG/cli-plugins
curl -SL "https://github.com/docker/compose/releases/download/v2.24.0/docker-compose-$(uname -s)-$(uname -m)" \
    -o $DOCKER_CONFIG/cli-plugins/docker-compose
chmod +x $DOCKER_CONFIG/cli-plugins/docker-compose

# Verify installation
docker --version
docker compose version

# ============================================================================
# 9. Setup Directory Structure
# ============================================================================
log "Creating directory structure..."
mkdir -p /opt/metamuses/{config,logs,backups}
mkdir -p /mnt/models
mkdir -p /mnt/data/{redis,qdrant,prometheus,grafana}

# Set ownership
chown -R deploy:deploy /opt/metamuses
chown -R deploy:deploy /mnt/models
chown -R deploy:deploy /mnt/data

log "Directory structure created"

# ============================================================================
# 10. Configure UFW Firewall
# ============================================================================
log "Configuring UFW firewall..."
ufw --force reset
ufw default deny incoming
ufw default allow outgoing

# Allow SSH (rate limited)
ufw limit ssh comment 'SSH rate limit'

# Allow HTTP/HTTPS
ufw allow 80/tcp comment 'HTTP'
ufw allow 443/tcp comment 'HTTPS'

# Enable UFW
ufw --force enable

log "UFW firewall configured and enabled"

# ============================================================================
# 11. Configure Fail2Ban
# ============================================================================
log "Configuring Fail2Ban..."

cat > /etc/fail2ban/jail.local <<'EOF'
[DEFAULT]
bantime = 3600
findtime = 600
maxretry = 5
destemail = root@localhost
sender = fail2ban@localhost
action = %(action_mwl)s

[sshd]
enabled = true
port = ssh
logpath = /var/log/auth.log
maxretry = 3

[nginx-http-auth]
enabled = true
port = http,https
logpath = /var/log/nginx/error.log

[nginx-limit-req]
enabled = true
port = http,https
logpath = /var/log/nginx/error.log
maxretry = 10
EOF

systemctl restart fail2ban
systemctl enable fail2ban

log "Fail2Ban configured and started"

# ============================================================================
# 12. Harden SSH
# ============================================================================
log "Hardening SSH configuration..."

# Backup original sshd_config
cp /etc/ssh/sshd_config /etc/ssh/sshd_config.backup

# Update SSH config
sed -i 's/^#PermitRootLogin.*/PermitRootLogin no/' /etc/ssh/sshd_config
sed -i 's/^PermitRootLogin.*/PermitRootLogin no/' /etc/ssh/sshd_config
sed -i 's/^#PasswordAuthentication.*/PasswordAuthentication no/' /etc/ssh/sshd_config
sed -i 's/^PasswordAuthentication.*/PasswordAuthentication no/' /etc/ssh/sshd_config
sed -i 's/^#PubkeyAuthentication.*/PubkeyAuthentication yes/' /etc/ssh/sshd_config

# Add AllowUsers if not present
if ! grep -q "^AllowUsers" /etc/ssh/sshd_config; then
    echo "AllowUsers deploy" >> /etc/ssh/sshd_config
fi

# Restart SSH (after a delay to ensure script completes)
(sleep 5 && systemctl restart sshd) &

log "SSH hardened - root login disabled, password auth disabled"

# ============================================================================
# 13. Enable Automatic Security Updates
# ============================================================================
log "Enabling automatic security updates..."
dpkg-reconfigure --priority=low unattended-upgrades -f noninteractive

# ============================================================================
# 14. Install Nginx
# ============================================================================
log "Installing Nginx..."
apt install -y nginx
systemctl enable nginx
systemctl start nginx

log "Nginx installed and started"

# ============================================================================
# 15. Setup Log Rotation
# ============================================================================
log "Configuring log rotation..."

cat > /etc/logrotate.d/metamuses <<'EOF'
/var/log/nginx/*.log {
    daily
    missingok
    rotate 30
    compress
    delaycompress
    notifempty
    create 0640 www-data adm
    sharedscripts
    postrotate
        [ -f /var/run/nginx.pid ] && kill -USR1 `cat /var/run/nginx.pid`
    endscript
}

/opt/metamuses/logs/*.log {
    daily
    missingok
    rotate 30
    compress
    delaycompress
    notifempty
    create 0644 deploy deploy
}
EOF

log "Log rotation configured"

# ============================================================================
# 16. Create Sudoers Entry for Deploy User
# ============================================================================
log "Configuring sudo for deploy user..."
echo "deploy ALL=(ALL) NOPASSWD: /usr/bin/docker, /usr/bin/docker-compose, /usr/bin/systemctl" > /etc/sudoers.d/deploy
chmod 0440 /etc/sudoers.d/deploy

# ============================================================================
# 17. Configure System Limits
# ============================================================================
log "Configuring system limits..."

cat >> /etc/security/limits.conf <<'EOF'
# MetaMuses API limits
deploy soft nofile 65536
deploy hard nofile 65536
deploy soft nproc 32768
deploy hard nproc 32768
EOF

# ============================================================================
# 18. Optimize Kernel Parameters
# ============================================================================
log "Optimizing kernel parameters..."

cat >> /etc/sysctl.conf <<'EOF'
# MetaMuses API optimizations
net.core.somaxconn = 65535
net.ipv4.tcp_max_syn_backlog = 8192
net.ipv4.ip_local_port_range = 1024 65535
net.ipv4.tcp_tw_reuse = 1
net.ipv4.tcp_fin_timeout = 30
vm.swappiness = 10
EOF

sysctl -p

# ============================================================================
# Completion
# ============================================================================
log ""
log "=========================================="
log "Server setup completed successfully!"
log "=========================================="
log ""
log "Next steps:"
log "1. Exit and log in as 'deploy' user"
log "2. Copy your application files to /opt/metamuses"
log "3. Configure environment variables in /opt/metamuses/.env"
log "4. Download model files to /mnt/models"
log "5. Run the deploy script: ./deployment/scripts/deploy.sh"
log ""
log "Important security notes:"
log "- Root SSH login is now disabled"
log "- Password authentication is disabled"
log "- Only 'deploy' user can SSH in"
log "- UFW firewall is enabled (ports 22, 80, 443 open)"
log "- Fail2Ban is monitoring for intrusions"
log ""
warn "If you're still connected as root, your session will remain active."
warn "New connections must use the 'deploy' user with SSH key."
log ""
