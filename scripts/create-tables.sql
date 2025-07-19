-- Users table
IF NOT EXISTS (SELECT * FROM sysobjects WHERE name='users' AND xtype='U')
CREATE TABLE users (
    id UNIQUEIDENTIFIER PRIMARY KEY DEFAULT NEWID(),
    clerkId NVARCHAR(255) UNIQUE NOT NULL,
    email NVARCHAR(255) UNIQUE NOT NULL,
    firstName NVARCHAR(255),
    lastName NVARCHAR(255),
    role NVARCHAR(50) DEFAULT 'caseworker',
    createdAt DATETIME2 DEFAULT GETDATE(),
    updatedAt DATETIME2 DEFAULT GETDATE()
);

-- Families table
IF NOT EXISTS (SELECT * FROM sysobjects WHERE name='families' AND xtype='U')
CREATE TABLE families (
    id UNIQUEIDENTIFIER PRIMARY KEY DEFAULT NEWID(),
    radiusId NVARCHAR(255) UNIQUE,
    familyName NVARCHAR(255) NOT NULL,
    address NVARCHAR(500),
    phone NVARCHAR(50),
    email NVARCHAR(255),
    caseNumber NVARCHAR(100),
    status NVARCHAR(50) DEFAULT 'active',
    createdAt DATETIME2 DEFAULT GETDATE(),
    updatedAt DATETIME2 DEFAULT GETDATE()
);

-- Placements table
IF NOT EXISTS (SELECT * FROM sysobjects WHERE name='placements' AND xtype='U')
CREATE TABLE placements (
    id UNIQUEIDENTIFIER PRIMARY KEY DEFAULT NEWID(),
    radiusId NVARCHAR(255) UNIQUE,
    familyId UNIQUEIDENTIFIER NOT NULL,
    childName NVARCHAR(255) NOT NULL,
    childAge INT,
    placementDate DATETIME2 NOT NULL,
    placementType NVARCHAR(100) NOT NULL,
    specialNeeds NVARCHAR(MAX),
    medicationInfo NVARCHAR(MAX),
    schoolInfo NVARCHAR(MAX),
    emergencyContact NVARCHAR(500),
    status NVARCHAR(50) DEFAULT 'active',
    createdAt DATETIME2 DEFAULT GETDATE(),
    updatedAt DATETIME2 DEFAULT GETDATE(),
    FOREIGN KEY (familyId) REFERENCES families(id) ON DELETE CASCADE
);

-- Visits table
IF NOT EXISTS (SELECT * FROM sysobjects WHERE name='visits' AND xtype='U')
CREATE TABLE visits (
    id UNIQUEIDENTIFIER PRIMARY KEY DEFAULT NEWID(),
    familyId UNIQUEIDENTIFIER NOT NULL,
    placementId UNIQUEIDENTIFIER,
    userId UNIQUEIDENTIFIER NOT NULL,
    visitType NVARCHAR(50) NOT NULL,
    visitDate DATETIME2 NOT NULL,
    startTime DATETIME2,
    endTime DATETIME2,
    status NVARCHAR(50) DEFAULT 'scheduled',
    purpose NVARCHAR(MAX),
    location NVARCHAR(500),
    notes NVARCHAR(MAX),
    tacCompliant BIT DEFAULT 0,
    rccCompliant BIT DEFAULT 0,
    createdAt DATETIME2 DEFAULT GETDATE(),
    updatedAt DATETIME2 DEFAULT GETDATE(),
    FOREIGN KEY (familyId) REFERENCES families(id) ON DELETE CASCADE,
    FOREIGN KEY (placementId) REFERENCES placements(id) ON DELETE SET NULL,
    FOREIGN KEY (userId) REFERENCES users(id) ON DELETE CASCADE
);

-- Visit Details table
IF NOT EXISTS (SELECT * FROM sysobjects WHERE name='visit_details' AND xtype='U')
CREATE TABLE visit_details (
    id UNIQUEIDENTIFIER PRIMARY KEY DEFAULT NEWID(),
    visitId UNIQUEIDENTIFIER NOT NULL,
    homeConditions NVARCHAR(MAX),
    childSafety NVARCHAR(MAX),
    childWellbeing NVARCHAR(MAX),
    caregiverInteraction NVARCHAR(MAX),
    educationalNeeds NVARCHAR(MAX),
    medicalNeeds NVARCHAR(MAX),
    behavioralConcerns NVARCHAR(MAX),
    serviceDelivery NVARCHAR(MAX),
    goalProgress NVARCHAR(MAX),
    familyStrengths NVARCHAR(MAX),
    challengesIdentified NVARCHAR(MAX),
    recommendedActions NVARCHAR(MAX),
    followUpRequired BIT DEFAULT 0,
    followUpDate DATETIME2,
    supervisorReview BIT DEFAULT 0,
    supervisorNotes NVARCHAR(MAX),
    createdAt DATETIME2 DEFAULT GETDATE(),
    updatedAt DATETIME2 DEFAULT GETDATE(),
    FOREIGN KEY (visitId) REFERENCES visits(id) ON DELETE CASCADE
);

-- Create indexes for better performance
CREATE INDEX IX_users_clerkId ON users(clerkId);
CREATE INDEX IX_families_status ON families(status);
CREATE INDEX IX_placements_familyId ON placements(familyId);
CREATE INDEX IX_visits_userId ON visits(userId);
CREATE INDEX IX_visits_familyId ON visits(familyId);
CREATE INDEX IX_visits_visitDate ON visits(visitDate);
CREATE INDEX IX_visit_details_visitId ON visit_details(visitId);
