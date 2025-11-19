# Shared-Core Package Reference

Complete reference for the `@refugehouse/shared-core` package, containing all foundational utilities used across microservices.

## Package Structure

```
packages/shared-core/
├── lib/                    # Core utilities and helpers
├── components/             # Reusable React components
├── hooks/                  # Custom React hooks
├── app/                    # Reference API routes (not built)
└── package.json           # Package configuration
```

## Import Aliases

All modules are available via TypeScript path aliases:

```typescript
import { ... } from '@refugehouse/shared-core/{module}'
```

## Core Modules

### Database (`@refugehouse/shared-core/db`)

Database connection and query utilities.

```typescript
import { query, getConnection, getConnectionPool } from '@refugehouse/shared-core/db'

// Execute a query
const result = await query('SELECT * FROM app_users WHERE email = @email', {
  email: 'user@example.com'
})

// Get connection for complex operations
const connection = await getConnection()
const request = connection.request()
const result = await request.input('param0', value).query('SELECT ...')
```

**Exports:**
- `query(sql, params?)` - Execute parameterized SQL query
- `getConnection()` - Get database connection
- `getConnectionPool()` - Get connection pool

### Authentication (`@refugehouse/shared-core/auth`)

Clerk authentication helpers.

```typescript
import { getAuth, getCurrentUser, getClerkUserIdFromRequest, isClerkEnabled } from '@refugehouse/shared-core/auth'

// In API routes
const { userId, email } = await getAuth(request)

// Get current user object
const user = await getCurrentUser(request)

// Check if Clerk is enabled
if (isClerkEnabled()) {
  // Clerk-specific logic
}
```

**Exports:**
- `getAuth(request)` - Get authenticated user info from request
- `getCurrentUser(request)` - Get full user object
- `getClerkUserIdFromRequest(request)` - Get Clerk user ID
- `isClerkEnabled()` - Check if Clerk is configured

### Permissions (`@refugehouse/shared-core/permissions`)

Permission checking middleware and utilities.

```typescript
import { checkPermission, checkRole, isSystemAdmin } from '@refugehouse/shared-core/permissions'

// Check permission
const hasPermission = await checkPermission(userId, 'plan.create')

// Check role
const hasRole = await checkRole(userId, 'case_manager')

// Check if system admin
if (isSystemAdmin(email)) {
  // System admin logic
}
```

**Exports:**
- `checkPermission(userId, permissionCode)` - Check if user has permission
- `checkRole(userId, roleName)` - Check if user has role
- `isSystemAdmin(email)` - Check if email is system admin

### User Management (`@refugehouse/shared-core/user-management`)

User, role, and permission management.

```typescript
import {
  getUserRolesForMicroservice,
  getUserPermissionsForMicroservice,
  getEffectiveUser,
  determineCoreRole
} from '@refugehouse/shared-core/user-management'

// Get user roles for microservice
const roles = await getUserRolesForMicroservice(userId, 'service-plan')

// Get user permissions
const permissions = await getUserPermissionsForMicroservice(userId, 'service-plan')

// Get effective user (handles impersonation)
const user = await getEffectiveUser(clerkUserId, request)
```

**Exports:**
- `getUserRolesForMicroservice(userId, microserviceCode)`
- `getUserPermissionsForMicroservice(userId, microserviceCode)`
- `getEffectiveUser(clerkUserId, request?)`
- `determineCoreRole(email)`

### System Admin (`@refugehouse/shared-core/system-admin`)

System administrator checking.

```typescript
import { isSystemAdmin, getSystemAdminEmails } from '@refugehouse/shared-core/system-admin'

if (isSystemAdmin(email)) {
  // System admin access
}

const adminEmails = getSystemAdminEmails()
```

**Exports:**
- `isSystemAdmin(email)` - Check if email is system admin
- `getSystemAdminEmails()` - Get list of system admin emails

### Communication

#### SMS (`@refugehouse/shared-core/sms`)

SMS sending via Twilio.

```typescript
import { sendSMS } from '@refugehouse/shared-core/sms'

await sendSMS({
  to: '+1234567890',
  message: 'Your appointment is confirmed',
  userId: userId,
  communicationType: 'appointment_confirmation'
})
```

**Exports:**
- `sendSMS(options)` - Send SMS with logging

#### Email (`@refugehouse/shared-core/email`)

Email sending via SendGrid.

```typescript
import { sendEmail } from '@refugehouse/shared-core/email'

await sendEmail({
  to: 'user@example.com',
  subject: 'Welcome',
  html: '<h1>Welcome!</h1>',
  userId: userId,
  communicationType: 'welcome_email'
})
```

