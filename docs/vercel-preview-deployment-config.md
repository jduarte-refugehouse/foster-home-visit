# Vercel Preview Deployment Configuration

## Overview

Preview deployments in Vercel are automatically created for every branch and pull request. This guide explains how to configure preview deployments to automatically detect which microservice they should run.

> **See also:** [Vercel Branch Deployment Strategy](./vercel-branch-deployment-strategy.md) for production branch configuration and deployment isolation.

## The Problem

When you push to a branch like `feature/case-management-update`, Vercel automatically creates a preview deployment. But how does it know which microservice code to use?

## Solution: Preview Branch Domains (Recommended) ⭐

**The best solution is to use Vercel's Preview Branch feature:**

Each Vercel project can have a dedicated preview domain that deploys from a specific branch. This gives you:
- ✅ Explicit control over which branch deploys to which domain
- ✅ Each microservice gets its own preview domain
- ✅ No need for branch name patterns
- ✅ Clear separation between microservices

### How It Works

1. **Go to Vercel Dashboard** → Your Project → **Settings** → **Domains**
2. **Click "Add Domain"**
3. **Enter preview domain** (e.g., `visit.test.refugehouse.app`)
4. **Select "Preview" environment**
5. **Select Preview Branch** (e.g., `visits-main`)
6. **Save**

Now:
- Pushing to `visits-main` → Deploys to `visit.test.refugehouse.app`
- Pushing to `case-management-main` → Deploys to `case-management.test.refugehouse.app`
- Each microservice has its own preview domain

### Example Setup

**Home Visits Project:**
- Preview Domain: `visit.test.refugehouse.app`
- Preview Branch: `visits-main`
- Environment Variable: `MICROSERVICE_CODE=home-visits` (for Preview)

**Case Management Project:**
- Preview Domain: `case-management.test.refugehouse.app`
- Preview Branch: `case-management-main`
- Environment Variable: `MICROSERVICE_CODE=case-management` (for Preview)

## Alternative Solutions

### Solution 2: Automatic Branch Name Detection

