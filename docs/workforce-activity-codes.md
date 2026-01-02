# Workforce MVP - Activity Types & Codes Reference

## Overview

Each activity has a **stable code** that remains constant even if the display label changes. This ensures data integrity for cost reporting.

---

## Activity Code Structure

```
Format: {CATEGORY}_{ACTIVITY}

Examples:
  CM_HOME_VISIT     → Case Management: Home Visit
  TR_HOME_VISIT     → Travel: Home Visit
  MED_PSYCH         → Medical: Psychiatric Appointment
  ADOPT_COURT       → Adoption: Court
```

---

## Concerning Types

The "Concerning" field identifies WHO or WHAT the activity is about. This determines cost allocation.

| Code | Label | Description | Cost Allocation |
|------|-------|-------------|-----------------|
| `CHILD` | Child(ren) | Specific placed child(ren) | Direct to child's service package |
| `HOME_CHILDREN` | Home (Children) | Foster home - splits to children | Equal split to all children in home |
| `HOME_MGMT` | Home Management | Foster home management activities | Home development cost center |
| `PRE_PLACEMENT` | Pre-Placement | Intake activities before placement | Pre-placement cost center |
| `HOME_DEV` | Home Development | Foster home recruitment/development | Home development cost center |
| `KINSHIP` | Kinship Support | Kinship home-specific support | Kinship program cost center |
| `ADOPTION` | Adoption | Adoption-related activities | Adoption cost center |
| `PREGNANT_PARENTING` | Pregnant/Parenting | Pregnant/parenting program support | P/P program cost center |
| `ADMIN` | Unassigned/Admin | General administrative | Administrative overhead |
| `SELF` | Self | Staff training/development | Staff development cost center |

---

## Activity Categories & Codes

### CASE MANAGEMENT (CM_)

| Code | Label | Notes |
|------|-------|-------|
| `CM_HOME_VISIT` | Home Visit | Regular home visit |
| `CM_PHONE` | Phone/Video Contact | Remote contact with family |
| `CM_DOCS` | Documentation/Case Notes | Case documentation |
| `CM_SERVICE_PLAN` | Service Planning | ISP, treatment planning |
| `CM_COURT_PREP` | Court Preparation | Preparing for court |
| `CM_COURT` | Court Attendance | Attending court |
| `CM_SCHOOL` | School Contact/Meeting | School-related coordination |
| `CM_EXT_PROVIDER` | External Provider Coordination | Coordinating with outside providers |
| `CM_PLACEMENT` | Placement Coordination | Placement-related activities |
| `CM_3DAY_ORIENT` | 3-Day Orientation | New placement orientation |
| `CM_KELLY_BEAR` | Kelly Bear Training | Kelly Bear curriculum delivery |
| `CM_RECREATION` | Recreational Activity | Youth recreational activities |
| `CM_AFTERCARE` | Aftercare | Post-placement aftercare support |
| `CM_OTHER` | Case Management - Other | Other case management activities |

### TREATMENT COORDINATION (TX_)

| Code | Label | Notes |
|------|-------|-------|
| `TX_TEAM_MTG` | Treatment Team Meeting | Treatment team meetings |
| `TX_THERAPY` | Therapy Coordination | Coordinating therapy services |
| `TX_CRISIS` | Crisis Intervention | Crisis response |
| `TX_BEHAVIOR` | Behavioral Support | Behavioral intervention |
| `TX_CANS` | CANS Assessment | CANS administration |
| `TX_SAFETY_PLAN` | Safety Planning | Safety plan development/review |
| `TX_OTHER` | Treatment Coordination - Other | Other treatment activities |

### DIRECT CARE SUPPORT (DC_)

| Code | Label | Notes |
|------|-------|-------|
| `DC_TRANSPORT_MED` | Transport - Medical | Transportation to medical |
| `DC_TRANSPORT_SCHOOL` | Transport - School | Transportation to school |
| `DC_TRANSPORT_COURT` | Transport - Court | Transportation to court |
| `DC_TRANSPORT_VISIT` | Transport - Visitation | Transportation to family visits |
| `DC_TRANSPORT_REC` | Transport - Recreation | Transportation to activities |
| `DC_SUPERVISION` | Direct Supervision/Respite | Direct care supervision |
| `DC_OTHER` | Direct Care - Other | Other direct care activities |