**Exports:**
- `sendEmail(options)` - Send email with logging

### Communication Logging (`@refugehouse/shared-core/communication`)

Log communication events.

```typescript
import {
  logCommunication,
  updateCommunicationStatus,
  getMicroserviceId
} from '@refugehouse/shared-core/communication'

// Log communication
await logCommunication({
  userId: userId,
  communicationType: 'sms',
  recipient: '+1234567890',
  content: 'Message text',
  status: 'sent'
})

// Update status
await updateCommunicationStatus(communicationId, 'delivered')
```

**Exports:**
- `logCommunication(options)` - Log communication event
- `updateCommunicationStatus(id, status)` - Update communication status
- `getMicroserviceId(microserviceCode)` - Get microservice ID from code

### Continuum Logging (`@refugehouse/shared-core/continuum`)

Log events to Continuum system.

```typescript
import {
  logDriveStart,
  logDriveEnd,
  logVisitStart,
  logVisitEnd
} from '@refugehouse/shared-core/continuum'

await logDriveStart({
  appointmentId: '...',
  staffUserId: '...',
  staffName: 'John Doe',
  locationLatitude: 30.123,
  locationLongitude: -97.456,
  createdByUserId: '...'
})
```

**Exports:**
- `logDriveStart(options)`
- `logDriveEnd(options)`
- `logVisitStart(options)`
- `logVisitEnd(options)`

### AI & Speech

#### Anthropic (`@refugehouse/shared-core/anthropic`)

Anthropic Claude API integration.

```typescript
import { callAnthropicAPI } from '@refugehouse/shared-core/anthropic'

const response = await callAnthropicAPI({
  messages: [{ role: 'user', content: 'Hello' }],
  model: 'claude-3-opus-20240229'
})
```

**Exports:**
- `callAnthropicAPI(options)` - Call Anthropic API

#### Deepgram (`@refugehouse/shared-core/deepgram`)

Deepgram real-time speech-to-text.

```typescript
import { createDeepgramConnection } from '@refugehouse/shared-core/deepgram'

const connection = await createDeepgramConnection({
  onTranscript: (text) => console.log(text),
  onError: (error) => console.error(error)
})
```

**Exports:**
- `createDeepgramConnection(options)` - Create Deepgram connection

#### Google Speech (`@refugehouse/shared-core/google-speech`)

Google Cloud Speech-to-Text API.

```typescript
import {
  transcribeWithGoogleSpeech,
  isGoogleSpeechAvailable
} from '@refugehouse/shared-core/google-speech'

if (isGoogleSpeechAvailable()) {
  const transcript = await transcribeWithGoogleSpeech(audioData, {
    encoding: 'WEBM_OPUS',
    sampleRateHertz: 48000
  })
}
```

**Exports:**
- `transcribeWithGoogleSpeech(audioData, options)`
- `isGoogleSpeechAvailable()` - Check if API key is configured

#### Speech Utils (`@refugehouse/shared-core/speech-utils`)

Speech recognition utilities.

```typescript
import {
  accumulateTranscript,
  addPunctuation,
  formatTranscript
} from '@refugehouse/shared-core/speech-utils'

const formatted = formatTranscript(rawTranscript)
```

**Exports:**
- `accumulateTranscript(transcript, accumulator)`
- `addPunctuation(text)`
- `formatTranscript(text)`

### Utilities

#### Utils (`@refugehouse/shared-core/utils`)

Tailwind CSS class name utility.

```typescript
import { cn } from '@refugehouse/shared-core/utils'

<div className={cn('base-class', condition && 'conditional-class')} />
```

**Exports:**
- `cn(...inputs)` - Merge Tailwind classes

#### Route Calculator (`@refugehouse/shared-core/route-calculator`)

Google Maps route calculation.

```typescript
import { calculateDrivingDistance } from '@refugehouse/shared-core/route-calculator'

const result = await calculateDrivingDistance(
  startLat, startLng,
  endLat, endLng
)
// Returns: { distance: number, estimatedTollCost: number | null }
```

**Exports:**
- `calculateDrivingDistance(startLat, startLng, endLat, endLng)`

#### ICS Generator (`@refugehouse/shared-core/ics-generator`)

iCalendar file generation.

```typescript
import {
  generateICSEvent,
  generateICSFile,
  generateOnCallICS
} from '@refugehouse/shared-core/ics-generator'

const icsContent = generateICSEvent({
  start: new Date(),
  end: new Date(),
  summary: 'Meeting',
  description: 'Description',
  location: 'Location'
})
```

