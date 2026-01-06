/**
 * Identity Resolver - Implements dual-source actor pattern
 * Resolves Clerk users to RadiusGuid or EntityGuid per USER-IDENTITY-ARCHITECTURE.md
 * 
 * This module implements the dual-source actor pattern where:
 * - Staff users have ActorRadiusGuid (from SyncRadiusUsers)
 * - External users have ActorEntityGuid (from EntityCommunicationBridge)
 * - One or the other, never both (except foster parents who have both set to same GUID)
 */

import { query } from "@refugehouse/shared-core/db"

export interface UserIdentity {
  clerkId: string
  email: string
  name: string
  userType: 'staff' | 'foster_parent' | 'therapist' | 'external'

  // Dual-source identity (one or the other, never both)
  radiusGuid: string | null      // Staff + Foster parents (has on-prem record)
  entityGuid: string | null      // External via EntityCommunicationBridge
  commBridgeId: string | null    // For third-party pros
  fosterHomeGuid: string | null  // Foster parents only

  // Staff-specific (for PULSE compatibility)
  pid: number | null             // From SyncRadiusUsers
  unit: 'DAL' | 'SAN' | null     // From SyncRadiusUsers
}

/**
 * Resolve user identity from Clerk user ID
 * Implements the dual-source actor pattern per USER-IDENTITY-ARCHITECTURE.md
 * 
 * @param clerkUserId - Clerk user ID from authentication
 * @returns UserIdentity with resolved GUIDs and metadata
 * @throws Error if user not found in app_users
 */
export async function resolveUserIdentity(clerkUserId: string): Promise<UserIdentity> {
  // 1. Get app_user record
  const appUserResult = await query(
    `SELECT id, clerk_user_id, email, first_name, last_name,
            user_type, radius_person_guid, radius_foster_home_guid, comm_bridge_id
     FROM app_users
     WHERE clerk_user_id = @param0 AND is_active = 1`,
    [clerkUserId]
  )

  if (!appUserResult.length) {
    throw new Error(`User not found in app_users: ${clerkUserId}`)
  }

  const appUser = appUserResult[0]

  const identity: UserIdentity = {
    clerkId: clerkUserId,
    email: appUser.email,
    name: `${appUser.first_name || ''} ${appUser.last_name || ''}`.trim(),
    userType: appUser.user_type || 'external',
    radiusGuid: null,
    entityGuid: null,
    commBridgeId: appUser.comm_bridge_id || null,
    fosterHomeGuid: appUser.radius_foster_home_guid || null,
    pid: null,
    unit: null
  }

  // 2. Resolve based on user type
  if (appUser.user_type === 'staff' && appUser.radius_person_guid) {
    // Staff: radius_person_guid → SyncRadiusUsers.guid
    identity.radiusGuid = appUser.radius_person_guid

    const staffResult = await query(
      `SELECT DAL_personID, SAN_personID,
              CASE WHEN DAL_personID IS NOT NULL THEN 'DAL' ELSE 'SAN' END as Unit
       FROM SyncRadiusUsers
       WHERE guid = @param0`,
      [appUser.radius_person_guid]
    )

    if (staffResult.length) {
      identity.pid = staffResult[0].DAL_personID || staffResult[0].SAN_personID
      identity.unit = staffResult[0].Unit
    }
  } else if (appUser.user_type === 'foster_parent' && appUser.radius_person_guid) {
    // Foster Parent: radius_person_guid = EntityGUID (same value)
    identity.radiusGuid = appUser.radius_person_guid
    identity.entityGuid = appUser.radius_person_guid
  } else if (appUser.comm_bridge_id) {
    // Third-party professional: comm_bridge_id → EntityCommunicationBridge.CommunicationID
    const commBridgeResult = await query(
      `SELECT EntityGUID, EntityType, EntityFullName
       FROM EntityCommunicationBridge
       WHERE CommunicationID = @param0`,
      [appUser.comm_bridge_id]
    )

    if (commBridgeResult.length) {
      identity.entityGuid = commBridgeResult[0].EntityGUID || null
      identity.userType = commBridgeResult[0].EntityType || 'external'
    }
  }

  return identity
}

/**
 * Get actor fields for database insert/update
 * Returns standardized actor fields for ContinuumMark and other tables
 * 
 * @param identity - Resolved user identity
 * @returns Object with actor fields ready for database operations
 */
export function getActorFields(identity: UserIdentity) {
  return {
    actorClerkId: identity.clerkId,
    actorRadiusGuid: identity.radiusGuid,
    actorEntityGuid: identity.entityGuid,
    actorCommBridgeId: identity.commBridgeId,
    actorName: identity.name,
    actorEmail: identity.email,
    actorUserType: identity.userType,
    actorPid: identity.pid || 0  // ActorPID is NOT NULL, use 0 for web-only users
  }
}

