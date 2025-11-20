-- Create API Keys table for centralized API hub authentication
-- This table stores API keys for microservices to authenticate with admin.refugehouse.app

IF NOT EXISTS (SELECT * FROM sys.objects WHERE object_id = OBJECT_ID(N'[dbo].[api_keys]') AND type in (N'U'))
BEGIN
    CREATE TABLE [dbo].[api_keys] (
        id UNIQUEIDENTIFIER PRIMARY KEY DEFAULT NEWID(),
        microservice_code NVARCHAR(50) NOT NULL,
        api_key_hash NVARCHAR(255) NOT NULL,  -- Hashed API key (SHA-256)
        api_key_prefix NVARCHAR(20) NOT NULL,  -- First 8 chars for display/identification
        created_at DATETIME2 DEFAULT GETDATE(),
        created_by_user_id UNIQUEIDENTIFIER NULL,
        expires_at DATETIME2 NULL,
        is_active BIT DEFAULT 1,
        rate_limit_per_minute INT DEFAULT 100,
        last_used_at DATETIME2 NULL,
        usage_count BIGINT DEFAULT 0,
        description NVARCHAR(500) NULL,
        CONSTRAINT FK_api_keys_created_by FOREIGN KEY (created_by_user_id) REFERENCES app_users(id)
    )

    -- Create index for fast lookups
    CREATE INDEX IX_api_keys_hash ON api_keys(api_key_hash) WHERE is_active = 1
    CREATE INDEX IX_api_keys_microservice ON api_keys(microservice_code, is_active)

    PRINT '✅ Created api_keys table'
END
ELSE
BEGIN
    PRINT 'ℹ️ api_keys table already exists'
END

-- Add usage tracking columns if they don't exist (for future migrations)
IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID(N'[dbo].[api_keys]') AND name = 'usage_count')
BEGIN
    ALTER TABLE api_keys ADD usage_count BIGINT DEFAULT 0
    PRINT '✅ Added usage_count column'
END

IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID(N'[dbo].[api_keys]') AND name = 'description')
BEGIN
    ALTER TABLE api_keys ADD description NVARCHAR(500) NULL
    PRINT '✅ Added description column'
END

IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID(N'[dbo].[api_keys]') AND name = 'api_key_prefix')
BEGIN
    ALTER TABLE api_keys ADD api_key_prefix NVARCHAR(20) NOT NULL DEFAULT ''
    PRINT '✅ Added api_key_prefix column'
END

