# Environment Variables Setup Guide

This guide explains how to configure environment variables for the Refuge House Platform, both locally and in Vercel.

## Quick Start

### Option 1: Using the Import Script (Recommended)

1. **Copy the template:**
   ```bash
   cp .env.example .env
   ```

2. **Fill in your values:**
   - Open `.env` in your editor
   - Replace all placeholder values with your actual credentials
   - Save the file

3. **Import to Vercel:**
   ```bash
   # For a specific environment
   ./scripts/import-env-to-vercel.sh .env your-project-name production
   
   # For all environments
   ./scripts/import-env-to-vercel.sh .env your-project-name all
   ```

### Option 2: Manual Vercel Configuration

1. Go to [Vercel Dashboard](https://vercel.com/dashboard)
2. Select your project
3. Go to **Settings** → **Environment Variables**
4. Add each variable from `.env.example`
5. Select which environments to apply to (Production, Preview, Development)

## Environment Variables Reference

### Required Variables

#### Microservice Configuration
- `MICROSERVICE_CODE` - The microservice identifier (e.g., `home-visits`, `service-domain-admin`)

#### Clerk Authentication
- `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` - Clerk publishable key
- `CLERK_SECRET_KEY` - Clerk secret key

#### Azure Key Vault (Database Password)
- `AZURE_TENANT_ID` - Azure AD tenant ID
- `AZURE_CLIENT_ID` - Azure AD application client ID
- `AZURE_CLIENT_SECRET` - Azure AD application client secret
- `AZURE_KEY_VAULT_NAME` - Azure Key Vault name

#### External APIs
- `SENDGRID_API_KEY` - SendGrid API key for emails
- `SENDGRID_FROM_EMAIL` - Email address for sending emails
- `TWILIO_ACCOUNT_SID` - Twilio account SID
- `TWILIO_AUTH_TOKEN` - Twilio auth token
- `TWILIO_MESSAGING_SERVICE_SID` - Twilio messaging service SID
- `GOOGLE_MAPS_API_KEY` - Google Maps API key
- `PULSE_APP_API_KEY` - API key for PULSE app integration
- `PULSE_ENVIRONMENT_URL` - Base URL of PULSE app

#### Application Configuration
- `NEXT_PUBLIC_APP_URL` - **Full deployment URL** (e.g., `https://admin.test.refugehouse.app` or `https://admin.refugehouse.app`)
  - **Critical for distributed service domain model**
  - Used for generating links, sending notifications, and referencing resources
  - Should be set differently for test vs production environments
  - If not set, the system will auto-detect from Vercel or request headers

### Optional Variables

- `GOOGLE_APPLICATION_CREDENTIALS_JSON` - Google Cloud service account JSON (for speech-to-text)
- `DEEPGRAM_API_KEY` - Deepgram API key (for speech transcription)
- `FIXIE_SOCKS_HOST` - Proxy configuration (not needed with Vercel Static IPs)
- `PROXY_URL` - Proxy URL (not needed with Vercel Static IPs)

## Per-Microservice Configuration

Each microservice needs its own `MICROSERVICE_CODE`:

> **See also:** [Environment Configuration](./environment-configuration.md) for service-domain-admin specific environment filtering, and [Deployment URL Configuration](./deployment-url-configuration.md) for URL detection.

- **Home Visits**: `MICROSERVICE_CODE=home-visits`
- **Service Domain Admin**: `MICROSERVICE_CODE=service-domain-admin`
- **Case Management**: `MICROSERVICE_CODE=case-management`
- (Add more as needed)

All other environment variables are shared across microservices.

## Security Best Practices

1. **Never commit `.env` files** - They're in `.gitignore`
2. **Use `.env.example`** - Template file with placeholders (safe to commit)
3. **Rotate keys regularly** - Especially if exposed
4. **Use Vercel's environment variable encryption** - Variables are encrypted at rest
5. **Limit access** - Only grant Vercel access to team members who need it

## Troubleshooting

### Build Fails with "Missing publishableKey"

- Ensure `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` is set in Vercel
- Check that it's set for the correct environment (Production/Preview/Development)
- Redeploy after adding the variable

### Database Connection Fails

- Verify all Azure Key Vault variables are set:
  - `AZURE_TENANT_ID`
  - `AZURE_CLIENT_ID`
  - `AZURE_CLIENT_SECRET`
  - `AZURE_KEY_VAULT_NAME`
- Check that the Key Vault contains the `database-password` secret
- Verify Azure service principal has Key Vault access

### API Errors

- Check that all required API keys are set
- Verify API keys are valid and not expired
- Check API quotas/limits

## Updating Environment Variables

### Using the Script

```bash
# Update all environments
./scripts/import-env-to-vercel.sh .env your-project-name all

# Update only production
./scripts/import-env-to-vercel.sh .env your-project-name production
```

### Manual Update

1. Go to Vercel Dashboard → Your Project → Settings → Environment Variables
2. Find the variable you want to update
3. Click the variable → Edit → Update value → Save
4. Redeploy your project

## Verifying Configuration

After setting environment variables:

1. **Check Vercel Dashboard:**
   - Settings → Environment Variables
   - Verify all required variables are present

2. **Test Deployment:**
   - Trigger a new deployment
   - Check build logs for any missing variable errors

3. **Test Application:**
   - Visit your deployed app
   - Check browser console for any client-side errors
   - Check server logs for any server-side errors

## Related Documentation

- [Database Architecture](./database-architecture.md) - Database connection details
- [Authentication & Permissions](./authentication-permissions-methodology.md) - Clerk setup
- [Microservice Template Setup](./microservice-template-setup.md) - New microservice setup

