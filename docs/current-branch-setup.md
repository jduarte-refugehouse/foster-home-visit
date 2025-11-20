# Current Branch Setup - Refuge House Platform

## Branch Configuration Status

### ✅ Completed Setup

**Home Visits Microservice:**
- **Production Branch**: `visits-main` (created and pushed to origin)
- **Current Status**: Ready for Vercel configuration
- **Vercel Action Required**: Configure Home Visits Vercel project to deploy from `visits-main`

### 📋 Next Steps

1. **Configure Vercel for Home Visits:**
   - Go to Vercel Dashboard → Home Visits Project
   - Settings → Git → Production Branch
   - Change from `main` to `visits-main`
   - Save changes

2. **Verify Configuration:**
   - Make a test commit to `visits-main`
   - Verify it triggers a deployment
   - Make a test commit to `main`
   - Verify it does NOT trigger Home Visits deployment

### 🌿 Current Branches

- **`main`**: General development branch (currently used for Home Visits, but will be transitioned)
- **`visits-main`**: Production branch for Home Visits microservice ✅
- **`feature/new-microservice-setup`**: Working branch for microservice setup documentation

### 🔄 Migration Plan

**Option A: Keep `main` as Home Visits (Recommended for now)**
- Keep `main` as the production branch for Home Visits
- Use `visits-main` as an alias/backup
- When creating new microservices, they'll get their own branches
- **Simplest approach** - no disruption to current workflow

**Option B: Fully Migrate to `visits-main`**
- Configure Vercel to use `visits-main` for Home Visits
- Keep `main` for shared/core changes
- More isolation, but requires Vercel reconfiguration

### 📝 Recommended Approach

For now, we recommend **Option A**:
1. Keep current Vercel configuration (deploying from `main`)
2. Use `visits-main` as a parallel branch for safety
3. When creating new microservices, configure them to use their own branches
4. This minimizes disruption while setting up the pattern

### 🎯 Future Microservice Branches

When creating new microservices, use this pattern:
- **Case Management**: `case-management-main`
- **Admin Portal**: `admin-main`
- **Training**: `training-main`
- **Service Plans**: `service-plans-main`

Each will have its own Vercel project configured to deploy from its specific branch.

### ⚠️ Important Notes

- **Branch Protection**: Consider protecting `visits-main` in GitHub Settings → Branches
- **Environment Variables**: Ensure `MICROSERVICE_CODE=home-visits` is set in Vercel for Home Visits project
- **Preview Deployments**: All branches will still create preview deployments (this is expected and useful)

### 📚 Related Documentation

- **[Vercel Branch Deployment Strategy](./vercel-branch-deployment-strategy.md)** - Complete guide
- **[Microservice Creation Guide](./microservice-creation-guide.md)** - How to create new microservices
- **[Development Workflow](./development-workflow.md)** - Testing and deployment workflow

---

**Last Updated**: January 2025  
**Status**: ✅ Branch created, Vercel configuration pending

