-- Add return travel tracking fields to appointments table
-- Run this script to add support for return travel mileage tracking

IF NOT EXISTS (
    SELECT 1 
    FROM sys.columns 
    WHERE object_id = OBJECT_ID('appointments') 
    AND name = 'return_latitude'
)
BEGIN
    ALTER TABLE appointments
    ADD return_latitude DECIMAL(10, 8) NULL
    
    PRINT 'Added return_latitude column to appointments table'
END
ELSE
BEGIN
    PRINT 'return_latitude column already exists'
END
GO

IF NOT EXISTS (
    SELECT 1 
    FROM sys.columns 
    WHERE object_id = OBJECT_ID('appointments') 
    AND name = 'return_longitude'
)
BEGIN
    ALTER TABLE appointments
    ADD return_longitude DECIMAL(11, 8) NULL
    
    PRINT 'Added return_longitude column to appointments table'
END
ELSE
BEGIN
    PRINT 'return_longitude column already exists'
END
GO

IF NOT EXISTS (
    SELECT 1 
    FROM sys.columns 
    WHERE object_id = OBJECT_ID('appointments') 
    AND name = 'return_timestamp'
)
BEGIN
    ALTER TABLE appointments
    ADD return_timestamp DATETIME2(7) NULL
    
    PRINT 'Added return_timestamp column to appointments table'
END
ELSE
BEGIN
    PRINT 'return_timestamp column already exists'
END
GO

IF NOT EXISTS (
    SELECT 1 
    FROM sys.columns 
    WHERE object_id = OBJECT_ID('appointments') 
    AND name = 'return_mileage'
)
BEGIN
    ALTER TABLE appointments
    ADD return_mileage DECIMAL(10, 2) NULL
    
    PRINT 'Added return_mileage column to appointments table'
END
ELSE
BEGIN
    PRINT 'return_mileage column already exists'
END
GO

