-- =============================================
-- Add Phone Number to app_users Table
-- =============================================
-- This script adds a phone number field to the app_users table
-- to store user contact information for on-call assignments
-- =============================================

USE RadiusBifrost;
GO

-- Add phone number column to app_users
IF NOT EXISTS (
    SELECT * 
    FROM INFORMATION_SCHEMA.COLUMNS 
    WHERE TABLE_NAME = 'app_users' 
    AND COLUMN_NAME = 'phone'
)
BEGIN
    ALTER TABLE [dbo].[app_users]
    ADD [phone] [nvarchar](20) NULL;
    
    PRINT 'Successfully added phone column to app_users table';
END
ELSE
BEGIN
    PRINT 'Phone column already exists in app_users table';
END
GO

-- Grant permissions to v0_application_role
GRANT SELECT, UPDATE ON [dbo].[app_users] TO [v0_application_role];
GO

PRINT 'Phone number field added to app_users table successfully!';
PRINT 'Users can now have their contact information stored centrally.';
GO

