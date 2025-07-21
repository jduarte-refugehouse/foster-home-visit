import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Lightbulb, Users, Briefcase, Shield } from "lucide-react"

export default function SolutionsPage() {
  const solutions = [
    {
      icon: Lightbulb,
      title: "Streamlined Workflows",
      description:
        "Automate routine tasks and reduce manual effort, allowing caseworkers to focus on critical activities.",
    },
    {
      icon: Users,
      title: "Enhanced Collaboration",
      description:
        "Facilitate seamless communication and data sharing among team members for better case coordination.",
    },
    {
      icon: Briefcase,
      title: "Improved Reporting",
      description: "Generate accurate and comprehensive reports for compliance, audits, and performance analysis.",
    },
    {
      icon: Shield,
      title: "Data Security & Compliance",
      description:
        "Ensure sensitive data is protected with robust security measures and adherence to regulatory standards.",
    },
  ]

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold text-center mb-8">Our Solutions</h1>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {solutions.map((solution, index) => {
          const Icon = solution.icon
          return (
            <Card key={index} className="flex flex-col">
              <CardHeader>
                <div className="flex items-center space-x-3">
                  <div className="p-2 rounded-lg bg-primary/10 text-primary">
                    <Icon className="w-6 h-6" />
                  </div>
                  <CardTitle className="text-lg">{solution.title}</CardTitle>
                </div>
              </CardHeader>
              <CardContent className="flex-1">
                <p className="text-base leading-relaxed text-muted-foreground">{solution.description}</p>
              </CardContent>
            </Card>
          )
        })}
      </div>
    </div>
  )
}
