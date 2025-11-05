"use client"

import { SidebarTrigger } from "@/components/ui/sidebar"
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb"
import { Separator } from "@/components/ui/separator"
import { usePathname } from "next/navigation"

export function AppHeader() {
  const pathname = usePathname()

  // Special handling for appointment detail pages - use simpler breadcrumb
  const isAppointmentDetail = pathname.startsWith("/appointment/") && pathname.split("/").length === 3
  
  // Generate breadcrumbs from pathname
  const pathSegments = pathname.split("/").filter(Boolean)
  const breadcrumbs: Array<{ href: string; label: string }> = []
  
  pathSegments.forEach((segment, index) => {
    // For appointment detail pages, link back to visits calendar and stop
    if (isAppointmentDetail && segment === "appointment") {
      breadcrumbs.push({ href: "/visits-calendar", label: "Appointments" })
      return
    }
    
    // Skip GUID segments for appointment detail pages
    if (isAppointmentDetail && segment.length > 30 && /^[A-F0-9-]+$/i.test(segment)) {
      return
    }
    
    const href = "/" + pathSegments.slice(0, index + 1).join("/")
    
    // Special handling for GUIDs and dynamic routes
    let label = segment
    
    // If this looks like a GUID (long hex string), replace with generic label
    if (segment.length > 30 && /^[A-F0-9-]+$/i.test(segment)) {
      label = "Details"
    } else {
      label = segment
      .split("-")
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
      .join(" ")
    }
    
    breadcrumbs.push({ href, label })
  })

  // Generate page title from pathname
  const generatePageTitle = (pathname: string) => {
    const segments = pathname.split("/").filter(Boolean)
    const lastSegment = segments[segments.length - 1] || "dashboard"

    // Title mapping for better display names
    const titleMap: Record<string, string> = {
      dashboard: "Dashboard",
      "homes-list": "Homes List",
      "homes-map": "Homes Map",
      "visits-calendar": "Visits Calendar",
      "visits-list": "Visits List",
      reports: "Reports",
      admin: "Admin",
      "system-admin": "System Admin",
      diagnostics: "Diagnostics",
      users: "User Management",
      invitations: "Invitations",
      "visit-form": "Visit Form",
      "visit-forms": "Visit Forms",
    }

    // Special handling for dynamic routes (appointment/[id], etc.)
    if (segments[0] === "appointment" && segments.length === 2) {
      return "Appointment Details"
    }

    return (
      titleMap[lastSegment] ||
      lastSegment
        .split("-")
        .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
        .join(" ")
    )
  }

  const pageTitle = generatePageTitle(pathname)

  // Hide header for appointment detail pages - they have their own custom header
  const isAppointmentDetail = pathname.startsWith("/appointment/") && pathname.split("/").length === 3
  if (isAppointmentDetail) {
    return null
  }

  return (
    <header className="flex h-16 shrink-0 items-center gap-2 transition-[width,height] ease-linear group-has-[[data-collapsible=icon]]/sidebar-wrapper:h-12">
      <div className="flex items-center gap-2 px-4">
        <SidebarTrigger className="-ml-1" />
        <Separator orientation="vertical" className="mr-2 h-4" />
        <Breadcrumb>
          <BreadcrumbList>
            {breadcrumbs.map((breadcrumb, index) => (
              <div key={breadcrumb.href} className="flex items-center">
                {index > 0 && <BreadcrumbSeparator className="hidden md:block" />}
                <BreadcrumbItem>
                  {index === breadcrumbs.length - 1 ? (
                    <BreadcrumbPage>{breadcrumb.label}</BreadcrumbPage>
                  ) : (
                    <BreadcrumbLink href={breadcrumb.href}>{breadcrumb.label}</BreadcrumbLink>
                  )}
                </BreadcrumbItem>
              </div>
            ))}
          </BreadcrumbList>
        </Breadcrumb>
      </div>

      {/* Page Title - Right Aligned */}
      <div className="ml-auto pr-4">
        <h1 className="text-2xl font-bold bg-gradient-to-r from-refuge-purple to-refuge-magenta bg-clip-text text-transparent">
          {pageTitle}
        </h1>
      </div>
    </header>
  )
}
