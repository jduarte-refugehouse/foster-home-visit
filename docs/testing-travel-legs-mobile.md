# Testing Travel Legs - Mobile Appointment Page

## Prerequisites

1. **Database Setup**: Run the SQL script to create the `travel_legs` table:
   ```sql
   -- Run: scripts/create-travel-legs-table.sql
   ```
   The script checks if the table exists, so it's safe to run multiple times.

2. **Environment**: Ensure you're on the `cursor-development` branch and the latest code is deployed.

## Test Checklist

### 1. **Start Drive Button** ✅
- [ ] Navigate to a mobile appointment page
- [ ] Click "Start Drive" button
- [ ] Verify location permission is requested
- [ ] Verify toast notification: "Drive Started - Starting location captured"
- [ ] Check browser console for any errors
- [ ] Verify `currentLegId` and `journeyId` are stored in state

**Expected Behavior:**
- Button should show "Capturing Location..." while getting GPS
- After success, button should disappear
- New travel leg should be created in database with `leg_status = 'in_progress'`

### 2. **Mark as Arrived Button** ✅
- [ ] After starting drive, click "Mark as Arrived"
- [ ] Verify location is captured
- [ ] Verify toast shows mileage (if calculated): "Arrival location captured. Distance: X.XX miles"
- [ ] Check that `currentLegId` is cleared from state
- [ ] Verify leg is completed in database (`leg_status = 'completed'`, `end_timestamp` populated)

**Expected Behavior:**
- Mileage should be calculated using Google Routes API
- Leg should be marked as completed
- Button should disappear after arrival

### 3. **Drive to Next Visit** ✅
- [ ] With an appointment that has a next appointment scheduled
- [ ] After arriving at current appointment, click "Drive to Next Visit"
- [ ] Verify new leg is created with `appointment_id_from` and `appointment_id_to`
- [ ] Verify `journey_id` is the same as previous leg (same journey)
- [ ] Verify `leg_sequence` increments correctly

**Expected Behavior:**
- New leg should be created in same journey
- Should link appointments together
- Sequence should increment (1, 2, 3, etc.)

### 4. **Return Travel** ✅
- [ ] After completing a visit, click "Return to Office/Home"
- [ ] Verify new leg is created with `is_final_leg = true`
- [ ] Verify "Arrived at Home" button appears
- [ ] Click "Arrived at Home" when you reach destination
- [ ] Verify return leg is completed with mileage calculated

**Expected Behavior:**
- Return leg should be marked as final leg
- "Arrived at Home" button should appear after starting return
- Final leg should complete the journey

### 5. **Page Reload / State Restoration** ✅
- [ ] Start a drive (create in-progress leg)
- [ ] Reload the page
- [ ] Verify `fetchCurrentTravelLeg()` restores the in-progress leg
- [ ] Verify `currentLegId` and `journeyId` are restored
- [ ] Verify appropriate buttons are shown based on leg status

**Expected Behavior:**
- In-progress legs should be restored on page load
- UI should reflect the current state (e.g., show "Mark as Arrived" if leg is in progress)

### 6. **Error Handling** ✅
- [ ] Test with location permission denied
- [ ] Test with location timeout
- [ ] Test with network errors
- [ ] Verify error messages are user-friendly
- [ ] Verify state is reset properly on errors

**Expected Behavior:**
- Clear error messages for each scenario
- UI should not get stuck in loading state
- `capturingLocation` should always reset

### 7. **Backward Compatibility** ✅
- [ ] Test with appointments that have old mileage data
- [ ] Verify fallback to old system works if `currentLegId` is missing
- [ ] Verify both systems can coexist during transition

**Expected Behavior:**
- Old appointment-based tracking should still work
- New leg-based system should be primary
- Fallback should work seamlessly

## Database Verification

After testing, verify data in database:

```sql
-- Check all travel legs for today
SELECT 
    leg_id,
    staff_user_id,
    journey_id,
    leg_sequence,
    start_location_name,
    end_location_name,
    calculated_mileage,
    leg_status,
    is_final_leg,
    created_at
FROM travel_legs
WHERE CAST(start_timestamp AS DATE) = CAST(GETUTCDATE() AS DATE)
ORDER BY start_timestamp, leg_sequence
```

**Expected Results:**
- Legs should be grouped by `journey_id`
- `leg_sequence` should increment within each journey
- Final leg should have `is_final_leg = 1`
- Completed legs should have `leg_status = 'completed'` and `end_timestamp` populated

## Common Issues & Solutions

### Issue: "Failed to create travel leg"
- **Check**: Database table exists
- **Check**: User authentication is working
- **Check**: API endpoint is accessible

### Issue: "No current leg ID found"
- **Check**: `fetchCurrentTravelLeg()` is being called
- **Check**: API returns in-progress legs correctly
- **Check**: Appointment ID matches in query

### Issue: Mileage not calculated
- **Check**: Google Maps API key is configured
- **Check**: Routes API is enabled
- **Check**: API key has correct permissions
- **Check**: Server logs for API errors

### Issue: State not persisting on reload
- **Check**: `fetchCurrentTravelLeg()` is in `useEffect`
- **Check**: Query filters are correct (`staffUserId`, `status=in_progress`)
- **Check**: Appointment ID matching logic

## Next Steps After Testing

1. If all tests pass: Update desktop appointment page to use same system
2. If issues found: Document and fix before proceeding
3. Consider: Adding UI to view travel history/legs
4. Consider: Adding manual entry UI for forgotten travel

