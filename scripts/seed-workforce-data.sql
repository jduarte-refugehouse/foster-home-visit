-- ============================================================
-- WORKFORCE TIME TRACKING & T3C COST REPORTING
-- Seed Data Script
--
-- Run this script AFTER create-workforce-tables.sql
-- Populates activity types and concerning types
-- ============================================================

-- ============================================================
-- CONCERNING TYPES
-- ============================================================
PRINT 'Seeding concerning types...';

-- Clear existing data (for re-runs)
DELETE FROM workforce_concerning_types;

INSERT INTO workforce_concerning_types
    (code, name, description, cost_center_type, allows_child_select, allows_home_select, auto_split_children, group_name, display_order)
VALUES
    -- Placed Children Group
    ('CHILD', 'Specific Child(ren)', 'Select specific placed children for direct allocation', 'CHILD_SERVICE_PACKAGE', 1, 0, 0, 'Placed Children', 10),
    ('HOME_CHILDREN', 'Home (All Children)', 'Foster home - time splits equally to all children in placement', 'CHILD_SERVICE_PACKAGE', 0, 1, 1, 'Placed Children', 20),

    -- Program-Specific Group
    ('PRE_PLACEMENT', 'Pre-Placement', 'Intake activities before child is placed', 'PRE_PLACEMENT', 0, 0, 0, 'Program-Specific', 30),
    ('HOME_DEV', 'Home Development', 'Foster home recruitment, training, and development', 'HOME_DEVELOPMENT', 0, 1, 0, 'Program-Specific', 40),
    ('KINSHIP', 'Kinship Support', 'Kinship home-specific support activities', 'KINSHIP_PROGRAM', 0, 1, 0, 'Program-Specific', 50),
    ('ADOPTION', 'Adoption', 'Adoption-related activities', 'ADOPTION', 0, 0, 0, 'Program-Specific', 60),
    ('PREGNANT_PARENTING', 'Pregnant/Parenting', 'Pregnant and parenting program support', 'PP_PROGRAM', 0, 0, 0, 'Program-Specific', 70),

    -- Other Group
    ('ADMIN', 'Unassigned/Administrative', 'General administrative activities not tied to specific children', 'ADMINISTRATIVE', 0, 0, 0, 'Other', 80),
    ('SELF', 'Self (Training/Development)', 'Staff training and professional development', 'STAFF_DEVELOPMENT', 0, 0, 0, 'Other', 90);

PRINT 'Inserted 9 concerning types';
GO

-- ============================================================
-- ACTIVITY TYPES
-- ============================================================
PRINT 'Seeding activity types...';

-- Clear existing data (for re-runs)
DELETE FROM workforce_activity_types;

-- ----------------------------------------
-- CASE MANAGEMENT (CM_)
-- ----------------------------------------
INSERT INTO workforce_activity_types
    (code, name, category, cost_report_category, icon, display_order, is_quick_access)
VALUES
    ('CM_HOME_VISIT', 'Home Visit', 'CM', 'CASE_MGMT', '🏠', 10, 1),
    ('CM_PHONE', 'Phone/Video Contact', 'CM', 'CASE_MGMT', '📞', 20, 1),
    ('CM_DOCS', 'Documentation/Case Notes', 'CM', 'CASE_MGMT', '📝', 30, 1),
    ('CM_SERVICE_PLAN', 'Service Planning', 'CM', 'CASE_MGMT', '📊', 40, 0),
    ('CM_COURT_PREP', 'Court Preparation', 'CM', 'CASE_MGMT', '⚖️', 50, 0),
    ('CM_COURT', 'Court Attendance', 'CM', 'CASE_MGMT', '⚖️', 60, 0),
    ('CM_SCHOOL', 'School Contact/Meeting', 'CM', 'CASE_MGMT', '🏫', 70, 0),
    ('CM_EXT_PROVIDER', 'External Provider Coordination', 'CM', 'CASE_MGMT', '🤝', 80, 0),
    ('CM_PLACEMENT', 'Placement Coordination', 'CM', 'CASE_MGMT', '🔄', 90, 0),
    ('CM_3DAY_ORIENT', '3-Day Orientation', 'CM', 'CASE_MGMT', '📋', 100, 0),
    ('CM_KELLY_BEAR', 'Kelly Bear Training', 'CM', 'CASE_MGMT', '🧸', 110, 0),
    ('CM_RECREATION', 'Recreational Activity', 'CM', 'CASE_MGMT', '⚽', 120, 0),
    ('CM_AFTERCARE', 'Aftercare', 'CM', 'CASE_MGMT', '🌟', 130, 0),
    ('CM_OTHER', 'Case Management - Other', 'CM', 'CASE_MGMT', '📋', 140, 0);

