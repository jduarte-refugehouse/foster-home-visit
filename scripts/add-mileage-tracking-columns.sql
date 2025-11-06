-- Add mileage tracking columns to appointments table
-- This allows tracking GPS locations for "Start Drive" and "Arrived" buttons
-- and calculates driving distance using Google Directions API

ALTER TABLE [dbo].[appointments]
ADD 
    [start_drive_latitude] [decimal](9, 6) NULL,
    [start_drive_longitude] [decimal](9, 6) NULL,
    [start_drive_timestamp] [datetime2](7) NULL,
    [arrived_latitude] [decimal](9, 6) NULL,
    [arrived_longitude] [decimal](9, 6) NULL,
    [arrived_timestamp] [datetime2](7) NULL,
    [calculated_mileage] [decimal](10, 2) NULL;

GO

-- Add indexes for efficient querying
CREATE NONCLUSTERED INDEX [IX_appointments_start_drive_timestamp] 
ON [dbo].[appointments] ([start_drive_timestamp])
WHERE [start_drive_timestamp] IS NOT NULL;

CREATE NONCLUSTERED INDEX [IX_appointments_arrived_timestamp] 
ON [dbo].[appointments] ([arrived_timestamp])
WHERE [arrived_timestamp] IS NOT NULL;

GO

PRINT 'Mileage tracking columns added to appointments table successfully';

