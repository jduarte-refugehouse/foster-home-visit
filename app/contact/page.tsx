import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card"
import { Mail, Phone, MapPin, ArrowLeft } from "lucide-react"
import Image from "next/image"

const LOGO_SRC = "/images/web logo with name.png"

export default function Contact() {
  return (
    <div className="flex flex-col min-h-screen bg-gray-50">
      {/* Header */}
      <header className="px-4 lg:px-6 h-14 flex items-center justify-between bg-white border-b border-gray-200">
        <div className="flex items-center space-x-4">
          <Link href="/">
            <Button variant="ghost">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Home
            </Button>
          </Link>
          <div className="flex items-center space-x-2">
            <Image
              src={LOGO_SRC || "/placeholder.svg"}
              alt="Family Visits Pro Logo"
              width={180}
              height={36}
              className="h-auto"
            />
            <span className="text-lg font-semibold text-gray-900">Contact Us</span>
          </div>
        </div>
        <nav className="ml-auto flex gap-4 sm:gap-6">
          <Link className="text-sm font-medium hover:underline underline-offset-4 text-gray-600" href="/features">
            Features
          </Link>
          <Link className="text-sm font-medium hover:underline underline-offset-4 text-gray-600" href="/solutions">
            Solutions
          </Link>
          <Link className="text-sm font-medium hover:underline underline-offset-4 text-gray-600" href="/contact">
            Contact
          </Link>
          <Link className="text-sm font-medium hover:underline underline-offset-4 text-gray-600" href="/admin">
            Admin
          </Link>
        </nav>
      </header>

      {/* Main Content */}
      <main className="flex-1 p-4 md:p-6">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-12">
            <h1 className="text-3xl font-bold text-gray-900 mb-4">Get in Touch</h1>
            <p className="text-lg text-gray-600 max-w-xl mx-auto">
              We'd love to hear from you! Whether you have questions, feedback, or need support, our team is here to
              help.
            </p>
          </div>

          <div className="grid gap-8 md:grid-cols-2">
            {/* Contact Information Card */}
            <Card className="bg-gradient-to-br from-refuge-purple to-refuge-blue text-white">
              <CardHeader>
                <CardTitle className="text-2xl font-bold">Contact Information</CardTitle>
                <CardDescription className="text-refuge-purple-100">Reach out to us directly.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center space-x-3">
                  <Mail className="w-6 h-6" />
                  <a href="mailto:info@familyvisitspro.com" className="text-lg hover:underline">
                    info@familyvisitspro.com
                  </a>
                </div>
                <div className="flex items-center space-x-3">
                  <Phone className="w-6 h-6" />
                  <a href="tel:+15551234567" className="text-lg hover:underline">
                    +1 (555) 123-4567
                  </a>
                </div>
                <div className="flex items-start space-x-3">
                  <MapPin className="w-6 h-6 flex-shrink-0 mt-1" />
                  <p className="text-lg">
                    123 Family Lane
                    <br />
                    Suite 400
                    <br />
                    Visitville, FV 12345
                  </p>
                </div>
              </CardContent>
            </Card>

            {/* Contact Form Card */}
            <Card>
              <CardHeader>
                <CardTitle className="text-2xl font-bold">Send Us a Message</CardTitle>
                <CardDescription>Fill out the form below and we'll get back to you shortly.</CardDescription>
              </CardHeader>
              <CardContent>
                <form className="space-y-4">
                  <div>
                    <label htmlFor="name" className="block text-sm font-medium text-gray-700">
                      Name
                    </label>
                    <input
                      type="text"
                      id="name"
                      name="name"
                      className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-refuge-purple focus:border-refuge-purple"
                      placeholder="Your Name"
                    />
                  </div>
                  <div>
                    <label htmlFor="email" className="block text-sm font-medium text-gray-700">
                      Email
                    </label>
                    <input
                      type="email"
                      id="email"
                      name="email"
                      className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-refuge-purple focus:border-refuge-purple"
                      placeholder="your@example.com"
                    />
                  </div>
                  <div>
                    <label htmlFor="message" className="block text-sm font-medium text-gray-700">
                      Message
                    </label>
                    <textarea
                      id="message"
                      name="message"
                      rows={4}
                      className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-refuge-purple focus:border-refuge-purple"
                      placeholder="Your message here..."
                    ></textarea>
                  </div>
                  <Button
                    type="submit"
                    className="w-full bg-refuge-green hover:bg-refuge-green/90 text-white py-2 px-4 rounded-md"
                  >
                    Send Message
                  </Button>
                </form>
              </CardContent>
            </Card>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="px-4 lg:px-6 h-14 flex items-center justify-center bg-white border-t border-gray-200 text-sm text-gray-600">
        <p>&copy; 2024 Family Visits Pro. All rights reserved.</p>
      </footer>
    </div>
  )
}
