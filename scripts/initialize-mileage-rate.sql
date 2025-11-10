-- Initialize mileage rate setting in SystemConfig table
-- Run this script to set up the default mileage reimbursement rate

IF NOT EXISTS (SELECT 1 FROM SystemConfig WHERE ConfigKey = 'mileage_rate')
BEGIN
    INSERT INTO SystemConfig (ConfigKey, ConfigValue, Description, ModifiedDate, ModifiedBy)
    VALUES ('mileage_rate', '0.67', 'Mileage reimbursement rate per mile (in USD)', GETUTCDATE(), 'system')
    PRINT 'Mileage rate setting created with default value: $0.67 per mile'
END
ELSE
BEGIN
    PRINT 'Mileage rate setting already exists. Current value: ' + (SELECT ConfigValue FROM SystemConfig WHERE ConfigKey = 'mileage_rate')
END
GO

