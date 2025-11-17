# Context Prompt for Next Chat Session

## Project Overview
You are continuing development on a **foster home visit application** built with Next.js, TypeScript, React, and SQL Server. The application uses Clerk.js for authentication and integrates with multiple databases (Bifrost, RHData, Radius/RadiusRHSA).

## Current State Summary

### Recent Major Changes (November 14, 2025)
1. **Staff Training Appointment Type**: New appointment type with dedicated summary form
2. **Training Summary Form**: Large textarea for documenting training sessions
3. **Travel Tracking for Training**: Full travel leg support for staff training appointments
4. **Conditional Form Display**: Training summary form shown instead of visit form for staff_training appointments

### Recent Major Changes (November 13, 2025)
1. **Enhanced Photo Capture**: Inline image previews, attachments tab, PDF generation from multiple images
2. **Database Schema Compatibility**: Graceful handling of missing columns, migration scripts provided
3. **Image Display Fixes**: Always include file_data for images, improved image viewing
4. **HEIC Format Support**: Proper handling of iPhone/iPad HEIC images

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
- ✅ Photo capture for inspection documents with inline previews
- ✅ Base64 file storage in database (`file_data` column)
- ✅ Multi-page PDF generation from multiple images
- ✅ Attachments tab in appointment detail page
- ✅ Image viewing in new windows
- ✅ Staff Training appointment type with summary form
- ✅ Training summary save/load functionality

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

#### File Attachment System
- **Storage Method**: Base64 data URLs stored in `file_data` column (nvarchar(max))
- **Why Base64**: Vercel serverless environment has read-only filesystem
- **File Path Column**: Stores reference identifier (`attachment:UUID`), not actual file path
- **File Size Limit**: 10MB per file
- **Attachment Types**: `fire_certificate`, `health_certificate`, `fire_extinguisher_tag`, `other`
- **Database Columns**: 
  - `file_data` (nvarchar(max)) - base64 image data (may not exist, code handles gracefully)
  - `is_deleted` (bit) - soft delete flag (may not exist, code handles gracefully)
  - `file_path` (nvarchar(500)) - reference identifier, not actual file path
- **API Endpoints**:
  - `POST /api/visit-forms/[id]/attachments` - Upload files (always includes file_data)
  - `GET /api/visit-forms/[id]/attachments` - List attachments (always includes file_data)
  - `DELETE /api/visit-forms/[id]/attachments/[attachmentId]` - Delete (handles missing columns)

## Important Files to Review

### Recent Changes (November 14, 2025)
- `components/appointments/staff-training-summary.tsx` - Training summary form component
- `app/api/appointments/[appointmentId]/training-summary/route.ts` - Training summary API endpoint
- `app/(protected)/appointment/[id]/page.tsx` - Conditional form display for staff training
- `components/appointments/create-appointment-dialog.tsx` - Added Staff Training option
- `scripts/add-staff-training-appointment-type.sql` - Database migration script

### Recent Changes (November 13, 2025)
- `components/forms/home-visit-form-enhanced.tsx` - Inline image previews, PDF generation
- `app/(protected)/appointment/[id]/page.tsx` - Attachments tab, image viewing
- `app/api/visit-forms/[id]/attachments/route.ts` - Always include file_data, handle missing columns
- `app/api/visit-forms/[id]/attachments/[attachmentId]/route.ts` - Graceful delete handling
- `scripts/add-file-data-to-attachments.sql` - Database migration script
- `docs/check-attachments-data.sql` - Database verification queries

### Recent Changes (November 11, 2025)
- `app/api/appointments/[appointmentId]/route.ts` - Fixed scoping, added travel leg flags
- `app/api/travel-legs/route.ts` - Continuum logging for drive_start
- `app/api/travel-legs/[legId]/route.ts` - Continuum logging for drive_end
- `app/(protected)/visit-form/page.tsx` - Removed debug badge, added Visit Completed handler
- `components/forms/home-visit-form-enhanced-sections.tsx` - Signature fixes, case manager section
- `app/api/visit-forms/send-report/route.ts` - Case manager signature in email

### Key Documentation
- `docs/daily-activity-summary-2025-11-14.md` - November 14 complete changelog
- `docs/daily-activity-summary-2025-11-13.md` - November 13 complete changelog
- `docs/daily-activity-summary-2025-11-11.md` - November 11 complete changelog
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

### File Attachment Handling
```typescript
// Always include file_data for images in GET response
attachments = await query(
  `SELECT attachment_id, file_name, file_path, file_size, mime_type,
   attachment_type, description, file_data, created_at, created_by_name
   FROM dbo.visit_form_attachments
   WHERE visit_form_id = @param0 AND (is_deleted = 0 OR is_deleted IS NULL)
   ORDER BY created_at DESC`,
  [formId]
)

// Handle missing columns gracefully
try {
  await query(`UPDATE ... SET is_deleted = 1, updated_at = GETUTCDATE() ...`)
} catch (error) {
  if (error.message.includes("Invalid column name")) {
    // Fallback to hard delete or alternative approach
  }
}
```

