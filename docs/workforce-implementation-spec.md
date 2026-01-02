# Workforce Time Tracking & T3C Cost Reporting - Implementation Specification

## Overview

This document provides a complete implementation specification for the Workforce Time Tracking system, designed to capture staff activities and allocate time to Texas HHSC cost report categories and children's service packages.

**Target Framework**: Integrate with existing "continuum" logging system in Bifrost database.

---

## Table of Contents

1. [Core Concepts](#core-concepts)
2. [Database Schema](#database-schema)
3. [API Endpoints](#api-endpoints)
4. [Business Logic](#business-logic)
5. [SMS Integration](#sms-integration)
6. [UI/UX Specifications](#uiux-specifications)
7. [Integration Points](#integration-points)
8. [Data Migration](#data-migration)
9. [Cost Allocation Engine](#cost-allocation-engine)

---

## Core Concepts

### Time Block Model

The atomic unit is a **Time Block** containing:
- **Activity** (What): What type of work was performed
- **Concerning** (Who/What): Who or what the work was about
- **Duration**: Time spent, in 15-minute increments
- **Children** (optional): Specific children when concerning is CHILD or HOME_CHILDREN

### Time Granularity

- All times snap to **15-minute increments**
- Minimum block size: 15 minutes
- Day boundary: Configurable per agency (default: midnight)

### Work Day States

```
┌─────────────────────────────────────────────────────────────────┐
│                        WORK DAY STATES                          │
├─────────────────────────────────────────────────────────────────┤
│  NOT_STARTED  →  ACTIVE  →  PENDING_COMPLETION  →  COMPLETED   │
│       ↓                                                         │
│  SICK / TIME_OFF / ON_CALL                                     │
└─────────────────────────────────────────────────────────────────┘
```

| State | Description |
|-------|-------------|
| `NOT_STARTED` | Default state, awaiting day start |
| `ACTIVE` | Work day in progress |
| `PENDING_COMPLETION` | Day ended, awaiting time block reconciliation |
| `COMPLETED` | All time blocks logged and reconciled |
| `SICK` | Sick day - suppresses prompts |
| `TIME_OFF` | Scheduled time off - suppresses prompts |
| `ON_CALL` | On-call status (can have episodes within) |

---

## Database Schema

### New Tables

```sql
-- ============================================================
-- WORK DAYS
-- Tracks daily work status for each staff member
-- ============================================================
CREATE TABLE workforce_days (
    id                      UNIQUEIDENTIFIER PRIMARY KEY DEFAULT NEWID(),

    -- Staff reference
    staff_user_id           VARCHAR(100) NOT NULL,
    staff_email             VARCHAR(255) NOT NULL,
    staff_name              VARCHAR(255),

    -- Day identification
    work_date               DATE NOT NULL,

    -- State machine
    status                  VARCHAR(30) NOT NULL DEFAULT 'NOT_STARTED',
    -- Values: NOT_STARTED, ACTIVE, PENDING_COMPLETION, COMPLETED, SICK, TIME_OFF, ON_CALL

    -- Timestamps
    day_start_time          DATETIME2,
    day_end_time            DATETIME2,

    -- Calculated totals (updated on reconciliation)
    total_minutes           INT DEFAULT 0,
    total_drive_miles       DECIMAL(10,2) DEFAULT 0,

    -- Metadata
    notes                   NVARCHAR(MAX),
    created_at              DATETIME2 DEFAULT GETUTCDATE(),
    updated_at              DATETIME2 DEFAULT GETUTCDATE(),

    -- Constraints
    CONSTRAINT uq_staff_date UNIQUE (staff_user_id, work_date),
    INDEX ix_work_date (work_date),
    INDEX ix_staff_status (staff_user_id, status)
);

-- ============================================================
-- TIME BLOCKS
-- Individual activity blocks within a work day
-- ============================================================
CREATE TABLE workforce_time_blocks (
    id                      UNIQUEIDENTIFIER PRIMARY KEY DEFAULT NEWID(),

    -- Parent reference
    workforce_day_id        UNIQUEIDENTIFIER NOT NULL,

    -- Timing
    start_time              DATETIME2 NOT NULL,
    end_time                DATETIME2 NOT NULL,
    duration_minutes        INT NOT NULL,  -- Calculated, must be multiple of 15

    -- Activity classification
    activity_code           VARCHAR(50) NOT NULL,  -- References activity_types.code

    -- Concerning classification
    concerning_type         VARCHAR(50) NOT NULL,  -- References concerning_types.code

    -- Entity references (based on concerning_type)
    home_guid               UNIQUEIDENTIFIER,      -- When concerning HOME_* types
    child_guids             NVARCHAR(MAX),         -- JSON array of child GUIDs

    -- Travel-specific fields
    is_travel               BIT DEFAULT 0,
    travel_leg_id           UNIQUEIDENTIFIER,      -- Links to travel_legs table
    mileage                 DECIMAL(10,2),

    -- Continuum integration
    continuum_entry_id      UNIQUEIDENTIFIER,      -- Links to continuum_entries if applicable

    -- Notes
    notes                   NVARCHAR(MAX),

    -- Audit
    created_at              DATETIME2 DEFAULT GETUTCDATE(),
    updated_at              DATETIME2 DEFAULT GETUTCDATE(),
    created_by              VARCHAR(100),

    -- Foreign keys
    CONSTRAINT fk_time_block_day FOREIGN KEY (workforce_day_id)
        REFERENCES workforce_days(id),

    -- Indexes
    INDEX ix_day_id (workforce_day_id),
    INDEX ix_activity (activity_code),
    INDEX ix_concerning (concerning_type),
    INDEX ix_home (home_guid),
    INDEX ix_time_range (start_time, end_time)
);

-- ============================================================
-- COST ALLOCATIONS
-- Computed allocations to service packages (generated from time blocks)
-- ============================================================
CREATE TABLE workforce_cost_allocations (
    id                      UNIQUEIDENTIFIER PRIMARY KEY DEFAULT NEWID(),

    -- Source reference
    time_block_id           UNIQUEIDENTIFIER NOT NULL,

    -- Allocation target
    child_guid              UNIQUEIDENTIFIER,      -- NULL for non-child allocations
    service_package         VARCHAR(100),          -- From SyncChildrenInPlacement
    cost_center             VARCHAR(100),          -- For non-child allocations

    -- Texas HHSC cost report category
    cost_report_category    VARCHAR(50) NOT NULL,
    -- Values: CASE_MGMT, TREATMENT_COORD, DIRECT_CARE, MEDICAL, ADMIN, TRAVEL

    -- Allocated time
    allocated_minutes       INT NOT NULL,
    allocation_percentage   DECIMAL(5,2),          -- For weighted distribution

    -- Allocation method
    allocation_method       VARCHAR(30) NOT NULL DEFAULT 'EQUAL',
    -- Values: EQUAL, WEIGHTED, MANUAL

    -- Audit
    created_at              DATETIME2 DEFAULT GETUTCDATE(),

    -- Foreign keys
    CONSTRAINT fk_allocation_block FOREIGN KEY (time_block_id)
        REFERENCES workforce_time_blocks(id) ON DELETE CASCADE,

    -- Indexes
    INDEX ix_block_id (time_block_id),
    INDEX ix_child (child_guid),
    INDEX ix_service_package (service_package),
    INDEX ix_cost_category (cost_report_category)
);

-- ============================================================
-- ACTIVITY TYPES
-- Configurable activity type definitions
-- ============================================================
CREATE TABLE workforce_activity_types (
    id                      UNIQUEIDENTIFIER PRIMARY KEY DEFAULT NEWID(),

    -- Stable identifier (never changes)
    code                    VARCHAR(50) UNIQUE NOT NULL,

    -- Display properties (can be updated)
    name                    VARCHAR(100) NOT NULL,
    description             NVARCHAR(500),
    category                VARCHAR(30) NOT NULL,
    -- Categories: CM, TX, DC, MED, TRV, ADM, TRANS, PP, KIN, ADOPT, HDEV, INTAKE

    icon                    VARCHAR(20),           -- Emoji for UI

    -- Cost reporting
    cost_report_category    VARCHAR(50) NOT NULL,

    -- Behavior flags
    is_travel               BIT DEFAULT 0,
    requires_concerning     BIT DEFAULT 1,
    valid_concerning_types  NVARCHAR(MAX),         -- JSON array of allowed concerning types

    -- UI configuration
    display_order           INT DEFAULT 100,
    is_quick_access         BIT DEFAULT 0,
    is_active               BIT DEFAULT 1,

    -- Audit
    created_at              DATETIME2 DEFAULT GETUTCDATE(),
    updated_at              DATETIME2 DEFAULT GETUTCDATE()
);

-- ============================================================
-- CONCERNING TYPES
-- Configurable concerning type definitions
-- ============================================================
CREATE TABLE workforce_concerning_types (
    id                      UNIQUEIDENTIFIER PRIMARY KEY DEFAULT NEWID(),

    -- Stable identifier
    code                    VARCHAR(50) UNIQUE NOT NULL,

    -- Display properties
    name                    VARCHAR(100) NOT NULL,
    description             NVARCHAR(500),

    -- Cost allocation behavior
    cost_center_type        VARCHAR(50),
    allows_child_select     BIT DEFAULT 0,
    allows_home_select      BIT DEFAULT 0,
    auto_split_children     BIT DEFAULT 0,

    -- UI configuration
    display_order           INT DEFAULT 100,
    group_name              VARCHAR(50),           -- For grouping in UI
    is_active               BIT DEFAULT 1,

    -- Audit
    created_at              DATETIME2 DEFAULT GETUTCDATE(),
    updated_at              DATETIME2 DEFAULT GETUTCDATE()
);

-- ============================================================
-- ON-CALL EPISODES
-- Tracks individual on-call response episodes
-- ============================================================
CREATE TABLE workforce_oncall_episodes (
    id                      UNIQUEIDENTIFIER PRIMARY KEY DEFAULT NEWID(),

    -- Parent reference
    workforce_day_id        UNIQUEIDENTIFIER NOT NULL,

    -- Episode timing
    start_time              DATETIME2 NOT NULL,
    end_time                DATETIME2,
    duration_minutes        INT,

    -- Classification
    episode_type            VARCHAR(50),           -- PHONE, IN_PERSON, etc.

    -- Related entities
    home_guid               UNIQUEIDENTIFIER,
    child_guids             NVARCHAR(MAX),         -- JSON array

    -- Notes
    description             NVARCHAR(MAX),
    resolution              NVARCHAR(MAX),

    -- Audit
    created_at              DATETIME2 DEFAULT GETUTCDATE(),
    updated_at              DATETIME2 DEFAULT GETUTCDATE(),

    CONSTRAINT fk_oncall_day FOREIGN KEY (workforce_day_id)
        REFERENCES workforce_days(id)
);

-- ============================================================
-- SMS PROMPTS LOG
-- Tracks SMS prompts sent to staff
-- ============================================================
CREATE TABLE workforce_sms_prompts (
    id                      UNIQUEIDENTIFIER PRIMARY KEY DEFAULT NEWID(),

    -- Staff reference
    staff_user_id           VARCHAR(100) NOT NULL,
    phone_number            VARCHAR(20) NOT NULL,

    -- Prompt details
    prompt_type             VARCHAR(50) NOT NULL,
    -- Values: DAY_START, DAY_END, REMINDER, COMPLETION_REQUIRED

    -- Twilio tracking
    twilio_message_sid      VARCHAR(50),

    -- Status
    sent_at                 DATETIME2 DEFAULT GETUTCDATE(),
    delivered_at            DATETIME2,
    response_received_at    DATETIME2,
    response_text           NVARCHAR(500),

    -- Metadata
    metadata                NVARCHAR(MAX),         -- JSON

    INDEX ix_staff (staff_user_id),
    INDEX ix_sent (sent_at)
);
```

### Seed Data for Activity Types

```sql
-- Case Management Activities
INSERT INTO workforce_activity_types (code, name, category, cost_report_category, display_order, is_quick_access) VALUES
('CM_HOME_VISIT', 'Home Visit', 'CM', 'CASE_MGMT', 10, 1),
('CM_PHONE', 'Phone/Video Contact', 'CM', 'CASE_MGMT', 20, 1),
('CM_DOCS', 'Documentation/Case Notes', 'CM', 'CASE_MGMT', 30, 1),
('CM_SERVICE_PLAN', 'Service Planning', 'CM', 'CASE_MGMT', 40, 0),
('CM_COURT_PREP', 'Court Preparation', 'CM', 'CASE_MGMT', 50, 0),
('CM_COURT', 'Court Attendance', 'CM', 'CASE_MGMT', 60, 0),
('CM_SCHOOL', 'School Contact/Meeting', 'CM', 'CASE_MGMT', 70, 0),
('CM_EXT_PROVIDER', 'External Provider Coordination', 'CM', 'CASE_MGMT', 80, 0),
('CM_PLACEMENT', 'Placement Coordination', 'CM', 'CASE_MGMT', 90, 0),
('CM_3DAY_ORIENT', '3-Day Orientation', 'CM', 'CASE_MGMT', 100, 0),
('CM_KELLY_BEAR', 'Kelly Bear Training', 'CM', 'CASE_MGMT', 110, 0),
('CM_RECREATION', 'Recreational Activity', 'CM', 'CASE_MGMT', 120, 0),
('CM_AFTERCARE', 'Aftercare', 'CM', 'CASE_MGMT', 130, 0),
('CM_OTHER', 'Case Management - Other', 'CM', 'CASE_MGMT', 140, 0);

-- Treatment Coordination
INSERT INTO workforce_activity_types (code, name, category, cost_report_category, display_order) VALUES
('TX_TEAM_MTG', 'Treatment Team Meeting', 'TX', 'TREATMENT_COORD', 10),
('TX_THERAPY', 'Therapy Coordination', 'TX', 'TREATMENT_COORD', 20),
('TX_CRISIS', 'Crisis Intervention', 'TX', 'TREATMENT_COORD', 30),
('TX_BEHAVIOR', 'Behavioral Support', 'TX', 'TREATMENT_COORD', 40),
('TX_CANS', 'CANS Assessment', 'TX', 'TREATMENT_COORD', 50),
('TX_SAFETY_PLAN', 'Safety Planning', 'TX', 'TREATMENT_COORD', 60),
('TX_OTHER', 'Treatment Coordination - Other', 'TX', 'TREATMENT_COORD', 70);

-- Direct Care Support
INSERT INTO workforce_activity_types (code, name, category, cost_report_category, display_order) VALUES
('DC_TRANSPORT_MED', 'Transport - Medical', 'DC', 'DIRECT_CARE', 10),
('DC_TRANSPORT_SCHOOL', 'Transport - School', 'DC', 'DIRECT_CARE', 20),
('DC_TRANSPORT_COURT', 'Transport - Court', 'DC', 'DIRECT_CARE', 30),
('DC_TRANSPORT_VISIT', 'Transport - Visitation', 'DC', 'DIRECT_CARE', 40),
('DC_TRANSPORT_REC', 'Transport - Recreation', 'DC', 'DIRECT_CARE', 50),
('DC_SUPERVISION', 'Direct Supervision/Respite', 'DC', 'DIRECT_CARE', 60),
('DC_OTHER', 'Direct Care - Other', 'DC', 'DIRECT_CARE', 70);

-- Medical
INSERT INTO workforce_activity_types (code, name, category, cost_report_category, display_order) VALUES
('MED_APPT', 'Medical Appointment', 'MED', 'MEDICAL', 10),
('MED_DENTAL', 'Dental Appointment', 'MED', 'MEDICAL', 20),
('MED_MENTAL_HEALTH', 'Mental Health Appointment', 'MED', 'MEDICAL', 30),
('MED_PSYCH', 'Psychiatric Appointment', 'MED', 'MEDICAL', 40),
('MED_MEDICATION', 'Medication Coordination', 'MED', 'MEDICAL', 50),
('MED_OTHER', 'Medical - Other', 'MED', 'MEDICAL', 60);

-- Travel (is_travel = 1)
INSERT INTO workforce_activity_types (code, name, category, cost_report_category, is_travel, display_order) VALUES
('TRV_HOME_VISIT', 'Travel - Home Visit', 'TRV', 'TRAVEL', 1, 10),
('TRV_COURT', 'Travel - Court', 'TRV', 'TRAVEL', 1, 20),
('TRV_MEDICAL', 'Travel - Medical', 'TRV', 'TRAVEL', 1, 30),
('TRV_SCHOOL', 'Travel - School', 'TRV', 'TRAVEL', 1, 40),
('TRV_VISITATION', 'Travel - Visitation', 'TRV', 'TRAVEL', 1, 50),
('TRV_ADMIN', 'Travel - Administrative', 'TRV', 'TRAVEL', 1, 60),
('TRV_TRAINING', 'Travel - Training', 'TRV', 'TRAVEL', 1, 70),
('TRV_ADOPTION', 'Travel - Adoption', 'TRV', 'TRAVEL', 1, 80),
('TRV_OTHER', 'Travel - Other', 'TRV', 'TRAVEL', 1, 90);

-- Administrative
INSERT INTO workforce_activity_types (code, name, category, cost_report_category, display_order) VALUES
('ADM_STAFF_MTG', 'Staff Meeting', 'ADM', 'ADMIN', 10),
('ADM_SUPERVISION', 'Supervision (1:1)', 'ADM', 'ADMIN', 20),
('ADM_TRAINING', 'Training', 'ADM', 'ADMIN', 30),
('ADM_LICENSING', 'Licensing/Compliance', 'ADM', 'ADMIN', 40),
('ADM_GENERAL', 'General Administrative', 'ADM', 'ADMIN', 50),
('ADM_OTHER', 'Administrative - Other', 'ADM', 'ADMIN', 60);

-- Transitional Living
INSERT INTO workforce_activity_types (code, name, category, cost_report_category, display_order) VALUES
('TRANS_PAL', 'PAL', 'TRANS', 'CASE_MGMT', 10),
('TRANS_ANSELL_CASEY', 'Ansell-Casey Assessment', 'TRANS', 'CASE_MGMT', 20),
('TRANS_RESOURCE_DEV', 'Resource Development', 'TRANS', 'CASE_MGMT', 30),
('TRANS_OTHER', 'Transitional - Other', 'TRANS', 'CASE_MGMT', 40);

-- Pregnant/Parenting
INSERT INTO workforce_activity_types (code, name, category, cost_report_category, display_order) VALUES
('PP_TRAINING', 'Training', 'PP', 'CASE_MGMT', 10),
('PP_RESOURCE_DEV', 'Resource Development', 'PP', 'CASE_MGMT', 20),
('PP_HOME_VISIT', 'Home Visit', 'PP', 'CASE_MGMT', 30),
('PP_OTHER', 'Pregnant/Parenting - Other', 'PP', 'CASE_MGMT', 40);

-- Kinship
INSERT INTO workforce_activity_types (code, name, category, cost_report_category, display_order) VALUES
('KIN_TRAINING', 'Training', 'KIN', 'CASE_MGMT', 10),
('KIN_RESOURCE_DEV', 'Resource Development', 'KIN', 'CASE_MGMT', 20),
('KIN_HOME_VISIT', 'Home Visit', 'KIN', 'CASE_MGMT', 30),
('KIN_SUPPORT', 'Support Services', 'KIN', 'CASE_MGMT', 40),
('KIN_OTHER', 'Kinship - Other', 'KIN', 'CASE_MGMT', 50);

-- Adoption
INSERT INTO workforce_activity_types (code, name, category, cost_report_category, display_order) VALUES
('ADOPT_DOCS', 'Documentation', 'ADOPT', 'CASE_MGMT', 10),
('ADOPT_COURT', 'Court', 'ADOPT', 'CASE_MGMT', 20),
('ADOPT_HOME_VISIT', 'Home Visit', 'ADOPT', 'CASE_MGMT', 30),
('ADOPT_HOME_STUDY', 'Home Study', 'ADOPT', 'CASE_MGMT', 40),
('ADOPT_MATCHING', 'Matching/Placement', 'ADOPT', 'CASE_MGMT', 50),
('ADOPT_OTHER', 'Adoption - Other', 'ADOPT', 'CASE_MGMT', 60);

-- Home Development
INSERT INTO workforce_activity_types (code, name, category, cost_report_category, display_order) VALUES
('HDEV_RECRUITMENT', 'Recruitment', 'HDEV', 'ADMIN', 10),
('HDEV_TRAINING', 'Training', 'HDEV', 'ADMIN', 20),
('HDEV_HOME_STUDY', 'Home Study', 'HDEV', 'ADMIN', 30),
('HDEV_LICENSING', 'Licensing', 'HDEV', 'ADMIN', 40),
('HDEV_SUPPORT', 'Support/Retention', 'HDEV', 'ADMIN', 50),
('HDEV_OTHER', 'Home Development - Other', 'HDEV', 'ADMIN', 60);

-- Intake/Pre-Placement
INSERT INTO workforce_activity_types (code, name, category, cost_report_category, display_order) VALUES
('INTAKE_REFERRAL', 'Referral Review', 'INTAKE', 'ADMIN', 10),
('INTAKE_ASSESSMENT', 'Assessment', 'INTAKE', 'ADMIN', 20),
('INTAKE_MATCHING', 'Matching', 'INTAKE', 'ADMIN', 30),
('INTAKE_COORDINATION', 'Coordination', 'INTAKE', 'ADMIN', 40),
('INTAKE_OTHER', 'Intake - Other', 'INTAKE', 'ADMIN', 50);
```

### Seed Data for Concerning Types

```sql
INSERT INTO workforce_concerning_types
(code, name, cost_center_type, allows_child_select, allows_home_select, auto_split_children, group_name, display_order) VALUES
-- Placed Children Group
('CHILD', 'Specific Child(ren)', 'CHILD_SERVICE_PACKAGE', 1, 0, 0, 'Placed Children', 10),
('HOME_CHILDREN', 'Home (All Children)', 'CHILD_SERVICE_PACKAGE', 0, 1, 1, 'Placed Children', 20),

-- Program-Specific Group
('PRE_PLACEMENT', 'Pre-Placement', 'PRE_PLACEMENT', 0, 0, 0, 'Program-Specific', 30),
('HOME_DEV', 'Home Development', 'HOME_DEVELOPMENT', 0, 1, 0, 'Program-Specific', 40),
('KINSHIP', 'Kinship Support', 'KINSHIP_PROGRAM', 0, 1, 0, 'Program-Specific', 50),
('ADOPTION', 'Adoption', 'ADOPTION', 0, 0, 0, 'Program-Specific', 60),
('PREGNANT_PARENTING', 'Pregnant/Parenting', 'PP_PROGRAM', 0, 0, 0, 'Program-Specific', 70),

-- Other Group
('ADMIN', 'Unassigned/Administrative', 'ADMINISTRATIVE', 0, 0, 0, 'Other', 80),
('SELF', 'Self (Training/Development)', 'STAFF_DEVELOPMENT', 0, 0, 0, 'Other', 90);
```

---

## API Endpoints

### Work Day Management

```
POST   /api/workforce/days/start
POST   /api/workforce/days/end
POST   /api/workforce/days/status
GET    /api/workforce/days/:date
GET    /api/workforce/days/current
PUT    /api/workforce/days/:id
```

#### POST /api/workforce/days/start

Start a work day.

**Request:**
```json
{
  "status": "ACTIVE",           // or "SICK", "TIME_OFF", "ON_CALL"
  "notes": "Optional notes",
  "location": {
    "latitude": 32.7767,
    "longitude": -96.7970
  }
}
```

**Response:**
```json
{
  "id": "uuid",
  "work_date": "2026-01-02",
  "status": "ACTIVE",
  "day_start_time": "2026-01-02T08:00:00Z",
  "staff_user_id": "user_123",
  "staff_name": "Jane Smith"
}
```

#### POST /api/workforce/days/end

End a work day.

**Request:**
```json
{
  "notes": "Optional end-of-day notes"
}
```

**Response:**
```json
{
  "id": "uuid",
  "status": "PENDING_COMPLETION",
  "day_end_time": "2026-01-02T17:30:00Z",
  "total_logged_minutes": 420,
  "total_expected_minutes": 570,
  "gaps": [
    { "start": "12:00", "end": "13:00", "duration": 60 }
  ]
}
```

### Time Block Management

```
GET    /api/workforce/blocks
POST   /api/workforce/blocks
PUT    /api/workforce/blocks/:id
DELETE /api/workforce/blocks/:id
POST   /api/workforce/blocks/batch
```

#### POST /api/workforce/blocks

Create a time block.

**Request:**
```json
{
  "workforce_day_id": "uuid",
  "start_time": "2026-01-02T09:00:00Z",
  "end_time": "2026-01-02T10:30:00Z",
  "activity_code": "CM_HOME_VISIT",
  "concerning_type": "HOME_CHILDREN",
  "home_guid": "home-uuid",
  "child_guids": ["child-1", "child-2"],
  "notes": "Monthly visit with the Smith family"
}
```

**Response:**
```json
{
  "id": "uuid",
  "duration_minutes": 90,
  "allocations": [
    {
      "child_guid": "child-1",
      "service_package": "Basic Foster Care",
      "allocated_minutes": 45,
      "cost_report_category": "CASE_MGMT"
    },
    {
      "child_guid": "child-2",
      "service_package": "Therapeutic Foster Care",
      "allocated_minutes": 45,
      "cost_report_category": "CASE_MGMT"
    }
  ]
}
```

### Day Reconciliation

```
GET  /api/workforce/reconcile/:date
POST /api/workforce/reconcile/:date/complete
```

#### GET /api/workforce/reconcile/:date

Get reconciliation status for a work day.

**Response:**
```json
{
  "work_date": "2026-01-02",
  "day_start": "08:00",
  "day_end": "17:30",
  "total_minutes": 570,
  "logged_minutes": 480,
  "unlogged_minutes": 90,
  "blocks": [...],
  "gaps": [
    { "start": "12:00", "end": "13:30", "duration": 90 }
  ],
  "is_complete": false,
  "completion_requirements": {
    "max_gap_minutes": 60,
    "current_max_gap": 90,
    "passed": false
  }
}
```

### Activity & Concerning Types

```
GET /api/workforce/activity-types
GET /api/workforce/concerning-types
```

### Travel Integration

```
POST /api/workforce/travel/start
POST /api/workforce/travel/end
GET  /api/workforce/travel/active
```

These endpoints integrate with existing `travel_legs` table and create corresponding time blocks.

### Cost Reporting

```
GET /api/workforce/reports/cost-summary
GET /api/workforce/reports/service-package
GET /api/workforce/reports/staff-activity
```

#### GET /api/workforce/reports/cost-summary

**Query Parameters:**
- `start_date`: Start of reporting period
- `end_date`: End of reporting period
- `staff_user_id`: Optional filter by staff

**Response:**
```json
{
  "period": { "start": "2026-01-01", "end": "2026-01-31" },
  "by_category": {
    "CASE_MGMT": { "minutes": 12500, "hours": 208.33 },
    "TREATMENT_COORD": { "minutes": 3200, "hours": 53.33 },
    "DIRECT_CARE": { "minutes": 1800, "hours": 30.0 },
    "MEDICAL": { "minutes": 900, "hours": 15.0 },
    "TRAVEL": { "minutes": 4200, "mileage": 1250.5 },
    "ADMIN": { "minutes": 2400, "hours": 40.0 }
  },
  "by_service_package": {
    "Basic Foster Care": { "minutes": 8500, "children": 12 },
    "Therapeutic Foster Care": { "minutes": 6200, "children": 8 },
    "Specialized Care": { "minutes": 3100, "children": 4 }
  }
}
```

---

## Business Logic

### Time Block Validation

```typescript
interface TimeBlockValidation {
  // Duration must be multiple of 15 minutes
  validateDuration(startTime: Date, endTime: Date): boolean {
    const minutes = differenceInMinutes(endTime, startTime);
    return minutes > 0 && minutes % 15 === 0;
  }

  // Cannot overlap with existing blocks
  validateNoOverlap(dayId: string, startTime: Date, endTime: Date, excludeId?: string): boolean;

  // Must be within work day bounds
  validateWithinWorkDay(dayId: string, startTime: Date, endTime: Date): boolean;

  // Activity must be valid for concerning type
  validateActivityConcerning(activityCode: string, concerningType: string): boolean;

  // Children must be in home if concerning is HOME_CHILDREN
  validateChildrenInHome(homeGuid: string, childGuids: string[]): boolean;
}
```

### Cost Allocation Algorithm

```typescript
async function allocateCosts(timeBlock: TimeBlock): Promise<CostAllocation[]> {
  const allocations: CostAllocation[] = [];
  const activityType = await getActivityType(timeBlock.activity_code);

  switch (timeBlock.concerning_type) {
    case 'CHILD':
      // Direct allocation to selected children
      const childCount = timeBlock.child_guids.length;
      const minutesPerChild = Math.floor(timeBlock.duration_minutes / childCount);

      for (const childGuid of timeBlock.child_guids) {
        const child = await getChildWithServicePackage(childGuid);
        allocations.push({
          time_block_id: timeBlock.id,
          child_guid: childGuid,
          service_package: child.service_package,
          cost_report_category: activityType.cost_report_category,
          allocated_minutes: minutesPerChild,
          allocation_method: 'EQUAL'
        });
      }
      break;

    case 'HOME_CHILDREN':
      // Auto-split to all children in home
      const children = await getChildrenInHome(timeBlock.home_guid);
      const perChildMinutes = Math.floor(timeBlock.duration_minutes / children.length);

      for (const child of children) {
        allocations.push({
          time_block_id: timeBlock.id,
          child_guid: child.guid,
          service_package: child.service_package,
          cost_report_category: activityType.cost_report_category,
          allocated_minutes: perChildMinutes,
          allocation_method: 'EQUAL'
        });
      }
      break;

    case 'PRE_PLACEMENT':
    case 'HOME_DEV':
    case 'KINSHIP':
    case 'ADOPTION':
    case 'PREGNANT_PARENTING':
    case 'ADMIN':
    case 'SELF':
      // Allocate to cost center, not children
      const concerningType = await getConcerningType(timeBlock.concerning_type);
      allocations.push({
        time_block_id: timeBlock.id,
        child_guid: null,
        service_package: null,
        cost_center: concerningType.cost_center_type,
        cost_report_category: activityType.cost_report_category,
        allocated_minutes: timeBlock.duration_minutes,
        allocation_method: 'DIRECT'
      });
      break;
  }

  return allocations;
}
```

### Day Completion Rules

```typescript
interface DayCompletionRules {
  // Maximum allowed unlogged time (default: 60 minutes for lunch)
  maxAllowedGapMinutes: number;

  // Minimum logged percentage of work day
  minLoggedPercentage: number;

  // Required fields for completion
  requireEndTime: boolean;

  // Auto-infer breaks if gaps match typical patterns
  autoInferBreaks: boolean;
}

function canCompleteDay(day: WorkforceDay, blocks: TimeBlock[]): CompletionStatus {
  const totalWorkMinutes = differenceInMinutes(day.day_end_time, day.day_start_time);
  const loggedMinutes = blocks.reduce((sum, b) => sum + b.duration_minutes, 0);
  const gaps = calculateGaps(day, blocks);
  const maxGap = Math.max(...gaps.map(g => g.duration));

  return {
    canComplete: maxGap <= 60 && loggedMinutes >= totalWorkMinutes * 0.9,
    issues: [
      maxGap > 60 ? `Gap of ${maxGap} minutes exceeds 60-minute limit` : null,
      loggedMinutes < totalWorkMinutes * 0.9 ? `Only ${(loggedMinutes/totalWorkMinutes*100).toFixed(0)}% of time logged` : null
    ].filter(Boolean)
  };
}
```

---

## SMS Integration

### Twilio Configuration

```typescript
// Environment variables
TWILIO_ACCOUNT_SID=xxx
TWILIO_AUTH_TOKEN=xxx
TWILIO_PHONE_NUMBER=+1xxxxxxxxxx
WORKFORCE_SMS_ENABLED=true
```

### Message Templates

```typescript
const SMS_TEMPLATES = {
  DAY_START: {
    message: "Good morning! Ready to start your work day? Reply:\n1 - Start Work\n2 - Sick\n3 - Time Off\n4 - On-Call",
    expectedResponses: ['1', '2', '3', '4', 'START', 'SICK', 'OFF', 'ONCALL']
  },

  DAY_END: {
    message: "Time to wrap up! Reply END to close your work day, or LATER if you're still working.",
    expectedResponses: ['END', 'LATER']
  },

  REMINDER: {
    message: "Reminder: You haven't logged your day yet. Reply START to begin, or SKIP for today.",
    expectedResponses: ['START', 'SKIP']
  },

  COMPLETION_REQUIRED: {
    message: "You have unlogged time from {date}. Please complete your time log before starting today.",
    link: "{base_url}/workforce/reconcile/{date}"
  }
};
```

### Prompt Schedule

```typescript
interface PromptSchedule {
  // Day start prompt
  dayStartTime: '08:00';      // Send at 8 AM local
  dayStartWindow: 30;          // Don't send if already started within 30 min

  // Day end prompt
  dayEndTime: '17:00';         // Send at 5 PM local
  dayEndWindow: 60;            // Wait 60 min after to send reminder

  // Reminder intervals
  reminderIntervalMinutes: 120; // Every 2 hours
  maxRemindersPerDay: 3;

  // Suppression
  suppressOnSick: true;
  suppressOnTimeOff: true;
  suppressOnWeekends: true;    // Unless on-call
}
```

### Webhook Handler

```typescript
// POST /api/workforce/sms/webhook
async function handleIncomingSMS(req: Request) {
  const { From, Body } = req.body;

  // Find staff by phone number
  const staff = await findStaffByPhone(From);
  if (!staff) return;

  const response = Body.trim().toUpperCase();
  const currentDay = await getCurrentWorkDay(staff.id);

  switch (response) {
    case '1':
    case 'START':
      await startWorkDay(staff.id, 'ACTIVE');
      return reply("Work day started! Have a great day.");

    case '2':
    case 'SICK':
      await startWorkDay(staff.id, 'SICK');
      return reply("Sick day recorded. Feel better soon!");

    case '3':
    case 'OFF':
      await startWorkDay(staff.id, 'TIME_OFF');
      return reply("Time off recorded. Enjoy your day!");

    case '4':
    case 'ONCALL':
      await startWorkDay(staff.id, 'ON_CALL');
      return reply("On-call status set. Reply EPISODE when responding to a call.");

    case 'END':
      await endWorkDay(staff.id);
      const url = `${BASE_URL}/workforce/reconcile/today`;
      return reply(`Day ended. Complete your time log: ${url}`);

    case 'EPISODE':
      if (currentDay?.status === 'ON_CALL') {
        await startOnCallEpisode(currentDay.id);
        return reply("On-call episode started. Reply DONE when resolved.");
      }
      break;

    case 'DONE':
      await endOnCallEpisode(staff.id);
      return reply("Episode recorded. Reply EPISODE for another call.");
  }
}
```

---

## UI/UX Specifications

### Mobile Interface (Primary)

#### Day Start Screen
```
┌─────────────────────────────────────────┐
│  ☀️ Good Morning, Jane                  │
│                                         │
│  Thursday, January 2, 2026              │
│                                         │
│  ┌─────────────────────────────────┐   │
│  │     🚀 Start My Work Day        │   │
│  └─────────────────────────────────┘   │
│                                         │
│  ┌─────────────┐  ┌─────────────────┐  │
│  │ 🤒 Sick     │  │ 🏖️ Time Off    │  │
│  └─────────────┘  └─────────────────┘  │
│                                         │
│  ┌─────────────────────────────────┐   │
│  │     📞 I'm On-Call Today        │   │
│  └─────────────────────────────────┘   │
│                                         │
│  Yesterday: ⚠️ Incomplete - Tap to fix │
└─────────────────────────────────────────┘
```

#### Time Block Entry (Gradient Slider)
```
┌─────────────────────────────────────────┐
│  ← Add Time Block                       │
│─────────────────────────────────────────│
│                                         │
│  TIME                                   │
│  ┌─────────────────────────────────┐   │
│  │ 8a    10a    12p    2p    4p    │   │
│  │ ●━━━━━━━━━━━━━━━●               │   │
│  │ 9:00 AM     11:30 AM            │   │
│  │        2h 30m                   │   │
│  └─────────────────────────────────┘   │
│                                         │
│  ACTIVITY                               │
│  ┌─────────────────────────────────┐   │
│  │ 🏠 Home Visit                 ▼ │   │
│  └─────────────────────────────────┘   │
│                                         │
│  CONCERNING                             │
│  ┌─────────────────────────────────┐   │
│  │ 👨‍👩‍👧‍👦 Johnson Home (3 kids)    ▼ │   │
│  └─────────────────────────────────┘   │
│                                         │
│  ┌─────────────────────────────────┐   │
│  │           💾 Save               │   │
│  └─────────────────────────────────┘   │
└─────────────────────────────────────────┘
```

#### Day Timeline View
```
┌─────────────────────────────────────────┐
│  Today's Timeline        Total: 6h 45m  │
│─────────────────────────────────────────│
│                                         │
│  8:00 ┌──────────────────────────┐      │
│       │ 🚗 Travel - Home Visit   │      │
│       │ To: Johnson Home         │      │
│  8:45 └──────────────────────────┘      │
│                                         │
│  8:45 ┌──────────────────────────┐      │
│       │ 🏠 Home Visit            │      │
│       │ Johnson Home (3 kids)    │      │
│ 11:15 └──────────────────────────┘      │
│                                         │
│ 11:15 ┌──────────────────────────┐      │
│       │ 🚗 Travel - Home Visit   │      │
│ 11:45 └──────────────────────────┘      │
│                                         │
│ 11:45 ░░░░░░░░░░░░░░░░░░░░░░░░░░░      │
│       ░░░ 1h 15m unlogged ░░░░░░░      │
│  1:00 ░░░░░░░░░░░░░░░░░░░░░░░░░░░      │
│                                         │
│  ┌─────────────────────────────────┐   │
│  │        ➕ Add Time Block        │   │
│  └─────────────────────────────────┘   │
└─────────────────────────────────────────┘
```

### Activity Selection UI

Group activities by category with collapsible sections:

```
┌─────────────────────────────────────────┐
│  Select Activity                    ✕   │
│─────────────────────────────────────────│
│  🔍 Search activities...                │
│─────────────────────────────────────────│
│                                         │
│  ⭐ QUICK ACCESS                        │
│  ├─ 🏠 Home Visit                       │
│  ├─ 📞 Phone/Video Contact              │
│  └─ 📝 Documentation                    │
│                                         │
│  📋 CASE MANAGEMENT                   ▼ │
│  ├─ 🏠 Home Visit                       │
│  ├─ 📞 Phone/Video Contact              │
│  ├─ 📝 Documentation/Case Notes         │
│  ├─ 📊 Service Planning                 │
│  ├─ ⚖️ Court Preparation                │
│  ├─ ⚖️ Court Attendance                 │
│  └─ ... more                            │
│                                         │
│  🩺 TREATMENT COORDINATION            ▶ │
│  🚗 TRAVEL                            ▶ │
│  🏥 MEDICAL                           ▶ │
│  📎 ADMINISTRATIVE                    ▶ │
│  🏠 HOME DEVELOPMENT                  ▶ │
│  👶 INTAKE/PRE-PLACEMENT              ▶ │
└─────────────────────────────────────────┘
```

### Concerning Selection UI

Group by type with context-aware options:

```
┌─────────────────────────────────────────┐
│  Who/What is this about?            ✕   │
│─────────────────────────────────────────│
│                                         │
│  👨‍👩‍👧‍👦 PLACED CHILDREN                    │
│  ├─ Marcus S. (Johnson Home)            │
│  ├─ Jaylen S. (Johnson Home)            │
│  ├─ Aaliyah W. (Martinez Home)          │
│  └─ + Select multiple children          │
│                                         │
│  🏠 FOSTER HOMES                        │
│  ├─ Johnson Home (3 children)           │
│  ├─ Martinez Home (1 child)             │
│  └─ Williams Home (2 children)          │
│                                         │
│  📁 PROGRAM-SPECIFIC                    │
│  ├─ 📥 Pre-Placement                    │
│  ├─ 🏠 Home Development                 │
│  ├─ 👨‍👩‍👧 Kinship Support                  │
│  ├─ 💜 Adoption                         │
│  └─ 🤰 Pregnant/Parenting               │
│                                         │
│  📎 OTHER                               │
│  ├─ 🏢 Unassigned/Administrative        │
│  └─ 📚 Self (Training/Development)      │
└─────────────────────────────────────────┘
```

---

## Integration Points

### Existing Continuum System

The workforce system integrates with the existing `continuum_entries` table:

```typescript
// When a time block is created, optionally create a continuum entry
async function createTimeBlockWithContinuum(block: TimeBlockInput): Promise<TimeBlock> {
  const timeBlock = await createTimeBlock(block);

  // Create corresponding continuum entry for audit trail
  if (shouldCreateContinuumEntry(block.activity_code)) {
    const continuumEntry = await createContinuumEntry({
      activity_type: mapActivityToContinuum(block.activity_code),
      activity_status: 'complete',
      timestamp: block.start_time,
      duration_minutes: block.duration_minutes,
      staff_user_id: block.staff_user_id,
      home_guid: block.home_guid,
      entity_guids: block.child_guids,
      metadata: {
        workforce_block_id: timeBlock.id,
        activity_code: block.activity_code,
        concerning_type: block.concerning_type
      }
    });

    // Link back
    await updateTimeBlock(timeBlock.id, { continuum_entry_id: continuumEntry.id });
  }

  return timeBlock;
}
```

### Travel Legs Integration

When travel is logged, link to existing travel tracking:

```typescript
// Reuse travel tracking from shared-core
import { startTravel, endTravel } from '@refuge-house/shared-core/travel';

async function createTravelBlock(input: TravelInput): Promise<TimeBlock> {
  // End any active travel
  const travelLeg = await endTravel({
    staffUserId: input.staff_user_id,
    endLocation: input.end_location,
    mileage: input.mileage
  });

  // Create time block linked to travel leg
  return createTimeBlock({
    workforce_day_id: input.workforce_day_id,
    start_time: travelLeg.start_time,
    end_time: travelLeg.end_time,
    activity_code: input.activity_code, // e.g., 'TRV_HOME_VISIT'
    concerning_type: input.concerning_type,
    home_guid: input.home_guid,
    is_travel: true,
    travel_leg_id: travelLeg.id,
    mileage: travelLeg.calculated_mileage
  });
}
```

### External Data Sources

```typescript
// Get children for a staff member's caseload
async function getStaffCaseload(staffEmail: string): Promise<Child[]> {
  // Query SyncChildrenInPlacement via SyncActiveHomes.CaseManagerEmail
  const homes = await query(`
    SELECT h.FosterHomeGUID, h.FosterHomeName
    FROM SyncActiveHomes h
    WHERE h.CaseManagerEmail = @email
  `, { email: staffEmail });

  const children = await query(`
    SELECT c.ChildGUID, c.ChildName, c.ServicePackage, c.FosterHomeGUID
    FROM SyncChildrenInPlacement c
    WHERE c.FosterHomeGUID IN (${homes.map(h => `'${h.FosterHomeGUID}'`).join(',')})
  `);

  return children;
}
```

---

## Data Migration

### From Existing continuum_entries

If migrating existing continuum entries to workforce:

```sql
-- Create workforce days from existing entries
INSERT INTO workforce_days (staff_user_id, staff_email, staff_name, work_date, status, created_at)
SELECT DISTINCT
    staff_user_id,
    staff_name,
    staff_name,
    CAST(timestamp AS DATE),
    'COMPLETED',
    MIN(timestamp)
FROM continuum_entries
WHERE activity_type IN ('drive_start', 'visit_start', 'visit_end')
  AND is_deleted = 0
GROUP BY staff_user_id, staff_name, CAST(timestamp AS DATE);

-- Migration of actual time blocks would require more complex logic
-- to pair drive_start/drive_end and visit_start/visit_end entries
```

### Activity Type Mapping

```typescript
const CONTINUUM_TO_WORKFORCE_MAP = {
  'drive_start': null,           // Handled specially
  'drive_end': null,             // Handled specially
  'visit_start': 'CM_HOME_VISIT',
  'visit_end': null,             // Close the block
  // Add more mappings as needed
};
```

---

## Cost Allocation Engine

### Texas HHSC Cost Report Categories

| Category | Description | Activity Prefixes |
|----------|-------------|-------------------|
| `CASE_MGMT` | Case Management | CM_, TRANS_, PP_, KIN_, ADOPT_ |
| `TREATMENT_COORD` | Treatment Coordination | TX_ |
| `DIRECT_CARE` | Direct Care | DC_ |
| `MEDICAL` | Medical Services | MED_ |
| `TRAVEL` | Travel/Mileage | TRV_ |
| `ADMIN` | Administrative | ADM_, HDEV_, INTAKE_ |

### Service Package Allocation

```typescript
interface ServicePackageReport {
  servicePackage: string;
  childCount: number;
  allocations: {
    category: CostCategory;
    totalMinutes: number;
    totalHours: number;
  }[];
}

async function generateServicePackageReport(
  startDate: Date,
  endDate: Date
): Promise<ServicePackageReport[]> {
  const allocations = await query(`
    SELECT
      ca.service_package,
      ca.cost_report_category,
      COUNT(DISTINCT ca.child_guid) as child_count,
      SUM(ca.allocated_minutes) as total_minutes
    FROM workforce_cost_allocations ca
    JOIN workforce_time_blocks tb ON ca.time_block_id = tb.id
    JOIN workforce_days wd ON tb.workforce_day_id = wd.id
    WHERE wd.work_date BETWEEN @startDate AND @endDate
      AND ca.service_package IS NOT NULL
    GROUP BY ca.service_package, ca.cost_report_category
    ORDER BY ca.service_package, ca.cost_report_category
  `, { startDate, endDate });

  // Transform to report format
  return transformToReport(allocations);
}
```

### Future: Weighted Distribution

Post-MVP enhancement for manual time distribution:

```typescript
interface WeightedAllocation {
  child_guid: string;
  weight: number;        // 0-100, must sum to 100
  allocated_minutes: number;
}

async function updateBlockWeights(
  blockId: string,
  weights: { childGuid: string; weight: number }[]
): Promise<CostAllocation[]> {
  const block = await getTimeBlock(blockId);
  const totalWeight = weights.reduce((sum, w) => sum + w.weight, 0);

  if (totalWeight !== 100) {
    throw new Error('Weights must sum to 100');
  }

  // Delete existing allocations
  await deleteAllocations(blockId);

  // Create new weighted allocations
  const allocations: CostAllocation[] = [];
  for (const { childGuid, weight } of weights) {
    const minutes = Math.round(block.duration_minutes * weight / 100);
    // Round to nearest 15 minutes
    const roundedMinutes = Math.round(minutes / 15) * 15;

    allocations.push(await createAllocation({
      time_block_id: blockId,
      child_guid: childGuid,
      allocated_minutes: roundedMinutes,
      allocation_percentage: weight,
      allocation_method: 'WEIGHTED'
    }));
  }

  return allocations;
}
```

---

## Environment Variables

```bash
# Database (existing)
AZURE_TENANT_ID=xxx
AZURE_CLIENT_ID=xxx
AZURE_CLIENT_SECRET=xxx
AZURE_KEY_VAULT_NAME=xxx

# Twilio SMS
TWILIO_ACCOUNT_SID=xxx
TWILIO_AUTH_TOKEN=xxx
TWILIO_PHONE_NUMBER=+1xxxxxxxxxx
TWILIO_WEBHOOK_URL=https://app.example.com/api/workforce/sms/webhook

# Workforce Configuration
WORKFORCE_SMS_ENABLED=true
WORKFORCE_DAY_START_PROMPT_TIME=08:00
WORKFORCE_DAY_END_PROMPT_TIME=17:00
WORKFORCE_REMINDER_INTERVAL_MINUTES=120
WORKFORCE_MAX_GAP_MINUTES=60
WORKFORCE_TIME_ZONE=America/Chicago
```

---

## Testing Checklist

### Unit Tests
- [ ] Time block duration validation (15-minute increments)
- [ ] Time block overlap detection
- [ ] Cost allocation algorithm (equal split)
- [ ] Day state machine transitions
- [ ] SMS response parsing

### Integration Tests
- [ ] Create work day flow
- [ ] Add time blocks with allocations
- [ ] Travel integration with travel_legs
- [ ] Continuum entry creation
- [ ] Day reconciliation and completion

### E2E Tests
- [ ] Full day workflow (start → blocks → end → reconcile)
- [ ] SMS day start/end flow
- [ ] Cost report generation
- [ ] Multi-child allocation scenarios

---

## Version History

| Version | Date | Changes |
|---------|------|---------|
| 1.0 | 2026-01-02 | Initial specification |

---

## Related Documents

- [Activity Codes Reference](./workforce-activity-codes.md)
- [Database Architecture](./database-architecture.md)
- [Continuum Logging](./continuum-logging.md)
- [Travel Tracking Architecture](./travel-tracking-architecture.md)

## Mockups

- [Mobile MVP Mockup](./mockups/workforce-mvp-mockup.html)
- [Desktop Mockup](./mockups/workforce-mvp-desktop.html)
- [Time Slider Mockup](./mockups/workforce-time-slider.html)
