-- Add 'staff_training' to the appointment_type constraint
-- This allows creating appointments with type 'staff_training'

-- First, drop the existing constraint
IF EXISTS (
    SELECT * FROM sys.check_constraints 
    WHERE name = 'CK_appointments_type'
)
BEGIN
    ALTER TABLE [dbo].[appointments] DROP CONSTRAINT [CK_appointments_type]
    PRINT 'Dropped existing CK_appointments_type constraint'
END
GO

-- Add the constraint with 'staff_training' included
ALTER TABLE [dbo].[appointments] 
WITH CHECK ADD CONSTRAINT [CK_appointments_type] 
CHECK (([appointment_type]='other' OR [appointment_type]='training' OR [appointment_type]='staff_training' OR [appointment_type]='court_hearing' OR [appointment_type]='follow_up' OR [appointment_type]='assessment' OR [appointment_type]='meeting' OR [appointment_type]='home_visit'))
GO

PRINT 'Added staff_training to appointment_type constraint'
GO