PRINT 'Inserted Case Management activities';

-- ----------------------------------------
-- TREATMENT COORDINATION (TX_)
-- ----------------------------------------
INSERT INTO workforce_activity_types
    (code, name, category, cost_report_category, icon, display_order)
VALUES
    ('TX_TEAM_MTG', 'Treatment Team Meeting', 'TX', 'TREATMENT_COORD', '👥', 10),
    ('TX_THERAPY', 'Therapy Coordination', 'TX', 'TREATMENT_COORD', '🧠', 20),
    ('TX_CRISIS', 'Crisis Intervention', 'TX', 'TREATMENT_COORD', '🚨', 30),
    ('TX_BEHAVIOR', 'Behavioral Support', 'TX', 'TREATMENT_COORD', '📈', 40),
    ('TX_CANS', 'CANS Assessment', 'TX', 'TREATMENT_COORD', '📊', 50),
    ('TX_SAFETY_PLAN', 'Safety Planning', 'TX', 'TREATMENT_COORD', '🛡️', 60),
    ('TX_OTHER', 'Treatment Coordination - Other', 'TX', 'TREATMENT_COORD', '🩺', 70);

PRINT 'Inserted Treatment Coordination activities';

-- ----------------------------------------
-- DIRECT CARE SUPPORT (DC_)
-- ----------------------------------------
INSERT INTO workforce_activity_types
    (code, name, category, cost_report_category, icon, display_order)
VALUES
    ('DC_TRANSPORT_MED', 'Transport - Medical', 'DC', 'DIRECT_CARE', '🚗', 10),
    ('DC_TRANSPORT_SCHOOL', 'Transport - School', 'DC', 'DIRECT_CARE', '🚗', 20),
    ('DC_TRANSPORT_COURT', 'Transport - Court', 'DC', 'DIRECT_CARE', '🚗', 30),
    ('DC_TRANSPORT_VISIT', 'Transport - Visitation', 'DC', 'DIRECT_CARE', '🚗', 40),
    ('DC_TRANSPORT_REC', 'Transport - Recreation', 'DC', 'DIRECT_CARE', '🚗', 50),
    ('DC_SUPERVISION', 'Direct Supervision/Respite', 'DC', 'DIRECT_CARE', '👀', 60),
    ('DC_OTHER', 'Direct Care - Other', 'DC', 'DIRECT_CARE', '🤲', 70);

PRINT 'Inserted Direct Care activities';

-- ----------------------------------------
-- MEDICAL (MED_)
-- ----------------------------------------
INSERT INTO workforce_activity_types
    (code, name, category, cost_report_category, icon, display_order)
VALUES
    ('MED_APPT', 'Medical Appointment', 'MED', 'MEDICAL', '🏥', 10),
    ('MED_DENTAL', 'Dental Appointment', 'MED', 'MEDICAL', '🦷', 20),
    ('MED_MENTAL_HEALTH', 'Mental Health Appointment', 'MED', 'MEDICAL', '🧠', 30),
    ('MED_PSYCH', 'Psychiatric Appointment', 'MED', 'MEDICAL', '💊', 40),
    ('MED_MEDICATION', 'Medication Coordination', 'MED', 'MEDICAL', '💉', 50),
    ('MED_OTHER', 'Medical - Other', 'MED', 'MEDICAL', '🩺', 60);

PRINT 'Inserted Medical activities';

-- ----------------------------------------
-- TRAVEL (TRV_) - is_travel = 1
-- ----------------------------------------
INSERT INTO workforce_activity_types
    (code, name, category, cost_report_category, icon, is_travel, display_order)
