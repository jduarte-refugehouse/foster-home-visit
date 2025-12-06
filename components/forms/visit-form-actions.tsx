"use client"

import { useState } from "react"
import { Button } from "@refugehouse/shared-core/components/ui/button"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@refugehouse/shared-core/components/ui/dialog"
import { Input } from "@refugehouse/shared-core/components/ui/input"
import { Label } from "@refugehouse/shared-core/components/ui/label"
import { Textarea } from "@refugehouse/shared-core/components/ui/textarea"
import { Printer, Mail, Send } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import VisitFormPrint from "./visit-form-print"

interface VisitFormActionsProps {
  formData: any
  visitFormId?: string
  appointmentId?: string
  homeData?: any
}

export default function VisitFormActions({ formData, visitFormId, appointmentId, homeData }: VisitFormActionsProps) {
  const [emailDialog, setEmailDialog] = useState(false)
  const [emailData, setEmailData] = useState({
    recipientEmail: "",
    recipientName: "",
    message: "",
  })
  const [sending, setSending] = useState(false)
  const { toast } = useToast()

  const handlePrint = () => {
    try {
      const printWindow = window.open("", "_blank", "width=800,height=600")

      if (!printWindow) {
        // Popup was blocked, show error message
        toast({
          title: "Print Blocked",
          description: "Please allow popups for this site and try again, or use your browser's print function (Ctrl+P)",
          variant: "destructive",
        })
        return
      }

      printWindow.document.write(`
        <!DOCTYPE html>
        <html>
          <head>
            <title>Foster Home Visit Report</title>
            <style>
              body { font-family: Arial, sans-serif; margin: 0; padding: 20px; }
              .print-content { max-width: 800px; margin: 0 auto; }
              h1 { color: #1e40af; text-align: center; border-bottom: 3px solid #2563eb; padding-bottom: 10px; }
              h2 { color: #374151; border-bottom: 2px solid #d1d5db; padding-bottom: 5px; }
              .grid { display: grid; grid-template-columns: 1fr 1fr; gap: 20px; }
              .attendee { display: flex; justify-content: space-between; padding: 5px 0; border-bottom: 1px solid #e5e7eb; }
              .signature-section { display: grid; grid-template-columns: 1fr 1fr; gap: 40px; margin-top: 40px; }
              .signature-line { border-bottom: 1px solid #000; height: 40px; margin-bottom: 10px; }
              .footer { border-top: 2px solid #2563eb; padding-top: 15px; margin-top: 30px; text-align: center; font-size: 12px; color: #6b7280; }
              @media print {
                body { margin: 0; }
                .no-print { display: none; }
              }
            </style>
          </head>
          <body>
            <div class="print-content">
              ${generatePrintHTML(formData, appointmentId, homeData)}
            </div>
            <script>
              window.onload = function() {
                window.print();
                setTimeout(function() {
                  window.close();
                }, 1000);
              }
            </script>
          </body>
        </html>
      `)
      printWindow.document.close()

      toast({
        title: "Print Ready",
        description: "Print dialog should open shortly",
      })
    } catch (error) {
      console.error("Print error:", error)
      toast({
        title: "Print Error",
        description: "Unable to open print dialog. Please try using your browser's print function (Ctrl+P)",
        variant: "destructive",
      })
    }
  }

  const handleEmail = async () => {
    if (!emailData.recipientEmail) {
      toast({
        title: "Error",
        description: "Please enter a recipient email address",
        variant: "destructive",
      })
      return
    }

    if (!visitFormId) {
      toast({
        title: "Error",
        description: "Form must be saved before emailing",
        variant: "destructive",
      })
      return
    }

    try {
      setSending(true)

      const response = await fetch("/api/visit-forms/email", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          visitFormId,
          recipientEmail: emailData.recipientEmail,
          recipientName: emailData.recipientName,
          formData,
          appointmentId,
          message: emailData.message,
        }),
      })

      const result = await response.json()

      if (result.success) {
        toast({
          title: "Email Sent",
          description: `Visit form emailed successfully to ${emailData.recipientEmail}`,
        })
        setEmailDialog(false)
        setEmailData({ recipientEmail: "", recipientName: "", message: "" })
      } else {
        throw new Error(result.error || "Failed to send email")
      }
    } catch (error) {
      console.error("Email error:", error)
      toast({
        title: "Email Error",
        description: error instanceof Error ? error.message : "Failed to send email",
        variant: "destructive",
      })
    } finally {
      setSending(false)
    }
  }

  return (
    <div className="flex gap-2">
      {/* Print Button */}
      <Button variant="outline" onClick={handlePrint}>
        <Printer className="h-4 w-4 mr-2" />
        Print
      </Button>

      {/* Email Button */}
      <Dialog open={emailDialog} onOpenChange={setEmailDialog}>
        <DialogTrigger asChild>
          <Button variant="outline">
            <Mail className="h-4 w-4 mr-2" />
            Email
          </Button>
        </DialogTrigger>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Email Visit Form</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="recipientEmail">Recipient Email *</Label>
              <Input
                id="recipientEmail"
                type="email"
                value={emailData.recipientEmail}
                onChange={(e) => setEmailData((prev) => ({ ...prev, recipientEmail: e.target.value }))}
                placeholder="supervisor@agency.org"
                required
              />
            </div>
            <div>
              <Label htmlFor="recipientName">Recipient Name</Label>
              <Input
                id="recipientName"
                value={emailData.recipientName}
                onChange={(e) => setEmailData((prev) => ({ ...prev, recipientName: e.target.value }))}
                placeholder="Supervisor Name"
              />
            </div>
            <div>
              <Label htmlFor="message">Additional Message</Label>
              <Textarea
                id="message"
                value={emailData.message}
                onChange={(e) => setEmailData((prev) => ({ ...prev, message: e.target.value }))}
                placeholder="Optional message to include with the visit form..."
                rows={3}
              />
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setEmailDialog(false)}>
                Cancel
              </Button>
              <Button onClick={handleEmail} disabled={sending}>
                <Send className="h-4 w-4 mr-2" />
                {sending ? "Sending..." : "Send Email"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Hidden print component */}
      <VisitFormPrint formData={formData} appointmentId={appointmentId} homeData={homeData} />
    </div>
  )
}

