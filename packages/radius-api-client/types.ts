/**
 * Type definitions for Radius API Client
 */

export interface ListHome {
  id: string
  name: string
  address: string
  City: string
  State: string
  zipCode: string
  Unit: string
  latitude: number
  longitude: number
  phoneNumber: string
  contactPersonName: string
  email: string
  contactPhone: string
  lastSync: string
}

export interface HomeFilters {
  unit?: string
  caseManager?: string
  search?: string
}

export interface Appointment {
  appointment_id: string
  title: string
  description: string | null
  appointment_type: string
  start_datetime: Date
  end_datetime: Date
  duration_minutes: number | null
  status: string
  home_xref: string | null
  location_address: string | null
  location_notes: string | null
  assigned_to_user_id: string | null
  assigned_to_name: string | null
  assigned_to_role: string | null
  created_by_user_id: string | null
  created_by_name: string | null
  priority: string | null
  is_recurring: boolean
  recurring_pattern: string | null
  parent_appointment_id: string | null
  preparation_notes: string | null
  completion_notes: string | null
  outcome: string | null
  created_at: Date
  updated_at: Date
  home_name: string | null
  Street: string | null
  City: string | null
  State: string | null
  Zip: string | null
  Unit: string | null
  CaseManager: string | null
  HomePhone: string | null
}

export interface AppointmentOptions {
  startDate?: string
  endDate?: string
  assignedTo?: string
  status?: string
  type?: string
}

export interface VisitForm {
  visit_form_id: string
  appointment_id: string | null
  form_type: string
  form_version: string | null
  status: string
  visit_date: Date | null
  visit_time: string | null
  visit_number: number | null
  quarter: string | null
  visit_variant: string | null
  visit_info: any | null
  family_info: any | null
  attendees: any | null
  observations: any | null
  recommendations: any | null
  signatures: any | null
  home_environment: any | null
  child_interviews: any | null
  parent_interviews: any | null
  compliance_review: any | null
  last_auto_save: Date | null
  auto_save_count: number
  created_at: Date
  updated_at: Date
  created_by_user_id: string | null
  created_by_name: string | null
  updated_by_user_id: string | null
  updated_by_name: string | null
  current_session_id: string | null
  current_session_last_save: Date | null
  current_session_save_type: string | null
  current_session_user_id: string | null
  current_session_user_name: string | null
  save_history_json: any | null
  appointment_title: string | null
  location_address: string | null
}

export interface VisitFormOptions {
  appointmentId?: string
  status?: string
  userId?: string
}

export interface User {
  id: string
  clerk_user_id: string
  email: string
  first_name: string | null
  last_name: string | null
  is_active: boolean
  created_at: Date
  updated_at: Date
}

export interface UserOptions {
  microserviceCode?: string
  isActive?: boolean
}

export interface ApiResponse<T> {
  success: boolean
  count: number
  data: T[]
  timestamp: string
  duration_ms?: number
  error?: string
}

// ============================================
// Auth Types
// ============================================

export interface AppUser {
  id: string
  clerk_user_id: string
  email: string
  first_name: string | null
  last_name: string | null
  phone: string | null
  is_active: boolean
  core_role: "admin" | "staff" | "external" | "foster_parent" | string
  department: string | null
  job_title: string | null
  user_type: string | null
  environment: string | null
  created_at: Date
  updated_at: Date
}

export interface UserRole {
  id: string
  user_id: string
  microservice_id: string
  role_name: string
  granted_by: string
  granted_at: Date
  is_active: boolean
  microservice_code: string
  microservice_name: string
  // Computed fields
  role_display_name: string
  role_level: number
}

export interface Permission {
  id: string
  microservice_id: string
  permission_code: string
  permission_name: string
  description: string | null
  category: string | null
  microservice_code: string
  microservice_name: string
}

export interface UserLookupOptions {
  clerkUserId?: string
  email?: string
  microserviceCode?: string
}

export interface UserLookupResponse {
  success: boolean
  found: boolean
  user: AppUser | null
  roles: UserRole[]
  permissions: Permission[]
  timestamp: string
  duration_ms: number
  error?: string
}

export interface UserCreateData {
  clerkUserId: string
  email: string
  firstName?: string
  lastName?: string
  phone?: string
  microserviceCode?: string
}

export interface UserCreateResponse {
  success: boolean
  user: AppUser | null
  roles: UserRole[]
  permissions: Permission[]
  isNewUser: boolean
  timestamp: string
  duration_ms: number
  error?: string
}

// ============================================
// Permissions Types
// ============================================

export interface PermissionsOptions {
  userId: string
  microserviceCode?: string
}

export interface PermissionsResponse {
  success: boolean
  userId: string
  email: string
  coreRole: string
  microserviceCode: string
  roles: UserRole[]
  permissions: Permission[]
  permissionCodes: string[]
  roleNames: string[]
  timestamp: string
  duration_ms: number
  error?: string
}

// ============================================
// Navigation Types
// ============================================