The code automatically detects the microservice based on branch name patterns (fallback if preview domains aren't configured).

## Method 2: Automatic Branch Name Detection (Fallback)

The code automatically detects the microservice based on branch name patterns.

### How It Works

The `getMicroserviceCode()` function in `lib/microservice-config.ts` checks branch names:

```typescript
// Branch name patterns automatically detected:
- 'visits' or 'home-visit' → 'home-visits'
- 'case-management' → 'case-management'
- 'admin' → 'admin'
- 'training' → 'training'
- 'placements' → 'placements'
- 'service-plan' or 'service-plans' → 'service-plans'
```

### Branch Naming Convention

Use these patterns in your branch names:

**For Home Visits:**
- `feature/visits-new-feature`
- `bugfix/home-visit-fix`
- `visits-main`

**For Case Management:**
- `feature/case-management-update`
- `bugfix/case-management-fix`

**For Admin:**
- `feature/admin-dashboard`
- `admin-main`

**For Training:**
- `feature/training-courses`
- `training-main`

### Example

```bash
# Create a branch for case management work
git checkout -b feature/case-management-user-roles

# Push to GitHub
git push origin feature/case-management-user-roles

# Vercel automatically:
# 1. Creates preview deployment
# 2. Sets VERCEL_BRANCH=feature/case-management-user-roles
# 3. Code detects 'case-management' in branch name
# 4. Preview deployment runs as 'case-management' microservice
```

### Adding New Microservice Patterns

To add detection for a new microservice, edit `lib/microservice-config.ts`:

```typescript
if (branch.includes('your-microservice-name')) {
  return 'your-microservice-code'
}
```

## Method 3: Vercel Environment Variables Per-Branch (Manual Override)

For more precise control, you can set environment variables for specific branches in Vercel.

### Setting Branch-Specific Environment Variables

1. **Go to Vercel Dashboard** → Your Project → **Settings** → **Environment Variables**

2. **Add Environment Variable:**
   - **Key**: `MICROSERVICE_CODE`
   - **Value**: `case-management` (or your microservice code)
   - **Environment**: Select **Preview** (or **Production** if needed)
   - **Git Branch**: Enter branch name pattern (e.g., `feature/case-management-*`)

3. **Save**

### Branch Pattern Examples

- **Specific branch**: `feature/case-management-update`
- **All branches matching pattern**: `feature/case-management-*`
- **Multiple patterns**: Use separate entries for each pattern

### Priority Order

Environment variables take precedence over branch name detection:

1. ✅ **Environment Variable** (`MICROSERVICE_CODE`) - Highest priority
2. ✅ **Branch Name Detection** - Automatic fallback
3. ✅ **Config Default** - Final fallback

## Configuration Strategy

### Recommended Approach ⭐

**Use Preview Branch Domains (Method 1):**
- ✅ Most explicit and clear
- ✅ Each microservice has its own preview domain
- ✅ No ambiguity about which branch deploys where
- ✅ Easy to test specific microservices

**Use automatic branch name detection (Method 2) when:**
- Preview domains aren't configured
- Working on feature branches that need automatic detection
- Quick testing without domain setup

**Use Vercel environment variables (Method 3) when:**
- Need to override automatic detection
- Testing with different microservice than branch suggests
- Special cases that don't fit other methods

### Example Scenarios

#### Scenario 1: Standard Feature Branch

```bash
# Branch name follows convention
git checkout -b feature/case-management-user-roles
git push origin feature/case-management-user-roles
```

**Result**: Automatically detected as `case-management` microservice ✅

#### Scenario 2: Generic Branch Name

```bash
# Branch name doesn't indicate microservice
git checkout -b feature/user-authentication
git push origin feature/user-authentication
```

**Options**:
- **Option A**: Rename branch to include microservice: `feature/case-management-user-authentication`
- **Option B**: Set environment variable in Vercel for `feature/user-authentication` → `MICROSERVICE_CODE=case-management`

#### Scenario 3: Testing Multiple Microservices

```bash
# Testing cross-microservice feature
git checkout -b feature/shared-core-update
git push origin feature/shared-core-update
```

**Options**:
- **Option A**: Test with default (home-visits)
- **Option B**: Create multiple preview deployments with different `MICROSERVICE_CODE` values
- **Option C**: Use branch name that indicates primary microservice: `feature/home-visits-shared-core-update`

## Production Deployments

Production deployments use the **Production Branch** configured in Vercel:

1. **Vercel Dashboard** → Project → **Settings** → **Git**
2. **Production Branch**: Set to your microservice-specific branch (e.g., `visits-main`, `case-management-main`)
3. **Environment Variables**: Set `MICROSERVICE_CODE` for **Production** environment

Production deployments always use the environment variable (Tier 1), so branch detection isn't needed for production.

## Troubleshooting

### Issue: Preview deployment shows wrong microservice

**Check:**
1. Branch name contains microservice identifier?
2. Environment variable set in Vercel for this branch?
3. Check Vercel deployment logs for `MICROSERVICE_CODE` value

**Solution:**
- Rename branch to include microservice identifier, OR
- Set environment variable in Vercel for this branch

### Issue: Preview deployment uses default microservice

**Check:**
1. Branch name doesn't match any pattern
2. No environment variable set

**Solution:**
- Add branch pattern to `getMicroserviceCode()` function, OR
- Set environment variable in Vercel

### Issue: Need to test with different microservice

**Solution:**
- Create a new branch with different microservice name in it, OR
- Set environment variable in Vercel for the branch

## Best Practices

1. ✅ **Use consistent branch naming**: Include microservice name in branch
2. ✅ **Let automatic detection work**: Only override when necessary
3. ✅ **Document branch patterns**: Update `getMicroserviceCode()` when adding microservices
4. ✅ **Test preview deployments**: Verify correct microservice is detected
5. ✅ **Use environment variables sparingly**: Only when branch name doesn't work

## Summary

### Recommended Setup (Preview Branch Domains)

1. **Configure Preview Domain per Microservice:**
   - Home Visits: `visit.test.refugehouse.app` → `visits-main` branch
   - Case Management: `case-management.test.refugehouse.app` → `case-management-main` branch
   - Each microservice gets its own preview domain

2. **Set Environment Variables:**
   - `MICROSERVICE_CODE` for Preview environment in each Vercel project
   - Matches the microservice for that project

3. **Result:**
   - Pushing to `visits-main` → Deploys to `visit.test.refugehouse.app` as `home-visits`
   - Pushing to `case-management-main` → Deploys to `case-management.test.refugehouse.app` as `case-management`
   - Clear separation, no ambiguity

### Fallback Methods

- **Automatic**: Branch name detection works for feature branches
- **Manual**: Vercel environment variables for special cases
- **Production**: Always uses environment variable (set in Vercel)

This gives you the best of both worlds: explicit control for main branches, automatic detection for feature branches.

