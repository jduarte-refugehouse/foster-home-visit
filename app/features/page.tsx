import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Calendar, FileText, Upload, Users, Database, Lock, Award, CheckCircle, Clock } from "lucide-react"

export default function FeaturesPage() {
  const features = [
    {
      icon: Calendar,
      title: "Smart Visit Scheduling",
      description: "Intuitive calendar management with automated reminders and compliance deadline tracking.",
    },
    {
      icon: FileText,
      title: "Comprehensive Documentation",
      description: "Detailed visit forms with TAC/RCC compliance prompts, digital signatures, and PDF export.",
    },
    {
      icon: Upload,
      title: "Radius Integration",
      description: "Seamless XML data import from Radius system for families, placements, and case information.",
    },
    {
      icon: Users,
      title: "Family Management",
      description: "Complete family and placement tracking with visit history and compliance status monitoring.",
    },
    {
      icon: Database,
      title: "Secure Azure Integration",
      description: "Enterprise-grade security with Azure SQL, Key Vault, and encrypted data storage.",
    },
    {
      icon: Lock,
      title: "Role-Based Access Control",
      description: "Granular permissions to ensure data security and appropriate access for different user roles.",
    },
    {
      icon: Award,
      title: "Audit-Ready Reports",
      description: "Generate comprehensive reports for state inspections and contract compliance reviews.",
    },
    {
      icon: CheckCircle,
      title: "Automated Compliance Checks",
      description:
        "Built-in validation and prompts to ensure adherence to TAC Chapter 749 and RCC contract requirements.",
    },
    {
      icon: Clock,
      title: "Time-Saving Workflows",
      description: "Streamlined processes and automation to reduce administrative overhead for caseworkers.",
    },
  ]

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold text-center mb-8">Key Features</h1>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {features.map((feature, index) => {
          const Icon = feature.icon
          return (
            <Card key={index} className="flex flex-col">
              <CardHeader>
                <div className="flex items-center space-x-3">
                  <div className="p-2 rounded-lg bg-primary/10 text-primary">
                    <Icon className="w-6 h-6" />
                  </div>
                  <CardTitle className="text-lg">{feature.title}</CardTitle>
                </div>
              </CardHeader>
              <CardContent className="flex-1">
                <CardDescription className="text-base leading-relaxed">{feature.description}</CardDescription>
              </CardContent>
            </Card>
          )
        })}
      </div>
    </div>
  )
}
