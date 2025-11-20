# Environment Configuration for Service Domain Admin

## Overview

The service-domain-admin microservice filters user lookups by environment (test vs production) to ensure users from the correct Clerk instance are authenticated.

## How Environment Detection Works

The `getDeploymentEnvironment()` function uses a tiered approach:

1. **Explicit Environment Variable** (Highest Priority)
   - `DEPLOYMENT_ENVIRONMENT` environment variable
   - Set to `'test'` or `'production'`

2. **Vercel Environment Detection**
   - `VERCEL_ENV` environment variable (automatically set by Vercel)
   - `'production'` → production environment
   - `'preview'` or `'development'` → test environment

3. **Branch Name Detection**
   - Branches with `'test'`, `'preview'`, or `'staging'` → test environment
   - Branches with `'main'`, `'master'`, or `'production'` → production environment

4. **Default**
   - Falls back to `'production'` (safer default)

## Configuration in Vercel

### Option 1: Set DEPLOYMENT_ENVIRONMENT Variable (Recommended)

1. Go to your Vercel project settings
2. Navigate to **Environment Variables**
3. Add a new variable:
   - **Name**: `DEPLOYMENT_ENVIRONMENT`
   - **Value**: 
     - `test` for test/preview deployments
     - `production` for production deployments
   - **Environment**: Select the appropriate environment(s)

### Option 2: Use VERCEL_ENV (Automatic)

Vercel automatically sets `VERCEL_ENV`:
- Production deployments: `VERCEL_ENV=production`
- Preview deployments: `VERCEL_ENV=preview`
- Development: `VERCEL_ENV=development`

The code automatically maps:
- `production` → `'production'`
- `preview` or `development` → `'test'`

### Option 3: Branch-Based Detection

If your branch names follow patterns:
- Test branches: `*-test-*`, `*-preview-*`, `*-staging-*`
- Production branches: `*-main`, `*-master`, `*-production`

The code will automatically detect the environment from the branch name.

## User Lookup Filtering

When `microservice_code = 'service-domain-admin'`, user lookups are filtered by:

1. **user_type**: `'global_admin'` or `NULL`
2. **is_active**: `1` (active users only)
3. **environment**: `'test'` or `'production'` (matches detected environment)

## Example Configuration

### Test Environment (Preview Deployments)
```bash
DEPLOYMENT_ENVIRONMENT=test
# OR rely on VERCEL_ENV=preview (automatic)
```

### Production Environment
```bash
DEPLOYMENT_ENVIRONMENT=production
# OR rely on VERCEL_ENV=production (automatic)
```

## Verification

After configuration, check the console logs:
- Look for: `🌍 [NAV] Deployment environment detected: test (microservice: service-domain-admin)`
- Or: `🌍 [PERMISSIONS] Deployment environment: production (microservice: service-domain-admin)`

This confirms the environment is being detected correctly.

## Database Requirements

Ensure your `app_users` table has:
- `user_type` column (can be `NULL` or `'global_admin'`)
- `environment` column (should be `'test'` or `'production'`)

Users should have:
- `user_type = 'global_admin'` (or `NULL`)
- `is_active = 1`
- `environment = 'test'` (for test deployments) or `'production'` (for production deployments)

