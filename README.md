# Home Visits Application

A Next.js application for managing foster care home visits with role-based access control.

## 🚨 CRITICAL DEPLOYMENT REQUIREMENTS FOR v0 🚨

**ALL FILES MUST BE WRITTEN COMPLETELY - NO PLACEHOLDERS**

When working with v0 on this project, the following rules are MANDATORY for successful deployment:

### ✅ REQUIRED PRACTICES:
- **Write complete file content** for every file being modified
- **Include all imports, exports, and function implementations**
- **Ensure all referenced functions and variables are included**
- **Never use placeholders** like "... This file was left out for brevity..."
- **Test deployment immediately** after each significant change

### ❌ DEPLOYMENT FAILURES CAUSED BY:
- Using brevity placeholders in production code
- Incomplete file implementations
- Missing exports or imports
- Referencing functions that aren't fully implemented
- Partial file updates that break dependencies

### v0 Development Workflow:
1. **Request changes** with explicit instruction: "Write complete file contents"
2. **Apply changes** to GitHub repository manually
3. **Deploy to Vercel** to test functionality
4. **Verify everything works** before proceeding
5. **Repeat process** for next change

**Remember**: Vercel builds from GitHub, so all v0 changes must be manually applied to the repository.

## Architecture

This application uses a microservice-aware authentication and permissions system built on:
- **Authentication**: Clerk for user authentication
- **Database**: SQL Server with Azure integration
- **Permissions**: Role-based access control per microservice
- **Frontend**: Next.js 14 with App Router

### Database Schema

The application follows the authentication methodology documented in `docs/authentication-permissions-methodology.md`.

## ⚠️⚠️⚠️ CRITICAL WARNING FOR v0 AI ASSISTANT ⚠️⚠️⚠️

**DO NOT CHANGE THE DATABASE CONNECTION PARAMETERS IN `lib/db.ts` WITHOUT EXPLICIT USER PERMISSION**

The database connection parameters in `lib/db.ts` are LOCKED and WORKING. They connect to:
- Server: `refugehouse-bifrost-server.database.windows.net`
- Database: `RadiusBifrost`
- User: `v0_app_user`
- Password: Retrieved from Azure Key Vault only

**IF YOU CHANGE THESE PARAMETERS, YOU WILL BREAK THE APPLICATION.**

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

### Visual Design System and Branding

#### Brand Colors (Tailwind CSS Custom Colors)
The application uses a custom branded color scheme defined in `tailwind.config.ts`:

\`\`\`css
--refuge-purple: #8B5CF6
--refuge-magenta: #EC4899  
--refuge-light-purple: #A78BFA
\`\`\`

These colors should be used consistently throughout the application:
- **Primary Actions**: `bg-refuge-purple` with hover gradients
- **Secondary Elements**: `text-refuge-purple` or `border-refuge-purple/20`
- **Gradients**: `from-refuge-purple to-refuge-magenta` or `from-refuge-light-purple/10 to-refuge-magenta/10`
- **Badges and Highlights**: `bg-refuge-purple/10 text-refuge-purple`

#### Logo and Branding
- **Primary Logo**: `/images/web logo with name.png` (used in sidebar header)
- **Logo Sizing**: `h-14` for sidebar, with hover scale effect
- **Background**: Gradient backgrounds using `from-refuge-light-purple/10 via-refuge-purple/5 to-refuge-magenta/10`

#### Component Styling Standards

**Headers and Titles**:
- Page titles use gradient text: `bg-gradient-to-r from-refuge-purple to-refuge-magenta bg-clip-text text-transparent`
- Card headers have gradient backgrounds: `bg-gradient-to-r from-refuge-purple/5 to-refuge-magenta/5`

**Buttons**:
- Primary: `bg-refuge-purple hover:bg-gradient-to-r hover:from-refuge-purple hover:to-refuge-purple/90`
- Outline: `border-refuge-purple/30 text-refuge-purple hover:bg-refuge-purple/5`
- Loading states use `text-refuge-purple` for spinners

**Form Elements**:
- Inputs: `border-refuge-purple/20 focus:border-refuge-purple focus:ring-refuge-purple/20`
- Select dropdowns: Same border styling as inputs
- Search icons: `text-refuge-purple/60`

**Cards and Containers**:
- Border: `border-refuge-purple/20`
- Selected states: `border-refuge-purple bg-refuge-purple/5`
- Hover effects: `hover:border-refuge-purple/30 hover:bg-refuge-purple/5`

#### Sidebar Design
- **Header**: Fixed height `h-20` with logo and gradient background
- **Navigation**: Hover effects with gradient backgrounds
- **Admin Section**: Anchored to bottom with distinct styling and Shield icon
- **User Avatar**: Gradient background `from-refuge-purple to-refuge-magenta`

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

#### 7. Admin Menu Missing
**Problem**: Administration menu not appearing in sidebar
**Solution**: Ensure admin section is anchored to bottom of sidebar with proper styling
**Files Affected**: `components/app-sidebar.tsx`

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

### Visual Consistency Checklist

When making UI changes, ensure:
- [ ] Brand colors are used consistently
- [ ] Gradient backgrounds are applied to headers and cards
- [ ] Hover effects use branded color transitions
- [ ] Loading states use refuge-purple for spinners
- [ ] Buttons follow the established styling patterns
- [ ] Form elements have proper focus states
- [ ] Admin section remains anchored to sidebar bottom
- [ ] Logo sizing and positioning is maintained

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

### Database Setup

After deploying the application, you'll need to run the following SQL scripts:

1. **Open Azure Portal** → Navigate to your SQL Database (`RadiusBifrost`)
2. **Open Query Editor** and authenticate as database admin
3. **Run the SQL scripts in order**:
   - `scripts/create-on-call-table-minimal.sql` - Creates the on-call schedule table
   - `scripts/add-phone-to-app-users.sql` - Adds phone number field to app_users table
   - `scripts/add-on-call-schedule-nav.sql` - Adds "On-Call Schedule" to the navigation menu
4. **Verify permissions**: The scripts grant permissions to `v0_application_role` (used by `v0_app_user`)

**Important**: The database user `v0_app_user` is a member of `v0_application_role`. All table permissions are granted to the role, not directly to the user.

**Phone Number Feature**: 
- User phone numbers are now stored centrally in the `app_users` table
- When assigning on-call schedules, the system automatically pulls phone from `app_users`
- If a phone number is missing, the user is prompted to enter it, and it's saved to their profile
- This eliminates redundant data entry and keeps contact information up-to-date

**Navigation Configuration**:
- Navigation items are stored in the `navigation_items` table
- The "On-Call Schedule" menu item must be added via the SQL script after initial setup
- The item is linked to the `view_visits` permission
- All navigation changes require a database update AND a browser cache clear to be visible

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
- `tailwind.config.ts`: Tailwind CSS configuration with custom brand colors.
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

- **Visual Inconsistencies**: Ensure branded colors are used consistently. Check that gradients and hover effects follow the established patterns.

- **Admin Menu Missing**: Verify that the administration section is properly anchored to the bottom of the sidebar with the correct styling.

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
5. Check that visual styling follows the established brand guidelines

For development support, provide full error messages and build logs when reporting issues.
