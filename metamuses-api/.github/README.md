# GitHub Actions CI/CD

Complete CI/CD automation for MetaMuses API deployment to Hetzner Cloud.

---

## Overview

This directory contains GitHub Actions workflows that automate:
- **Continuous Integration** - Testing, linting, security audits
- **Automated Deployment** - Production and staging deployments
- **Health Monitoring** - Automated health checks every 15 minutes
- **Rollback Capability** - Manual rollback with confirmation
- **Notifications** - Slack/Discord alerts for deployment status

---

## Workflows

### 1. Continuous Integration (`ci.yml`)

**Triggers**: Pull requests and pushes to `develop` branch

**Jobs**:
- **Lint and Format** - `cargo fmt`, `cargo clippy`, documentation checks
- **Test** - Run all tests with multiple configurations
- **Security Audit** - `cargo-audit` for vulnerability scanning
- **Build Release** - Build release binary
- **Docker Build** - Test Docker image build
- **Code Coverage** - Generate coverage reports with tarpaulin
- **Status Check** - Summary and PR comment

**Status**: ✅ Fully automated

---

### 2. Production Deployment (`deploy-production.yml`)

**Triggers**:
- **Automatic**: Push to `main` branch (on merge)
- **Manual**: workflow_dispatch with environment selection

**Git Flow**:
```
Feature → PR → Develop (Staging) → PR → Main (Production)
```

**Pipeline**:
```
Test → Build Docker → Deploy → Health Check → Notify
   ↓
Rollback on failure
```

**Jobs**:
1. **Test** - Run all tests (skippable with `skip_tests` input)
2. **Build Docker** - Build and push to GHCR
3. **Deploy** - SSH deployment to Hetzner with automatic backup
4. **Post-deploy** - Cleanup and record keeping
5. **Notify** - Slack/Discord notifications

**Features**:
- Pre-deployment backup creation
- Automatic rollback on health check failure
- 30 retry health checks with 5s intervals
- Docker image versioning with multiple tags
- Build provenance attestation

**Status**: ✅ Production ready

---

### 3. Staging Deployment (`deploy-staging.yml`)

**Triggers**: Push to `develop` branch

**Purpose**: Test deployments before production

**Similar to production** but deploys to staging environment with:
- Separate server (STAGING_HOST)
- Separate SSH credentials
- Faster deployment (fewer checks)

**Status**: ✅ Ready for use

---

### 4. Rollback (`rollback.yml`)

**Triggers**: Manual only (workflow_dispatch)

**Safety Features**:
- Requires typing "ROLLBACK" to confirm
- Creates pre-rollback backup
- Health check after rollback
- Creates GitHub issue on failure

**Inputs**:
- `environment` - production or staging
- `backup_file` - specific backup (or latest if empty)
- `confirm` - must type "ROLLBACK"

**Status**: ✅ Emergency ready

---

### 5. Health Check (`health-check.yml`)

**Triggers**:
- **Scheduled**: Every 15 minutes
- **Manual**: workflow_dispatch

