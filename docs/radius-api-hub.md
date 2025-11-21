# Radius API Hub Documentation

## Overview

The Radius API Hub is a centralized API service that provides access to RadiusBifrost database data for all microservices in the Refuge House ecosystem. This eliminates the need for each microservice to have its own static IP addresses ($100 each), saving significant costs.

**Location**: `admin.refugehouse.app` (service-domain-admin microservice)

**Architecture**: 
- One microservice (admin) has static IPs and direct database access
- Other microservices call admin APIs via HTTP (no static IPs needed)
- All requests are authenticated via API keys

## ⚠️ Important: Vercel Deployment Protection

**CRITICAL**: The admin microservice's API routes (`/api/radius/*`) must be accessible without browser authentication. If you're getting HTML authentication pages instead of JSON responses, Vercel's deployment protection is blocking access.

### Solution

1. **Go to Vercel Dashboard** → Your Admin Microservice Project → **Settings** → **Deployment Protection**
2. **Disable protection for preview deployments** (or configure it to allow unauthenticated access to API routes)
3. **Alternative**: Configure protection to allow public access to `/api/radius/*` paths

**Why this is needed**: API-to-API communication requires unauthenticated HTTP access. The API key authentication happens at the application level, not via Vercel's browser-based protection.

## Quick Start

### For Other Microservices (Consumers)

1. **Get an API Key**
   - Contact an administrator or use the API Key Management dashboard at `/admin/apis/keys`
   - Save the API key securely - it's only shown once!

2. **Set Environment Variables**
   ```bash
   RADIUS_API_HUB_URL=https://admin.refugehouse.app
   RADIUS_API_KEY=rh_your_api_key_here
   ```

3. **Install and Use the Client**
   ```typescript
   import { radiusApiClient } from '@refugehouse/radius-api-client'
   
   // Get homes
   const homes = await radiusApiClient.getHomes({ unit: 'RAD' })
   
   // Get appointments
   const appointments = await radiusApiClient.getAppointments({
     startDate: '2024-01-01',
     endDate: '2024-12-31'
   })
   ```

## Available Endpoints

### GET /api/radius/homes

Retrieve home data from RadiusBifrost.

**Query Parameters:**
- `unit` (optional): Filter by unit code (e.g., 'RAD', 'RHSA')
- `caseManager` (optional): Filter by case manager name
- `search` (optional): Search in home name, address, or case manager

**Example:**
```bash
curl -H "x-api-key: rh_your_key_here" \
  "https://admin.refugehouse.app/api/radius/homes?unit=RAD&search=Main"
```

**Response:**
```json
{
  "success": true,
  "count": 10,
  "homes": [
    {
      "id": "guid-here",
      "name": "Home Name",
      "address": "123 Main St",
      "City": "Austin",
      "State": "TX",
      "zipCode": "78701",
      "Unit": "RAD",
      "latitude": 30.2672,
      "longitude": -97.7431,
      "phoneNumber": "512-555-1234",
      "contactPersonName": "John Doe",
      "email": "john@example.com",
      "contactPhone": "512-555-5678",
      "lastSync": "2024-01-01T00:00:00Z"
    }
  ],
  "timestamp": "2024-01-01T12:00:00Z",
  "duration_ms": 45
}
```

### GET /api/radius/appointments

Retrieve appointment data from RadiusBifrost.

**Query Parameters:**
- `startDate` (optional): Filter appointments from this date (ISO string)
- `endDate` (optional): Filter appointments until this date (ISO string)
- `assignedTo` (optional): Filter by assigned user ID
- `status` (optional): Filter by appointment status
- `type` (optional): Filter by appointment type

**Example:**
```bash
curl -H "x-api-key: rh_your_key_here" \
  "https://admin.refugehouse.app/api/radius/appointments?startDate=2024-01-01&status=scheduled"
```

### GET /api/radius/visit-forms

Retrieve visit form data from RadiusBifrost.

**Query Parameters:**
- `appointmentId` (optional): Filter by appointment ID
- `status` (optional): Filter by form status
- `userId` (optional): Filter by created user ID

**Example:**
```bash
curl -H "x-api-key: rh_your_key_here" \
  "https://admin.refugehouse.app/api/radius/visit-forms?appointmentId=guid-here"
```

### GET /api/radius/users

Retrieve user data from RadiusBifrost.

**Query Parameters:**
- `microserviceCode` (optional): Filter users by microservice (users with roles/permissions for this microservice)
- `isActive` (optional): Filter by active status (defaults to true)

**Example:**
```bash
curl -H "x-api-key: rh_your_key_here" \
  "https://admin.refugehouse.app/api/radius/users?microserviceCode=home-visits&isActive=true"
```

## Authentication

All API requests require an API key in the `x-api-key` header:

```bash
x-api-key: rh_your_api_key_here
```

API keys are:
- Generated per microservice
- Stored as SHA-256 hashes in the database
- Tracked for usage statistics
- Can be revoked at any time
- Can have expiration dates
- Can have rate limits (default: 100 requests/minute)

