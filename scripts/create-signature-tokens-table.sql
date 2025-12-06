-- Create table for tokenized signature links
-- Allows sending secure links via email to collect signatures

CREATE TABLE [dbo].[signature_tokens] (
    [token_id] [uniqueidentifier] NOT NULL DEFAULT NEWID(),
    [visit_form_id] [uniqueidentifier] NOT NULL,
    [appointment_id] [uniqueidentifier] NOT NULL,
    [signature_type] [nvarchar](50) NOT NULL, -- 'parent1', 'parent2', 'staff', etc.
    [signature_key] [nvarchar](100) NOT NULL, -- e.g., 'parent1Signature', 'staffSignature'
    [token] [nvarchar](255) NOT NULL, -- Secure token for URL
    [recipient_email] [nvarchar](255) NOT NULL,
    [recipient_name] [nvarchar](255) NULL,
    [description] [nvarchar](500) NULL,
    [expires_at] [datetime2](7) NOT NULL,
    [used_at] [datetime2](7) NULL,
    [signature_data] [nvarchar](max) NULL, -- Base64 signature image
    [signer_name] [nvarchar](255) NULL, -- Name entered by signer
    [signed_date] [date] NULL,
    [created_at] [datetime2](7) NOT NULL DEFAULT GETUTCDATE(),
    [created_by_user_id] [nvarchar](255) NOT NULL,
    [created_by_name] [nvarchar](255) NOT NULL,
    [is_deleted] [bit] NOT NULL DEFAULT 0,
    PRIMARY KEY CLUSTERED ([token_id] ASC)
    WITH (STATISTICS_NORECOMPUTE = OFF, IGNORE_DUP_KEY = OFF, OPTIMIZE_FOR_SEQUENTIAL_KEY = OFF) ON [PRIMARY]
) ON [PRIMARY] TEXTIMAGE_ON [PRIMARY]
GO

-- Create index for token lookups
CREATE NONCLUSTERED INDEX [IX_signature_tokens_token] 
ON [dbo].[signature_tokens] ([token])
INCLUDE ([visit_form_id], [signature_key], [expires_at], [used_at], [is_deleted]);
GO

-- Create index for visit form lookups
CREATE NONCLUSTERED INDEX [IX_signature_tokens_visit_form_id] 
ON [dbo].[signature_tokens] ([visit_form_id])
INCLUDE ([signature_type], [used_at], [is_deleted]);
GO

-- Grant permissions
GRANT SELECT, INSERT, UPDATE, DELETE ON [dbo].[signature_tokens] TO [v0_application_role];
GO

