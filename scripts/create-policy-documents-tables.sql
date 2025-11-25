-- Policy Documents Management Tables
-- Tracks document metadata, versions, and approvals for policies and procedures
-- Git is the source of truth for document content; database tracks metadata and workflow

-- Main document registry
CREATE TABLE [dbo].[policy_documents] (
    [document_id] UNIQUEIDENTIFIER NOT NULL DEFAULT NEWID(),
    [document_number] NVARCHAR(50) NULL, -- e.g., "FC-T3C-01", "FC2-01"
    [document_name] NVARCHAR(500) NOT NULL,
    [document_type] NVARCHAR(50) NOT NULL, -- 'policy', 'procedure', 'combined', 'package-specific', 'regulatory', 'guide', 'job-description', 'plan', 'model', 'historical'
    [category] NVARCHAR(100) NOT NULL, -- 'operational', 'regulatory-reference', 'historical', 'supporting'
    [git_path] NVARCHAR(1000) NOT NULL, -- Full path in repository (relative to submodule root)
    [git_sha] NVARCHAR(40) NULL, -- Current Git commit SHA
    [status] NVARCHAR(50) NOT NULL DEFAULT 'active', -- 'active', 'draft', 'pending-approval', 'archived'
    [effective_date] DATE NULL,
    [next_review_date] DATE NULL, -- For compliance tracking
    [review_frequency_months] INT NULL DEFAULT 12, -- Default review schedule in months
    [created_at] DATETIME2(7) NOT NULL DEFAULT GETUTCDATE(),
    [updated_at] DATETIME2(7) NOT NULL DEFAULT GETUTCDATE(),
    [created_by_user_id] NVARCHAR(255) NULL,
    
    CONSTRAINT [PK_policy_documents] PRIMARY KEY CLUSTERED ([document_id] ASC),
    CONSTRAINT [UQ_policy_documents_git_path] UNIQUE NONCLUSTERED ([git_path] ASC)
);

-- Version history (metadata only, content in Git)
CREATE TABLE [dbo].[policy_document_versions] (
    [version_id] UNIQUEIDENTIFIER NOT NULL DEFAULT NEWID(),
    [document_id] UNIQUEIDENTIFIER NOT NULL,
    [version_number] NVARCHAR(50) NULL, -- e.g., "7/14/25.2"
    [git_sha] NVARCHAR(40) NOT NULL, -- Git commit SHA for this version
    [git_path] NVARCHAR(1000) NOT NULL, -- Path at time of version
    [action] NVARCHAR(50) NOT NULL, -- 'add', 'replace', 'archive'
    [effective_date] DATE NULL,
    [revision_notes] NVARCHAR(MAX) NULL,
    [created_at] DATETIME2(7) NOT NULL DEFAULT GETUTCDATE(),
    [created_by_user_id] NVARCHAR(255) NULL,
    
    CONSTRAINT [PK_policy_document_versions] PRIMARY KEY CLUSTERED ([version_id] ASC),
    CONSTRAINT [FK_policy_document_versions_documents] FOREIGN KEY ([document_id]) 
        REFERENCES [dbo].[policy_documents] ([document_id]) ON DELETE CASCADE
);

-- Approval workflow tracking
CREATE TABLE [dbo].[policy_document_approvals] (
    [approval_id] UNIQUEIDENTIFIER NOT NULL DEFAULT NEWID(),
    [document_id] UNIQUEIDENTIFIER NOT NULL,
    [version_id] UNIQUEIDENTIFIER NULL, -- Links to specific version if applicable
    [approval_status] NVARCHAR(50) NOT NULL DEFAULT 'pending', -- 'pending', 'approved', 'rejected'
    [approval_type] NVARCHAR(50) NOT NULL, -- 'board', 'executive', 'designee', 'compliance'
    -- Note: Approval type determined by document_type - Policies require 'board', Procedures require 'executive' or 'designee'
    [requested_by_user_id] NVARCHAR(255) NOT NULL,
    [requested_at] DATETIME2(7) NOT NULL DEFAULT GETUTCDATE(),
    [approved_by_user_id] NVARCHAR(255) NULL,
    [approved_at] DATETIME2(7) NULL,
    [approval_notes] NVARCHAR(MAX) NULL,
    
    CONSTRAINT [PK_policy_document_approvals] PRIMARY KEY CLUSTERED ([approval_id] ASC),
    CONSTRAINT [FK_policy_document_approvals_documents] FOREIGN KEY ([document_id]) 
        REFERENCES [dbo].[policy_documents] ([document_id]) ON DELETE CASCADE,
    CONSTRAINT [FK_policy_document_approvals_versions] FOREIGN KEY ([version_id]) 
        REFERENCES [dbo].[policy_document_versions] ([version_id]) ON DELETE SET NULL
);

-- Indexes for common queries
CREATE NONCLUSTERED INDEX [IX_policy_documents_document_type] 
    ON [dbo].[policy_documents] ([document_type] ASC);

CREATE NONCLUSTERED INDEX [IX_policy_documents_status] 
    ON [dbo].[policy_documents] ([status] ASC);

CREATE NONCLUSTERED INDEX [IX_policy_documents_next_review_date] 
    ON [dbo].[policy_documents] ([next_review_date] ASC);

CREATE NONCLUSTERED INDEX [IX_policy_document_versions_document_id] 
    ON [dbo].[policy_document_versions] ([document_id] ASC);

CREATE NONCLUSTERED INDEX [IX_policy_document_approvals_document_id] 
    ON [dbo].[policy_document_approvals] ([document_id] ASC);

CREATE NONCLUSTERED INDEX [IX_policy_document_approvals_status] 
    ON [dbo].[policy_document_approvals] ([approval_status] ASC);

GO