## Using the Type-Safe Client

### Installation

The client is already available in the monorepo. Just import it:

```typescript
import { radiusApiClient } from '@refugehouse/radius-api-client'
```

### Examples

```typescript
// Get all homes
const allHomes = await radiusApiClient.getHomes()

// Get homes with filters
const radHomes = await radiusApiClient.getHomes({
  unit: 'RAD',
  search: 'Main Street'
})

// Get appointments in date range
const appointments = await radiusApiClient.getAppointments({
  startDate: '2024-01-01T00:00:00Z',
  endDate: '2024-12-31T23:59:59Z',
  status: 'scheduled'
})

// Get visit forms for an appointment
const forms = await radiusApiClient.getVisitForms({
  appointmentId: 'appointment-guid-here'
})

// Get users for a microservice
const users = await radiusApiClient.getUsers({
  microserviceCode: 'home-visits',
  isActive: true
})
```

### Error Handling

The client throws errors for failed requests:

```typescript
try {
  const homes = await radiusApiClient.getHomes()
} catch (error) {
  if (error.message.includes('Unauthorized')) {
    // API key is invalid
  } else if (error.message.includes('API request failed')) {
    // Server error or network issue
  }
}
```

## API Key Management

### Creating API Keys

1. Navigate to `/admin/apis/keys` in the admin microservice
2. Click "Create API Key"
3. Fill in:
   - **Microservice Code**: The code for your microservice (e.g., `serviceplan`, `training`)
   - **Description**: Optional description of what this key is for
   - **Rate Limit**: Requests per minute (default: 100)
   - **Expires At**: Optional expiration date
4. **Important**: Copy and save the API key immediately - it's only shown once!

### Revoking API Keys

1. Navigate to `/admin/apis/keys`
2. Find the API key you want to revoke
3. Click "Revoke"
4. Confirm the action

Revoked keys cannot be used for new requests.

## API Health Monitoring

View API health and statistics at `/admin/apis/health`:

- Overall health status
- Total API keys and active keys
- Total requests processed
- Endpoint health status
- Usage statistics by microservice

## Environment Variables

### For Admin Microservice (API Hub)

```bash
# Static IPs configured in Vercel
# Database connection (existing)
AZURE_TENANT_ID=...
AZURE_CLIENT_ID=...
AZURE_CLIENT_SECRET=...
AZURE_KEY_VAULT_NAME=...

# API Hub Configuration
RADIUS_API_HUB_URL=https://admin.refugehouse.app
```

### For Other Microservices (Consumers)

```bash
# No static IPs needed!
# API Hub Configuration
RADIUS_API_HUB_URL=https://admin.refugehouse.app
RADIUS_API_KEY=rh_your_api_key_here
```

## Database Setup

Run the SQL script to create the `api_keys` table:

```bash
# Run this script on RadiusBifrost database
scripts/create-api-keys-table.sql
```

## Cost Savings

**Before (Current Approach)**:
- 5 microservices × $100 static IPs = $500
- Each microservice connects directly to RadiusBifrost

**After (API Hub Approach)**:
- 1 microservice (admin) × $100 static IPs = $100
- Other microservices call admin APIs (no static IPs)
- **Savings: $400+** (scales with more microservices)

## Security Best Practices

1. **Store API Keys Securely**
   - Never commit API keys to version control
   - Use environment variables in Vercel
   - Rotate keys periodically

2. **Use Rate Limiting**
   - Set appropriate rate limits per microservice
   - Monitor usage patterns
   - Adjust limits as needed

3. **Monitor Usage**
   - Check `/admin/apis/health` regularly
   - Review usage statistics
   - Watch for unusual patterns

4. **Revoke Unused Keys**
   - Remove keys for decommissioned microservices
   - Revoke keys if compromised
   - Clean up expired keys

## Troubleshooting

### "Unauthorized" Error

- Check that `RADIUS_API_KEY` environment variable is set
- Verify the API key is active in `/admin/apis/keys`
- Ensure the API key hasn't expired
- Check that the `x-api-key` header is being sent

### "API request failed" Error

- Check that `RADIUS_API_HUB_URL` is set correctly
- Verify the admin microservice is running
- Check network connectivity
- Review server logs for details

### Slow Response Times

- Check API health dashboard for endpoint status
- Review rate limits - may be hitting limits
- Check database connection health
- Monitor for high load

## Future Enhancements

- [ ] Caching layer (Redis) for frequently accessed data
- [ ] Webhooks for data change notifications
- [ ] GraphQL API alternative
- [ ] API versioning support
- [ ] Enhanced analytics dashboard
- [ ] Request/response logging and monitoring
- [ ] Automatic rate limit adjustment

## Support

For issues or questions:
1. Check the API health dashboard: `/admin/apis/health`
2. Review API catalog: `/admin/apis`
3. Check server logs for detailed error messages
4. Contact system administrators

---

**Last Updated**: January 2025  
**Version**: 1.0

