# Bulk Recurring Appointments

This feature allows you to create multiple appointments for an entire year based on a recurring pattern (e.g., "First Monday of every month at 4pm"). All appointments are created as **unassigned** and can be assigned to staff members later.

## Features

- ✅ Create appointments for an entire year (or multiple years) at once
- ✅ Support for recurring patterns: first/second/third/fourth/last day of week per month
- ✅ All appointments created as "unassigned" (no staff member assigned)
- ✅ Can be assigned to staff members later through the normal appointment editing flow
- ✅ UI component available on the Visits Calendar page

## How to Use

### Via UI (Recommended)

1. Navigate to **Visits Calendar** page
2. Click the **"Create Recurring Appointments"** button (next to "Schedule Appointment")
3. Fill in the form:
   - **Title**: e.g., "Monthly Home Visit"
   - **Foster Home**: Select the home (optional - can be unassigned)
   - **Recurring Pattern**: Choose from dropdown (e.g., "First Monday", "Second Tuesday", "Last Friday")
   - **Time**: Set the time (e.g., 16:00 for 4pm)
   - **Start Year**: e.g., 2026
   - **End Year**: e.g., 2026 (defaults to start year)
   - **Duration**: Default 60 minutes
   - Other optional fields (description, location, notes, etc.)
4. Click **"Create Recurring Appointments"**
5. The system will create all appointments for the year matching the pattern

### Via API

**Endpoint**: `POST /api/appointments/bulk-recurring`

**Request Body**:
```json
{
  "title": "Monthly Home Visit",
  "description": "Regular monthly home visit",
  "appointmentType": "home_visit",
  "homeXref": 2509,
  "locationAddress": "123 Main St, City, State 12345",
  "locationNotes": "Optional location notes",
  "assignedToUserId": null,  // null for unassigned
  "assignedToName": null,    // null for unassigned
  "assignedToRole": null,
  "priority": "normal",
  "preparationNotes": "Optional preparation notes",
  "createdByName": "Executive Director",
  "recurringPattern": "first_monday",  // first_monday, second_tuesday, last_friday, etc.
  "startYear": 2026,
  "endYear": 2026,
  "time": "16:00",  // HH:mm format (4pm)
  "durationMinutes": 60
}
```

**Response**:
```json
{
  "success": true,
  "created": 12,
  "total": 12,
  "appointmentIds": ["uuid1", "uuid2", ...],
  "message": "Created 12 recurring appointments"
}
```

## Recurring Patterns

Supported patterns:
- `first_monday`, `first_tuesday`, `first_wednesday`, `first_thursday`, `first_friday`
- `second_monday`, `second_tuesday`, `second_wednesday`, `second_thursday`, `second_friday`
- `third_monday`, `third_tuesday`, `third_wednesday`, `third_thursday`, `third_friday`
- `fourth_monday`, `fourth_tuesday`, `fourth_wednesday`, `fourth_thursday`, `fourth_friday`
- `last_monday`, `last_tuesday`, `last_wednesday`, `last_thursday`, `last_friday`

## Examples

### Example 1: First Monday of every month at 4pm for 2026
```json
{
  "title": "Monthly Home Visit - Bradley Home",
  "homeXref": 2509,
  "recurringPattern": "first_monday",
  "startYear": 2026,
  "endYear": 2026,
  "time": "16:00",
  "durationMinutes": 60
}
```
This will create 12 appointments (one for each month in 2026).

### Example 2: Second Tuesday of every month at 2pm for 2026-2027
```json
{
  "title": "Bi-weekly Home Visit",
  "recurringPattern": "second_tuesday",
  "startYear": 2026,
  "endYear": 2027,
  "time": "14:00",
  "durationMinutes": 90
}
```
This will create 24 appointments (12 for 2026 + 12 for 2027).

## Unassigned Appointments

All appointments created via this feature are **unassigned** by default:
- `assignedToUserId`: `null`
- `assignedToName`: `null`
- `assignedToRole`: `null`
- `status`: `"scheduled"`

You can assign these appointments to staff members later by:
1. Opening the appointment from the calendar
2. Using the "Edit Appointment" dialog
3. Selecting a staff member from the "Assigned To" dropdown

## Technical Details

### Database Schema
- Appointments are stored in the `appointments` table
- `is_recurring` is set to `1` (true)
- `recurring_pattern` stores the pattern string (e.g., "first_monday")
- Each appointment is a separate record (not a single recurring record)

### Date Calculation
The system calculates dates by:
1. Iterating through each month in the specified year range
2. Finding the matching day of week based on the pattern (first/second/third/fourth/last)
3. Creating an appointment record for each matching date

### Error Handling
- If a date cannot be calculated for a month (e.g., "fifth Monday" doesn't exist), that month is skipped
- Individual appointment creation errors are logged but don't stop the batch process
- The response includes both successful and failed appointment counts

## Notes

- ⚠️ **Important**: This creates individual appointment records, not a single recurring appointment. Each appointment can be edited, cancelled, or completed independently.
- ⚠️ **Performance**: Creating appointments for multiple years may take a few seconds. The UI will show a loading state.
- ✅ **Idempotency**: You can safely run the same pattern multiple times - it will create duplicate appointments (which you can then delete if needed).

