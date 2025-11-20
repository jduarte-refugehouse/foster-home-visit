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

