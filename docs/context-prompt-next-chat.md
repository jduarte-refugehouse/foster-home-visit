# Context Prompt for Next Chat Session

## Project Overview
You are continuing development on a **foster home visit application** built with Next.js, TypeScript, React, and SQL Server. The application uses Clerk.js for authentication and integrates with multiple databases (Bifrost, RHData, Radius/RadiusRHSA).

## Current State Summary

### Recent Major Changes (November 11, 2025)
1. **Travel Leg System**: Fully integrated leg-based travel tracking system with continuum logging
2. **Signature System**: Home liaison and case manager signatures with remote signature links
3. **Form UI Improvements**: Header always visible, debug badge removed, button color coding
4. **API Fixes**: Resolved appointment API scoping errors, fixed travel leg mileage display

### Key Features Currently Working
- ✅ Travel leg creation and completion with location capture
- ✅ Continuum logging (`drive_start`, `drive_end`, `visit_start`, `visit_end`)
- ✅ Remote signature collection via tokenized links (email/SMS)
- ✅ Case manager signature section in form
- ✅ Visit Completed button functionality
- ✅ Photo capture for inspection documents
- ✅ Base64 file storage in database

### Known Architecture Patterns

#### Authentication
- **Clerk Authentication**: Used for initial login, then "deaf/mute/blind" status
- **Token-Based Authentication**: For public routes (signatures) - does NOT use Clerk
- **Session Cookie Authentication**: For mobile APIs after initial Clerk login
- **Header-Based Auth**: Travel APIs use `x-user-clerk-id`, `x-user-email`, `x-user-name` headers

#### Database Architecture
- **Bifrost**: Current/active data (appointments, visit forms, travel legs, continuum entries)
- **RHData**: Historical/reference data
- **Radius/RadiusRHSA**: Internal, VM-based SQL Server (HIPAA compliant)
- **Connection**: Direct via Vercel Static IPs (no proxy)

#### Travel Tracking
- **Leg-Based System**: `travel_legs` table for flexible mileage tracking
- **Continuum Integration**: Logs `drive_start`/`drive_end` when legs tied to appointments
- **Button States**: Check both `has_in_progress_leg`/`has_completed_leg` flags AND legacy fields
- **Colors**: Start = green, Arrived/Stop = red

#### Signature System
- **Home Liaison**: Always visible, pre-populated from appointment data
- **Foster Parents**: Pre-populated from `formData.household?.providers`
- **Case Manager**: Appears when name available, includes signature link button
- **Remote Signatures**: Tokenized links via `/api/visit-forms/[id]/signature-tokens`
- **Public Route**: `/signature/[token]` - no authentication required

## Important Files to Review

### Recent Changes
- `app/api/appointments/[appointmentId]/route.ts` - Fixed scoping, added travel leg flags
- `app/api/travel-legs/route.ts` - Continuum logging for drive_start
- `app/api/travel-legs/[legId]/route.ts` - Continuum logging for drive_end
- `app/(protected)/visit-form/page.tsx` - Removed debug badge, added Visit Completed handler
- `components/forms/home-visit-form-enhanced-sections.tsx` - Signature fixes, case manager section
- `app/api/visit-forms/send-report/route.ts` - Case manager signature in email

### Key Documentation
- `docs/daily-activity-summary-2025-11-11.md` - Today's complete changelog
- `docs/travel-tracking-architecture.md` - Travel leg system documentation
- `docs/enhanced-home-visit-form.md` - Form structure and features (Version 3.4)
- `docs/database-architecture.md` - Multi-database architecture
- `docs/continuum-logging.md` - Activity logging system

## Current Branch
- **Active Branch**: `cursor-development`
- **Status**: All changes committed and pushed

## Common Patterns to Follow

### API Route Authentication
```typescript
import { getClerkUserIdFromRequest } from "@/lib/clerk-auth-helper"

export async function POST(request: NextRequest) {
  const authInfo = getClerkUserIdFromRequest(request)
  if (!authInfo.clerkUserId) {
    return NextResponse.json({ error: "Authentication required" }, { status: 401 })
  }
  // Use authInfo.clerkUserId for user identification
}
```

### Travel Leg Continuum Logging
```typescript
// When creating leg with appointment
if (appointment_id_to) {
  await logDriveStart({ appointmentId: appointment_id_to, ... })
}

// When completing leg with appointment
if (appointment_id_to) {
  await logDriveEnd({ appointmentId: appointment_id_to, ... })
}
```

### Signature Pre-population
```typescript
// Handle both wrapped and direct appointment structures
const appointment = appointmentData?.appointment || appointmentData
const staffName = appointment?.assigned_to_name || formData.visitInfo?.conductedBy || ""
```

### Button State Checking
```typescript
// Check both new system (flags) and old system (fields)
const showStartDrive = 
  appointment.status === "scheduled" && 
  appointment.arrived_timestamp && 
  !appointment.has_in_progress_leg &&
  !appointment.has_completed_leg
```

## Important Notes

1. **Clerk Status**: After initial authentication, Clerk is in "deaf/mute/blind" status - no Clerk hooks/APIs should be used
2. **Token-Based Auth**: Public routes (signatures) use token-based auth, NOT Clerk
3. **Travel Legs**: Do NOT rely on appointment context for user identification - use headers or token
4. **File Storage**: Files stored as base64 data URLs in `file_data` column (not filesystem)
5. **Header Visibility**: Header always shows with fallback text when data not loaded
6. **Signature Sections**: Always visible (not conditional) - pre-populate from available data

## Next Development Priorities

1. **Automatic Signature Link Generation**: Generate case manager signature link automatically in email
2. **Travel Leg History Enhancement**: Show detailed travel leg info in history tab
3. **Form Data Pre-loading**: Pre-load form data to prevent empty header
4. **Performance Optimization**: Optimize API calls and data loading

## Testing Considerations

- Test travel leg system on mobile devices
- Verify signature pre-population in all scenarios
- Test Visit Completed button from both entry points
- Verify header visibility and fallback text
- Test case manager signature link generation

---

**Last Updated**: November 11, 2025
**Version**: 3.4
**Branch**: cursor-development

