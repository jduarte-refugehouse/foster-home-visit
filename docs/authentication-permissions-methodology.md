# Comprehensive Authentication and Permissions Methodology Template

## Overview
This document outlines a templated authentication and permissions system that can be adapted for any microservice application. This system uses Clerk STRICTLY for identity management only, while implementing a custom database-driven authorization system.

## Core Principles
1. **Identity vs Authorization Separation**: Clerk handles WHO the user is (identity ONLY), our database handles WHAT they can do (authorization)
2. **Clerk Isolation**: Clerk is NEVER extended beyond basic identity management - no custom claims, no middleware, no authorization logic
3. **Microservice-Specific Permissions**: Each microservice has its own roles and permissions
4. **Database-Driven Security**: All authorization decisions are made against our database, never Clerk
5. **Template-Based Implementation**: System designed for easy adaptation to new microservices

## Database Schema Template

### Core Tables (Shared Across All Microservices)

\`\`\`sql
-- Main user table (shared across all microservices)
CREATE TABLE app_users (
    id UNIQUEIDENTIFIER PRIMARY KEY DEFAULT NEWID(),
    clerk_user_id NVARCHAR(255) UNIQUE NOT NULL,
    email NVARCHAR(255) UNIQUE NOT NULL,
    first_name NVARCHAR(100),
    last_name NVARCHAR(100),
    is_active BIT DEFAULT 1,
    created_at DATETIME2 DEFAULT GETDATE(),
    updated_at DATETIME2 DEFAULT GETDATE()
);

-- Microservice applications registry
CREATE TABLE microservice_apps (
    id UNIQUEIDENTIFIER PRIMARY KEY DEFAULT NEWID(),
    app_code NVARCHAR(50) UNIQUE NOT NULL,
    app_name NVARCHAR(100) NOT NULL,
    app_url NVARCHAR(255),
    description NVARCHAR(500),
    is_active BIT DEFAULT 1,
    created_at DATETIME2 DEFAULT GETDATE()
);

-- Permissions defined per microservice
CREATE TABLE permissions (
    id UNIQUEIDENTIFIER PRIMARY KEY DEFAULT NEWID(),
    microservice_id UNIQUEIDENTIFIER NOT NULL,
    permission_code NVARCHAR(100) NOT NULL,
    permission_name NVARCHAR(200) NOT NULL,
    description NVARCHAR(500),
    category NVARCHAR(100),
    created_at DATETIME2 DEFAULT GETDATE(),
    FOREIGN KEY (microservice_id) REFERENCES microservice_apps(id),
    UNIQUE(microservice_id, permission_code)
);

-- User roles per microservice
CREATE TABLE user_roles (
    id UNIQUEIDENTIFIER PRIMARY KEY DEFAULT NEWID(),
    user_id UNIQUEIDENTIFIER NOT NULL,
    microservice_id UNIQUEIDENTIFIER NOT NULL,
    role_name NVARCHAR(100) NOT NULL,
    granted_by NVARCHAR(255),
    granted_at DATETIME2 DEFAULT GETDATE(),
    is_active BIT DEFAULT 1,
    FOREIGN KEY (user_id) REFERENCES app_users(id),
    FOREIGN KEY (microservice_id) REFERENCES microservice_apps(id)
);

-- Direct user permissions (overrides or additions to role permissions)
CREATE TABLE user_permissions (
    id UNIQUEIDENTIFIER PRIMARY KEY DEFAULT NEWID(),
    user_id UNIQUEIDENTIFIER NOT NULL,
    permission_id UNIQUEIDENTIFIER NOT NULL,
    granted_by NVARCHAR(255),
    granted_at DATETIME2 DEFAULT GETDATE(),
    expires_at DATETIME2 NULL,
    is_active BIT DEFAULT 1,
    context_type NVARCHAR(50), -- 'all', 'unit', 'region', 'specific_resources'
    context_value NVARCHAR(MAX), -- JSON object with context details
    FOREIGN KEY (user_id) REFERENCES app_users(id),
    FOREIGN KEY (permission_id) REFERENCES permissions(id)
);

-- Invitation system for external users
CREATE TABLE invited_users (
    id UNIQUEIDENTIFIER PRIMARY KEY DEFAULT NEWID(),
    email NVARCHAR(255) NOT NULL,
    invited_by UNIQUEIDENTIFIER NOT NULL,
    invitation_token NVARCHAR(255) UNIQUE,
    expires_at DATETIME2,
    is_active BIT DEFAULT 1,
    created_at DATETIME2 DEFAULT GETDATE(),
    FOREIGN KEY (invited_by) REFERENCES app_users(id)
);
\`\`\`

## Microservice Configuration Template

### 1. Microservice Registration Template
\`\`\`sql
-- Template for registering a new microservice
INSERT INTO microservice_apps (id, app_code, app_name, app_url, description, is_active)
VALUES (NEWID(), '[MICROSERVICE_CODE]', '[MICROSERVICE_NAME]', '/[MICROSERVICE_PATH]', '[DESCRIPTION]', 1);
\`\`\`

### 2. Role Definition Template
\`\`\`typescript
// Template for microservice-specific roles
export const [MICROSERVICE_NAME]_ROLES = {
  // Administrative roles
  SYSTEM_ADMIN: "system_admin",
  [MICROSERVICE]_ADMIN: "[microservice]_admin",
  
  // Operational roles
  MANAGER: "manager",
  STAFF: "staff",
  SUPERVISOR: "supervisor",
  
  // Limited access roles
  VIEWER: "viewer",
  EXTERNAL_USER: "external_user",
} as const;
\`\`\`

### 3. Permission Categories Template
\`\`\`sql
-- Template for basic permission categories
-- Replace [MICROSERVICE_ID] with actual microservice GUID
INSERT INTO permissions (microservice_id, permission_code, permission_name, description, category) VALUES
('[MICROSERVICE_ID]', 'view_dashboard', 'View Dashboard', 'Access main dashboard', 'Basic'),
('[MICROSERVICE_ID]', 'view_data', 'View Data', 'View application data', 'Basic'),
('[MICROSERVICE_ID]', 'create_data', 'Create Data', 'Create new records', 'Operations'),
('[MICROSERVICE_ID]', 'edit_data', 'Edit Data', 'Modify existing records', 'Operations'),
('[MICROSERVICE_ID]', 'delete_data', 'Delete Data', 'Remove records', 'Operations'),
('[MICROSERVICE_ID]', 'manage_users', 'Manage Users', 'Manage system users and permissions', 'Admin'),
('[MICROSERVICE_ID]', 'system_config', 'System Configuration', 'Configure system settings', 'Admin');
\`\`\`

## Authentication Flow Template

### 1. User Registration/Login (Clerk Identity Only)
\`\`\`typescript
// Template for handling user authentication
export async function createOrUpdateAppUser(clerkUser: any): Promise<AppUser> {
  const email = clerkUser.emailAddresses[0]?.emailAddress;
  const firstName = clerkUser.firstName || "";
  const lastName = clerkUser.lastName || "";

  try {
    // Check if user exists
    const existingUser = await query<AppUser>(
      "SELECT * FROM app_users WHERE clerk_user_id = @param0", 
      [clerkUser.id]
    );

    let userId: string;

    if (existingUser.length > 0) {
      // Update existing user
      await query(`
        UPDATE app_users 
        SET email = @param1, first_name = @param2, last_name = @param3, updated_at = GETDATE()
        WHERE clerk_user_id = @param0
      `, [clerkUser.id, email, firstName, lastName]);
      
      userId = existingUser[0].id;
    } else {
      // Check authorization for new users
      const isAuthorized = await isUserAuthorized(email);
      if (!isAuthorized) {
        throw new Error("User not authorized for this system");
      }

      // Create new user
      const newUserResult = await query<{ id: string }>(`
        INSERT INTO app_users (clerk_user_id, email, first_name, last_name, is_active, created_at, updated_at)
        OUTPUT INSERTED.id
        VALUES (@param0, @param1, @param2, @param3, 1, GETDATE(), GETDATE())
      `, [clerkUser.id, email, firstName, lastName]);
      
      userId = newUserResult[0].id;

      // Assign default roles for this microservice
      await assignDefaultMicroserviceRoles(userId, email);
    }

    // Return the updated/created user
    const result = await query<AppUser>(
      "SELECT * FROM app_users WHERE clerk_user_id = @param0", 
      [clerkUser.id]
    );

    return result[0];
  } catch (error) {
    console.error("Error creating/updating app user:", error);
    throw error;
  }
}
\`\`\`

### 2. Authorization Check Template
\`\`\`typescript
export async function isUserAuthorized(email: string): Promise<boolean> {
  // Internal users (organization domain) are always authorized
  if (email.endsWith("@[ORGANIZATION_DOMAIN]")) {
    return true;
  }
  
  // External users must be explicitly invited
  const invitation = await query(
    "SELECT * FROM invited_users WHERE email = @param0 AND is_active = 1 AND expires_at > GETDATE()",
    [email]
  );
  
  return invitation.length > 0;
}
\`\`\`

### 3. Default Role Assignment Template
\`\`\`typescript
export async function assignDefaultMicroserviceRoles(userId: string, email: string): Promise<void> {
  try {
    // Get current microservice ID
    const microservice = await query<{ id: string }>(
      "SELECT id FROM microservice_apps WHERE app_code = @param0", 
      [CURRENT_MICROSERVICE]
    );

    if (microservice.length === 0) {
      console.error(`Microservice ${CURRENT_MICROSERVICE} not found in database`);
      return;
    }

    const microserviceId = microservice[0].id;

    // Assign roles based on email domain and specific addresses
    if (email.endsWith("@[ORGANIZATION_DOMAIN]")) {
      // Default internal user role
      await assignUserToRole(userId, "viewer", CURRENT_MICROSERVICE, "system");
    } else {
      // External users (with invitation)
      await assignUserToRole(userId, "external_user", CURRENT_MICROSERVICE, "system");
    }
  } catch (error) {
    console.error("Error assigning default microservice roles:", error);
  }
}
\`\`\`

## Permission Checking System Template

### 1. Basic Permission Check
\`\`\`typescript
export async function hasPermission(
  userId: string, 
  permissionCode: string, 
  microserviceCode: string = CURRENT_MICROSERVICE
): Promise<boolean> {
  try {
    // Check direct permission
    const directPermission = await query<{ count: number }>(`
      SELECT COUNT(*) as count
      FROM user_permissions up
      INNER JOIN permissions p ON up.permission_id = p.id
      INNER JOIN microservice_apps ma ON p.microservice_id = ma.id
      WHERE up.user_id = @param0 AND ma.app_code = @param1 AND p.permission_code = @param2
      AND up.is_active = 1 AND (up.expires_at IS NULL OR up.expires_at > GETDATE())
    `, [userId, microserviceCode, permissionCode]);
    
    return directPermission[0]?.count > 0;
  } catch (error) {
    console.error("Error checking permission:", error);
    return false;
  }
}
\`\`\`

### 2. Context-Aware Permission Check Template
\`\`\`typescript
export async function canUserPerformAction(
  userId: string,
  action: string,
  context: {
    microservice: string;
    resourceType?: string;
    resourceId?: string;
    contextId?: string;
  }
): Promise<boolean> {
  try {
    // Check if user has the required permission
    const hasDirectPermission = await hasPermission(userId, action, context.microservice);
    
    if (!hasDirectPermission) {
      return false;
    }
    
    // Check context-specific restrictions if context is provided
    if (context.contextId) {
      const contextPermission = await query<{ count: number }>(`
        SELECT COUNT(*) as count
        FROM user_permissions up
        INNER JOIN permissions p ON up.permission_id = p.id
        INNER JOIN microservice_apps ma ON p.microservice_id = ma.id
        WHERE up.user_id = @param0 AND ma.app_code = @param1 AND p.permission_code = @param2
        AND up.is_active = 1 
        AND (up.context_type IS NULL OR up.context_type = 'all'
             OR (up.context_type = 'specific' AND JSON_VALUE(up.context_value, '$.context_id') = @param3))
      `, [userId, context.microservice, action, context.contextId]);
      
      return contextPermission[0]?.count > 0;
    }
    
    return true;
  } catch (error) {
    console.error("Error checking user action permission:", error);
    return false;
  }
}
\`\`\`

## Frontend Permission System Template

### 1. Permission Hook Template
\`\`\`typescript
export function usePermissions(): UserPermissions {
  const { isSignedIn, userId } = useAuth(); // Clerk hook for identity only
  const [permissionData, setPermissionData] = useState<UserPermissions>(createDefaultPermissions());

  useEffect(() => {
    if (!isSignedIn) {
      setPermissionData({ ...createDefaultPermissions(), isLoaded: true });
      return;
    }

    const fetchPermissions = async () => {
      try {
        const response = await fetch("/api/permissions");
        if (!response.ok) {
          throw new Error("Failed to fetch permissions");
        }
        const data = await response.json();
        setPermissionData(constructPermissionSet(data));
      } catch (error) {
        console.error("Error fetching permissions:", error);
        setPermissionData({ ...createDefaultPermissions(), isLoaded: true });
      }
    };

    fetchPermissions();
  }, [isSignedIn, userId]);

  return permissionData;
}
\`\`\`

### 2. Protected Content Component Template
\`\`\`typescript
interface ProtectedContentProps {
  children: ReactNode;
  requiredPermissions?: string[];
  requiredRoles?: string[];
  fallback?: ReactNode;
  requireAll?: boolean;
}

export function ProtectedContent({
  children,
  requiredPermissions = [],
  requiredRoles = [],
  fallback = null,
  requireAll = false,
}: ProtectedContentProps) {
  const { permissions, roles, isLoaded } = usePermissions();

  if (!isLoaded) {
    return <div className="animate-pulse bg-gray-200 h-4 rounded"></div>;
  }

  // Check if user has required permissions
  const hasPermissions = requiredPermissions.length === 0 ||
    (requireAll
      ? requiredPermissions.every((perm) => permissions.includes(perm))
      : requiredPermissions.some((perm) => permissions.includes(perm)));

  // Check if user has required roles
  const hasRoles = requiredRoles.length === 0 ||
    (requireAll
      ? requiredRoles.every((role) => roles.includes(role))
      : requiredRoles.some((role) => roles.includes(role)));

  if (hasPermissions && hasRoles) {
    return <>{children}</>;
  }

  return <>{fallback}</>;
}
\`\`\`

## API Route Protection Template

### 1. Permission Middleware Template
\`\`\`typescript
export async function checkPermission(
  request: NextRequest,
  requiredPermission: string,
  microservice: string = CURRENT_MICROSERVICE
): Promise<{ authorized: boolean; user?: any; error?: string }> {
  try {
    // Get user from Clerk (identity only - NO authorization logic in Clerk)
    const clerkUser = await currentUser();
    if (!clerkUser) {
      return { authorized: false, error: "Not authenticated" };
    }

    // Get user from our database (authorization system)
    const appUser = await query(
      "SELECT * FROM app_users WHERE clerk_user_id = @param0 AND is_active = 1",
      [clerkUser.id]
    );

    if (appUser.length === 0) {
      return { authorized: false, error: "User not found in system" };
    }

    // Check permission using our database system
    const hasRequiredPermission = await hasPermission(appUser[0].id, requiredPermission, microservice);
    
    return {
      authorized: hasRequiredPermission,
      user: appUser[0],
      error: hasRequiredPermission ? undefined : "Insufficient permissions"
    };
  } catch (error) {
    return { 
      authorized: false, 
      error: error instanceof Error ? error.message : "Unknown error" 
    };
  }
}
\`\`\`

### 2. Protected API Route Template
\`\`\`typescript
export async function GET(request: NextRequest) {
  // Check permission using our database system
  const authCheck = await checkPermission(request, "view_data");
  
  if (!authCheck.authorized) {
    return NextResponse.json(
      { error: authCheck.error },
      { status: authCheck.error === "Not authenticated" ? 401 : 403 }
    );
  }

  // Proceed with authorized logic
  try {
    const data = await query("SELECT * FROM [table] WHERE microservice_id = @param0", [
      CURRENT_MICROSERVICE_ID
    ]);

    return NextResponse.json({ data });
  } catch (error) {
    return NextResponse.json(
      { error: "Failed to fetch data" },
      { status: 500 }
    );
  }
}
\`\`\`

## User Management Functions Template

### 1. Role Assignment Template
\`\`\`typescript
export async function assignUserToRole(
  userId: string,
  roleName: string,
  microserviceCode: string,
  grantedBy: string
): Promise<void> {
  try {
    const microservice = await query<{ id: string }>(
      "SELECT id FROM microservice_apps WHERE app_code = @param0", 
      [microserviceCode]
    );

    if (microservice.length === 0) {
      throw new Error(`Microservice ${microserviceCode} not found`);
    }

    const microserviceId = microservice[0].id;

    // Assign role
    await query(`
      INSERT INTO user_roles (user_id, microservice_id, role_name, granted_by, granted_at, is_active)
      VALUES (@param0, @param1, @param2, @param3, GETDATE(), 1)
    `, [userId, microserviceId, roleName, grantedBy]);
  } catch (error) {
    console.error("Error assigning user to role:", error);
    throw error;
  }
}
\`\`\`

### 2. Permission Grant Template
\`\`\`typescript
export async function grantUserPermission(
  userId: string,
  permissionCode: string,
  microserviceCode: string,
  grantedBy: string,
  context?: { type: string; value: any },
  expiresAt?: Date
): Promise<void> {
  try {
    // Get permission ID
    const permission = await query<{ id: string }>(`
      SELECT p.id 
      FROM permissions p
      INNER JOIN microservice_apps ma ON p.microservice_id = ma.id
      WHERE ma.app_code = @param0 AND p.permission_code = @param1
    `, [microserviceCode, permissionCode]);

    if (permission.length === 0) {
      throw new Error(`Permission ${permissionCode} not found for microservice ${microserviceCode}`);
    }

    await query(`
      INSERT INTO user_permissions (user_id, permission_id, granted_by, granted_at, expires_at, is_active, context_type, context_value)
      VALUES (@param0, @param1, @param2, GETDATE(), @param3, 1, @param4, @param5)
    `, [
      userId, 
      permission[0].id, 
      grantedBy, 
      expiresAt, 
      context?.type, 
      context ? JSON.stringify(context.value) : null
    ]);
  } catch (error) {
    console.error("Error granting user permission:", error);
    throw error;
  }
}
\`\`\`

## Invitation System Template

### 1. Create Invitation Template
\`\`\`typescript
export async function createInvitation(
  email: string,
  invitedBy: string,
  expiresInDays: number = 7
): Promise<string> {
  const token = crypto.randomUUID();
  const expiresAt = new Date();
  expiresAt.setDate(expiresAt.getDate() + expiresInDays);

  await query(`
    INSERT INTO invited_users (email, invited_by, invitation_token, expires_at, is_active, created_at)
    VALUES (@param0, @param1, @param2, @param3, 1, GETDATE())
  `, [email, invitedBy, token, expiresAt]);

  return token;
}
\`\`\`

### 2. Validate Invitation Template
\`\`\`typescript
export async function validateInvitation(token: string): Promise<{ valid: boolean; email?: string }> {
  const invitation = await query(`
    SELECT email FROM invited_users 
    WHERE invitation_token = @param0 AND is_active = 1 AND expires_at > GETDATE()
  `, [token]);

  return {
    valid: invitation.length > 0,
    email: invitation[0]?.email
  };
}
\`\`\`

## Middleware Configuration (NO CLERK MIDDLEWARE)

\`\`\`typescript
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

// This middleware is completely passive and does nothing.
// NO CLERK MIDDLEWARE AT ALL.
// All authentication is handled at the component/API level.
export function middleware(request: NextRequest) {
  return NextResponse.next();
}

export const config = {
  matcher: [
    "/((?!api|_next/static|_next/image|favicon.ico).*)",
  ],
};
\`\`\`

## Environment Configuration Template

### Required Environment Variables
\`\`\`plaintext
# Clerk (Identity Only - NO AUTHORIZATION)
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_test_...
CLERK_SECRET_KEY=sk_test_...

# Database (Authorization System)
DATABASE_URL=Server=...
AZURE_CLIENT_ID=...
AZURE_CLIENT_SECRET=...
AZURE_TENANT_ID=...
AZURE_KEY_VAULT_NAME=...

# Application
NEXT_PUBLIC_APP_URL=https://your-app.com
