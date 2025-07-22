import { Navigation } from "@/components/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { MapPin, List, Users, FileText, Shield, Clock, BarChart3, Bell, Smartphone, Database } from "lucide-react"

export default function FeaturesPage() {
  const features = [
    {
      icon: MapPin,
      title: "Interactive Maps",
      description: "Visualize home locations with detailed markers and real-time status updates.",
      category: "Navigation",
    },
    {
      icon: List,
      title: "Comprehensive Lists",
      description: "Manage homes with sortable, filterable lists and detailed information panels.",
      category: "Management",
    },
    {
      icon: Users,
      title: "User Management",
      description: "Role-based access control with granular permissions and user administration.",
      category: "Security",
    },
    {
      icon: FileText,
      title: "Detailed Reports",
      description: "Generate comprehensive reports with analytics and compliance tracking.",
      category: "Analytics",
    },
    {
      icon: Shield,
      title: "Secure Access",
      description: "Enterprise-grade security with encrypted data and secure authentication.",
      category: "Security",
    },
    {
      icon: Clock,
      title: "Real-time Updates",
      description: "Live synchronization of data across all devices and users.",
      category: "Performance",
    },
    {
      icon: BarChart3,
      title: "Analytics Dashboard",
      description: "Visual insights with charts, graphs, and key performance indicators.",
      category: "Analytics",
    },
    {
      icon: Bell,
      title: "Smart Notifications",
      description: "Automated alerts for important events and scheduled activities.",
      category: "Communication",
    },
    {
      icon: Smartphone,
      title: "Mobile Responsive",
      description: "Fully responsive design that works seamlessly on all devices.",
      category: "Accessibility",
    },
    {
      icon: Database,
      title: "Data Management",
      description: "Robust database with backup, recovery, and data integrity features.",
      category: "Infrastructure",
    },
  ]

  const categories = [
    "All",
    "Navigation",
    "Management",
    "Security",
    "Analytics",
    "Performance",
    "Communication",
    "Accessibility",
    "Infrastructure",
  ]

  return (
    <div className="min-h-screen bg-gray-50">
      <Navigation />

      <main className="max-w-7xl mx-auto py-12 px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">Features</h1>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            Discover the powerful features that make our Home Visits Management System the perfect solution for your
            organization.
          </p>
        </div>

        <div className="flex flex-wrap gap-2 justify-center mb-8">
          {categories.map((category) => (
            <Badge
              key={category}
              variant="secondary"
              className="cursor-pointer hover:bg-primary hover:text-primary-foreground"
            >
              {category}
            </Badge>
          ))}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {features.map((feature, index) => {
            const IconComponent = feature.icon
            return (
              <Card key={index} className="hover:shadow-lg transition-shadow">
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <IconComponent className="h-8 w-8 text-primary" />
                    <Badge variant="outline">{feature.category}</Badge>
                  </div>
                  <CardTitle className="text-xl">{feature.title}</CardTitle>
                </CardHeader>
                <CardContent>
                  <CardDescription className="text-base">{feature.description}</CardDescription>
                </CardContent>
              </Card>
            )
          })}
        </div>

        <div className="mt-16 bg-white rounded-lg shadow p-8">
          <h2 className="text-3xl font-bold text-gray-900 mb-6 text-center">Why Choose Our Platform?</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="text-center">
              <div className="bg-blue-100 rounded-full p-4 w-16 h-16 mx-auto mb-4 flex items-center justify-center">
                <Shield className="h-8 w-8 text-blue-600" />
              </div>
              <h3 className="text-xl font-semibold mb-2">Enterprise Security</h3>
              <p className="text-gray-600">
                Bank-level security with encryption, secure authentication, and compliance with industry standards.
              </p>
            </div>
            <div className="text-center">
              <div className="bg-green-100 rounded-full p-4 w-16 h-16 mx-auto mb-4 flex items-center justify-center">
                <Clock className="h-8 w-8 text-green-600" />
              </div>
              <h3 className="text-xl font-semibold mb-2">Real-time Performance</h3>
              <p className="text-gray-600">
                Lightning-fast performance with real-time updates and synchronization across all devices.
              </p>
            </div>
            <div className="text-center">
              <div className="bg-purple-100 rounded-full p-4 w-16 h-16 mx-auto mb-4 flex items-center justify-center">
                <Users className="h-8 w-8 text-purple-600" />
              </div>
              <h3 className="text-xl font-semibold mb-2">User-Friendly</h3>
              <p className="text-gray-600">
                Intuitive interface designed for ease of use, with comprehensive training and support.
              </p>
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}
