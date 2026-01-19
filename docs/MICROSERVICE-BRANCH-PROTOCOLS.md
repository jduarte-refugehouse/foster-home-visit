# Microservice Branch Protocols

**Last Updated**: January 2025  
**Repository**: Monorepo (foster-home-visit)  
**Purpose**: Standardized branch management for microservice deployments

---

## Overview

This monorepo contains multiple microservices that deploy to different Vercel instances. Each microservice has dedicated branches for test and production deployments.

### Branch Naming Convention

- **Production Branches**: `{microservice}-main` (e.g., `visits-main`, `service-domain-admin-main`)
- **Test Branches**: `{microservice}-test-deployment` (e.g., `visit-test-deployment`, `service-domain-admin-test-deployment`)
- **Development Branch**: `main` (shared development branch)

---

## Microservice Branch Mapping

### Visit Service (`visit.refugehouse.app`)

| Branch | Vercel Deployment | URL | Purpose |
|--------|------------------|-----|---------|
| `visits-main` | Production | `visit.refugehouse.app` | Production deployment |
| `visit-test-deployment` | Preview | `visit.test.refugehouse.app` | Test/staging environment |
| `main` | Development | N/A | Shared development branch |

**Vercel Configuration**:
- Production branch: `visits-main`
- Preview branches: `visit-test-deployment` and others

**Key Characteristics**:
- Uses API Hub pattern (no direct database access)
- Requires `RADIUS_API_KEY` and `RADIUS_API_HUB_URL` environment variables
- No static IPs required

---

### Admin Service (`admin.refugehouse.app`)

| Branch | Vercel Deployment | URL | Purpose |
|--------|------------------|-----|---------|
| `service-domain-admin-main` | Production | `admin.refugehouse.app` | Production deployment |
| `service-domain-admin-test-deployment` | Preview | `admin.test.refugehouse.app` | Test/staging environment |
| `main` | Development | N/A | Shared development branch |

**Vercel Configuration**:
- Production branch: `service-domain-admin-main`
- Preview branches: `service-domain-admin-test-deployment` and others

**Key Characteristics**:
- Uses direct database access (has static IPs)
- Serves as API Hub for other microservices
- Contains all `/api/radius/*` endpoints

---

## Branch Workflow

### Standard Development Workflow

1. **Start Feature Development**
   ```bash
   git checkout main
   git pull origin main
   # Create feature branch or work directly on main
   ```

2. **Make Changes**
   - Develop and test locally
   - Commit changes to `main` or feature branch

3. **Deploy to Test Environment**
   ```bash
   # For Visit Service
   git checkout visit-test-deployment
   git merge main --no-ff
   git push origin visit-test-deployment
   
   # For Admin Service
   git checkout service-domain-admin-test-deployment
   git merge main --no-ff
   git push origin service-domain-admin-test-deployment
   ```

4. **Test in Test Environment**
   - Verify functionality at test URLs
   - Check Vercel deployment logs
   - Test API endpoints

5. **Deploy to Production**
   ```bash
   # For Visit Service
   git checkout visits-main
   git merge main --no-ff
   git push origin visits-main
   
   # For Admin Service
   git checkout service-domain-admin-main
   git merge main --no-ff
   git push origin service-domain-admin-main
   ```

---

## Deployment Procedures

### Deploying Shared Code Changes

When changes affect shared packages (e.g., `packages/shared-core/`), deploy to **all** microservice branches:

```bash
# 1. Ensure changes are committed to main
git checkout main
git add .
git commit -m "Update shared-core package"
git push origin main

# 2. Deploy to Visit Service (Test)
git checkout visit-test-deployment
git merge main --no-ff -m "Merge main: Update shared-core"
git push origin visit-test-deployment

# 3. Deploy to Visit Service (Production)
git checkout visits-main
git merge main --no-ff -m "Merge main: Update shared-core"
git push origin visits-main

# 4. Deploy to Admin Service (Test)
git checkout service-domain-admin-test-deployment
git merge main --no-ff -m "Merge main: Update shared-core"
git push origin service-domain-admin-test-deployment

# 5. Deploy to Admin Service (Production)
git checkout service-domain-admin-main
git merge main --no-ff -m "Merge main: Update shared-core"
git push origin service-domain-admin-main
```

### Deploying Microservice-Specific Changes

When changes only affect one microservice:

```bash
# Example: Visit Service only
git checkout main
# ... make changes ...
git add .
git commit -m "Fix visit service endpoint"
git push origin main

# Deploy to test
git checkout visit-test-deployment
git merge main --no-ff
git push origin visit-test-deployment

# After testing, deploy to production
git checkout visits-main
git merge main --no-ff
git push origin visits-main
```

---

## Critical Deployment Rules

### 1. Admin Service Must Deploy First

**CRITICAL**: When deploying changes that affect API Hub endpoints or shared infrastructure:

1. **Always deploy admin service first**
2. **Then deploy visit service (or other microservices)**

**Why**: Visit service depends on admin service API Hub. If admin service endpoints are missing or broken, visit service will fail.

### 2. Shared Package Updates

