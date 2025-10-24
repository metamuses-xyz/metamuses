# MetaMuses Monorepo - CI/CD

GitHub Actions workflows for the MetaMuses monorepo.

---

## Repository Structure

```
metamuses/
├── contracts/          # Solidity smart contracts (Foundry)
├── metamuses-api/      # Backend API (Rust/Axum)
├── metamuses-web/      # Frontend web app (Next.js)
└── .github/
    └── workflows/      # GitHub Actions workflows (this directory)
```

---

## Workflows Overview

### API Workflows

**Location**: Workflows monitor `metamuses-api/` directory

1. **`ci-api.yml`** - API Continuous Integration
   - **Triggers**: PRs and pushes to `develop` (when API files change)
   - **Jobs**: Lint, Test, Security Audit, Build, Docker Build, Coverage
   - **Path Filter**: `metamuses-api/**`

2. **`deploy-api-production.yml`** - API Production Deployment
   - **Triggers**:
     - Automatic: Push to `main` (when API files change)
     - Manual: workflow_dispatch
   - **Jobs**: Test → Build Docker → Deploy → Health Check → Notify
   - **Path Filter**: `metamuses-api/src/**`, `metamuses-api/Cargo.*`, etc.

3. **`rollback-api.yml`** - API Rollback
   - **Triggers**: Manual only (workflow_dispatch)
   - **Safety**: Requires typing "ROLLBACK" to confirm

4. **`health-check-api.yml`** - API Health Monitoring
   - **Triggers**: Every 15 minutes (cron)
   - **Alerts**: Slack, Discord, GitHub Issues

### Contracts Workflows

*Coming soon* - CI/CD for Foundry smart contracts

### Web Workflows

*Coming soon* - CI/CD for Next.js frontend

---

## Monorepo Features

### Path-Based Triggering

Workflows only run when relevant files change:

```yaml
# API workflow triggers
on:
  push:
    branches: [main]
    paths:
      - 'metamuses-api/**'          # Only API changes
      - '.github/workflows/ci-api.yml'  # Or workflow changes
```

**Benefits**:
- ✅ Faster CI/CD (only affected packages run)
- ✅ Parallel workflows (API, web, contracts run independently)
- ✅ Reduced GitHub Actions minutes

---

### Working Directory

Each job uses `working-directory` for package-specific commands:

```yaml
jobs:
  test:
    defaults:
      run:
        working-directory: metamuses-api  # All commands run in this dir
    steps:
      - run: cargo test  # Runs in metamuses-api/
```

---

### Docker Build Context

Docker builds specify the package directory:

```yaml
- uses: docker/build-push-action@v5
  with:
    context: ./metamuses-api           # Build context
    file: ./metamuses-api/deployment/docker/Dockerfile
```

---

## Quick Start

### Prerequisites

1. **GitHub Secrets** (same as before):
   - `SERVER_HOST` - Production server IP
   - `SERVER_USER` - SSH username
   - `SSH_PRIVATE_KEY` - SSH private key
   - Optional: `SLACK_WEBHOOK_URL`, `DISCORD_WEBHOOK`

2. **No Repository Settings Changes Needed**:
   - Workflows have permissions defined at workflow-level
   - Works with any repository settings

3. **Server Setup**:
   - Follow `metamuses-api/docs/PRODUCTION_DEPLOYMENT.md`
   - Deploy to `/opt/metamuses` on Hetzner server

---

## Usage

### Deploy API to Production

**Automatic** (Recommended):
```bash
# Make changes to API
cd metamuses-api
# ... make changes ...
git add .
git commit -m "Update API"
git push origin main

# ✅ deploy-api-production.yml triggers automatically
```

**Manual**:
1. Go to Actions → "Deploy API to Production"
2. Click "Run workflow"
3. Select environment and options
4. Click "Run workflow"

---

### Run API CI

```bash
# Create PR with API changes
cd metamuses-api
# ... make changes ...
git checkout -b feature/api-update
git push origin feature/api-update

# Create PR on GitHub
# ✅ ci-api.yml runs automatically
```

---

### Rollback API

1. Go to Actions → "Rollback API Deployment"
2. Select environment: `production`
3. Backup file: (leave empty for latest)
4. Confirm: Type `ROLLBACK`
5. Click "Run workflow"

---

## Path Filters Explained

### API Workflows Trigger On

```yaml
paths:
  - 'metamuses-api/src/**'           # Source code
  - 'metamuses-api/Cargo.toml'       # Dependencies
  - 'metamuses-api/Cargo.lock'       # Lock file
  - 'metamuses-api/deployment/**'    # Deployment configs
  - '.github/workflows/*-api.yml'    # API workflow changes
```

