# Development Workflow - Refuge House Platform

## ⚠️ CRITICAL: Remote Testing Workflow

**ALL TESTING IS DONE IN REMOTE ENVIRONMENTS. NO LOCAL TESTING IS PERFORMED.**

### Standard Workflow

1. **Make Changes**
   - Edit code in the workspace
   - Commit changes to Git
   - Push to GitHub

2. **Deploy to Vercel**
   - Vercel automatically deploys on push (or manually trigger)
   - Preview deployments are created for each branch/PR
   - Production deployments are created for main branch

3. **Test in Remote Environment**
   - Access via Vercel preview URL or production domain
   - Test all functionality in the remote environment
   - Verify authentication, permissions, and features
   - Check database connectivity and API endpoints

4. **Iterate**
   - Make additional changes based on remote testing results
   - Push changes and test again in remote environment
   - Repeat until functionality is verified

### Why Remote Testing?

- **Production-like environment**: Vercel deployments match production conditions
- **Database access**: Remote environments have proper database connectivity
- **Authentication**: Clerk authentication works correctly in deployed environments
- **Environment variables**: All environment variables are properly configured
- **Real-world conditions**: Testing in actual deployment environment catches issues early

### Local Development

Local development (`npm run dev`) is available for:
- **Code reference**: Viewing code structure and making edits
- **Syntax checking**: Verifying TypeScript/React syntax
- **Quick previews**: Seeing UI changes before deployment

**However, all actual testing, validation, and verification must be done in remote Vercel deployments.**

### Vercel Deployment Types

1. **Preview Deployments**
   - Created automatically for each branch/PR
   - URL: `https://your-project-git-branch.vercel.app`
   - Use for testing new features and changes

2. **Production Deployments**
   - Created for main branch (or configured branch)
   - URL: `https://your-project.vercel.app` or custom domain
   - Use for final validation before release

### Environment Variables

All environment variables are configured in Vercel project settings:
- Go to Vercel Dashboard → Project → Settings → Environment Variables
- Set `MICROSERVICE_CODE` for each microservice deployment
- Configure database, authentication, and API keys
- Environment variables are automatically available in deployments

### Testing Checklist

When testing in remote environment, verify:
- [ ] Application loads correctly
- [ ] Authentication works (Clerk sign-in)
- [ ] Navigation loads from database
- [ ] Permissions are enforced correctly
- [ ] Database queries execute successfully
- [ ] API endpoints respond correctly
- [ ] UI components render properly
- [ ] Microservice-specific features work
- [ ] Error handling works correctly

### Troubleshooting Remote Deployments

If issues occur in remote environment:

1. **Check Vercel Logs**
   - Go to Vercel Dashboard → Project → Deployments → Select deployment → Logs
   - Look for build errors, runtime errors, or API failures

2. **Verify Environment Variables**
   - Ensure all required variables are set in Vercel
   - Check that `MICROSERVICE_CODE` matches database configuration

3. **Check Database Connectivity**
   - Verify database credentials are correct
   - Ensure database server is accessible from Vercel

4. **Review Build Output**
   - Check if build completed successfully
   - Verify all dependencies installed correctly

### Best Practices

1. **Small, Incremental Changes**
   - Make small changes and test frequently
   - Easier to identify issues when changes are isolated

2. **Use Preview Deployments**
   - Test in preview before merging to main
   - Preview deployments are perfect for validation

3. **Monitor Deployments**
   - Check Vercel dashboard for deployment status
   - Review logs for any warnings or errors

4. **Document Issues**
   - Note any issues found during remote testing
   - Document solutions for future reference

## Summary

- ✅ **DO**: Test all functionality in remote Vercel deployments
- ✅ **DO**: Use preview deployments for feature testing
- ✅ **DO**: Verify environment variables are configured
- ❌ **DON'T**: Rely on local testing for validation
- ❌ **DON'T**: Assume local behavior matches remote behavior

**All testing and validation happens in remote environments.**

