# Database Architecture Documentation

## Overview

This application uses a multi-database architecture with different access patterns and purposes. Understanding this architecture is critical for development and maintenance.

## Database Schemas

### 1. Bifrost (Primary Connection) ✅ **DIRECT ACCESS**

**Database Name**: `RadiusBifrost`  
**Server**: `refugehouse-bifrost-server.database.windows.net`  
**Connection**: Direct SQL Server connection  
**Status**: **Actively under development** - schema changes regularly

**Purpose**: Integration layer and application database
- Primary database for this application
- Stores **current/active data only** (not historical archives)
- Integration layer that connects to other systems
- Contains tables for: `app_users`, `appointments`, `visit_forms`, `signature_tokens`, `continuum_entries`, etc.

**Access Pattern**: 
- Direct SQL queries via `lib/db.ts`
- Connection uses Azure Key Vault for credentials
- Uses Vercel Static IPs for direct connection (no proxy)

**Schema Documentation**: `docs/bifrost-schema.sql`

---

### 2. RHData (Unified View) ⚠️ **API ACCESS ONLY**

**Database Name**: `rhdata`  
**Access**: **INTERNAL ONLY - Must use PULSE App API**  
**Status**: **Actively under development** - schema changes regularly

**Purpose**: Unified view of historical data
- Aggregates data from unit-specific databases (radius, radiusrhsa)
- Provides a unified view across 20+ years of historical data
- Contains views and tables for: `SyncActiveHomes`, `SyncLicenseCurrent`, placement history, etc.

**Access Pattern**: 
- **CANNOT access directly** - no direct SQL connection (VM-based, no public exposure)
- **MUST use PULSE App API** to access data
- **Current API endpoint**: `/api/placement-history` (in PULSE app)
  - Note: This is currently the only PULSE App API endpoint implemented
  - Additional endpoints may be added in the future
- Requires `PULSE_APP_API_KEY` environment variable
- See `docs/pulse-app-api-key-setup.md` for API setup

**Why API-Only?**
- **Hosted on VM-based SQL Server instance** without public exposure
- **HIPAA security measure** - protects 20+ years of historical PHI data
- API provides controlled, secure access through PULSE app
- Limits exposure of sensitive historical data to external threats
- Allows PULSE app to manage data transformations and security

**Schema Documentation**: `docs/rhdata-schema.sql` (reference only - cannot query directly)

---

### 3. Radius & RadiusRHSA (Unit-Specific Databases) ⚠️ **API ACCESS ONLY**

**Database Names**: `radius`, `radiusrhsa`  
**Access**: **INTERNAL ONLY - Must use PULSE App API**  
**Status**: **Reasonably stable** - minimal schema changes

**Purpose**: Historical unit-specific databases
- Contains 20+ years of historical operational data
- Unit-specific data (each unit has its own database)
- Source data for RHData unified view

**Access Pattern**: 
- **CANNOT access directly** - no direct SQL connection (VM-based, no public exposure)
- **MUST use PULSE App API** to access data
- Data is accessed through RHData unified views via API
- See `docs/pulse-app-api-key-setup.md` for API setup

**Why API-Only?**
- **Hosted on VM-based SQL Server instance** without public exposure
- **HIPAA security measure** - protects 20+ years of historical PHI data
- Legacy databases with restricted direct access
- Unit-specific databases require controlled access
- API provides unified interface through RHData

**Schema Documentation**: `docs/radius-radiusrhsa-schema.sql` (reference only - cannot query directly)

---

## Access Patterns Summary

| Database | Access Method | Status | Schema Updates |
|----------|--------------|--------|----------------|
| **Bifrost** | Direct SQL | ✅ Active | Regular |
| **RHData** | PULSE App API | ⚠️ Internal | Regular |
| **Radius/RadiusRHSA** | PULSE App API | ⚠️ Internal | Stable |

## Development Guidelines

### ✅ DO:
- **Query Bifrost directly** using `lib/db.ts` and SQL queries
- **Use PULSE App API** to access RHData or Radius/RadiusRHSA data
- **Reference schema docs** for understanding data structures
- **Update Bifrost schema docs** when making schema changes
- **Check PULSE App API** for available endpoints before accessing historical data

### ❌ DON'T:
- **Attempt direct SQL connections** to RHData, Radius, or RadiusRHSA
- **Query internal databases directly** - always use API
- **Assume schema stability** - Bifrost and RHData change regularly
- **Hardcode schema assumptions** - use schema docs as reference

## Environment Variables

### Bifrost (Direct Connection)
- `AZURE_TENANT_ID` - Azure Key Vault tenant
- `AZURE_CLIENT_ID` - Azure Key Vault client ID
- `AZURE_CLIENT_SECRET` - Azure Key Vault client secret
- `AZURE_KEY_VAULT_NAME` - Key Vault name (contains database password)

### PULSE App API (For RHData/Radius Access)
- `PULSE_APP_API_KEY` - API key for authenticating with PULSE app
- `PULSE_ENVIRONMENT_URL` - Base URL of PULSE app instance

## Code Examples

### Accessing Bifrost (Direct)
```typescript
import { query } from "@/lib/db"

// Direct SQL query to Bifrost
const users = await query(
  "SELECT * FROM app_users WHERE is_active = 1"
)
```

### Accessing RHData via PULSE App API
```typescript
// Use PULSE App API - do NOT query directly
const response = await fetch(
  `${process.env.PULSE_ENVIRONMENT_URL}/api/placement-history?homeGUID=${homeGUID}&startDate=${startDate}&endDate=${endDate}`,
  {
    headers: {
      'x-api-key': process.env.PULSE_APP_API_KEY || '',
    },
  }
)
const data = await response.json()
```

## Schema Documentation Files

- `docs/bifrost-schema.sql` - Full Bifrost schema (primary database)
- `docs/rhdata-schema.sql` - RHData schema (reference only - API access)
- `docs/radius-radiusrhsa-schema.sql` - Unit database schemas (reference only - API access)

**Note**: Schema files for RHData and Radius/RadiusRHSA are for reference only. They help understand data structures but cannot be queried directly.

## Important Notes

1. **Bifrost is actively developed** - schema changes regularly, update docs when making changes
2. **RHData is actively developed** - schema changes regularly, but you access via API so changes are abstracted
3. **Radius/RadiusRHSA are stable** - minimal changes, but still require API access
4. **Always use API for internal databases** - HIPAA security requirement (VM-based, no public exposure)
5. **Schema docs are references** - actual access patterns differ (direct vs API)
6. **Schema updates**: During significant development that requires these resources, AI assistants should prompt to update schema documentation files
7. **PULSE App API**: Currently only `/api/placement-history` endpoint exists; additional endpoints may be added in the future

## Questions?

If you need to:
- **Access Bifrost data**: Use direct SQL queries via `lib/db.ts`
- **Access historical/legacy data**: Use PULSE App API endpoints
- **Understand data structure**: Reference schema documentation files
- **Add new features**: Check if data exists in Bifrost first, then consider API for historical data

