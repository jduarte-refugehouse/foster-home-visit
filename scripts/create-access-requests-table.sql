-- @shared-core
-- This script should be moved to packages/shared-core/scripts/create-access-requests-table.sql
-- Creates the access_requests table for managing user access requests to microservices

SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO

CREATE TABLE [dbo].[access_requests](
	[id] [uniqueidentifier] NOT NULL DEFAULT NEWID(),
	[user_id] [uniqueidentifier] NOT NULL,
	[microservice_id] [uniqueidentifier] NOT NULL,
	[requested_at] [datetime2](7) NOT NULL DEFAULT GETDATE(),
	[status] [nvarchar](50) NOT NULL DEFAULT 'pending', -- pending, approved, denied
	[reviewed_by] [uniqueidentifier] NULL,
	[reviewed_at] [datetime2](7) NULL,
	[notes] [nvarchar](max) NULL,
PRIMARY KEY CLUSTERED 
(
	[id] ASC
)WITH (STATISTICS_NORECOMPUTE = OFF, IGNORE_DUP_KEY = OFF, OPTIMIZE_FOR_SEQUENTIAL_KEY = OFF) ON [PRIMARY]
) ON [PRIMARY] TEXTIMAGE_ON [PRIMARY]
GO

-- Add foreign key constraints
ALTER TABLE [dbo].[access_requests]  WITH CHECK ADD FOREIGN KEY([user_id])
REFERENCES [dbo].[app_users] ([id])
GO

ALTER TABLE [dbo].[access_requests]  WITH CHECK ADD FOREIGN KEY([microservice_id])
REFERENCES [dbo].[microservice_apps] ([id])
GO

ALTER TABLE [dbo].[access_requests]  WITH CHECK ADD FOREIGN KEY([reviewed_by])
REFERENCES [dbo].[app_users] ([id])
GO

-- Create unique constraint to prevent duplicate pending requests
-- One pending request per user per microservice
CREATE UNIQUE NONCLUSTERED INDEX [IX_access_requests_user_microservice_pending]
ON [dbo].[access_requests] ([user_id], [microservice_id])
WHERE [status] = 'pending'
GO

-- Create index for faster lookups by status
CREATE NONCLUSTERED INDEX [IX_access_requests_status]
ON [dbo].[access_requests] ([status], [requested_at])
GO

-- Create index for faster lookups by microservice
CREATE NONCLUSTERED INDEX [IX_access_requests_microservice]
ON [dbo].[access_requests] ([microservice_id], [status], [requested_at])
GO

