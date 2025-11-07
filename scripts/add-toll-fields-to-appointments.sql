-- Add toll-related fields to appointments table
-- Run this script to add support for toll tracking and reimbursement

IF NOT EXISTS (
    SELECT 1 
    FROM sys.columns 
    WHERE object_id = OBJECT_ID('appointments') 
    AND name = 'estimated_toll_cost'
)
BEGIN
    ALTER TABLE appointments
    ADD estimated_toll_cost DECIMAL(10, 2) NULL
    
    PRINT 'Added estimated_toll_cost column to appointments table'
END
ELSE
BEGIN
    PRINT 'estimated_toll_cost column already exists'
END
GO

IF NOT EXISTS (
    SELECT 1 
    FROM sys.columns 
    WHERE object_id = OBJECT_ID('appointments') 
    AND name = 'toll_confirmed'
)
BEGIN
    ALTER TABLE appointments
    ADD toll_confirmed BIT NULL DEFAULT 0
    
    PRINT 'Added toll_confirmed column to appointments table'
END
ELSE
BEGIN
    PRINT 'toll_confirmed column already exists'
END
GO

IF NOT EXISTS (
    SELECT 1 
    FROM sys.columns 
    WHERE object_id = OBJECT_ID('appointments') 
    AND name = 'actual_toll_cost'
)
BEGIN
    ALTER TABLE appointments
    ADD actual_toll_cost DECIMAL(10, 2) NULL
    
    PRINT 'Added actual_toll_cost column to appointments table'
END
ELSE
BEGIN
    PRINT 'actual_toll_cost column already exists'
END
GO