### What DOESN'T Trigger API Workflows

- Changes to `metamuses-web/` (frontend)
- Changes to `contracts/` (smart contracts)
- Changes to root-level docs
- Changes to other workflows

**Example**:
```bash
# This WILL trigger API workflows
git commit -m "Update API endpoint" metamuses-api/src/main.rs

# This WON'T trigger API workflows
git commit -m "Update frontend" metamuses-web/src/app/page.tsx
```

---

## Git Flow

### For API Changes

```
Feature Branch (metamuses-api changes)
    ↓ PR + ci-api.yml
Develop Branch
    ↓ deploy-api-production.yml (staging)
Main Branch
    ↓ deploy-api-production.yml (production)
```

### For Multiple Packages

```
Feature Branch (changes to api + web)
    ↓ PR + ci-api.yml + ci-web.yml (parallel)
Develop Branch
    ↓ deploy-api-production.yml + deploy-web.yml (parallel)
Main Branch
    ↓ deploy-api-production.yml + deploy-web.yml (parallel)
```

**Benefits**: Independent deployments for each package!

---

## Workflow-Level Permissions

All workflows define their own permissions (no repository settings needed):

```yaml
# Example from ci-api.yml
permissions:
  contents: read        # Clone repo
  packages: write       # Push Docker images (deploy workflows)
  issues: write         # Create issues
  pull-requests: write  # Comment on PRs (CI workflows)
```

**See**: `metamuses-api/.github/PERMISSIONS_GUIDE.md` for details

---

## Monorepo vs Single Package

### Before (Single Package)

```
metamuses-api/
└── .github/
    └── workflows/
        ├── ci.yml
        ├── deploy-production.yml
        └── ...
```

**Problem**: Workflows in subdirectory don't run!

---

### After (Monorepo)

```
metamuses/  (root)
├── .github/
│   └── workflows/
│       ├── ci-api.yml                 # ✅ Works!
│       ├── deploy-api-production.yml  # ✅ Works!
│       ├── ci-web.yml                 # Future
│       └── ci-contracts.yml           # Future
├── metamuses-api/
├── metamuses-web/
└── contracts/
```

**Solution**: Workflows at root with path filters + working-directory

---

## Caching Strategy

### Rust/Cargo Caching

```yaml
- uses: actions-rust-lang/setup-rust-toolchain@v1
  with:
    cache: true
    cache-workspaces: metamuses-api -> target
```

**Benefits**:
- Caches `metamuses-api/target/` separately
- Different packages have independent caches
- Faster builds (5-10 min → 2-3 min)

---

### Docker Layer Caching

```yaml
- uses: docker/build-push-action@v5
  with:
    context: ./metamuses-api
    cache-from: type=gha
    cache-to: type=gha,mode=max
```

**Benefits**:
- Reuses Docker layers across builds
- Faster image builds (10 min → 3-5 min)

---

## Deployment Architecture

### From Monorepo to Production

```
GitHub (metamuses repo)
    │
    ├─ metamuses-api/       ──▶  Build → GHCR → Hetzner
    ├─ metamuses-web/       ──▶  Build → Vercel (future)
    └─ contracts/           ──▶  Deploy → Metis (future)
```

### API Deployment Flow

```
metamuses-api/ changes
    ↓
ci-api.yml (test)
    ↓
deploy-api-production.yml
    ↓
Build Docker (context: ./metamuses-api)
    ↓
Push to ghcr.io/YOUR_ORG/metamuses-api
    ↓
SSH to Hetzner (/opt/metamuses)
    ↓
docker compose pull api
    ↓
docker compose up -d api
    ↓
Health check (https://api.metamuses.xyz/health)
```

---

## Debugging

### Check Which Workflows Run

View GitHub Actions tab → See which workflows triggered

**Expected**:
- Change `metamuses-api/` → Only `*-api.yml` workflows run
- Change `metamuses-web/` → Only `*-web.yml` workflows run
- Change both → Both sets of workflows run (parallel)

---

### Path Filter Not Working?

**Symptoms**: Workflow doesn't trigger when files change

**Check**:
1. Path filter in workflow:
   ```yaml
   paths:
     - 'metamuses-api/**'  # Must match changed files
   ```

2. Changed files:
   ```bash
   git diff --name-only HEAD~1
   ```

