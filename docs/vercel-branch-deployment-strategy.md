# Vercel Branch-Based Deployment Strategy

## Overview

This guide explains how to configure separate Vercel projects for each microservice, each deploying from its own dedicated branch. This prevents commits to one microservice from automatically deploying to another.

> **See also:** [Vercel Preview Deployment Configuration](./vercel-preview-deployment-config.md) for preview deployment setup and automatic microservice detection.

## Strategy: One Branch Per Microservice

### Branch Naming Convention

Use dedicated branches for each microservice's production deployments:

- **Home Visits**: `visits-main` (or `main` for the original service)
- **Case Management**: `case-management-main`
- **Admin Portal**: `admin-main`
- **Training**: `training-main`

### Benefits

1. **Isolated Deployments**: Changes to Microservice A won't trigger deployments for Microservice B
2. **Clear Intent**: Branch name makes it obvious which microservice you're deploying
3. **Independent Release Cycles**: Each microservice can be released independently
4. **Safe Development**: Work on feature branches without affecting production

## Step-by-Step Setup

### 1. Create Dedicated Branches

For each microservice, create a dedicated production branch:

```bash
# For Home Visits (if not already using main)
git checkout -b visits-main
git push -u origin visits-main

# For Case Management
git checkout -b case-management-main
git push -u origin case-management-main

# For Admin Portal
git checkout -b admin-main
git push -u origin admin-main
```

### 2. Configure Vercel Project - Production Branch

For each Vercel project:

1. **Go to Vercel Dashboard** → Select your microservice project
2. **Settings** → **Git**
3. **Production Branch**: Set to your microservice-specific branch
   - Home Visits project → `visits-main`
   - Case Management project → `case-management-main`
   - Admin Portal project → `admin-main`

**Important**: This means:
- Only pushes to `visits-main` will deploy to the Home Visits production
- Only pushes to `case-management-main` will deploy to Case Management production
- Other branches will create preview deployments only

### 3. Configure Environment Variables Per Branch

You can also set environment variables specific to branches:

1. **Vercel Dashboard** → Project → **Settings** → **Environment Variables**
2. Add environment variables with **Environment** set to:
   - **Production**: Only applies to production branch
   - **Preview**: Applies to all preview deployments
   - **Development**: For local development (if used)

3. **Branch-Specific Variables**:
   - Click "Add" on an environment variable
   - Select "Production" environment
   - Optionally specify a branch pattern (e.g., `visits-main`)

### 4. Example Configuration

#### Home Visits Vercel Project
- **Repository**: `your-org/foster-home-visit`
- **Production Branch**: `visits-main`
- **Environment Variables**:
  - `MICROSERVICE_CODE=home-visits` (Production)
  - All other shared variables (Production)

#### Case Management Vercel Project
- **Repository**: `your-org/foster-home-visit` (same repo!)
- **Production Branch**: `case-management-main`
- **Environment Variables**:
  - `MICROSERVICE_CODE=case-management` (Production)
  - All other shared variables (Production)

## Workflow Examples

### Working on Home Visits

```bash
# Create feature branch
git checkout -b feature/home-visits-new-feature

# Make changes, commit
git add .
git commit -m "Add new feature to home visits"

# Push to feature branch (creates preview deployment)
git push origin feature/home-visits-new-feature

# After testing, merge to visits-main
git checkout visits-main
git merge feature/home-visits-new-feature
git push origin visits-main  # ← This deploys to Home Visits production
```

### Working on Case Management

```bash
# Create feature branch
git checkout -b feature/case-management-update

# Make changes, commit
git add .
git commit -m "Update case management"

# Push to feature branch (creates preview deployment)
git push origin feature/case-management-update

# After testing, merge to case-management-main
git checkout case-management-main
git merge feature/case-management-update
git push origin case-management-main  # ← This deploys to Case Management production
```

**Key Point**: Pushing to `case-management-main` will NOT trigger a deployment for Home Visits, because Home Visits is configured to deploy from `visits-main` only.

## Preview Deployments

Preview deployments are created for ALL branches, regardless of production branch configuration:

- **Feature branches**: `feature/home-visits-new-feature` → Preview deployment
- **Other microservice branches**: `case-management-main` → Preview deployment (if you're working on Home Visits project)
- **Pull requests**: Automatic preview deployments

This is useful for:
- Testing changes before merging
- Reviewing changes in a deployed environment
- Testing cross-microservice compatibility

## Branch Protection (Recommended)

Consider protecting your production branches in GitHub:

1. **GitHub Repository** → **Settings** → **Branches**
2. Add branch protection rule for each production branch:
   - `visits-main`
   - `case-management-main`
   - `admin-main`

3. **Protection Settings**:
   - ✅ Require pull request reviews before merging
   - ✅ Require status checks to pass
   - ✅ Require branches to be up to date
   - ✅ Include administrators

This prevents accidental direct pushes to production branches.

## Alternative: Single Main Branch Strategy

If you prefer to use a single `main` branch for all microservices:

### Option A: Manual Deployment Control
- Keep all code in `main`
- Use Vercel's "Redeploy" feature manually when you want to deploy a specific microservice
- Less automated, but more control

### Option B: Environment Variable Only
- All microservices deploy from `main`
- Use `MICROSERVICE_CODE` environment variable to differentiate
- Changes to `main` deploy to ALL microservices
- **Not recommended** if you want isolated deployments

## Recommended Setup

For maximum isolation and clarity:

1. ✅ **Use dedicated branches**: `visits-main`, `case-management-main`, etc.
2. ✅ **Configure each Vercel project** to deploy from its specific branch
3. ✅ **Protect production branches** in GitHub
4. ✅ **Use feature branches** for development
5. ✅ **Merge to microservice-specific branch** when ready to deploy

## Troubleshooting

### Issue: Changes to Microservice A are deploying to Microservice B

**Solution**: 
- Check Vercel project settings → Git → Production Branch
- Ensure each project is configured to deploy from its own branch
- Verify you're pushing to the correct branch

### Issue: Preview deployments showing wrong microservice

**Solution**:
- Preview deployments use environment variables from the branch
- Set `MICROSERVICE_CODE` in Vercel project settings → Environment Variables → Preview
- Or rely on branch name detection in code (if implemented)

### Issue: Need to deploy shared-core changes to all microservices

**Solution**:
- Merge shared-core changes to each microservice's production branch
- Or create a script to merge to all production branches
- Or use a single `main` branch for shared changes (less isolation)

## Summary

- ✅ **Each microservice has its own production branch**: `visits-main`, `case-management-main`, etc.
- ✅ **Each Vercel project deploys from its specific branch**: Configure in Vercel Settings → Git
- ✅ **Pushing to one branch only deploys that microservice**: Complete isolation
- ✅ **Preview deployments work for all branches**: Great for testing
- ✅ **Use feature branches for development**: Merge to production branch when ready

This strategy gives you complete control over which microservice gets deployed when.

