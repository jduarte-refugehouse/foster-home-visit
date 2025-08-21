"use client"

import { Button } from "@/components/ui/button"
import { FileText } from "lucide-react"
import Link from "next/link"

interface VisitFormButtonProps {
  appointmentId: string
  appointmentTitle: string
  disabled?: boolean
}

export function VisitFormButton({ appointmentId, appointmentTitle, disabled = false }: VisitFormButtonProps) {
  return (
    <Link href={`/visit-form?appointmentId=${appointmentId}`} className="w-full">
      <Button size="sm" className="w-full flex items-center gap-2" disabled={disabled}>
        <FileText className="h-4 w-4" />
        Visit Form
      </Button>
    </Link>
  )
}