VALUES
    ('TRV_HOME_VISIT', 'Travel - Home Visit', 'TRV', 'TRAVEL', '🚗', 1, 10),
    ('TRV_COURT', 'Travel - Court', 'TRV', 'TRAVEL', '🚗', 1, 20),
    ('TRV_MEDICAL', 'Travel - Medical', 'TRV', 'TRAVEL', '🚗', 1, 30),
    ('TRV_SCHOOL', 'Travel - School', 'TRV', 'TRAVEL', '🚗', 1, 40),
    ('TRV_VISITATION', 'Travel - Visitation', 'TRV', 'TRAVEL', '🚗', 1, 50),
    ('TRV_ADMIN', 'Travel - Administrative', 'TRV', 'TRAVEL', '🚗', 1, 60),
    ('TRV_TRAINING', 'Travel - Training', 'TRV', 'TRAVEL', '🚗', 1, 70),
    ('TRV_ADOPTION', 'Travel - Adoption', 'TRV', 'TRAVEL', '🚗', 1, 80),
    ('TRV_OTHER', 'Travel - Other', 'TRV', 'TRAVEL', '🚗', 1, 90);

PRINT 'Inserted Travel activities';

-- ----------------------------------------
-- ADMINISTRATIVE (ADM_)
-- ----------------------------------------
INSERT INTO workforce_activity_types
    (code, name, category, cost_report_category, icon, display_order)
VALUES
    ('ADM_STAFF_MTG', 'Staff Meeting', 'ADM', 'ADMIN', '👥', 10),
    ('ADM_SUPERVISION', 'Supervision (1:1)', 'ADM', 'ADMIN', '💬', 20),
    ('ADM_TRAINING', 'Training', 'ADM', 'ADMIN', '📚', 30),
    ('ADM_LICENSING', 'Licensing/Compliance', 'ADM', 'ADMIN', '📜', 40),
    ('ADM_GENERAL', 'General Administrative', 'ADM', 'ADMIN', '🏢', 50),
    ('ADM_OTHER', 'Administrative - Other', 'ADM', 'ADMIN', '📎', 60);

PRINT 'Inserted Administrative activities';

-- ----------------------------------------
-- TRANSITIONAL (TRANS_)
-- ----------------------------------------
INSERT INTO workforce_activity_types
    (code, name, category, cost_report_category, icon, display_order)
VALUES
    ('TRANS_PAL', 'PAL (Preparation for Adult Living)', 'TRANS', 'CASE_MGMT', '🎓', 10),
    ('TRANS_ANSELL_CASEY', 'Ansell-Casey Assessment', 'TRANS', 'CASE_MGMT', '📊', 20),
    ('TRANS_RESOURCE_DEV', 'Resource Development', 'TRANS', 'CASE_MGMT', '🔧', 30),
    ('TRANS_OTHER', 'Transitional - Other', 'TRANS', 'CASE_MGMT', '🚀', 40);

PRINT 'Inserted Transitional activities';

-- ----------------------------------------
-- PREGNANT/PARENTING (PP_)
-- ----------------------------------------
INSERT INTO workforce_activity_types
    (code, name, category, cost_report_category, icon, display_order)
VALUES
    ('PP_TRAINING', 'Training', 'PP', 'CASE_MGMT', '📚', 10),
    ('PP_RESOURCE_DEV', 'Resource Development', 'PP', 'CASE_MGMT', '🔧', 20),
    ('PP_HOME_VISIT', 'Home Visit', 'PP', 'CASE_MGMT', '🏠', 30),
    ('PP_OTHER', 'Pregnant/Parenting - Other', 'PP', 'CASE_MGMT', '🤰', 40);

PRINT 'Inserted Pregnant/Parenting activities';

-- ----------------------------------------
-- KINSHIP (KIN_)
-- ----------------------------------------
INSERT INTO workforce_activity_types
    (code, name, category, cost_report_category, icon, display_order)
