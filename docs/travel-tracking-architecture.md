# Travel Tracking Architecture

## Overview

The travel tracking system uses a **leg-based approach** for maximum flexibility. Each travel leg represents a single segment from point A to point B, independent of appointments or other constraints.

## Core Concept

**Travel Leg**: A single travel segment with:
- Start point (location, timestamp)
- End point (location, timestamp)
- Calculated mileage and tolls
- Status (in_progress, completed, cancelled)

**Journey**: An optional grouping of related legs (e.g., all legs from one work day)

## Key Features

### 1. **Maximum Flexibility**
- Legs can be tied to appointments OR be standalone/ad-hoc
- Supports any travel scenario:
  - Office → Visit 1 → Visit 2 → Visit 3 → Office
  - Office → Visit 1 → Home (early end)
  - Visit 1 → Visit 2 (forgot to log start)
  - Ad-hoc errands between visits
  - Multiple trips in one day

### 2. **Manual Entry & Corrections**
- `is_manual_entry`: Flag for manually entered/edited legs
- `manual_mileage`: Override calculated mileage
- `manual_notes`: Notes about corrections
- `is_backdated`: Flag for legs with manually adjusted timestamps

### 3. **Status Tracking**
- `in_progress`: Leg has started but not completed
- `completed`: Leg has both start and end points
- `cancelled`: Leg was started but cancelled

### 4. **Journey Grouping** (Optional)
- `journey_id`: Groups related legs together
- `leg_sequence`: Order within journey
- `is_final_leg`: Marks the last leg (return to office/home)

## Data Model

### Travel Legs Table

```sql
travel_legs
├── leg_id (PK)
├── staff_user_id
├── journey_id (optional grouping)
├── leg_sequence (order in journey)
│
├── START POINT
│   ├── start_latitude
│   ├── start_longitude
│   ├── start_timestamp
│   ├── start_location_name
│   ├── start_location_address
│   ├── start_location_type ('office', 'appointment', 'home', 'other')
│   └── appointment_id_from (optional)
│
├── END POINT
│   ├── end_latitude
│   ├── end_longitude
│   ├── end_timestamp (NULL if in progress)
│   ├── end_location_name
│   ├── end_location_address
│   ├── end_location_type
│   └── appointment_id_to (optional)
│
├── CALCULATED DATA
│   ├── calculated_mileage
│   ├── estimated_toll_cost
│   ├── actual_toll_cost
│   └── duration_minutes
│
├── STATUS & FLAGS
│   ├── leg_status ('in_progress', 'completed', 'cancelled')
│   ├── is_final_leg
│   ├── is_manual_entry
│   └── is_backdated
│
├── MANUAL OVERRIDES
│   ├── manual_mileage
│   └── manual_notes
│
└── METADATA
    ├── travel_purpose
    ├── vehicle_type
    └── reimbursable
```

## Use Cases

### 1. **Standard Multi-Visit Day**
```
Leg 1: Office → Visit 1 (appointment_id_to = Visit 1)
Leg 2: Visit 1 → Visit 2 (appointment_id_from = Visit 1, appointment_id_to = Visit 2)
Leg 3: Visit 2 → Visit 3 (appointment_id_from = Visit 2, appointment_id_to = Visit 3)
Leg 4: Visit 3 → Office (appointment_id_from = Visit 3, is_final_leg = 1)
```

### 2. **Forgotten Start (Backdated Entry)**
```
User forgot to log start from Visit 1 to Visit 2:
- Create leg with manual entry
- Set start_timestamp to estimated time
- Set is_manual_entry = 1
- Set is_backdated = 1
- Enter manual_mileage or let system calculate from coordinates
```

### 3. **Ad-Hoc Travel**
```
User needs to run errand between visits:
Leg 1: Office → Visit 1
Leg 2: Visit 1 → Store (ad-hoc, no appointment)
Leg 3: Store → Visit 2
Leg 4: Visit 2 → Office
```

### 4. **Incomplete Journey**
```
User goes home early:
Leg 1: Office → Visit 1
Leg 2: Visit 1 → Home (is_final_leg = 1, end_location_type = 'home')
```

### 5. **Manual Correction**
```
User realizes they forgot to log travel yesterday:
- Create leg with is_manual_entry = 1
- Set is_backdated = 1
- Enter start/end locations manually
- Enter manual_mileage or coordinates for calculation
- Add manual_notes explaining the correction
```

## API Design

### Create/Start Leg
```typescript
POST /api/travel-legs
{
  staff_user_id: string,
  start_latitude: number,
  start_longitude: number,
  start_timestamp: string,
  start_location_name?: string,
  appointment_id_from?: string,
  journey_id?: string, // Optional: create new journey or add to existing
  travel_purpose?: string
}
```

### Complete Leg
```typescript
PATCH /api/travel-legs/[legId]
{
  end_latitude: number,
  end_longitude: number,
  end_timestamp: string,
  end_location_name?: string,
  appointment_id_to?: string
}
// System calculates mileage automatically
```

### Manual Entry
```typescript
POST /api/travel-legs/manual
{
  staff_user_id: string,
  start_location_name: string,
  start_address?: string,
  start_timestamp: string,
  end_location_name: string,
  end_address?: string,
  end_timestamp: string,
  manual_mileage?: number, // Override calculation
  manual_notes: string,
  is_backdated: boolean,
  travel_purpose?: string
}
```

### Get Daily Travel Summary
```typescript
GET /api/travel-legs?staffUserId=xxx&date=2025-11-11
// Returns all legs for that staff member on that date
// Includes total mileage, total tolls, journey breakdown
```

## Migration Strategy

1. **Phase 1**: Create `travel_legs` table (no breaking changes)
2. **Phase 2**: Build new API endpoints alongside existing ones
3. **Phase 3**: Update mobile app to use new leg-based system
4. **Phase 4**: Migrate existing appointment-based travel data to legs
5. **Phase 5**: Deprecate old appointment travel fields (keep for historical data)

## Benefits

✅ **Maximum Flexibility**: Handles any travel scenario
✅ **Manual Corrections**: Easy to log forgotten travel
✅ **Backdating Support**: Can enter travel from previous days
✅ **Ad-Hoc Travel**: Not tied to appointments
✅ **Accurate Reporting**: Sum all legs for daily/weekly/monthly totals
✅ **Route Optimization**: Can analyze travel patterns
✅ **Reimbursement**: Easy to calculate total reimbursable mileage
✅ **Continuum Integration**: Automatically logs `drive_start` and `drive_end` events
✅ **Button State Sync**: Consistent UI state across mobile and desktop views
✅ **Visual Clarity**: Color-coded buttons (green for start, red for stop)

## Implementation Status

**Completed (November 11, 2025):**
- ✅ Travel leg creation and completion APIs
- ✅ Continuum logging integration (`drive_start`, `drive_end`)
- ✅ Appointment API includes travel leg flags (`has_in_progress_leg`, `has_completed_leg`)
- ✅ Button state synchronization across views
- ✅ Mileage display from travel legs
- ✅ History tab shows travel leg actions

**Mobile Integration:**
- ✅ Mobile appointment page uses travel leg system
- ✅ Button states check travel leg status
- ✅ Location capture for start/end points
- ✅ Automatic UI refresh after actions

**Desktop Integration:**
- ✅ Appointment detail page checks travel leg flags
- ✅ Mileage tracking card shows travel leg data
- ✅ History tab displays continuum entries
- ✅ Button colors: Start = green, Arrived/Stop = red

