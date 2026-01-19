# Mileage Tracking Implementation Alignment Review

## Overview
This document reviews the current mileage tracking implementation against the specified requirements and identifies alignment issues and fixes.

## Requirements Summary

### Data Model
1. **`trips` table** (with `journey_id` as PK) - One row per visit journey
   - Carries staff, purpose, reimbursement flags, overall start/end, rolled-up mileage/tolls
   - Status: `draft` → `in_progress` → `completed`

2. **`travel_legs` table** - Ordered segments for a trip
   - `leg_sequence` (1, 2, 3...) - Order within journey
   - `is_final_leg` - Set to 1 on the last leg
   - Both `calculated_mileage` and `manual_mileage` (for overrides)
   - Status: `in_progress` → `completed`

### Workflow
1. **On "Start trip"**: Create trip first, then create leg 1 (leg_sequence = 1)
2. **On arrival**: Close leg 1, optionally open leg 2 (return)
3. **On trip completion**: Close final leg, roll up totals into trips table

## Current Implementation Status

### ✅ What's Working

1. **Travel Legs Table Structure** ✅
   - `journey_id` FK exists
   - `leg_sequence` field exists
   - `is_final_leg` field exists
   - `calculated_mileage` and `manual_mileage` fields exist
   - All required fields are present

2. **Leg Creation** ✅
   - `leg_sequence` is calculated correctly (1, 2, 3...)
   - `is_final_leg` is set when creating return leg
   - Both start and end locations are captured

3. **Leg Completion** ✅
   - Mileage is calculated using Google Routes API
   - Duration is calculated from timestamps
   - `is_final_leg` is set when completing return leg

### ❌ What Needs Fixing

1. **Missing `trips` Table** ❌
   - **Issue**: No `trips` table with `journey_id` as PK exists
   - **Current**: Only `Trips` table with `TripID` exists (different purpose)
   - **Fix**: Created migration script `scripts/create-trips-table.sql`

2. **Trip Not Created First** ❌
   - **Issue**: When `journey_id` is not provided, a leg is created but no trip record is created
   - **Current**: `journey_id` is generated but no trip record exists
   - **Fix**: Updated `app/api/radius/travel-legs/route.ts` POST endpoint to create trip first

3. **Trip Rollups Not Updated** ❌
   - **Issue**: When final leg completes, totals are not rolled up into `trips` table
   - **Current**: Only `Trips` table (expense reporting) is updated
   - **Fix**: Updated `app/api/radius/travel-legs/[legId]/route.ts` PATCH endpoint to roll up totals

## Implementation Changes Made

### 1. Created `trips` Table Migration
**File**: `scripts/create-trips-table.sql`
- Creates `trips` table with `journey_id` as PK
- Includes all required fields: staff, purpose, timing, rollups, flags, status
- Indexes for common queries

### 2. Updated Travel Legs POST Endpoint
**File**: `app/api/radius/travel-legs/route.ts`
- **Before**: Generated `journey_id` but didn't create trip record
- **After**: Creates trip record first when `journey_id` is not provided
- Sets `trip_status = 'in_progress'`
- Fetches staff_name if not provided

### 3. Updated Travel Legs PATCH Endpoint
**File**: `app/api/radius/travel-legs/[legId]/route.ts`
- **Before**: Only updated `Trips` table (expense reporting)
- **After**: Also rolls up totals into `trips` table when `is_final_leg = true`
- Calculates: `total_mileage`, `total_duration_minutes`, `total_tolls_estimated`, `total_tolls_actual`
- Sets `trip_status = 'completed'` and `end_timestamp` when final leg completes

## Workflow Alignment

### Current Workflow (After Fixes)

1. **User clicks "Start Drive"**:
   - ✅ Creates trip record with `journey_id`, `trip_status = 'in_progress'`
   - ✅ Creates leg 1 with `leg_sequence = 1`, `leg_status = 'in_progress'`
   - ✅ Sets `appointment_id_to` to link leg to appointment

2. **User clicks "Arrived"**:
   - ✅ Completes leg 1: sets end location, calculates mileage, sets `leg_status = 'completed'`
   - ✅ Updates appointment with arrival location and mileage

3. **User clicks "Return to Office/Home"**:
   - ✅ Creates leg 2 with `leg_sequence = 2`, `is_final_leg = true`
   - ✅ Sets `appointment_id_from` to link leg to appointment

4. **User clicks "Complete Return"**:
   - ✅ Completes leg 2: sets end location, calculates mileage, sets `leg_status = 'completed'`
   - ✅ **NEW**: Rolls up totals into `trips` table
   - ✅ Sets `trip_status = 'completed'` and `end_timestamp`

## Field Mapping Verification

### Required Leg Fields ✅
- ✅ `leg_id` (GUID, PK)
- ✅ `journey_id` (FK to trips)
- ✅ `leg_sequence` (1, 2, 3...)
- ✅ `staff_user_id`, `staff_name`
- ✅ `travel_purpose`
- ✅ `start_latitude`, `start_longitude`, `start_timestamp`, `start_location_name`, `start_location_type`, `start_location_address`
- ✅ `end_latitude`, `end_longitude`, `end_timestamp`, `end_location_name`, `end_location_type`, `end_location_address`
- ✅ `appointment_id_from`, `appointment_id_to`
- ✅ `calculated_mileage`, `manual_mileage`, `duration_minutes`, `estimated_toll_cost`, `actual_toll_cost`, `manual_notes`
- ✅ `is_final_leg`, `is_manual_entry`, `is_backdated`, `is_deleted`
- ✅ `leg_status` (in_progress → completed)
- ✅ Audit fields

### Required Trip Fields ✅
- ✅ `journey_id` (GUID, PK)
- ✅ `staff_user_id`, `staff_name`
- ✅ `travel_purpose`
- ✅ `start_timestamp`, `end_timestamp`
- ✅ `total_mileage`, `total_duration_minutes`, `total_tolls_estimated`, `total_tolls_actual`
- ✅ `is_manual_entry`, `is_backdated`, `reimbursable`
- ✅ `trip_status` (draft → in_progress → completed)
- ✅ Audit fields

## Remaining Tasks

1. **Run Migration**: Execute `scripts/create-trips-table.sql` on the database
2. **Test Workflow**: Verify trip creation, leg sequencing, and rollups work correctly
3. **Verify Manual Mileage**: Ensure `manual_mileage` is stored when user overrides calculated mileage

## Notes

- The `Trips` table (with `TripID`) is still used for expense reporting and ContinuumMark integration
- The new `trips` table (with `journey_id`) is for journey-level tracking and rollups
- Both tables can coexist - they serve different purposes
- The mobile app already sets `is_final_leg: true` when creating return legs (line 838, 1214)
