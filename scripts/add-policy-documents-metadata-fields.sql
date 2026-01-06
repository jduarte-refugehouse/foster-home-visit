-- Add additional metadata fields to policy_documents table
-- Run this after the initial table creation to add new fields

USE [RadiusBifrost]
GO

-- Add new metadata fields
ALTER TABLE [dbo].[policy_documents]
ADD 
    [t3c_packages] NVARCHAR(MAX) NULL, -- JSON array of applicable T3C packages
    [domain] NVARCHAR(100) NULL, -- Functional domain (Intake, Discharge, Service Planning, Direct Care, etc.)
    [tags] NVARCHAR(MAX) NULL; -- JSON array of tags for flexible categorization

GO

PRINT 'Additional metadata fields added successfully'
GO