VALUES
    ('KIN_TRAINING', 'Training', 'KIN', 'CASE_MGMT', '📚', 10),
    ('KIN_RESOURCE_DEV', 'Resource Development', 'KIN', 'CASE_MGMT', '🔧', 20),
    ('KIN_HOME_VISIT', 'Home Visit', 'KIN', 'CASE_MGMT', '🏠', 30),
    ('KIN_SUPPORT', 'Support Services', 'KIN', 'CASE_MGMT', '🤝', 40),
    ('KIN_OTHER', 'Kinship - Other', 'KIN', 'CASE_MGMT', '👨‍👩‍👧', 50);

PRINT 'Inserted Kinship activities';

-- ----------------------------------------
-- ADOPTION (ADOPT_)
-- ----------------------------------------
INSERT INTO workforce_activity_types
    (code, name, category, cost_report_category, icon, display_order)
VALUES
    ('ADOPT_DOCS', 'Documentation', 'ADOPT', 'CASE_MGMT', '📝', 10),
    ('ADOPT_COURT', 'Court', 'ADOPT', 'CASE_MGMT', '⚖️', 20),
    ('ADOPT_HOME_VISIT', 'Home Visit', 'ADOPT', 'CASE_MGMT', '🏠', 30),
    ('ADOPT_HOME_STUDY', 'Home Study', 'ADOPT', 'CASE_MGMT', '📋', 40),
    ('ADOPT_MATCHING', 'Matching/Placement', 'ADOPT', 'CASE_MGMT', '💜', 50),
    ('ADOPT_OTHER', 'Adoption - Other', 'ADOPT', 'CASE_MGMT', '💜', 60);

PRINT 'Inserted Adoption activities';

-- ----------------------------------------
-- HOME DEVELOPMENT (HDEV_)
-- ----------------------------------------
INSERT INTO workforce_activity_types
    (code, name, category, cost_report_category, icon, display_order)
VALUES
    ('HDEV_RECRUITMENT', 'Recruitment', 'HDEV', 'ADMIN', '📢', 10),
    ('HDEV_TRAINING', 'Training', 'HDEV', 'ADMIN', '📚', 20),
    ('HDEV_HOME_STUDY', 'Home Study', 'HDEV', 'ADMIN', '📋', 30),
    ('HDEV_LICENSING', 'Licensing', 'HDEV', 'ADMIN', '📜', 40),
    ('HDEV_SUPPORT', 'Support/Retention', 'HDEV', 'ADMIN', '🤝', 50),
    ('HDEV_OTHER', 'Home Development - Other', 'HDEV', 'ADMIN', '🏠', 60);

PRINT 'Inserted Home Development activities';

-- ----------------------------------------
-- INTAKE/PRE-PLACEMENT (INTAKE_)
-- ----------------------------------------
INSERT INTO workforce_activity_types
    (code, name, category, cost_report_category, icon, display_order)
VALUES
    ('INTAKE_REFERRAL', 'Referral Review', 'INTAKE', 'ADMIN', '📥', 10),
    ('INTAKE_ASSESSMENT', 'Assessment', 'INTAKE', 'ADMIN', '📊', 20),
    ('INTAKE_MATCHING', 'Matching', 'INTAKE', 'ADMIN', '🔄', 30),
    ('INTAKE_COORDINATION', 'Coordination', 'INTAKE', 'ADMIN', '🤝', 40),
    ('INTAKE_OTHER', 'Intake - Other', 'INTAKE', 'ADMIN', '📋', 50);

PRINT 'Inserted Intake/Pre-Placement activities';
GO

-- ============================================================
-- SUMMARY
-- ============================================================
PRINT '';
PRINT '========================================';
PRINT 'Workforce Seed Data Complete';
PRINT '========================================';

SELECT 'Activity Types' as [Table], COUNT(*) as [Count] FROM workforce_activity_types
UNION ALL
SELECT 'Concerning Types' as [Table], COUNT(*) as [Count] FROM workforce_concerning_types;

PRINT '';
PRINT 'Activity Types by Category:';

SELECT category, COUNT(*) as count
FROM workforce_activity_types
GROUP BY category
ORDER BY category;

PRINT '';
PRINT 'Quick Access Activities:';

SELECT code, name
FROM workforce_activity_types
WHERE is_quick_access = 1
ORDER BY display_order;

PRINT '========================================';
GO