function generatePrintHTML(formData: any, appointmentId?: string, homeData?: any): string {
  const getVariantDescription = (visitNumber: number) => {
    const variant = ((visitNumber - 1) % 3) + 1
    const descriptions = {
      1: "Comprehensive, baseline, relationships",
      2: "Education, behavior, social",
      3: "Health, development, planning",
    }
    return descriptions[variant as keyof typeof descriptions] || "Standard visit"
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    })
  }

  return `
    <h1>FOSTER HOME VISIT REPORT</h1>
    
    <div class="grid" style="margin-bottom: 30px;">
      <div>
        <p><strong>Appointment ID:</strong> ${appointmentId || "N/A"}</p>
        <p><strong>Visit Date:</strong> ${formatDate(formData.visitInfo.date)}</p>
        <p><strong>Visit Time:</strong> ${formData.visitInfo.time}</p>
      </div>
      <div>
        <p><strong>Quarter:</strong> ${formData.visitInfo.quarter}</p>
        <p><strong>Visit Number:</strong> ${formData.visitInfo.visitNumber}</p>
        <p><strong>Focus:</strong> ${getVariantDescription(formData.visitInfo.visitNumber)}</p>
      </div>
    </div>

    <h2>Family & Home Information</h2>
    <div class="grid" style="margin-bottom: 30px;">
      <div>
        <p><strong>Family Name:</strong> ${formData.family.familyName}</p>
        <p><strong>Address:</strong> ${formData.family.address}</p>
      </div>
      <div>
        <p><strong>Phone:</strong> ${formData.family.phone}</p>
        <p><strong>Email:</strong> ${formData.family.email}</p>
      </div>
    </div>

    <h2>Visit Details</h2>
    <div class="grid" style="margin-bottom: 30px;">
      <div>
        <p><strong>Visit Type:</strong> ${formData.visitInfo.type}</p>
        <p><strong>Visit Mode:</strong> ${formData.visitInfo.mode}</p>
      </div>
      <div>
        <p><strong>Conducted By:</strong> ${formData.visitInfo.conductedBy}</p>
        <p><strong>Role:</strong> ${formData.visitInfo.role === "liaison" ? "Home Visit Liaison" : "Case Manager"}</p>
      </div>
    </div>

    ${
      formData.attendees && formData.attendees.length > 0
        ? `
      <h2>Attendees</h2>
      <div style="margin-bottom: 30px;">
        ${formData.attendees
          .map(
            (attendee: any) => `
          <div class="attendee">
            <span>${attendee.name}</span>
            <span>${attendee.role} - ${attendee.present ? "Present" : "Absent"}</span>
          </div>
        `,
          )
          .join("")}
      </div>
    `
        : ""
    }

    ${
      formData.observations
        ? `
      <h2>Observations</h2>
      <div style="margin-bottom: 30px;">
        ${
          formData.observations.homeAtmosphere
            ? `
          <p><strong>Home Atmosphere:</strong></p>
          <p style="margin-left: 20px; white-space: pre-wrap;">${formData.observations.homeAtmosphere}</p>
        `
            : ""
        }
        ${
          formData.observations.positiveObservations
            ? `
          <p><strong>Positive Observations:</strong></p>
          <p style="margin-left: 20px; white-space: pre-wrap;">${formData.observations.positiveObservations}</p>
        `
            : ""
        }
        ${
          formData.observations.behaviorObservations
            ? `
          <p><strong>Behavior Observations:</strong></p>
          <p style="margin-left: 20px; white-space: pre-wrap;">${formData.observations.behaviorObservations}</p>
        `
            : ""
        }
      </div>
    `
        : ""
    }

    ${
      formData.recommendations
        ? `
      <h2>Recommendations & Next Steps</h2>
      <div style="margin-bottom: 30px;">
        <p style="white-space: pre-wrap;">${formData.recommendations}</p>
      </div>
    `
        : ""
    }

    <h2>Signatures</h2>
    <div class="signature-section">
      <div>
        <div class="signature-line"></div>
        <p><strong>Visitor Signature</strong></p>
        <p>Date: _______________</p>
      </div>
      <div>
        <div class="signature-line"></div>
        <p><strong>Foster Parent Signature</strong></p>
        <p>Date: _______________</p>
      </div>
    </div>

    <div class="footer">
      <p>Foster Home Visit Report - Generated on ${new Date().toLocaleDateString("en-US", {
        year: "numeric",
        month: "long",
        day: "numeric",
        hour: "numeric",
        minute: "2-digit",
      })}</p>
      <p>This document contains confidential information and should be handled according to agency policies.</p>
    </div>
  `
}
