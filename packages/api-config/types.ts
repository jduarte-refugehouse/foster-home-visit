/**
 * Type definitions for API Configuration
 */

export interface ApiEndpoint {
  path: string
  method: "GET" | "POST" | "PUT" | "DELETE" | "PATCH"
  category: string
  description: string
  parameters?: ApiParameter[]
  responseType: string
  exampleRequest?: any
  exampleResponse?: any
}

export interface ApiParameter {
  name: string
  type: string
  required: boolean
  description: string
  example?: any
}

export interface ApiCategory {
  name: string
  description: string
  endpoints: ApiEndpoint[]
}