### MEDICAL (MED_)

| Code | Label | Notes |
|------|-------|-------|
| `MED_APPT` | Medical Appointment | General medical appointments |
| `MED_DENTAL` | Dental Appointment | Dental appointments |
| `MED_MENTAL_HEALTH` | Mental Health Appointment | MH appointments (non-psychiatric) |
| `MED_PSYCH` | Psychiatric Appointment | Psychiatric appointments |
| `MED_MEDICATION` | Medication Coordination | Medication management |
| `MED_OTHER` | Medical - Other | Other medical activities |

### TRAVEL (TRV_)

| Code | Label | Notes |
|------|-------|-------|
| `TRV_HOME_VISIT` | Travel - Home Visit | Travel to/from home visits |
| `TRV_COURT` | Travel - Court | Travel to/from court |
| `TRV_MEDICAL` | Travel - Medical | Travel to/from medical |
| `TRV_SCHOOL` | Travel - School | Travel to/from school |
| `TRV_VISITATION` | Travel - Visitation | Travel to/from family visits |
| `TRV_ADMIN` | Travel - Administrative | Travel for admin purposes |
| `TRV_TRAINING` | Travel - Training | Travel to training/conferences |
| `TRV_ADOPTION` | Travel - Adoption | Travel for adoption activities |
| `TRV_OTHER` | Travel - Other | Other travel |

### ADMINISTRATIVE (ADM_)

| Code | Label | Notes |
|------|-------|-------|
| `ADM_STAFF_MTG` | Staff Meeting | Team/staff meetings |
| `ADM_SUPERVISION` | Supervision (1:1) | Supervisory meetings |
| `ADM_TRAINING` | Training | Staff training activities |
| `ADM_LICENSING` | Licensing/Compliance | Licensing activities |
| `ADM_GENERAL` | General Administrative | General admin work |
| `ADM_OTHER` | Administrative - Other | Other admin activities |

### TRANSITIONAL (TRANS_)

| Code | Label | Notes |
|------|-------|-------|
| `TRANS_PAD` | PAD | Preparation for Adult Living |
| `TRANS_ANSELL_CASEY` | Ansell-Casey Assessment | Ansell-Casey Life Skills assessment |
| `TRANS_RESOURCE_DEV` | Resource Development | Transitional resource development |
| `TRANS_OTHER` | Transitional - Other | Other transitional activities |

### PREGNANT/PARENTING SUPPORT (PP_)

| Code | Label | Notes |
|------|-------|-------|
| `PP_TRAINING` | Training | P/P program training |
| `PP_RESOURCE_DEV` | Resource Development | P/P resource development |
| `PP_HOME_VISIT` | Home Visit | P/P specific home visit |
| `PP_OTHER` | Pregnant/Parenting - Other | Other P/P activities |

### KINSHIP HOME SUPPORT (KIN_)

| Code | Label | Notes |
|------|-------|-------|
| `KIN_TRAINING` | Training | Kinship caregiver training |
| `KIN_RESOURCE_DEV` | Resource Development | Kinship resource development |
| `KIN_HOME_VISIT` | Home Visit | Kinship home visit |
| `KIN_SUPPORT` | Support Services | General kinship support |
| `KIN_OTHER` | Kinship - Other | Other kinship activities |

### ADOPTION (ADOPT_)

| Code | Label | Notes |
|------|-------|-------|
| `ADOPT_DOCS` | Documentation | Adoption documentation |
| `ADOPT_COURT` | Court | Adoption court proceedings |
| `ADOPT_HOME_VISIT` | Home Visit | Adoption home visits |
| `ADOPT_HOME_STUDY` | Home Study | Adoption home studies |
| `ADOPT_MATCHING` | Matching/Placement | Adoption matching activities |
| `ADOPT_OTHER` | Adoption - Other | Other adoption activities |

### HOME DEVELOPMENT (HDEV_)

| Code | Label | Notes |
|------|-------|-------|
| `HDEV_RECRUITMENT` | Recruitment | Foster home recruitment |
| `HDEV_TRAINING` | Training | Foster parent training |
| `HDEV_HOME_STUDY` | Home Study | Initial/renewal home studies |
| `HDEV_LICENSING` | Licensing | Home licensing activities |
| `HDEV_SUPPORT` | Support/Retention | Foster parent support |
| `HDEV_OTHER` | Home Development - Other | Other home dev activities |

