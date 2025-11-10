# Continuum Logging System

## Overview

The Continuum Logging System tracks multi-dimensional activity logs for home visits and related activities. It implements the continuum concept by tracking activities across five dimensions:

- **Temporal** (When): Timestamps, durations, state transitions
- **Relational** (Who): Staff, homes, children, household members
- **Functional** (What): Activity types, descriptions, outcomes
- **Contextual** (Where): Locations, addresses, GPS coordinates
- **Outcome** (Why): Results, impacts, triggered actions

## Database Schema

The `continuum_entries` table stores all activity logs. See `scripts/create-continuum-entries-table.sql` for the full schema.

### Key Fields

- `appointment_id`: Links to the appointment (can be NULL for non-appointment activities)
- `activity_type`: Type of activity (e.g., 'drive_start', 'drive_end', 'visit_start', 'visit_end')
- `activity_status`: Current status ('active', 'complete', 'cancelled')
- `timestamp`: When the activity occurred
- `duration_minutes`: Calculated duration if applicable
- `staff_user_id` / `staff_name`: Staff member conducting activity
- `home_guid` / `home_xref` / `home_name`: Home entity
- `entity_guids`: JSON array of related entity GUIDs (children, household members, etc.)
- `metadata`: JSON object for additional activity-specific data
- `location_latitude` / `location_longitude` / `location_address`: Location information
- `triggered_by_entry_id`: Links to entry that triggered this one (for trigger-response chains)

## API Endpoints

### POST `/api/continuum/entries`
Log a new activity entry.

**Request Body:**
```json
{
  "appointmentId": "uuid",
  "activityType": "visit_start",
  "activityStatus": "active",
  "timestamp": "2025-01-15T10:30:00Z",
  "staffUserId": "user_123",
  "staffName": "John Doe",
  "homeGuid": "home-uuid",
  "homeName": "Smith Family Home",
  "entityGuids": ["child-uuid-1", "child-uuid-2"],
  "locationAddress": "123 Main St, City, State",
  "activityDescription": "Visit started"
}
```

### GET `/api/continuum/entries`
Fetch entries with optional filtering.

**Query Parameters:**
- `appointmentId`: Filter by appointment
- `homeGuid`: Filter by home
- `staffUserId`: Filter by staff member
- `activityType`: Filter by activity type
- `limit`: Maximum number of results (default: 100)

### DELETE `/api/continuum/entries/[entryId]`
Soft delete a continuum entry.

## Usage Examples

### Using the Logger Utility

```typescript
import { logDriveStart, logVisitStart, logVisitEnd } from '@/lib/continuum-logger'

// Log drive start (tied to appointment, not yet relevant to home)
await logDriveStart({
  appointmentId: appointment.appointment_id,
  staffUserId: user.id,
  staffName: `${user.firstName} ${user.lastName}`,
  locationAddress: 'Office Address',
  locationLatitude: 32.7767,
  locationLongitude: -96.7970,
})

// Log visit start (directly relevant to home, individuals, children, staff)
await logVisitStart({
  appointmentId: appointment.appointment_id,
  staffUserId: user.id,
  staffName: `${user.firstName} ${user.lastName}`,
  homeGuid: home.guid,
  homeXref: home.xref,
  homeName: home.name,
  entityGuids: [
    ...childrenInPlacement.map(c => c.guid),
    ...householdMembers.map(m => m.guid),
  ],
  locationAddress: home.address,
  locationLatitude: home.latitude,
  locationLongitude: home.longitude,
})

// Log visit end
await logVisitEnd({
  appointmentId: appointment.appointment_id,
  staffUserId: user.id,
  staffName: `${user.firstName} ${user.lastName}`,
  homeGuid: home.guid,
  homeName: home.name,
  durationMinutes: 45,
  outcome: 'Visit completed successfully',
  contextNotes: 'Discussed placement changes and reviewed compliance items',
})
```

### Direct API Usage

```typescript
const response = await fetch('/api/continuum/entries', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    appointmentId: appointmentId,
    activityType: 'visit_start',
    timestamp: new Date().toISOString(),
    staffName: 'John Doe',
    homeGuid: homeGuid,
    homeName: 'Smith Family Home',
  }),
})
```

## Activity Types

### Visit-Related Activities

- **`drive_start`**: Staff member starts driving to the home
  - Tied to appointment, not directly relevant to home until visit starts
  - Should include starting location (office, previous home, etc.)

- **`drive_end`**: Staff member arrives at destination
  - If going to another home, include `nextAppointmentId` in metadata
  - Duration can be calculated from `drive_start` timestamp

- **`visit_start`**: Visit begins at the home
  - Directly relevant to: home, individuals in home, children in placement, staff
  - Should include all related entity GUIDs
  - Marks transition from "driving" to "visiting"

- **`visit_end`**: Visit concludes
  - Should include outcome and any relevant notes
  - Duration can be calculated from `visit_start` timestamp

## Drive Time Calculation

Drive time is calculated as the duration between `drive_start` and `drive_end` entries.

**Exception**: If `drive_end` has `nextAppointmentId` in metadata, the drive time becomes part of the next visit's continuum rather than the current home's.

## Entity Tracking

When logging `visit_start`, include all relevant entity GUIDs in the `entityGuids` array:

- Children in placement at the home
- Household members (providers, biological children, other members)
- Staff member conducting the visit

This enables tracking how activities affect multiple continuums simultaneously.

## Deletion

When an appointment is deleted:
- All related continuum entries are automatically soft-deleted (`is_deleted = 1`)
- This is handled in the appointment DELETE endpoint
- Entries remain in the database for historical reference but are filtered from queries

## History Tab

The History tab in the appointment detail page displays all continuum entries for that appointment, showing:

- Activity type with color-coded badges
- Timestamp and relative time
- Duration (if applicable)
- Staff member and home information
- Location details
- Activity descriptions and notes
- Outcomes

Entries are displayed in reverse chronological order (newest first).

## Future Enhancements

- Trigger-response chains: Link entries that trigger other entries
- Pattern recognition: Identify common activity patterns
- Predictive capabilities: Suggest next required activities
- Multi-continuum views: See how activities affect multiple entities
- Document frame integration: Link activities to document requirements