export interface NavigationItem {
  code: string
  title: string
  url: string
  icon: string
  order: number
  category: string
  item_type: string
}

export interface NavigationGroup {
  title: string
  items: NavigationItem[]
}

export interface NavigationOptions {
  userId?: string
  microserviceCode?: string
  userPermissions?: string[]
}

export interface NavigationMetadata {
  source: string
  totalItems: number
  visibleItems: number
  fixedItems: number
  collapsibleItems: number
  filteredItems: number
  microservice: {
    code: string
    name: string
    description: string
  }
  userPermissions: string[]
  error?: string
}

export interface NavigationResponse {
  success: boolean
  navigation: NavigationGroup[]
  collapsibleItems?: NavigationItem[]
  metadata: NavigationMetadata
  timestamp: string
  duration_ms: number
  error?: string
}

// ============================================
// Continuum / Visits Types
// ============================================

export interface ContinuumMark {
  MarkID: string
  MarkType: string
  MarkDate: string                    // Note: MarkDate not MarkTime
  Unit: 'DAL' | 'SAN'
  SourceSystem: string
  // PID-based identity (PULSE)
  ActorPID: number
  // GUID-based identity (Visit Service)
  ActorClerkId: string | null
  ActorRadiusGuid: string | null
  ActorEntityGuid: string | null
  ActorCommBridgeId: string | null
  ActorName: string | null
  ActorEmail: string | null
  ActorUserType: string | null
  // Content
  Notes: string | null
  MarkContext: string | null
  JsonPayload: Record<string, any> | null
  MarkStatus: string | null
  // Audit
  CreatedAt: string
  CreatedBy: string | null
  IsArchived: boolean
  IsDeleted: boolean
}

export interface MarkSubject {
  MarkSubjectID: string
  MarkID: string
  EntityGUID: string
  EntityType: 'facility' | 'child' | 'person'
  EntityPID: number | null
  SubjectRole: 'primary' | 'participant' | 'observer'
  EntityName: string | null
  EntityXref: number | null
}

export interface MarkParty {
  MarkPartyID: string
  MarkID: string
  PartyName: string
  PartyRole: 'PRESENT' | 'NOTIFIED' | 'ABSENT' | 'VIRTUAL'
  EntityGUID: string | null
  EntityPID: number | null
  PartyRadiusGuid: string | null
  PartyEntityGuid: string | null
  PartyCommBridgeId: string | null
  PartyType: string | null
  PartyEmail: string | null
  PartyPhone: string | null
}

export interface Trip {
  TripID: string
  TripDate: string
  StaffClerkId: string
  StaffRadiusGuid: string | null
  StaffEmail: string
  StaffName: string
  TripPurpose: string
  OriginType: string
  DestinationType: string
  DestinationFosterHomeGuid: string | null
  MilesEstimated: number | null
  MilesActual: number | null
  CostCenterUnit: 'DAL' | 'SAN'
  RelatedMarkID: string | null
  TripStatus: string
  IsDeleted: boolean
}

export interface UserIdentity {
  clerkId: string
  email: string
  name: string
  userType: 'staff' | 'foster_parent' | 'therapist' | 'external'
  radiusGuid: string | null
  entityGuid: string | null
  commBridgeId: string | null
  fosterHomeGuid: string | null
  pid: number | null
  unit: 'DAL' | 'SAN' | null
}

export interface CreateVisitParams {
  markDate: string                    // ISO datetime
  markType?: string                   // Default: 'HOME_VISIT'
  fosterHomeGuid: string
  fosterHomeName?: string
  fosterHomeXref?: number
  childGuids?: Array<{ guid: string; name?: string }>
  notes?: string
  jsonPayload?: Record<string, any>
  unit: 'DAL' | 'SAN'
  sourceSystem?: string               // Default: 'VisitService'
  // Actor identity
  actorPid?: number                   // For PULSE compatibility
  actorClerkId: string
  actorRadiusGuid?: string | null
  actorEntityGuid?: string | null
  actorCommBridgeId?: string | null
  actorName: string
  actorEmail?: string
  actorUserType: string
  // Parties
  parties?: Array<{
    name: string
    role?: string                     // 'PRESENT', 'NOTIFIED', 'ABSENT'
    radiusGuid?: string | null
    entityGuid?: string | null
    commBridgeId?: string | null
    type?: string                     // 'foster_parent', 'child', 'dfps', etc.
    email?: string
    phone?: string
  }>
}

export interface GetVisitsParams {
  homeGuid?: string
  staffGuid?: string
  startDate?: string
  endDate?: string
}

export interface CreateTripParams {
  tripDate: string
  staffClerkId: string
  staffRadiusGuid?: string | null
  staffEmail: string
  staffName: string
  tripPurpose: string
  originType: string
  originAddress?: string
  destinationType: string
  destinationAddress?: string
  destinationFosterHomeGuid?: string
  milesEstimated?: number
  milesActual?: number
  costCenterUnit: 'DAL' | 'SAN'
  relatedMarkId?: string
}

