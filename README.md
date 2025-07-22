# Family Visits Application

This is an internal application designed to streamline the management of family visits for social workers and agencies. It provides tools for managing homes, scheduling visits, and ensuring compliance with relevant regulations.

## ⚠️⚠️⚠️ CRITICAL WARNING FOR v0 AI ASSISTANT ⚠️⚠️⚠️

**DO NOT CHANGE THE DATABASE CONNECTION PARAMETERS IN `lib/db.ts` WITHOUT EXPLICIT USER PERMISSION**

The database connection parameters in `lib/db.ts` are LOCKED and WORKING. They connect to:
- Server: `refugehouse-bifrost-server.database.windows.net`
- Database: `RadiusBifrost`
- User: `v0_app_user`
- Password: Retrieved from Azure Key Vault only

**IF YOU CHANGE THESE PARAMETERS, YOU WILL BREAK THE APPLICATION AND WILL HAVE TO BREAK YOUR OWN FINGERS.**

These parameters are stable and functional. Do not revert to old configurations or suggest alternatives without explicit user request.

## ⚠️⚠️⚠️ END CRITICAL WARNING ⚠️⚠️⚠️

## 🚨 CRITICAL STABILITY GUIDELINES FOR AI ASSISTANTS 🚨

### Database and API Stability Rules

1. **Database Table Names**: 
   - ALWAYS use `SyncActiveHomes` - this is the correct table name
   - NEVER use `Homes` - this table does not exist and will cause build failures
   - The table structure is stable and should not be modified

2. **Interface Stability**:
   - The `ListHome` and `MapHome` interfaces in `lib/db-extensions.ts` are used across multiple screens
   - DO NOT modify these interfaces without explicit permission
   - The `lastSync` field was added to fix missing sync data - DO NOT REMOVE

3. **API Response Structures**:
   - API endpoints have stable response structures used by multiple components
   - Changing response structures will break consuming components
   - All API routes require `export const dynamic = "force-dynamic"` and `export const runtime = "nodejs"`

4. **Map Component Usage**:
   - `components/homes-map.tsx` is a PURE map component - do not add headers, filters, or lists
   - Must be imported dynamically with `ssr: false` to prevent SSR issues
   - Leaflet requires dynamic imports - never use static imports

5. **Z-Index Issues**:
   - Leaflet maps have high z-index values
   - Dropdown components need `z-[9999]` or higher to appear above maps
   - This was a recurring issue that required multiple fixes

### Common Issues and Solutions

#### 1. Missing LastSync Data
**Problem**: LastSync column showing "Never" despite database having data
**Solution**: Ensure `[LastSync] as lastSync` is included in all SQL queries in `lib/db-extensions.ts`
**Files Affected**: `lib/db-extensions.ts`, API endpoints

#### 2. Map Component Duplicate Layout
**Problem**: Map page showing duplicate headers, filters, and lists
**Solution**: Keep `HomesMap` component as pure map only, layout goes in page component
**Files Affected**: `components/homes-map.tsx`, `app/homes-map/page.tsx`

#### 3. Leaflet SSR Issues
**Problem**: "window is not defined" errors during build
**Solution**: Use dynamic import with `ssr: false` and async Leaflet imports
**Files Affected**: `components/homes-map.tsx`, consuming pages

#### 4. Dropdown Z-Index Issues
**Problem**: Filter dropdowns appearing behind map
**Solution**: Use `z-[9999]` class on SelectContent components
**Files Affected**: Any page with dropdowns near maps

#### 5. Build Failures with SQL Syntax
**Problem**: SQL syntax errors during build (e.g., "current_time" keyword)
**Solution**: Use proper SQL Server syntax, avoid MySQL-specific functions
**Files Affected**: API routes, diagnostic endpoints

#### 6. Coordinate Display Issues
**Problem**: Raw coordinates showing instead of user-friendly display
**Solution**: Use "Map Status" badges instead of raw coordinate numbers
**Files Affected**: `app/homes-list/page.tsx`

### Database Query Guidelines

