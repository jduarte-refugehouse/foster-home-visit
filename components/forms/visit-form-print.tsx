"use client"

import { format } from "date-fns"

interface VisitFormPrintProps {
  formData: any
  appointmentId?: string
  homeData?: any
}

export default function VisitFormPrint({ formData, appointmentId, homeData }: VisitFormPrintProps) {
  const getVariantDescription = (visitNumber: number) => {
    const variant = ((visitNumber - 1) % 3) + 1
    const descriptions = {
      1: "Comprehensive, baseline, relationships",
      2: "Education, behavior, social",
      3: "Health, development, planning",
    }
    return descriptions[variant as keyof typeof descriptions] || "Standard visit"
  }

  return (
    <div className="print:block hidden">
      <div className="max-w-4xl mx-auto p-8 bg-white text-black">
        {/* Header */}
        <div className="border-b-2 border-gray-800 pb-4 mb-6">
          <h1 className="text-2xl font-bold text-center">FOSTER HOME VISIT REPORT</h1>
          <div className="grid grid-cols-2 gap-4 mt-4 text-sm">
            <div>
              <p>
                <strong>Appointment ID:</strong> {appointmentId}
              </p>
              <p>
                <strong>Visit Date:</strong> {format(new Date(formData.visitInfo.date), "MMMM d, yyyy")}
              </p>
              <p>
                <strong>Visit Time:</strong> {formData.visitInfo.time}
              </p>
            </div>
            <div>
              <p>
                <strong>Quarter:</strong> {formData.visitInfo.quarter}
              </p>
              <p>
                <strong>Visit Number:</strong> {formData.visitInfo.visitNumber}
              </p>
              <p>
                <strong>Focus:</strong> {getVariantDescription(formData.visitInfo.visitNumber)}
              </p>
            </div>
          </div>
        </div>

        {/* Family Information */}
        <section className="mb-6">
          <h2 className="text-lg font-semibold border-b border-gray-400 pb-1 mb-3">FAMILY & HOME INFORMATION</h2>
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <p>
                <strong>Family Name:</strong> {formData.family.familyName}
              </p>
              <p>
                <strong>Address:</strong> {formData.family.address}
              </p>
            </div>
            <div>
              <p>
                <strong>Phone:</strong> {formData.family.phone}
              </p>
              <p>
                <strong>Email:</strong> {formData.family.email}
              </p>
            </div>
          </div>
        </section>

        {/* Visit Details */}
        <section className="mb-6">
          <h2 className="text-lg font-semibold border-b border-gray-400 pb-1 mb-3">VISIT DETAILS</h2>
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <p>
                <strong>Visit Type:</strong> {formData.visitInfo.type}
              </p>
              <p>
                <strong>Visit Mode:</strong> {formData.visitInfo.mode}
              </p>
            </div>
            <div>
              <p>
                <strong>Conducted By:</strong> {formData.visitInfo.conductedBy}
              </p>
              <p>
                <strong>Role:</strong> {formData.visitInfo.role === "liaison" ? "Home Visit Liaison" : "Case Manager"}
              </p>
            </div>
          </div>
        </section>

        {/* Attendees */}
        {formData.attendees && formData.attendees.length > 0 && (
          <section className="mb-6">
            <h2 className="text-lg font-semibold border-b border-gray-400 pb-1 mb-3">ATTENDEES</h2>
            <div className="text-sm">
              {formData.attendees.map((attendee: any, idx: number) => (
                <div key={idx} className="flex justify-between py-1 border-b border-gray-200">
                  <span>{attendee.name}</span>
                  <span>
                    {attendee.role} - {attendee.present ? "Present" : "Absent"}
                  </span>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* Observations */}
        {formData.observations && (
          <section className="mb-6">
            <h2 className="text-lg font-semibold border-b border-gray-400 pb-1 mb-3">OBSERVATIONS</h2>
            <div className="text-sm space-y-3">
              {formData.observations.homeAtmosphere && (
                <div>
                  <p>
                    <strong>Home Atmosphere:</strong>
                  </p>
                  <p className="ml-4 whitespace-pre-wrap">{formData.observations.homeAtmosphere}</p>
                </div>
              )}
              {formData.observations.positiveObservations && (
                <div>
                  <p>
                    <strong>Positive Observations:</strong>
                  </p>
                  <p className="ml-4 whitespace-pre-wrap">{formData.observations.positiveObservations}</p>
                </div>
              )}
              {formData.observations.behaviorObservations && (
                <div>
                  <p>
                    <strong>Behavior Observations:</strong>
                  </p>
                  <p className="ml-4 whitespace-pre-wrap">{formData.observations.behaviorObservations}</p>
                </div>
              )}
            </div>
          </section>
        )}

        {/* Recommendations */}
        {formData.recommendations && (
          <section className="mb-6">
            <h2 className="text-lg font-semibold border-b border-gray-400 pb-1 mb-3">RECOMMENDATIONS & NEXT STEPS</h2>
            <div className="text-sm">
              <p className="whitespace-pre-wrap">{formData.recommendations}</p>
            </div>
          </section>
        )}

        {/* Signatures */}
        <section className="mb-6">
          <h2 className="text-lg font-semibold border-b border-gray-400 pb-1 mb-3">SIGNATURES</h2>
          <div className="grid grid-cols-2 gap-8 text-sm mt-8">
            <div>
              <div className="border-b border-gray-400 mb-2 pb-8"></div>
              <p>
                <strong>Visitor Signature</strong>
              </p>
              <p>Date: _______________</p>
            </div>
            <div>
              <div className="border-b border-gray-400 mb-2 pb-8"></div>
              <p>
                <strong>Foster Parent Signature</strong>
              </p>
              <p>Date: _______________</p>
            </div>
          </div>
        </section>

        {/* Footer */}
        <div className="border-t-2 border-gray-800 pt-4 mt-8 text-xs text-center text-gray-600">
          <p>Foster Home Visit Report - Generated on {format(new Date(), "MMMM d, yyyy 'at' h:mm a")}</p>
          <p>This document contains confidential information and should be handled according to agency policies.</p>
        </div>
      </div>
    </div>
  )
}