**Checks**:
- API health endpoint (https://api.metamuses.xyz/health)
- Grafana accessibility
- Response time monitoring

**On Failure**:
1. Send Slack alert
2. Send Discord alert
3. Create GitHub issue with:
   - Priority: Urgent
   - Labels: bug, production, health-check
   - Auto-assigned to repository owner

**Status**: ✅ Monitoring active

---

## Quick Start

### Prerequisites

Before using these workflows, complete the setup:

1. **Read Documentation**:
   - [`SETUP_SECRETS.md`](./SETUP_SECRETS.md) - Configure GitHub secrets
   - [`CICD_QUICK_REFERENCE.md`](./CICD_QUICK_REFERENCE.md) - Common operations
   - [`/docs/CICD_GUIDE.md`](../docs/CICD_GUIDE.md) - Comprehensive guide

2. **Required GitHub Secrets**:
   - `SERVER_HOST` - Production server IP
   - `SERVER_USER` - SSH username (deploy)
   - `SSH_PRIVATE_KEY` - SSH private key

3. **Optional GitHub Secrets**:
   - `STAGING_HOST`, `STAGING_USER`, `STAGING_SSH_KEY` - For staging
   - `SLACK_WEBHOOK_URL` - Slack notifications
   - `DISCORD_WEBHOOK` - Discord notifications
   - `CODECOV_TOKEN` - Code coverage uploads
   - `HEALTH_CHECK_URL` - Custom health check URL

4. **GitHub Settings** (OPTIONAL):
   - ✅ Workflows have permissions defined at workflow-level
   - ✅ No repository settings changes needed
   - See [`PERMISSIONS_GUIDE.md`](./PERMISSIONS_GUIDE.md) for details

5. **Environments** (Optional but recommended):
   - Create `production` environment with protection rules
   - Create `staging` environment

---

## Usage

### Deploy to Production

**Automatic Deployment** (Recommended):
```bash
# Merge PR to main
git checkout main
git pull
git merge develop
git push
# ✓ Deployment starts automatically
```

**Manual Deployment**:
1. Go to Actions → "Deploy to Production"
2. Click "Run workflow"
3. Select environment: `production`
4. Skip tests: `false` (recommended)
5. Click "Run workflow"

---

### Deploy to Staging

```bash
# Push to develop branch
git checkout develop
git push origin develop
# ✓ Staging deployment starts automatically
```

---

### Rollback Production

1. Go to Actions → "Rollback Deployment"
2. Click "Run workflow"
3. Environment: `production`
4. Backup file: (leave empty for latest)
5. Confirm: Type `ROLLBACK`
6. Click "Run workflow"

---

### Manual Health Check

1. Go to Actions → "Health Check"
2. Click "Run workflow"
3. Environment: Select `production`, `staging`, or `both`
4. Click "Run workflow"

---

## Git Flow

```
┌─────────────┐
│   Feature   │
│   Branch    │
└──────┬──────┘
       │ PR + CI
       ▼
┌─────────────┐
│   Develop   │──────► Staging Deployment
└──────┬──────┘
       │ PR + CI
       ▼
┌─────────────┐
│    Main     │──────► Production Deployment
└─────────────┘
```

**Branch Protection Rules** (Recommended):
- `main`: Require PR reviews, require status checks
- `develop`: Require status checks

---

## Architecture

### Docker Image Registry

**GitHub Container Registry (GHCR)**:
- Registry: `ghcr.io`
- Image: `ghcr.io/YOUR_ORG/metamuses-api`
- Tags:
  - `latest` - Latest production build
  - `main-SHA` - Specific commit
  - `YYYYMMDD-HHmmss` - Timestamp tag

### Deployment Flow

```
┌─────────────┐
│ GitHub      │
│ Actions     │
└──────┬──────┘
       │ SSH
       ▼
┌─────────────┐
│ Hetzner     │
│ Server      │
└──────┬──────┘
       │
       ▼
┌─────────────┐     ┌─────────────┐
│ Docker      │────▶│ Nginx       │
│ Compose     │     │ Reverse     │
│             │     │ Proxy       │
└─────────────┘     └──────┬──────┘
       │                   │
       ▼                   ▼
┌─────────────┐     ┌─────────────┐
│ API         │     │ Cloudflare  │
│ Redis       │     │ CDN + SSL   │
│ Qdrant      │     │             │
│ Prometheus  │     └─────────────┘
│ Grafana     │
└─────────────┘
```

---

## Deployment Timing

| Stage | Time | Description |
|-------|------|-------------|
| Test | 2-5 min | Tests + linting |
| Build Docker | 3-5 min | Multi-stage build |
| Deploy | 1-3 min | SSH + container update |
| Health Check | 30 sec | Verify deployment |
| **Total** | **6-13 min** | Full pipeline |

---

## Monitoring

### Health Check Schedule

- **Frequency**: Every 15 minutes
- **Endpoint**: https://api.metamuses.xyz/health
- **Timeout**: 5 seconds
- **On Failure**: Slack + Discord + GitHub Issue

### Metrics

**Access Grafana**:
- URL: https://api.metamuses.xyz/grafana
- Dashboards: API metrics, system resources, deployment history

**Key Metrics**:
- API uptime (target: >99.9%)
- Response time p95 (target: <2s)
- Error rate (target: <1%)
- Deployment success rate (target: >95%)

---

## Notifications

### Slack Integration

**Setup**:
1. Create incoming webhook at https://api.slack.com/messaging/webhooks
2. Add `SLACK_WEBHOOK_URL` to GitHub secrets
3. Format: `https://hooks.slack.com/services/T00000000/B00000000/XXXX`

**Notifications**:
- Deployment success/failure
- Health check failures
- Rollback operations

### Discord Integration

**Setup**:
1. Server Settings → Integrations → Webhooks
2. Add `DISCORD_WEBHOOK` to GitHub secrets
3. Format: `https://discord.com/api/webhooks/123456789012345678/abcdef`

**Notifications**: Same as Slack

---

## Troubleshooting

### Common Issues

| Issue | Solution |
|-------|----------|
| SSH connection failed | Verify `SSH_PRIVATE_KEY` secret, check server firewall |
| Docker login failed | Enable "Read and write permissions" in Actions settings |
| Health check timeout | Check server logs: `docker compose logs api` |
| Build fails | Check Rust version, dependencies, Cargo.lock |
| Tests fail | Run locally: `cargo test --all-features` |

### Debug Commands

```bash
# SSH to server
ssh deploy@YOUR_SERVER_IP

# Check containers
docker compose ps

# View logs
docker compose logs api --tail=100 -f

# Check health
curl http://localhost:8080/health

# View disk usage
df -h
docker system df

# Manual deployment
cd /opt/metamuses
bash deployment/scripts/deploy.sh
```

### Workflow Logs

1. Go to Actions tab
2. Click on workflow run
3. Click on failed job
4. Expand failed step
5. Review logs and error messages

---

## Security

### SSH Key Management

**Generate Deployment Key**:
```bash
ssh-keygen -t ed25519 -f ~/.ssh/metamuses_deploy -C "metamuses-deploy"
# No passphrase (required for automation)
```

**Rotation Schedule**:
- SSH keys: Every 90 days
- Webhook URLs: When team members leave
- API tokens: Every 30 days

**Best Practices**:
- Never commit private keys to Git
- Use separate keys for staging and production
- Limit key permissions on server (deploy user only)
- Monitor key usage in workflow logs

### GitHub Actions Permissions

**Workflow-Level Permissions** (Recommended ✅):
- All workflows have explicit `permissions:` blocks
- No repository settings changes needed
- More secure (least privilege principle)

**Permissions Used**:
- `contents: read` - Read repository code
- `packages: write` - Push Docker images to GHCR
- `issues: write` - Create incident issues
- `pull-requests: write` - Comment on PRs (CI only)

**See**: [`PERMISSIONS_GUIDE.md`](./PERMISSIONS_GUIDE.md) for complete details

---

## Status Badges

Add these badges to your README.md:

```markdown
![CI](https://github.com/YOUR_ORG/metamuses-api/actions/workflows/ci.yml/badge.svg)
![Deploy](https://github.com/YOUR_ORG/metamuses-api/actions/workflows/deploy-production.yml/badge.svg)
![Health](https://github.com/YOUR_ORG/metamuses-api/actions/workflows/health-check.yml/badge.svg)
```

---

## Emergency Procedures

### Production Down

1. **Check Health**:
   ```bash
   curl https://api.metamuses.xyz/health
   ```

2. **Check Grafana**:
   - https://api.metamuses.xyz/grafana
   - Review error rates, response times

3. **Check Server**:
   ```bash
   ssh deploy@SERVER_IP
   docker compose logs api --tail=100
   ```

4. **Rollback if Needed**:
   - Actions → Rollback Deployment
   - Confirm: Type "ROLLBACK"

5. **Notify Team**:
   - Slack/Discord
   - Create incident report

---

## Files in This Directory

```
.github/
├── workflows/
│   ├── ci.yml                    # Continuous Integration
│   ├── deploy-production.yml     # Production deployment
│   ├── deploy-staging.yml        # Staging deployment
│   ├── rollback.yml              # Manual rollback
│   └── health-check.yml          # Automated monitoring
├── README.md                     # This file (overview)
├── SETUP_SECRETS.md              # Secrets configuration guide
├── CICD_QUICK_REFERENCE.md       # Quick reference card
├── ARCHITECTURE.md               # System architecture diagrams
├── PERMISSIONS_GUIDE.md          # Complete permissions guide
└── PERMISSIONS_SUMMARY.md        # Quick permissions reference
```

---

## Related Documentation

- **Full Guide**: [`/docs/CICD_GUIDE.md`](../docs/CICD_GUIDE.md) - Comprehensive CI/CD guide
- **Deployment**: [`/docs/PRODUCTION_DEPLOYMENT.md`](../docs/PRODUCTION_DEPLOYMENT.md) - Infrastructure setup
- **Model Management**: [`/docs/MODEL_MANAGEMENT.md`](../docs/MODEL_MANAGEMENT.md) - GGUF model handling
- **Build Status**: [`BUILD_STATUS.md`](../BUILD_STATUS.md) - Current build status

---

## Support

### Resources

- **GitHub Actions Logs**: https://github.com/YOUR_ORG/metamuses-api/actions
- **Production API**: https://api.metamuses.xyz
- **Grafana Dashboard**: https://api.metamuses.xyz/grafana
- **Documentation**: `/docs/` directory

### Getting Help

1. Check workflow logs in Actions tab
2. Review troubleshooting section above
3. Check server logs via SSH
4. Review deployment documentation:
   - [`PERMISSIONS_GUIDE.md`](./PERMISSIONS_GUIDE.md) - Permissions issues
   - [`SETUP_SECRETS.md`](./SETUP_SECRETS.md) - Secrets configuration
   - [`ARCHITECTURE.md`](./ARCHITECTURE.md) - System overview
5. Create GitHub issue with `cicd` label

---

**Last Updated**: 2025-10-23
**Status**: ✅ Production Ready