### INTAKE/PRE-PLACEMENT (INTAKE_)

| Code | Label | Notes |
|------|-------|-------|
| `INTAKE_REFERRAL` | Referral Review | Reviewing placement referrals |
| `INTAKE_ASSESSMENT` | Assessment | Pre-placement assessment |
| `INTAKE_MATCHING` | Matching | Placement matching activities |
| `INTAKE_COORDINATION` | Coordination | Intake coordination |
| `INTAKE_OTHER` | Intake - Other | Other intake activities |

---

## Cost Report Category Mapping

Each activity code maps to a Texas HHSC cost report category:

| Activity Prefix | Cost Report Category |
|-----------------|---------------------|
| `CM_` | Case Management |
| `TX_` | Treatment Coordination |
| `DC_` | Direct Care |
| `MED_` | Medical |
| `TRV_` | Travel (allocated based on purpose) |
| `ADM_` | Administrative |
| `TRANS_` | Case Management (Transitional) |
| `PP_` | Case Management (P/P Program) |
| `KIN_` | Case Management (Kinship) |
| `ADOPT_` | Case Management (Adoption) |
| `HDEV_` | Administrative (Home Development) |
| `INTAKE_` | Administrative (Intake) |

---

## Database Schema

```sql
-- Activity Types (configurable)
activity_types (
    id                  UUID PRIMARY KEY,
    code                VARCHAR(50) UNIQUE NOT NULL,  -- Stable code, never changes

    -- Display
    name                VARCHAR(100) NOT NULL,        -- Can be updated
    description         TEXT,
    category            VARCHAR(50) NOT NULL,         -- CM, TX, MED, etc.
    icon                VARCHAR(20),                  -- Emoji for UI

    -- Cost Reporting
    cost_report_category VARCHAR(50) NOT NULL,        -- Maps to HHSC category

    -- Behavior
    is_travel           BOOLEAN DEFAULT FALSE,        -- Triggers mileage calc
    requires_concerning BOOLEAN DEFAULT TRUE,         -- Must specify concerning
    valid_concerning    JSONB,                        -- Which concerning types allowed

    -- UI
    display_order       INT,
    is_quick_access     BOOLEAN DEFAULT FALSE,        -- Show in quick-pick
    is_active           BOOLEAN DEFAULT TRUE,

    created_at          TIMESTAMP,
    updated_at          TIMESTAMP
)

-- Concerning Types (configurable)
concerning_types (
    id                  UUID PRIMARY KEY,
    code                VARCHAR(50) UNIQUE NOT NULL,
    name                VARCHAR(100) NOT NULL,
    description         TEXT,

    -- Cost Allocation
    cost_center_type    VARCHAR(50),                  -- How costs are allocated
    allows_child_select BOOLEAN DEFAULT FALSE,        -- Can select specific children
    allows_home_select  BOOLEAN DEFAULT FALSE,        -- Can select specific home
    auto_split_children BOOLEAN DEFAULT FALSE,        -- Auto-split to children in home

    display_order       INT,
    is_active           BOOLEAN DEFAULT TRUE
)
```

---

## Future Feature: Weighted Distribution

**MVP Behavior:**
- When multiple children are selected, time is split equally
- Example: 1:30 with 2 children → 0:45 each

**Post-MVP Enhancement:**
- Allow manual adjustment of distribution
- UI: Slider or numeric input per child
- Example: 1:30 with 2 children → User adjusts to 1:00 / 0:30

```
┌─────────────────────────────────────────────────────────────────┐
│  Time Distribution                                              │
│                                                                 │
│  Total: 1:30                                                    │
│                                                                 │
│  Marcus S.    [════════════════════░░░░░░░░░░]    1:00 (67%)   │
│  Jaylen S.    [════════░░░░░░░░░░░░░░░░░░░░░░]    0:30 (33%)   │
│                                                                 │
│  [Reset to Equal]                                               │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

---

## Version History

| Version | Date | Changes |
|---------|------|---------|
| 1.0 | 2026-01-02 | Initial activity codes defined |