**Exports:**
- `generateICSEvent(event)`
- `generateICSFile(events)`
- `generateOnCallICS(schedules, assigneeName, onCallType)`

#### Geolocation (`@refugehouse/shared-core/geolocation`)

GPS location capture.

```typescript
import {
  captureLocation,
  isGeolocationSupported,
  requestLocationPermission
} from '@refugehouse/shared-core/geolocation'

try {
  const location = await captureLocation('start_drive')
  // Returns: { latitude: number, longitude: number, accuracy?: number }
} catch (error) {
  // Handle error (permission denied, timeout, etc.)
}
```

**Exports:**
- `captureLocation(action?)` - Capture current GPS location
- `isGeolocationSupported()` - Check if geolocation is available
- `requestLocationPermission()` - Request location permission

#### Environment (`@refugehouse/shared-core/environment`)

Environment detection utilities.

```typescript
import { isV0Preview, isDevelopment, isProduction } from '@refugehouse/shared-core/environment'

if (isV0Preview()) {
  // V0 preview environment
}
```

**Exports:**
- `isV0Preview()` - Check if running in V0 preview
- `isDevelopment()` - Check if development mode
- `isProduction()` - Check if production mode

## Components

### Access Guard (`@refugehouse/shared-core/components/access-guard`)

Protect routes with authentication and permission checks.

```typescript
import { AccessGuard } from '@refugehouse/shared-core/components/access-guard'

export default function ProtectedPage() {
  return (
    <AccessGuard>
      <div>Protected content</div>
    </AccessGuard>
  )
}
```

### UI Components (`@refugehouse/shared-core/components/ui/*`)

All shadcn/ui components are available:

```typescript
import { Button } from '@refugehouse/shared-core/components/ui/button'
import { Card } from '@refugehouse/shared-core/components/ui/card'
import { Dialog } from '@refugehouse/shared-core/components/ui/dialog'
// ... etc
```

**Available Components:**
- `button`, `card`, `dialog`, `input`, `textarea`, `select`
- `table`, `badge`, `alert`, `toast`, `tabs`
- `calendar`, `date-range-picker`, `sidebar`
- `voice-input-button`, `voice-input-modal`, `textarea-with-voice`
- ... and more

## Hooks

### usePermissions (`@refugehouse/shared-core/hooks/use-permissions`)

Check permissions in React components.

```typescript
import { usePermissions } from '@refugehouse/shared-core/hooks/use-permissions'

export function MyComponent() {
  const { hasPermission, hasRole, permissions, roles } = usePermissions()
  
  if (hasPermission('plan.create')) {
    return <Button>Create Plan</Button>
  }
}
```

**Returns:**
- `hasPermission(code)` - Check if user has permission
- `hasRole(name)` - Check if user has role
- `permissions` - Array of permission codes
- `roles` - Array of role names

### useSafeUser (`@refugehouse/shared-core/hooks/use-safe-user`)

Safely get user information.

```typescript
import { useSafeUser } from '@refugehouse/shared-core/hooks/use-safe-user'

export function MyComponent() {
  const { user, isLoading, error } = useSafeUser()
  
  if (isLoading) return <div>Loading...</div>
  if (error) return <div>Error: {error}</div>
  
  return <div>Hello, {user?.email}</div>
}
```

**Returns:**
- `user` - User object or null
- `isLoading` - Loading state
- `error` - Error message or null

## Reference API Routes

Reference copies of API routes are in `packages/shared-core/app/api/`:

- `app/api/auth/check-access/route.ts` - Check user access
- `app/api/access-requests/route.ts` - Handle access requests
- `app/api/navigation/route.ts` - Load navigation from database

**Note:** These are reference copies. Actual routes must be in `app/api/` for Next.js routing.

## Type Definitions

All TypeScript types are exported from the main index:

```typescript
import type {
  AppUser,
  MicroserviceApp,
  UserRole,
  Permission,
  UserPermission
} from '@refugehouse/shared-core'
```

## Best Practices

1. **Always use shared-core imports** - Don't import from `@/lib/` for shared utilities
2. **Check permissions** - Always verify permissions in API routes
3. **Use AccessGuard** - Protect pages with AccessGuard component
4. **Log communications** - Use communication logging for SMS/email
5. **Handle errors** - All async functions should handle errors gracefully

## Migration Notes

If you're migrating existing code:

1. Replace `@/lib/` imports with `@refugehouse/shared-core/*`
2. Update component imports to use shared-core paths
3. Test thoroughly after migration
4. Remove old files from `lib/` after migration is complete

