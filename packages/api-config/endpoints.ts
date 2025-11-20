import type { ApiEndpoint, ApiCategory } from "./types"

/**
 * Centralized API endpoint definitions
 * 
 * This is the single source of truth for all API endpoints provided by
 * the Radius API Hub (admin.refugehouse.app)
 * 
 * Used for:
 * - Auto-generating API documentation
 * - Type safety across microservices
 * - API catalog dashboard
 */
export const API_ENDPOINTS: ApiEndpoint[] = [
  {
    path: "/api/radius/homes",
    method: "GET",
    category: "Homes",
    description: "Retrieve home data from RadiusBifrost",
    parameters: [
      {
        name: "unit",
        type: "string",
        required: false,
        description: "Filter by unit code (e.g., 'RAD', 'RHSA')",
        example: "RAD",
      },
      {
        name: "caseManager",
        type: "string",
        required: false,
        description: "Filter by case manager name",
        example: "John Doe",
      },
      {
        name: "search",
        type: "string",
        required: false,
        description: "Search in home name, address, or case manager",
        example: "Main Street",
      },
    ],
    responseType: "ListHome[]",
    exampleRequest: {
      url: "/api/radius/homes?unit=RAD&search=Main",
    },
    exampleResponse: {
      success: true,
      count: 10,
      homes: [
        {
          id: "guid-here",
          name: "Home Name",
          address: "123 Main St",
          City: "Austin",
          State: "TX",
          zipCode: "78701",
          Unit: "RAD",
          latitude: 30.2672,
          longitude: -97.7431,
          phoneNumber: "512-555-1234",
          contactPersonName: "John Doe",
          email: "john@example.com",
          contactPhone: "512-555-5678",
          lastSync: "2024-01-01T00:00:00Z",
        },
      ],
      timestamp: "2024-01-01T12:00:00Z",
      duration_ms: 45,
    },
  },
  {
    path: "/api/radius/appointments",
    method: "GET",
    category: "Appointments",
    description: "Retrieve appointment data from RadiusBifrost",
    parameters: [
      {
        name: "startDate",
        type: "string (ISO date)",
        required: false,
        description: "Filter appointments from this date",
        example: "2024-01-01T00:00:00Z",
      },
      {
        name: "endDate",
        type: "string (ISO date)",
        required: false,
        description: "Filter appointments until this date",
        example: "2024-12-31T23:59:59Z",
      },
      {
        name: "assignedTo",
        type: "string (user ID)",
        required: false,
        description: "Filter by assigned user ID",
        example: "user-guid-here",
      },
      {
        name: "status",
        type: "string",
        required: false,
        description: "Filter by appointment status",
        example: "scheduled",
      },
      {
        name: "type",
        type: "string",
        required: false,
        description: "Filter by appointment type",
        example: "home_visit",
      },
    ],
    responseType: "Appointment[]",
    exampleRequest: {
      url: "/api/radius/appointments?startDate=2024-01-01&status=scheduled",
    },
    exampleResponse: {
      success: true,
      count: 5,
      appointments: [
        {
          appointment_id: "guid-here",
          title: "Home Visit",
          appointment_type: "home_visit",
          start_datetime: "2024-01-15T10:00:00Z",
          status: "scheduled",
        },
      ],
      timestamp: "2024-01-01T12:00:00Z",
      duration_ms: 120,
    },
  },
  {
    path: "/api/radius/visit-forms",
    method: "GET",
    category: "Visit Forms",
    description: "Retrieve visit form data from RadiusBifrost",
    parameters: [
      {
        name: "appointmentId",
        type: "string",
        required: false,
        description: "Filter by appointment ID",
        example: "appointment-guid-here",
      },
      {
        name: "status",
        type: "string",
        required: false,
        description: "Filter by form status",
        example: "completed",
      },
      {
        name: "userId",
        type: "string",
        required: false,
        description: "Filter by created user ID",
        example: "user-guid-here",
      },
    ],
    responseType: "VisitForm[]",
    exampleRequest: {
      url: "/api/radius/visit-forms?appointmentId=guid-here",
    },
    exampleResponse: {
      success: true,
      count: 3,
      visitForms: [
        {
          visit_form_id: "guid-here",
          appointment_id: "appointment-guid-here",
          form_type: "home_visit",
          status: "completed",
        },
      ],
      timestamp: "2024-01-01T12:00:00Z",
      duration_ms: 200,
    },
  },
  {
    path: "/api/radius/users",
    method: "GET",
    category: "Users",
    description: "Retrieve user data from RadiusBifrost",
    parameters: [
      {
        name: "microserviceCode",
        type: "string",
        required: false,
        description: "Filter users by microservice (users with roles/permissions for this microservice)",
        example: "home-visits",
      },
      {
        name: "isActive",
        type: "boolean",
        required: false,
        description: "Filter by active status (defaults to true)",
        example: true,
      },
    ],
    responseType: "User[]",
    exampleRequest: {
      url: "/api/radius/users?microserviceCode=home-visits&isActive=true",
    },
    exampleResponse: {
      success: true,
      count: 25,
      users: [
        {
          id: "guid-here",
          clerk_user_id: "user_abc123",
          email: "user@refugehouse.org",
          first_name: "John",
          last_name: "Doe",
          is_active: true,
        },
      ],
      timestamp: "2024-01-01T12:00:00Z",
      duration_ms: 80,
    },
  },
]

/**
 * Group endpoints by category
 */
export function getEndpointsByCategory(): ApiCategory[] {
  const categories = new Map<string, ApiEndpoint[]>()

  for (const endpoint of API_ENDPOINTS) {
    if (!categories.has(endpoint.category)) {
      categories.set(endpoint.category, [])
    }
    categories.get(endpoint.category)!.push(endpoint)
  }

  return Array.from(categories.entries()).map(([name, endpoints]) => ({
    name,
    description: `${name} related endpoints`,
    endpoints,
  }))
}

/**
 * Get endpoint by path
 */
export function getEndpointByPath(path: string): ApiEndpoint | undefined {
  return API_ENDPOINTS.find((e) => e.path === path)
}

/**
 * Get all categories
 */
export function getCategories(): string[] {
  return Array.from(new Set(API_ENDPOINTS.map((e) => e.category)))
}

