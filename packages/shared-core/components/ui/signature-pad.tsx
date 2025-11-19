"use client"

import { useRef, useEffect, useState } from "react"
import { Button } from "@refugehouse/shared-core/components/ui/button"
import { Card } from "@refugehouse/shared-core/components/ui/card"
import { X } from "lucide-react"

interface SignaturePadProps {
  value?: string
  onChange: (signature: string) => void
  label?: string
  disabled?: boolean
}

export function SignaturePad({ value, onChange, label, disabled = false }: SignaturePadProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [isDrawing, setIsDrawing] = useState(false)
  const [isEmpty, setIsEmpty] = useState(true)

  // Initialize canvas on mount
  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    const ctx = canvas.getContext("2d")
    if (!ctx) return

    // Set canvas size
    const rect = canvas.getBoundingClientRect()
    canvas.width = rect.width * window.devicePixelRatio
    canvas.height = rect.height * window.devicePixelRatio
    ctx.scale(window.devicePixelRatio, window.devicePixelRatio)

    // Configure drawing style
    ctx.strokeStyle = "#000000"
    ctx.lineWidth = 2
    ctx.lineCap = "round"
    ctx.lineJoin = "round"
  }, [])

  // Load existing signature when value changes
  useEffect(() => {
    if (!value) {
      setIsEmpty(true)
      return
    }
    
    const canvas = canvasRef.current
    if (!canvas) return

    const ctx = canvas.getContext("2d")
    if (!ctx) return

    const rect = canvas.getBoundingClientRect()
      const img = new Image()
      img.onload = () => {
      // Clear canvas first
      ctx.clearRect(0, 0, canvas.width, canvas.height)
      
      // For capture: always fill canvas (original behavior - works correctly on mobile)
      // For display: maintain aspect ratio only when disabled (read-only)
      // When enabled, we still fill canvas so user can continue drawing/editing
      if (disabled) {
        // Read-only display mode: maintain aspect ratio to prevent distortion
        const imgAspect = img.width / img.height
        const canvasAspect = rect.width / rect.height
        
        let drawWidth = rect.width
        let drawHeight = rect.height
        let drawX = 0
        let drawY = 0
        
        // Maintain aspect ratio (like object-fit: contain)
        if (imgAspect > canvasAspect) {
          // Image is wider - fit to width
          drawHeight = rect.width / imgAspect
          drawY = (rect.height - drawHeight) / 2
        } else {
          // Image is taller - fit to height
          drawWidth = rect.height * imgAspect
          drawX = (rect.width - drawWidth) / 2
        }
        
        // Scale for device pixel ratio
        const scaleX = canvas.width / rect.width
        const scaleY = canvas.height / rect.height
        
        // Draw the signature maintaining aspect ratio
        ctx.drawImage(
          img, 
          drawX * scaleX, 
          drawY * scaleY, 
          drawWidth * scaleX, 
          drawHeight * scaleY
        )
      } else {
        // Capture/Edit mode: fill canvas (original behavior - works correctly on mobile)
        // This preserves the mobile capture experience
        ctx.drawImage(img, 0, 0, rect.width, rect.height)
      }
        setIsEmpty(false)
      }
      img.src = value
  }, [value, disabled])

  const startDrawing = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    if (disabled) return
    
    setIsDrawing(true)
    setIsEmpty(false)
    
    const canvas = canvasRef.current
    if (!canvas) return
    
    const ctx = canvas.getContext("2d")
    if (!ctx) return

    const rect = canvas.getBoundingClientRect()
    const x = "touches" in e ? e.touches[0].clientX - rect.left : e.clientX - rect.left
    const y = "touches" in e ? e.touches[0].clientY - rect.top : e.clientY - rect.top

    ctx.beginPath()
    ctx.moveTo(x, y)
  }

  const draw = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    if (!isDrawing || disabled) return
    
    e.preventDefault() // Prevent scrolling on touch devices
    
    const canvas = canvasRef.current
    if (!canvas) return
    
    const ctx = canvas.getContext("2d")
    if (!ctx) return

    const rect = canvas.getBoundingClientRect()
    const x = "touches" in e ? e.touches[0].clientX - rect.left : e.clientX - rect.left
    const y = "touches" in e ? e.touches[0].clientY - rect.top : e.clientY - rect.top

    ctx.lineTo(x, y)
    ctx.stroke()
  }

  const stopDrawing = () => {
    if (!isDrawing) return
    
    setIsDrawing(false)
    
    const canvas = canvasRef.current
    if (!canvas) return
    
    // Save signature as base64
    const dataUrl = canvas.toDataURL("image/png")
    onChange(dataUrl)
  }

  const clear = () => {
    const canvas = canvasRef.current
    if (!canvas) return
    
    const ctx = canvas.getContext("2d")
    if (!ctx) return

    ctx.clearRect(0, 0, canvas.width, canvas.height)
    setIsEmpty(true)
    onChange("")
  }

  return (
    <div className="space-y-2">
      {label && <label className="text-sm font-medium">{label}</label>}
      <Card className={`relative ${disabled ? "bg-gray-100" : "bg-white"}`}>
        <canvas
          ref={canvasRef}
          className="w-full h-40 touch-none cursor-crosshair"
          style={{ touchAction: "none" }}
          onMouseDown={startDrawing}
          onMouseMove={draw}
          onMouseUp={stopDrawing}
          onMouseLeave={stopDrawing}
          onTouchStart={startDrawing}
          onTouchMove={draw}
          onTouchEnd={stopDrawing}
        />
        {!isEmpty && !disabled && (
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className="absolute top-2 right-2 h-6 w-6 p-0"
            onClick={clear}
          >
            <X className="h-4 w-4" />
          </Button>
        )}
        {isEmpty && !disabled && (
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            <p className="text-gray-400 text-sm">Sign here with your finger or stylus</p>
          </div>
        )}
      </Card>
      {!isEmpty && (
        <p className="text-xs text-gray-500">Signature captured</p>
      )}
    </div>
  )
}

