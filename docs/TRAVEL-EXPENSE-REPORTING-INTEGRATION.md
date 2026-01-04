# Travel Expense Reporting Integration

## Overview

This document describes how travel data flows from operational tracking (`travel_legs`) to expense reporting (`Trips`) with proper cost center allocation.

## Architecture

### Two-Tier System

1. **`travel_legs` Table** (Operational Tracking)
   - Detailed GPS-based tracking of individual travel segments
   - Real-time tracking with start/end locations
   - Supports journey grouping via `journey_id`
   - Used for operational purposes (appointment tracking, route optimization)

2. **`Trips` Table** (Expense Reporting)
   - Aggregated trip records for case manager expense reports
   - Automatically created/updated when journeys complete
   - Includes cost center allocation (DAL/SAN)
   - Links to ContinuumMarks for visit tracking
   - Single source of truth for expense reporting

## Automatic Synchronization

### When a Journey Completes

When the final leg of a journey is completed:

1. **Check Journey Status**: Verify all legs in the journey are completed
2. **Aggregate Legs**: Sum mileage, tolls, and duration across all legs
3. **Get Staff Identity**: Resolve staff user to get:
   - Clerk ID
   - Radius GUID
   - Email and name
   - **Cost Center Unit** (DAL or SAN) - **Critical for cost allocation**
4. **Link to ContinuumMark**: Find related visit mark if journey is tied to an appointment
5. **Create/Update Trips Record**: 
   - Create new record if none exists
   - Update existing record if one exists (prevents duplicates)

### Cost Center Allocation

The system automatically determines cost center allocation:

```sql
CASE WHEN sru.DAL_personID IS NOT NULL THEN 'DAL' ELSE 'SAN' END as unit
```

This is based on the staff member's assignment in `SyncRadiusUsers`:
- If `DAL_personID` exists → Cost Center = **DAL**
- Otherwise → Cost Center = **SAN**

Default fallback: **DAL** (if staff identity cannot be resolved)

## Data Flow

```
travel_legs (operational)
    ↓
Journey Completion Check
    ↓
Aggregate All Legs
    ↓
Resolve Staff Identity → Get Cost Center (DAL/SAN)
    ↓
Link to ContinuumMark (if applicable)
    ↓
Trips (expense reporting)
    ↓
Case Manager Expense Reports
```

## Key Features

### 1. Automatic Aggregation
- Sums mileage from all legs (uses `calculated_mileage` or `manual_mileage`)
- Sums toll costs
- Calculates total duration
- Determines origin (first leg start) and destination (last leg end)

### 2. Duplicate Prevention
- Checks for existing Trips record before creating
- Updates existing record if found (based on staff, date, and purpose)
- Prevents duplicate expense entries

### 3. Cost Allocation
- Automatically assigns to correct cost center (DAL/SAN)
- Based on staff's unit assignment in Radius
- Critical for accurate financial reporting

### 4. Visit Linking
- Attempts to link Trips to ContinuumMark when journey is tied to an appointment
- Enables correlation between visits and travel expenses

## API Endpoint

**POST** `/api/radius/travel-legs/[legId]` (PATCH method)

When completing a travel leg, if it's the final leg of a journey:
- Automatically creates/updates `Trips` record
- Returns `trip_id` in response if created/updated

## Response Format

```json
{
  "success": true,
  "message": "Travel leg completed",
  "calculated_mileage": 15.5,
  "estimated_toll_cost": 2.50,
  "duration_minutes": 25,
  "trip_id": "uuid-if-created",
  "timestamp": "2026-01-03T16:30:00Z",
  "duration_ms": 150
}
```

## Database Schema

### Trips Table (Expense Reporting)

Key fields for expense reporting:
- `TripDate` - Date of travel
- `StaffClerkId` - Staff identifier
- `StaffRadiusGuid` - Links to Radius staff record
- `CostCenterUnit` - **DAL or SAN** (for cost allocation)
- `MilesActual` - Total mileage for expense calculation
- `ActualTollCost` - Total toll costs
- `IsReimbursable` - Whether eligible for reimbursement
- `ReimbursementStatus` - pending/approved/paid
- `RelatedMarkID` - Links to ContinuumMark (visit)

## Benefits

1. **Single Source of Truth**: `Trips` table is the authoritative source for expense reporting
2. **No Reconciliation Needed**: Automatic sync prevents data discrepancies
3. **Proper Cost Allocation**: Automatically assigns to correct cost center
4. **Audit Trail**: Links travel expenses to visits via ContinuumMark
5. **Operational Flexibility**: `travel_legs` remains flexible for operational needs

## Future Enhancements

- Batch processing for historical data migration
- Integration with accounting systems
- Automated reimbursement workflow
- Cost center reporting dashboards

