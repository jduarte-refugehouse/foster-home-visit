# Mileage Tracking - Simplified Approach

**Date**: January 19, 2026  
**Status**: Using existing `Trips` table with `JourneyID` column

---

## Summary

Instead of creating a new `travel_journeys` table, we're using the existing `Trips` table by adding a `JourneyID` column to link it to `travel_legs.journey_id`.

---

## Database Changes

### Migration Script: `scripts/create-trips-table.sql`

Adds `JourneyID` column to existing `Trips` table:

```sql
ALTER TABLE [dbo].[Trips]
ADD [JourneyID] [uniqueidentifier] NULL;

CREATE INDEX [IX_Trips_JourneyID] 
ON [dbo].[Trips] ([JourneyID])
WHERE [JourneyID] IS NOT NULL;
```

**Why this approach:**
- ✅ Uses existing schema (no new table)
- ✅ Links `Trips` to `travel_legs` via `journey_id`
- ✅ Maintains backward compatibility (existing `Trips` records work)
- ✅ Simpler than creating a separate table

---

## Workflow

### 1. Start Journey (First Leg)
- Create `Trips` record with `JourneyID = journey_id`, `TripStatus = 'in_progress'`
- Create first `travel_legs` record with `leg_sequence = 1`

### 2. Complete Legs
- Update `travel_legs` records as legs complete
- No `Trips` update needed until final leg

### 3. Complete Final Leg
- Roll up totals from all legs
- Update `Trips` record using `JourneyID`:
  - Set `TripStatus = 'completed'`
  - Update `MilesActual`, `MilesEstimated`, `EstimatedTollCost`, `ActualTollCost`, `DurationMinutes`
  - Set `DepartureTime`, `ArrivalTime`
  - Set origin/destination addresses and coordinates

---

## Code Changes

### POST `/api/radius/travel-legs` (Create Leg)
- If `journey_id` not provided (new trip):
  1. Generate `journey_id`
  2. Create `Trips` record with `JourneyID`, `TripStatus = 'in_progress'`
  3. Create first leg with `leg_sequence = 1`

### PATCH `/api/radius/travel-legs/[legId]` (Complete Leg)
- If `is_final_leg = true`:
  1. Roll up totals from all completed legs
  2. Update `Trips` record using `JourneyID` (if exists)
  3. Fallback to legacy fuzzy matching if `JourneyID` column doesn't exist yet

---

## Backward Compatibility

- If `JourneyID` column doesn't exist: Falls back to legacy fuzzy matching (by date, staff, purpose)
- If `Trips` record wasn't created on start: Legacy logic creates it on completion
- Existing `Trips` records: Continue to work (no `JourneyID` required)

---

## Benefits

1. **No new table** - Uses existing `Trips` table
2. **Clear linkage** - `JourneyID` directly links `Trips` to `travel_legs`
3. **Trip-first workflow** - Creates trip when journey starts (as required)
4. **Rollups on completion** - Updates trip with totals when final leg completes
5. **Backward compatible** - Works even if migration hasn't run yet

---

## Next Steps

1. Run migration script on test database
2. Test journey creation and completion workflow
3. Verify `Trips` records are created with `JourneyID`
4. Verify rollups work correctly on final leg completion