### Staff Training Summary Handling
```typescript
// GET training summary (uses completion_notes field)
const appointments = await query(
  `SELECT appointment_id, appointment_type, completion_notes
   FROM dbo.appointments
   WHERE appointment_id = @param0 AND is_deleted = 0`,
  [appointmentId]
)

// PUT training summary (saves to completion_notes field)
await query(
  `UPDATE dbo.appointments
   SET completion_notes = @param0,
       updated_at = GETUTCDATE(),
       updated_by_user_id = @param1
   WHERE appointment_id = @param2 AND is_deleted = 0`,
  [summary, userId, appointmentId]
)
```

### Image Viewing
```typescript
// Create new window with image HTML (more reliable than window.open(dataUrl))
onClick={() => {
  if (attachment.file_data) {
    const newWindow = window.open()
    if (newWindow) {
      newWindow.document.write(`<img src="${attachment.file_data}" style="max-width: 100%; height: auto;" />`)
    }
  }
}}
```

## Important Notes

1. **Clerk Status**: After initial authentication, Clerk is in "deaf/mute/blind" status - no Clerk hooks/APIs should be used
2. **Token-Based Auth**: Public routes (signatures) use token-based auth, NOT Clerk
3. **Travel Legs**: Do NOT rely on appointment context for user identification - use headers or token
4. **File Storage**: Files stored as base64 data URLs in `file_data` column (nvarchar(max)), NOT filesystem
5. **File Path Column**: `file_path` stores reference identifier (`attachment:UUID`), NOT actual file path
6. **Database Schema**: Code handles missing `file_data` and `is_deleted` columns gracefully - migration recommended but not required
7. **Image Display**: GET endpoint always includes `file_data` for images (needed for display)
8. **Image Viewing**: Use `window.open()` then `document.write()` for base64 data URLs (more reliable than direct open)
9. **Header Visibility**: Header always shows with fallback text when data not loaded
10. **Signature Sections**: Always visible (not conditional) - pre-populate from available data
11. **HEIC Images**: iOS browsers convert HEIC to JPEG automatically - code normalizes MIME types
12. **Staff Training Appointments**: Use `appointment_type = 'staff_training'` - shows training summary form instead of visit form
13. **Training Summary Storage**: Stored in `completion_notes` field of appointments table
14. **Travel Tracking for Training**: Travel leg buttons work for all appointment types including staff_training

## Next Development Priorities

1. **Image Optimization**: Automatic compression, thumbnail generation, progressive loading
2. **Bulk Operations**: Select multiple images for PDF, bulk delete, bulk download as ZIP
3. **Image Editing**: Crop/rotate before upload, annotation tools, enhancement filters
4. **Storage Optimization**: CDN for large images, cleanup for old attachments, archive to cold storage
5. **Enhanced PDF Features**: Custom templates, text annotations, combine multiple attachment types
6. **Automatic Signature Link Generation**: Generate case manager signature link automatically in email
7. **Travel Leg History Enhancement**: Show detailed travel leg info in history tab
8. **Form Data Pre-loading**: Pre-load form data to prevent empty header
9. **Performance Optimization**: Optimize API calls and data loading
10. **Training Summary Enhancements**: Add templates, attachments, or structured fields for training summaries

## Testing Considerations

- Test photo capture and inline previews on iPad/iPhone
- Verify images display correctly in attachments tab
- Test PDF generation from multiple images
- Test image deletion (both inline and in attachments tab)
- Test image viewing in new windows
- Verify database migration script works correctly
- Test with missing database columns (graceful degradation)
- Test travel leg system on mobile devices
- Verify signature pre-population in all scenarios
- Test Visit Completed button from both entry points
- Verify header visibility and fallback text
- Test case manager signature link generation
- Test creating Staff Training appointments
- Verify training summary form appears for staff_training appointments
- Test saving and loading training summaries
- Verify travel leg buttons work for staff training appointments
- Test multiple travel legs between locations for training appointments

## Database Migration Status

### Required Migrations

#### 1. File Attachments (Recommended)
Run `scripts/add-file-data-to-attachments.sql` on Bifrost database to add:
- `file_data` column (nvarchar(max)) - for base64 image storage
- `is_deleted` column (bit, default 0) - for soft deletes

**Note**: Code works without migration (handles missing columns gracefully), but migration is recommended for full functionality.

#### 2. Staff Training Appointment Type (Required)
Run `scripts/add-staff-training-appointment-type.sql` on Bifrost database to:
- Update `CK_appointments_type` constraint to include `staff_training` as valid appointment type

**Note**: This migration is required to create Staff Training appointments. The script is safe to run multiple times.

### Verification
- After file attachments migration, run queries from `docs/check-attachments-data.sql` to verify columns exist and data is stored correctly.
- After staff training migration, verify constraint allows `staff_training` type:
  ```sql
  SELECT * FROM sys.check_constraints WHERE name = 'CK_appointments_type'
  ```

---

**Last Updated**: November 14, 2025
**Version**: 3.6
**Branch**: cursor-development

