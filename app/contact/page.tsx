import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Mail, Phone, MapPin } from "lucide-react"

export default function ContactPage() {
  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold text-center mb-8">Contact Us</h1>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <Card>
          <CardHeader>
            <CardTitle>General Inquiries</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center space-x-2">
              <Mail className="h-5 w-5 text-muted-foreground" />
              <p className="text-muted-foreground">info@example.com</p>
            </div>
            <div className="flex items-center space-x-2">
              <Phone className="h-5 w-5 text-muted-foreground" />
              <p className="text-muted-foreground">+1 (555) 123-4567</p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Technical Support</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center space-x-2">
              <Mail className="h-5 w-5 text-muted-foreground" />
              <p className="text-muted-foreground">support@example.com</p>
            </div>
            <div className="flex items-center space-x-2">
              <Phone className="h-5 w-5 text-muted-foreground" />
              <p className="text-muted-foreground">+1 (555) 987-6543</p>
            </div>
          </CardContent>
        </Card>

        <Card className="md:col-span-2">
          <CardHeader>
            <CardTitle>Our Office</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center space-x-2">
              <MapPin className="h-5 w-5 text-muted-foreground" />
              <p className="text-muted-foreground">
                123 Main Street
                <br />
                Anytown, TX 78701
                <br />
                USA
              </p>
            </div>
            <div className="h-[200px] bg-gray-100 rounded-md flex items-center justify-center text-muted-foreground">
              {/* Placeholder for a map component */}
              Map Placeholder
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