3. Verify match:
   ```bash
   # Should show files in metamuses-api/
   git diff --name-only HEAD~1 | grep '^metamuses-api/'
   ```

---

### Working Directory Issues?

**Symptoms**: `cargo` or file commands fail

**Check**:
```yaml
jobs:
  test:
    defaults:
      run:
        working-directory: metamuses-api  # Must be set!
```

**Or** use absolute paths:
```yaml
- run: cargo test --manifest-path=metamuses-api/Cargo.toml
```

---

## Documentation

### API Documentation

Located in `metamuses-api/.github/`:
- `SETUP_SECRETS.md` - Secrets configuration
- `CICD_QUICK_REFERENCE.md` - Quick commands
- `PERMISSIONS_GUIDE.md` - Permissions explained
- `ARCHITECTURE.md` - System architecture

**Note**: These docs are for reference. The actual workflows are at root level.

---

### Creating New Package Workflows

**Example**: Add CI for `metamuses-web`

1. Create `ci-web.yml`:
   ```yaml
   name: CI - Web
   on:
     pull_request:
       paths:
         - 'metamuses-web/**'  # Only web changes

   jobs:
     test:
       defaults:
         run:
           working-directory: metamuses-web
       steps:
         - run: pnpm install
         - run: pnpm test
   ```

2. Add to this README under "Web Workflows"

---

## Migration from Subdirectory

If you previously had workflows in `metamuses-api/.github/workflows/`:

**Old**: `metamuses-api/.github/workflows/ci.yml` ❌ (doesn't run)
**New**: `.github/workflows/ci-api.yml` ✅ (runs at root)

**Changes Made**:
1. Moved workflows to root `.github/workflows/`
2. Renamed for clarity (`ci.yml` → `ci-api.yml`)
3. Added path filters (`paths: ['metamuses-api/**']`)
4. Added working-directory (`working-directory: metamuses-api`)
5. Updated Docker context (`context: ./metamuses-api`)

---

## Status

| Package | CI | Deploy | Health Check | Rollback |
|---------|----|----|-------|----------|--------|
| API | ✅ `ci-api.yml` | ✅ `deploy-api-production.yml` | ✅ `health-check-api.yml` | ✅ `rollback-api.yml` |
| Web | 🔜 Coming soon | 🔜 Coming soon | - | - |
| Contracts | 🔜 Coming soon | 🔜 Coming soon | - | - |

---

## Next Steps

1. **Setup Secrets** - Follow `metamuses-api/.github/SETUP_SECRETS.md`
2. **Configure Server** - Follow `metamuses-api/docs/PRODUCTION_DEPLOYMENT.md`
3. **Test API Workflows** - Create PR with API changes
4. **Deploy API** - Merge to main
5. **Add Web Workflows** - Create `ci-web.yml`, `deploy-web-production.yml`
6. **Add Contracts Workflows** - Create `ci-contracts.yml`

---

## FAQ

### Q: Why are workflows at root instead of in each package?

**A**: GitHub Actions only reads workflows from `.github/workflows/` at the repository root. Subdirectory workflows are ignored.

---

### Q: How do I make workflows only run for specific packages?

**A**: Use path filters:
```yaml
on:
  push:
    paths:
      - 'metamuses-api/**'  # Only this package
```

---

### Q: Can I still have package-specific documentation?

**A**: Yes! Documentation stays in each package (e.g., `metamuses-api/.github/`), but workflows must be at root.

---

### Q: Do I need to change anything in metamuses-api/?

**A**: No! The API package structure stays the same. Only workflows moved to root.

---

### Q: What if I want to deploy both API and Web together?

**A**: Create a combined workflow that runs both, or use workflow dependencies:
```yaml
# deploy-all.yml
jobs:
  deploy-api:
    # ... deploy API ...

  deploy-web:
    needs: [deploy-api]  # Wait for API
    # ... deploy web ...
```

---

## Quick Reference

### Trigger API CI
```bash
git commit -m "Update API" metamuses-api/src/main.rs
git push origin feature-branch
# Create PR → ci-api.yml runs
```

### Deploy API
```bash
git push origin main
# deploy-api-production.yml runs (if API files changed)
```

### Rollback API
```
Actions → Rollback API Deployment → Type "ROLLBACK"
```

### Check API Health
```bash
curl https://api.metamuses.xyz/health
```

---

**Last Updated**: 2025-10-24
**Monorepo**: ✅ Configured
**API Workflows**: ✅ Complete
**Web Workflows**: 🔜 Coming Soon
**Contracts Workflows**: 🔜 Coming Soon