When updating `packages/shared-core/` or other shared packages:
- **Must deploy to all microservice branches**
- Test in test environments first
- Deploy to production branches after verification

### 3. API Hub Endpoint Changes

When adding or modifying `/api/radius/*` endpoints:
- These endpoints exist in the **admin service** codebase
- Must be deployed to `service-domain-admin-main` for production
- Must be deployed to `service-domain-admin-test-deployment` for testing

---

## Branch Status Commands

### Check Current Branch Status

```bash
# See all branches
git branch -a

# Check which branch you're on
git branch

# See branch relationships
git log --oneline --graph --all --decorate -10
```

### Check Branch Differences

```bash
# See what's in main but not in production branch
git log --oneline {branch-name}..main

# See differences in specific files
git diff {branch-name} main -- {file-path}

# See all file differences
git diff {branch-name} main --stat
```

### Check Remote Branch Status

```bash
# Fetch latest from remote
git fetch origin

# See remote branch status
git log --oneline origin/{branch-name} -5

# Compare local vs remote
git log --oneline {branch-name}..origin/{branch-name}
```

---

## Troubleshooting

### Worktree Conflicts

If you see: `fatal: 'branch-name' is already checked out at '...'`

**Solution**: The branch is checked out in another worktree. Options:

1. **Close the other worktree** (if using Cursor/IDE)
2. **Use a different directory** to checkout the branch
3. **Remove the worktree**:
   ```bash
   git worktree remove {path}
   ```

### Merge Conflicts

If merge conflicts occur:

```bash
# Abort the merge
git merge --abort

# Or resolve conflicts manually
# Edit conflicted files
git add {resolved-files}
git commit -m "Resolve merge conflicts"
```

### Uncommitted Changes

Before switching branches:

```bash
# Check for uncommitted changes
git status

# Stash changes (save for later)
git stash

# Or commit changes
git add .
git commit -m "WIP: Save changes"
```

---

## Quick Reference: Common Tasks

### Update All Branches from Main

```bash
#!/bin/bash
# Update all microservice branches from main

BRANCHES=(
  "visit-test-deployment"
  "visits-main"
  "service-domain-admin-test-deployment"
  "service-domain-admin-main"
)

for branch in "${BRANCHES[@]}"; do
  echo "Updating $branch..."
  git checkout $branch
  git merge main --no-ff -m "Merge main: Update from development"
  git push origin $branch
done

git checkout main
echo "All branches updated!"
```

### Check What Needs Deployment

```bash
# Check visit service production branch
git log --oneline visits-main..main

# Check admin service production branch
git log --oneline service-domain-admin-main..main

# Check test branches
git log --oneline visit-test-deployment..main
git log --oneline service-domain-admin-test-deployment..main
```

### Verify Branch Alignment

```bash
# See if branches are in sync
git log --oneline --graph --all --decorate -15

# Check specific commit is in all branches
git branch --contains {commit-hash}
```

---

## Vercel Configuration

### Production Branch Settings

Each Vercel project must be configured with the correct production branch:

- **Visit Service** (`visit-refugehouse-app`):
  - Production Branch: `visits-main`
  
- **Admin Service** (`admin-refugehouse-app`):
  - Production Branch: `service-domain-admin-main`

### Verifying Vercel Configuration

1. Go to Vercel Dashboard → Project → Settings → Git
2. Verify "Production Branch" matches the branch name above
3. Check that preview deployments use test branches

---

## Best Practices

1. **Always test in test environment first**
   - Deploy to `*-test-deployment` branches
   - Verify functionality
   - Then deploy to `*-main` branches

2. **Use descriptive commit messages**
   - Include microservice name if change is specific
   - Note if change affects shared packages

3. **Keep branches in sync**
   - Regularly merge `main` into microservice branches
   - Don't let branches drift too far apart

4. **Document breaking changes**
   - Update this document when adding new microservices
   - Note any branch naming changes

5. **Monitor deployments**
   - Check Vercel deployment logs after pushing
   - Verify endpoints are accessible
   - Test critical functionality

---

## Adding a New Microservice

When adding a new microservice:

1. **Create branches**:
   ```bash
   git checkout main
   git checkout -b {microservice}-main
   git checkout -b {microservice}-test-deployment
   git push origin {microservice}-main
   git push origin {microservice}-test-deployment
   ```

2. **Configure Vercel**:
   - Create new Vercel project
   - Set production branch to `{microservice}-main`
   - Configure preview branches

3. **Update this document**:
   - Add microservice to branch mapping table
   - Document deployment procedures
   - Note any special requirements

---

## Related Documentation

- `PRODUCTION-DEPLOYMENT-GUIDE.md` - Detailed deployment procedures
- `PRODUCTION-DEPLOYMENT-STATUS.md` - Current deployment status
- `VERCEL-PRODUCTION-BRANCH-FIX.md` - Vercel configuration guide
- `lib/microservice-config.ts` - Microservice configuration logic

---

## Questions or Issues?

If you encounter issues with branch management:
1. Check this document first
2. Review Vercel deployment logs
3. Verify branch names match Vercel configuration
4. Check for worktree conflicts
5. Ensure all branches are up to date with `main`
