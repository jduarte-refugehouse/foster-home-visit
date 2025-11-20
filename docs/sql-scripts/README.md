# SQL Scripts - One-Time Setup and Maintenance

This directory contains SQL scripts for one-time setup tasks, fixes, and maintenance operations. These scripts are typically run once and then archived here for reference.

## Script Categories

### Microservice Setup Scripts
- **`create-service-domain-admin.sql`** - Comprehensive setup for service-domain-admin microservice (kept in `scripts/` as it's a template for new microservices)

### One-Time Fixes and Updates
- **`update-service-domain-admin-url.sql`** - One-time fix to update app_url for service-domain-admin
- **`add-diagnostics-to-service-domain-admin.sql`** - One-time addition of Diagnostics navigation item

### User Access Scripts
- **`grant-home-liaison-access.sql`** - One-time script to grant home_liaison role to all existing users

### Data Migration Scripts
- **`add-staff-training-appointment-type.sql`** - One-time addition of appointment type
- **`add-file-data-to-attachments.sql`** - One-time data migration for attachments
- **`initialize-mileage-rate.sql`** - One-time initialization of mileage rate

## Reusable Scripts

For reusable table creation scripts and ongoing maintenance, see:
- `scripts/create-access-requests-table.sql`
- `scripts/create-continuum-entries-table.sql`
- `scripts/create-signature-tokens-table.sql`
- `scripts/create-travel-legs-table.sql`

## Schema Reference

For database schema reference, see:
- `docs/bifrost-schema.sql` - Main database schema
- `docs/radius-radiusrhsa-schema.sql` - Radius database schema
- `docs/rhdata-schema.sql` - RHData database schema

## Usage

These scripts are typically run once and then kept here for historical reference. Before running:

1. **Review the script** to understand what it does
2. **Backup your database** if modifying production data
3. **Test in a development environment** first
4. **Verify the results** after running

## Notes

- Scripts in this directory are **one-time use** - they check for existing data before making changes
- Scripts are **idempotent** where possible (safe to run multiple times)
- Always review scripts before running in production

