/**
 * @shared-core
 * Main entry point for shared-core package
 * Re-exports all shared functionality
 */

// Database
export * from './db'

// Authentication
export * from './clerk-auth-helper'
export * from './auth-utils'

// Permissions & Access
export * from './permissions-middleware'
export * from './system-admin-check'
export * from './user-access-check'
export * from './user-management'

// Impersonation
export * from './impersonation'

// Logging
export * from './communication-logging'
export * from './continuum-logger'

// Communication
export * from './sms-helper'
export * from './email-helper'

// AI & Speech
export * from './anthropic-helper'
export * from './deepgram-streaming'
export * from './google-speech-helper'
export * from './speech-utils'
export * from './environment'