\`\`\`sql
-- CORRECT: Use this table name
FROM SyncActiveHomes

-- WRONG: This table does not exist
FROM Homes

-- REQUIRED: Cast coordinates properly
CAST([Latitude] AS FLOAT) as latitude,
CAST([Longitude] AS FLOAT) as longitude,

-- CRITICAL: Always include LastSync
[LastSync] as lastSync
\`\`\`

### Map Component Integration

\`\`\`typescript
// CORRECT: Dynamic import with SSR disabled
const HomesMap = dynamic(() => import("@/components/homes-map"), {
  ssr: false,
  loading: () => <LoadingComponent />
})

// WRONG: Static import will cause SSR issues
import HomesMap from "@/components/homes-map"
\`\`\`

### Z-Index Configuration

\`\`\`typescript
// CORRECT: High z-index for dropdowns near maps
<SelectContent className="z-[9999]">

// WRONG: Low z-index will appear behind map
<SelectContent className="z-50">
\`\`\`

## Development Workflow with v0

This project is being developed in collaboration with v0, Vercel's AI Assistant. To ensure a smooth workflow and successful deployments, please follow these steps:

1. **Receiving Code from v0**: v0 will provide code changes and new files within the chat interface.
2. **Applying Changes to GitHub**: These changes must be **manually applied** to your GitHub repository. Vercel builds directly from GitHub, so changes in the v0 chat are not automatically synced.
3. **How to Apply Changes**:
   - Navigate to the specific file in your GitHub repository (e.g., `package.json`).
   - Click the "Edit" (pencil) icon.
   - Replace the entire content of the file with the code provided by v0.
   - Commit the changes directly to the `main` branch.
4. **Triggering a Deployment**: Committing changes to the `main` branch on GitHub will automatically trigger a new deployment on Vercel.
5. **Troubleshooting Build Errors**: If a deployment fails, provide the full build log from Vercel to v0. We will use the logs to diagnose and fix the issue by repeating this process.

**Important**: Always ensure the files in your GitHub repository match the latest working code provided by v0 to avoid deployment errors.

## Features

- **Dashboard**: Overview of key metrics and quick access to main modules.
- **Homes List**: Comprehensive list of all registered homes with detailed information.
- **Homes Map**: Interactive map to visualize home locations and plan routes.
- **Admin Panel**: Tools for administrative tasks, including user management.
- **Visit Scheduling**: Efficiently schedule and track upcoming home visits.
- **User Management**: Administer user accounts, roles, and permissions.
- **Database Diagnostics**: Test and monitor database connectivity and proxy setup.
- **Proxy Setup**: Configure and verify static IP proxy settings for secure connections.
- **Connection Recipe**: View code and configuration for database connection.
- **Coordinate Test**: Test access to coordinate data for homes.

## Getting Started

### Prerequisites

- Node.js (v18 or later)
- pnpm (recommended package manager)
- Access to an Azure SQL Database
- Azure Key Vault configured with database password
- Fixie SOCKS proxy credentials (if using a proxy)

### Environment Variables

Ensure you have the following environment variables configured in your `.env.local` file (for local development) and on Vercel (for deployment):

**Required for Azure Key Vault (Database Password)**:
- `AZURE_TENANT_ID`: Your Azure AD tenant ID
- `AZURE_CLIENT_ID`: Your Azure AD application client ID
- `AZURE_CLIENT_SECRET`: Your Azure AD application client secret
- `AZURE_KEY_VAULT_NAME`: Your Azure Key Vault name (e.g., "refugehouse-kv")

**Required for Proxy (if using)**:
- `FIXIE_SOCKS_HOST`: Your Fixie SOCKS proxy URL (e.g., `socks://username:password@host:port`)

**Note**: The database connection parameters are hardcoded in `lib/db.ts` and should not be changed. The password is retrieved securely from Azure Key Vault.

### Installation

1. **Clone the repository:**
   \`\`\`bash
   git clone <your-repo-url>
   cd foster-home-visit
   \`\`\`

2. **Install dependencies:**
   \`\`\`bash
   pnpm install
   \`\`\`

3. **Run the development server:**
   \`\`\`bash
   pnpm dev
   \`\`\`
   Open [http://localhost:3000](http://localhost:3000) in your browser to see the application.

### Deployment to Vercel

1. **Ensure your `pnpm-lock.yaml` is up to date:**
   After making any changes to `package.json` (adding/removing/updating dependencies), always run `pnpm install` locally to regenerate `pnpm-lock.yaml`.

2. **Commit your changes:**
   \`\`\`bash
   git add .
   git commit -m "Update project"
   git push
   \`\`\`

3. **Deploy via Vercel CLI or Git Integration:**
   If connected to a Git repository, Vercel will automatically deploy on push.
   Alternatively, use the Vercel CLI:
   \`\`\`bash
   vercel --prod
   \`\`\`

## Project Structure

- `app/`: Next.js App Router pages and API routes.
- `components/`: Reusable React components (including shadcn/ui components).
- `lib/db.ts`: Database connection logic, including Fixie proxy integration. **DO NOT MODIFY WITHOUT PERMISSION**.
- `lib/db-extensions.ts`: Safe database query functions that extend functionality without modifying core connection.
- `public/images/`: Static assets like logos.
- `tailwind.config.ts`: Tailwind CSS configuration.
- `app/globals.css`: Global CSS styles.

## Troubleshooting

### Common Build/Deployment Issues

- **`ERR_PNPM_OUTDATED_LOCKFILE`**: This means your `pnpm-lock.yaml` file is not in sync with `package.json`. Run `pnpm install` locally, commit both files, and then redeploy.

- **Database Connection Issues**: Check your environment variables for Azure Key Vault. Use the `/diagnostics` page in the app to test connectivity. **DO NOT CHANGE THE DATABASE PARAMETERS IN `lib/db.ts`**.

- **Proxy Issues**: Ensure `FIXIE_SOCKS_HOST` is correctly formatted and accessible. Use the `/diagnostics` page to test the proxy connection.

- **Map Not Loading**: Ensure the map component is imported dynamically with `ssr: false`. Check browser console for Leaflet-related errors.

- **Dropdown Behind Map**: Use `z-[9999]` class on dropdown components near maps.

- **Missing LastSync Data**: Verify that `[LastSync] as lastSync` is included in SQL queries in `lib/db-extensions.ts`.

- **SQL Syntax Errors**: Use SQL Server syntax, not MySQL. Avoid functions like `current_time` - use `GETDATE()` instead.

### Diagnostic Pages

- `/test-db`: Test database connection and authentication
- `/coordinate-test`: Test coordinate data access
- `/diagnostics`: Comprehensive system diagnostics including proxy and Key Vault
- `/connection-recipe`: View database connection configuration

### Security Notes

- Database passwords are stored securely in Azure Key Vault
- All database connections use TLS encryption
- Proxy connections use SOCKS5 for additional security
- No sensitive credentials are stored in code or environment variables (except Key Vault access)

## Support

If you encounter issues not covered in this README:

1. Check the diagnostic pages listed above
2. Review the build logs in Vercel for specific error messages
3. Ensure all environment variables are properly configured
4. Verify that the database and Key Vault are accessible from your deployment environment

For development support, provide full error messages and build logs when reporting issues.
