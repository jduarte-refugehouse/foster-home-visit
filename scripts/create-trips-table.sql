-- Add journey_id column to existing Trips table
-- This links Trips records to travel_legs via journey_id
-- Allows creating trip record when journey starts, updating when it completes

IF NOT EXISTS (
    SELECT 1 
    FROM sys.columns 
    WHERE object_id = OBJECT_ID('dbo.Trips') 
    AND name = 'JourneyID'
)
BEGIN
    ALTER TABLE [dbo].[Trips]
    ADD [JourneyID] [uniqueidentifier] NULL;
    
    PRINT 'Added JourneyID column to Trips table.'
END
ELSE
BEGIN
    PRINT 'JourneyID column already exists in Trips table.'
END
GO

-- Add index for journey_id lookups
IF NOT EXISTS (
    SELECT 1 
    FROM sys.indexes 
    WHERE name = 'IX_Trips_JourneyID' 
    AND object_id = OBJECT_ID('dbo.Trips')
)
BEGIN
    CREATE INDEX [IX_Trips_JourneyID] 
    ON [dbo].[Trips] ([JourneyID])
    WHERE [JourneyID] IS NOT NULL;
    
    PRINT 'Created index IX_Trips_JourneyID.'
END
ELSE
BEGIN
    PRINT 'Index IX_Trips_JourneyID already exists.'
END
GO
